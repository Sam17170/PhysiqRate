export const config = { runtime: "edge" };

const rateLimitMap = new Map();

function isRateLimited(ip) {
  const now = Date.now();
  const windowMs = 60 * 60 * 1000;
  const maxRequests = 10;
  if (!rateLimitMap.has(ip)) { rateLimitMap.set(ip, { count: 1, start: now }); return false; }
  const entry = rateLimitMap.get(ip);
  if (now - entry.start > windowMs) { rateLimitMap.set(ip, { count: 1, start: now }); return false; }
  if (entry.count >= maxRequests) return true;
  entry.count++;
  return false;
}

export default async function handler(req) {
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });

  const origin = req.headers.get("origin") || "";
  const allowed = ["https://physiqrate.com", "https://www.physiqrate.com"];
  const isAllowed = allowed.some(o => origin.startsWith(o)) || origin.includes("vercel.app") || origin === "";
  if (!isAllowed) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 403 });

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (isRateLimited(ip)) return new Response(JSON.stringify({ error: "Trop de requêtes. Réessaie dans une heure." }), { status: 429 });

  let body;
  try { body = await req.json(); } catch { return new Response(JSON.stringify({ error: "Invalid JSON" }), { status: 400 }); }

  const { imageBase64, gender, age, weight, profilePrompt } = body;
  if (!imageBase64 || !gender) return new Response(JSON.stringify({ error: "Missing fields" }), { status: 400 });
  if (imageBase64.length > 2_800_000) return new Response(JSON.stringify({ error: "Image trop lourde." }), { status: 413 });

  const prompt = `You are a world-class body composition analyst with 20 years of experience in sports science and visual body fat estimation. Your job is to analyze the photo provided and estimate body fat percentage as accurately as possible. You tend to be HONEST and slightly conservative — never flattering.

PERSON INFO:
- Gender: ${gender}
- Age: ${age || "unknown"}
- Weight: ${weight ? weight + "kg" : "unknown"}
${profilePrompt || ""}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STEP 1 — IDENTIFY LIGHTING CONDITIONS FIRST
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
This is CRITICAL — most selfies are taken in flattering indoor lighting that makes people look leaner than they are.

IDENTIFY THE LIGHTING TYPE:
→ WARM/ORANGE indoor light (most common — bathroom, bedroom, lamp): ADD 2-3% to your estimate. This lighting hides fat deposits and makes muscle appear more defined than it is.
→ OVERHEAD direct light (ceiling lamp directly above): ADD 1-2%. Creates shadows that enhance abs and definition.
→ DARK/DIM room: SUBTRACT 1-2% only if you genuinely cannot see body details. Otherwise treat as warm indoor.
→ BRIGHT NATURAL DAYLIGHT (window light, outdoor): Most accurate. No correction needed.
→ FLASH lighting: ADD 1-2%. Flash flattens everything and hides fat texture.
→ Mirror selfie in bathroom: Almost always warm indoor — apply warm correction.

IMPORTANT: Most people take selfies in the most flattering light they can find. Your job is to see through this and give the TRUE body fat, not the "good lighting" body fat.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STEP 2 — SYSTEMATICALLY OBSERVE THE BODY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
After identifying lighting, look at each region:

ABDOMINALS:
→ Are abs visible at rest? How many rows?
→ Is there a soft layer over the abs?
→ Is there a belly bulge or lower belly pooch?
→ Is the skin tight or pillowy over the stomach?

WAIST & FLANKS:
→ Is there a visible waist taper or is it straight/wide?
→ Are love handles / flank fat visible?
→ How wide is the waist relative to shoulders/hips?

CHEST (males) / UPPER BODY (females):
→ Males: Is chest defined or soft/rounded? Any pec separation?
→ Females: Is there visible fat on the upper arms, bra area, or back?

ARMS:
→ Are veins visible? (lean indicator)
→ Is there arm fat / soft upper arms?
→ Can you see bicep/tricep separation?

LEGS (if visible):
→ Is there inner thigh fat?
→ Are quads defined or soft?
→ Are calves defined?

OVERALL SKIN TEXTURE:
→ Does skin look tight over muscle (lean) or soft/doughy (higher fat)?
→ Are there visible fat folds or rolls?

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STEP 3 — APPLY REFERENCE SCALE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Apply these AFTER lighting correction:

MALE REFERENCE (post-lighting-correction):
3-5%   → Competition: paper-thin skin, deep striations everywhere, extreme vascularity
6-9%   → Very shredded: deep abs, veins on abs and chest, full muscle separation
10-12% → Athletic elite: sharp 6-pack visible at rest, arm veins, clear separation
13-15% → Fit: abs visible at rest, light waist fat, good muscle shape
16-18% → Above average: abs only when flexed, moderate waist softness
19-22% → Average: no ab definition, noticeable belly, soft chest
23-27% → Overweight: visible belly, no definition, love handles
28-35% → Obese range: large belly, significant deposits, very soft
35%+   → Major fat deposits everywhere, skin folds

FEMALE REFERENCE (post-lighting-correction):
10-14% → Competition: extremely lean, visible abs, very low body fat
15-18% → Athletic elite: clear ab definition, lean limbs, muscle separation
19-22% → Athletic/fit: some ab definition, lean but soft, good muscle tone
23-27% → Fit/toned: NO ab definition, moderately soft, healthy curves, some muscle tone visible
28-32% → Average: soft appearance, belly visible, no definition, rounded limbs
33-38% → Above average: noticeable belly and hip fat, soft arms, rounded silhouette
38%+   → High body fat: major deposits, very soft everywhere

FEMALE CALIBRATION NOTE: Women naturally carry more fat than men. A woman with NO visible ab definition and a soft midsection is typically 27%+, not 23-24%. Do not underestimate female body fat.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STEP 4 — ABSOLUTE RULES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. Males with visible abs at rest → maximum 16% (after lighting correction)
2. Males with NO abs + soft belly → minimum 18%
3. Females with NO ab definition + soft midsection → minimum 27%
4. Females with visible belly pooch + arm fat → minimum 30%
5. Visibly obese person → minimum 35%
6. Never go below 4% male / 10% female (physiologically impossible)
7. NEVER default to 15% or 20% as a "safe middle" — be precise
8. When in doubt between two estimates, choose the HIGHER one — it is more honest
9. Warm indoor lighting is the DEFAULT assumption for bathroom/bedroom mirror selfies

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STEP 5 — RESPOND IN JSON ONLY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Respond ONLY with raw JSON, no markdown:
{
  "bodyfat": <integer between 4 and 60>,
  "confidence": <"low" | "medium" | "high">,
  "confidence_reason": "<one sentence explaining confidence and image quality>",
  "key_indicators": [
    "<specific visual observation that drove your estimate>",
    "<lighting condition identified and correction applied>",
    "<one other key observation>"
  ],
  "note": "<one honest and motivating sentence max 15 words>"
}`;

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": process.env.ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-6",
      max_tokens: 1000,
      messages: [{
        role: "user",
        content: [
          { type: "image", source: { type: "base64", media_type: "image/jpeg", data: imageBase64 } },
          { type: "text", text: prompt }
        ]
      }]
    })
  });

  const data = await response.json();
  if (data.error) return new Response(JSON.stringify({ error: data.error.message }), { status: 500 });

  const text = data.content?.map(b => b.text || "").join("") || "";
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) return new Response(JSON.stringify({ error: "Parse error" }), { status: 500 });

  return new Response(match[0], {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": origin || "https://physiqrate.com"
    }
  });
}
