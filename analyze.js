export const config = { runtime: "edge" };

export default async function handler(req) {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const { imageBase64, gender, age } = await req.json();

  if (!imageBase64 || !gender) {
    return new Response(JSON.stringify({ error: "Missing fields" }), { status: 400 });
  }

  const prompt = `You are a professional body composition analyst. Analyze this photo and estimate the person's body fat percentage.

Context:
- Gender: ${gender}
- Age: ${age || "unknown"}

Instructions:
1. Examine: muscle definition, subcutaneous fat, abdominal definition, overall silhouette.
2. Apply gender-specific standards (females have higher essential fat).
3. Account for photo limitations: lighting, clothing, angle.

Respond ONLY with a raw JSON object, no markdown, no explanation:
{
  "bodyfat": <integer between 3 and 50>,
  "confidence": <"low"|"medium"|"high">,
  "confidence_reason": "<one short sentence>",
  "key_indicators": ["<indicator 1>", "<indicator 2>", "<indicator 3>"],
  "note": "<one encouraging sentence, max 15 words>"
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
