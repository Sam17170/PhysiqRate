export const config = { runtime: "edge" };

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE = process.env.SUPABASE_SERVICE_KEY;

async function checkAndIncrementUsage(ip, isPro, adWatched) {
  if (isPro) return { allowed: true };

  // Récupère l'usage actuel pour cette IP
  const res = await fetch(`${SUPABASE_URL}/rest/v1/analysis_usage?ip=eq.${encodeURIComponent(ip)}&select=count,first_used,weekly_used,weekly_ad_used`, {
    headers: { "apikey": SUPABASE_SERVICE, "Authorization": `Bearer ${SUPABASE_SERVICE}` }
  });
  const rows = await res.json();
  const usage = rows?.[0] || null;

  const now = new Date();

  if (!usage) {
    // 1ère analyse — crée l'entrée, gratuite
    await fetch(`${SUPABASE_URL}/rest/v1/analysis_usage`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "apikey": SUPABASE_SERVICE, "Authorization": `Bearer ${SUPABASE_SERVICE}`, "Prefer": "return=minimal" },
      body: JSON.stringify({ ip, count: 1, first_used: now.toISOString(), weekly_used: null, weekly_ad_used: null })
    });
    return { allowed: true };
  }

  const count = usage.count || 0;

  if (count < 1) {
    await fetch(`${SUPABASE_URL}/rest/v1/analysis_usage?ip=eq.${encodeURIComponent(ip)}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", "apikey": SUPABASE_SERVICE, "Authorization": `Bearer ${SUPABASE_SERVICE}`, "Prefer": "return=minimal" },
      body: JSON.stringify({ count: count + 1, updated_at: now.toISOString() })
    });
    return { allowed: true };
  }

  if (count === 1) {
    // 2ème analyse — gratuite (pub courte gérée côté client), et démarre le cycle hebdomadaire à partir de maintenant
    await fetch(`${SUPABASE_URL}/rest/v1/analysis_usage?ip=eq.${encodeURIComponent(ip)}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", "apikey": SUPABASE_SERVICE, "Authorization": `Bearer ${SUPABASE_SERVICE}`, "Prefer": "return=minimal" },
      body: JSON.stringify({ count: count + 1, weekly_used: now.toISOString(), updated_at: now.toISOString() })
    });
    return { allowed: true };
  }

  // count >= 2 — phase hebdomadaire : 1 analyse gratuite par semaine + 1 déblocage via pub max par semaine
  const weeklyUsed = usage.weekly_used ? new Date(usage.weekly_used) : now;
  const daysSinceWeekly = (now - weeklyUsed) / (1000 * 60 * 60 * 24);

  if (daysSinceWeekly >= 7) {
    // Nouvelle semaine — 1 analyse gratuite, et le bonus pub est de nouveau disponible
    await fetch(`${SUPABASE_URL}/rest/v1/analysis_usage?ip=eq.${encodeURIComponent(ip)}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", "apikey": SUPABASE_SERVICE, "Authorization": `Bearer ${SUPABASE_SERVICE}`, "Prefer": "return=minimal" },
      body: JSON.stringify({ count: count + 1, weekly_used: now.toISOString(), weekly_ad_used: null, updated_at: now.toISOString() })
    });
    return { allowed: true };
  }

  // Quota gratuit de la semaine déjà utilisé — vérifie si le bonus pub hebdomadaire est encore disponible
  const weeklyAdUsed = usage.weekly_ad_used ? new Date(usage.weekly_ad_used) : null;
  const daysSinceAd = weeklyAdUsed ? (now - weeklyAdUsed) / (1000 * 60 * 60 * 24) : 999;
  const adAvailable = daysSinceAd >= 7;

  if (adWatched && adAvailable) {
    await fetch(`${SUPABASE_URL}/rest/v1/analysis_usage?ip=eq.${encodeURIComponent(ip)}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", "apikey": SUPABASE_SERVICE, "Authorization": `Bearer ${SUPABASE_SERVICE}`, "Prefer": "return=minimal" },
      body: JSON.stringify({ count: count + 1, weekly_ad_used: now.toISOString(), updated_at: now.toISOString() })
    });
    return { allowed: true };
  }

  // Bloqué — calcule le nombre de jours restants et si le bonus pub est encore proposable
  const daysLeft = Math.ceil(7 - daysSinceWeekly);
  return { allowed: false, daysLeft, adAvailable };
}

