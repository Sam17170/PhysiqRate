export const config = { runtime: "edge" };

export default async function handler(req) {
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });
  const rawOrigin = req.headers.get("origin") || "";
  const allowedOrigins = ["https://physiqrate.com", "https://www.physiqrate.com"];
  const origin = (allowedOrigins.includes(rawOrigin) || rawOrigin.includes("vercel.app")) ? rawOrigin : "https://physiqrate.com";

  let body;
  try { body = await req.json(); } catch { return new Response(JSON.stringify({ error: "Invalid JSON" }), { status: 400 }); }

  const { sessionId } = body;
  if (!sessionId) return new Response(JSON.stringify({ active: false }), { status: 200 });

  try {
    const res = await fetch(`https://api.stripe.com/v1/checkout/sessions/${sessionId}`, {
      headers: { "Authorization": `Bearer ${process.env.STRIPE_SECRET_KEY}` }
    });
    const session = await res.json();
    if (session.error) return new Response(JSON.stringify({ active: false }), { status: 200 });

    const active = session.payment_status === "paid" || session.status === "complete";
    const email = session.customer_details?.email || session.customer_email || null;

    if (active && session.subscription) {
      const subRes = await fetch(`https://api.stripe.com/v1/subscriptions/${session.subscription}`, {
        headers: { "Authorization": `Bearer ${process.env.STRIPE_SECRET_KEY}` }
      });
      const sub = await subRes.json();
      const subActive = sub.status === "active" || sub.status === "trialing";
      return new Response(JSON.stringify({ active: subActive, email }), {
        status: 200,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": origin }
      });
    }

    return new Response(JSON.stringify({ active, email }), {
      status: 200,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": origin }
    });
  } catch {
    return new Response(JSON.stringify({ active: false }), { status: 200 });
  }
}
