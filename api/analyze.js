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

  const prompt = `You are a world-class body composition analyst with 20 years of experience in sports science and visual body fat estimation. Your job is to analyze the photo provided and estimate body fat percentage as accurately as possible.

PERSON INFO:
- Gender: ${gender}
- Age: ${age || "unknown"}
- Weight: ${weight ? weight + "kg" : "unknown"}
${profilePrompt || ""}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STEP 1 — CAREFULLY OBSERVE THE IMAGE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Look at each body region systematically before estimating:

ABDOMINALS:
→ Are abs visible at rest? (yes = likely ≤16% male, ≤22% female)
→ Are there visible lines between ab segments?
→ Is there a soft layer covering the abs?
→ Is there a visible belly bulge or overhang?

WAIST & OBLIQUES:
→ Is the waist narrow with a visible taper?
→ Are obliques visible (lines on the sides)?
→ Is there a love handle / flank fat deposit?
→ How thick is the waistline relative to the chest/hips?

CHEST & PECTORALS:
→ Is there chest definition or are pecs rounded/soft?
→ Is there any gynecomastia / breast tissue visible?
→ Can you see pec striations or separation?

ARMS:
→ Are veins visible on forearms or biceps?
→ Is there visible muscle separation (bicep/tricep line)?
→ Are arms soft and undefined or lean and muscular?

BACK & SHOULDERS (if visible):
→ Is there back fat visible?
→ Can you see deltoid definition?
→ Are there fat folds on the back?

LEGS (if visible):
→ Is quad separation visible?
→ Is there thigh fat / inner thigh thickness?
→ Are hamstrings defined?

OVERALL SKIN:
→ Does the skin appear tight over muscle (lean) or loose/pillowy (higher fat)?
→ Are there visible stretch marks or skin folds?

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STEP 2 — APPLY REFERENCE SCALE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
MALE REFERENCE:
3-5%   → Competition bodybuilder: paper-thin skin, deep muscle striations everywhere, extreme vascularity, grainy look
6-9%   → Very shredded: clear deep abs, visible veins on abs and chest, full muscle separation, no soft tissue anywhere
10-12% → Athletic elite: sharp 6-pack visible at rest, visible arm veins, clear shoulder/arm separation, minimal waist fat
13-15% → Fit/athletic: abs visible at rest or when flexed, light waist fat, good muscle shape, some vascularity
16-18% → Above average: abs only when flexed or barely at rest, moderate waist softness, muscles visible but not sharp
19-22% → Average: no ab definition, noticeable belly, soft chest, arms defined but not sharp
23-27% → Overweight: visible belly, no definition, love handles, soft all over
28-35% → Obese range: large belly, significant fat deposits on chest/arms/waist, very soft look
35%+   → Morbidly obese: major fat deposits everywhere, skin folds, very low muscle visibility

FEMALE REFERENCE:
10-14% → Competition: extremely lean, visible abs, very low breast tissue, visible muscle striae
15-18% → Athletic elite: clear ab definition, lean limbs, visible muscle separation
19-22% → Athletic/fit: some ab definition, lean but soft, good muscle tone
23-27% → Fit/toned: no ab definition, moderately soft, healthy curves, muscle tone visible
28-32% → Average: soft appearance, some belly, no definition
33-38% → Above average: noticeable belly and hip fat, soft arms
38%+   → High body fat: major fat deposits, soft everywhere

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STEP 3 — LIGHTING & ANGLE CORRECTIONS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Apply these corrections to your initial estimate:
- Harsh/direct flash lighting: add 1-2% (shadows create false definition)
- Warm/orange gym lighting: subtract 1-2% (hides fat, enhances definition)
- Dark/dim lighting: subtract 2-3% (hard to see fat deposits accurately → be conservative)
- Bright natural daylight: most accurate, no correction
- Mirror selfie angled downward: subtract 1% (makes person look leaner)
- Profile/side shot: most accurate for belly fat assessment
- Only face/neck visible: very hard to assess, low confidence
- Fully clothed: cannot assess, refuse or low confidence

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STEP 4 — ABSOLUTE RULES (never break these)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. If abs are clearly visible at rest on a male → maximum 16%
2. If NO abs visible and belly is soft on a male → minimum 18%
3. If person is visibly obese → minimum 30%
4. Never estimate below 4% for males or 10% for females (physiologically impossible)
5. Never default to 15% or 20% as a "safe middle" — be precise based on what you see
6. If image quality is too poor to assess → set confidence to "low" and explain why
7. Always explain your reasoning in key_indicators

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STEP 5 — RESPOND IN JSON ONLY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Respond ONLY with raw JSON, no markdown, no explanation outside the JSON:
{
  "bodyfat": <integer between 4 and 60>,
  "confidence": <"low" | "medium" | "high">,
  "confidence_reason": "<one sentence explaining confidence level and image quality>",
  "key_indicators": [
    "<specific visual observation 1 that drove your estimate>",
    "<specific visual observation 2>",
    "<lighting or angle correction applied if any>"
  ],
  "note": "<one motivating/honest sentence max 15 words tailored to this result>"
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
