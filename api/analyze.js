export const config = { runtime: "edge" };

export default async function handler(req) {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const { imageBase64, gender, age, weight, profilePrompt } = await req.json();

  if (!imageBase64 || !gender) {
    return new Response(JSON.stringify({ error: "Missing fields" }), { status: 400 });
  }

  const prompt = `You are an expert body composition analyst. Estimate body fat percentage accurately based on visual indicators.

Gender: ${gender}
Age: ${age || "unknown"}
Weight: ${weight ? weight + "kg" : "unknown"}
${profilePrompt || ""}

CALIBRATION REFERENCES — use these as anchors:

MALE:
- 10-12%: Clear 6-pack visible at rest, visible muscle separation on arms/shoulders, some vascularity. Even in warm/dim lighting this definition is clearly visible.
- 14-15%: Some abdominal definition visible but not fully developed, good muscle mass, slight fat layer on lower abs and flanks. Warm lighting may flatter slightly.
- 18-22%: No visible ab definition, flat or slightly rounded belly, muscle mass present but covered. Soft look overall.
- 28-32%: Significant belly fat, rounded silhouette, no muscle definition visible, noticeable fat on chest and flanks.
- 35-40%: Large protruding belly, fat deposits everywhere, very soft, no definition at all, possible fat folds.

FEMALE:
- 14-18%: Visible abs, very lean, athletic competition physique, clear muscle definition
- 19-23%: Toned, some ab definition, athletic look, minimal fat
- 24-28%: Fit but soft, no visible abs, healthy feminine shape, some curves
- 29-33%: Average, soft look, no definition, noticeable fat on hips/belly
- 34%+: Significant fat deposits, rounded silhouette, very soft

LIGHTING CORRECTIONS (apply before final answer):
- Dark/dim lighting: subtract 2-3% (shadows hide definition, makes body look fatter)
- Warm/orange lighting: subtract 1-2% (flatters the physique)
- Mirror selfie: subtract 1% (slight compression)
- Bright natural or studio lighting: no correction needed

RULES:
1. Start with the reference that best matches what you see
2. Apply lighting correction
3. Cross-check: if you see ANY ab definition on a male → must be 15% or below
4. Cross-check: if NO ab definition and soft belly → must be 18% or above
5. Be precise — avoid defaulting to "safe" middle estimates
6. Account for the angle: side/profile shots reveal belly fat more accurately than front shots

Respond ONLY with raw JSON, no markdown:
{
  "bodyfat": <integer>,
  "confidence": <"low"|"medium"|"high">,
  "confidence_reason": "<one sentence>",
  "key_indicators": ["<indicator 1>", "<indicator 2>", "<indicator 3>"],
  "note": "<motivating sentence max 15 words>"
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

  if (data.error) {
    return new Response(JSON.stringify({ error: data.error.message }), { status: 500 });
  }

  const text = data.content?.map(b => b.text || "").join("") || "";
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) {
    return new Response(JSON.stringify({ error: "Parse error", raw: text.slice(0, 200) }), { status: 500 });
  }

  return new Response(match[0], {
    status: 200,
    headers: { "Content-Type": "application/json" }
  });
}
