export const config = { runtime: "edge" };

export default async function handler(req) {
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });

  const origin = req.headers.get("origin") || "https://physiqrate.com";

  let body;
  try { body = await req.json(); } catch { return new Response(JSON.stringify({ error: "Invalid JSON" }), { status: 400 }); }

  const { sessionId } = body;
  if (!sessionId) return new Response(JSON.stringify({ error: "Missing sessionId" }), { status: 400 });

  // 1. Récupère la session Stripe pour obtenir le customer ID
  const sessionRes = await fetch(`https://api.stripe.com/v1/checkout/sessions/${sessionId}`, {
    headers: { "Authorization": `Bearer ${process.env.STRIPE_SECRET_KEY}` }
  });
  const session = await sessionRes.json();

  if (session.error) return new Response(JSON.stringify({ error: "Session invalide" }), { status: 400 });

  const customerId = session.customer;
  if (!customerId) return new Response(JSON.stringify({ error: "Pas de client trouvé" }), { status: 400 });

  // 2. Crée une session portail client
  const portalRes = await fetch("https://api.stripe.com/v1/billing_portal/sessions", {
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

  const portal = await portalRes.json();
  if (portal.error) return new Response(JSON.stringify({ error: portal.error.message }), { status: 500 });

  return new Response(JSON.stringify({ url: portal.url }), {
    status: 200,
    headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": origin }
  });
}
