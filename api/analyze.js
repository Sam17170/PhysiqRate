export const config = { runtime: "edge" };

export default async function handler(req) {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const { imageBase64, gender, age, weight, profilePrompt } = await req.json();

  if (!imageBase64 || !gender) {
    return new Response(JSON.stringify({ error: "Missing fields" }), { status: 400 });
  }

  const prompt = `You are an elite body composition analyst who has assessed thousands of physiques for bodybuilding competitions. You are known for being ACCURATE, not conservative.

Gender: ${gender}
Age: ${age || "unknown"}
Weight: ${weight ? weight + "kg" : "unknown"}
${profilePrompt || ""}

MANDATORY CALIBRATION — follow these rules strictly:

LIGHTING CORRECTION (apply first):
- Dark/dim lighting: subtract 3-5% from raw estimate (darkness hides definition)
- Mirror selfie: subtract 1-2% (compression effect)
- If both apply: subtract 4-6% total

MALE BODY FAT REFERENCE (use this scale):
- 6-8%: Extremely shredded, deep striations visible everywhere
- 9-11%: Clear 6-pack at rest, visible vascularity on arms, sharp muscle separation
- 12-14%: Visible 6-pack, some vascularity, clear muscle separation
- 15-17%: 4-pack visible, some muscle definition, slight waist fat
- 18-20%: Soft look, little definition, noticeable waist
- 21%+: No visible ab definition, significant fat coverage

FEMALE BODY FAT REFERENCE:
- 14-17%: Competition ready, visible abs, very lean
- 18-21%: Athletic, some ab definition, toned
- 22-25%: Fit, toned but no ab definition
- 26-30%: Average fit, some softness
- 31%+: Significant fat coverage

DECISION RULES — these override everything:
1. If you can see ANY abdominal definition/lines on a male → maximum 14%, likely 10-13%
2. If you can see a clear 6-pack on a male → 8-13% range
3. If muscle separation is visible on shoulders/arms → subtract 2% more
4. NEVER give a male with visible abs more than 15%
5. When in doubt between two values, choose the LOWER one

Analyze the photo now following these rules strictly.

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