export default async function handler(req) {
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });

  const origin = req.headers.get("origin") || "";
  const allowed = ["https://physiqrate.com", "https://www.physiqrate.com"];
  const isAllowed = allowed.some(o => origin.startsWith(o)) || origin.includes("vercel.app") || origin === "";
  if (!isAllowed) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 403 });

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";

  let body;
  try { body = await req.json(); } catch { return new Response(JSON.stringify({ error: "Invalid JSON" }), { status: 400 }); }

  const { imageBase64, gender, age, weight, height, profilePrompt, isPro, adWatched, lang } = body;
  if (!imageBase64 || !gender) return new Response(JSON.stringify({ error: "Missing fields" }), { status: 400 });
  if (imageBase64.length > 2_800_000) return new Response(JSON.stringify({ error: "Image trop lourde." }), { status: 413 });
  const responseLang = lang === "fr" ? "French" : "English";

  // Calcule le BMI si poids ET taille sont disponibles — utilisé comme repère de plausibilité, pas comme mesure directe
  const w = parseFloat(weight) || null;
  const h = parseFloat(height) || null;
  const bmi = (w && h) ? Math.round((w / ((h / 100) ** 2)) * 10) / 10 : null;

  // Vérifie l'usage côté serveur
  const usageCheck = await checkAndIncrementUsage(ip, !!isPro, !!adWatched);
  if (!usageCheck.allowed) {
    return new Response(JSON.stringify({
      error: `Limite atteinte. Prochaine analyse gratuite dans ${usageCheck.daysLeft} jour${usageCheck.daysLeft > 1 ? "s" : ""}.`,
      daysLeft: usageCheck.daysLeft,
      adAvailable: !!usageCheck.adAvailable
    }), { status: 429 });
  }

  const prompt = `You are a world-class body composition analyst with 20 years of experience in sports science and visual body fat estimation. Your job is to analyze the photo provided and estimate body fat percentage as accurately as possible. You tend to be HONEST and slightly conservative — never flattering.

PERSON INFO:
- Gender: ${gender}
- Age: ${age || "unknown"}
- Weight: ${weight ? weight + "kg" : "unknown"}
- Height: ${height ? height + "cm" : "unknown"}
- BMI: ${bmi ? bmi + " (calculated from height and weight)" : "unknown"}
${profilePrompt || ""}

STEP 1 — LIGHTING: WARM/ORANGE indoor: ADD 2-3%. OVERHEAD: ADD 1-2%. DARK: SUBTRACT 1-2%. NATURAL DAYLIGHT: no correction. FLASH: ADD 1-2%.

STEP 2 — OBSERVE: Abs visible at rest? Belly bulge? Love handles? Arm definition? Skin tight or doughy?

STEP 3 — MALE SCALE: 3-5% competition | 6-9% shredded | 10-12% athletic | 13-15% fit | 16-18% above avg | 19-22% average | 23-27% overweight | 28%+ obese
FEMALE SCALE: 10-14% competition | 15-18% athletic | 19-22% fit | 23-27% toned | 28-32% average | 33%+ above average

STEP 4 — BMI CROSS-CHECK (only if BMI is known): use it as a plausibility check on your visual estimate, not as a direct measurement. BMI under ~21 rarely coexists with body fat above ~25% — there simply isn't enough total mass. If your visual read suggests a high body fat but BMI is low, lean toward the lower end of your visual range. BMI over ~27 can still mean low body fat if the person is visibly heavily muscled (wide shoulders, thick limbs, dense muscle) — in that case trust the visual read over the BMI. If BMI is in a normal, unremarkable range (~21-26), it doesn't move your estimate either way. Visual evidence always stays primary; BMI only narrows your choice between two visually plausible values, it never overrides clear visual signals.

RULES: Males visible abs → max 16%. Males no abs soft belly → min 18%. Females no definition soft → min 27%. Never below 4% male / 10% female. When in doubt → higher estimate.

Respond ONLY with raw JSON: {"bodyfat":<4-60>,"confidence":"low|medium|high","confidence_reason":"<one sentence>","key_indicators":["<obs 1>","<lighting>","<obs 3>"],"note":"<honest motivating sentence max 15 words>"}
IMPORTANT: Write the values of "confidence_reason", "key_indicators" and "note" in ${responseLang}. Keep JSON keys and the "confidence" value in English exactly as specified.`;

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
