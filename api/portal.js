export const config = { runtime: "edge" };

export default async function handler(req) {
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });

  const origin = req.headers.get("origin") || "https://physiqrate.com";

  let body;
  try { body = await req.json(); } catch { return new Response(JSON.stringify({ error: "Invalid JSON" }), { status: 400 }); }

  const { customerId } = body;
  if (!customerId) return new Response(JSON.stringify({ error: "Missing customerId" }), { status: 400 });

  const session = await fetch("https://api.stripe.com/v1/billing_portal/sessions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${process.env.STRIPE_SECRET_KEY}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      customer: customerId,
      return_url: origin,
    }).toString()
  });

  const data = await session.json();
  if (data.error) return new Response(JSON.stringify({ error: data.error.message }), { status: 500 });

  return new Response(JSON.stringify({ url: data.url }), {
    status: 200,
    headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": origin }
  });
}
