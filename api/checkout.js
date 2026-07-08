export const config = { runtime: "edge" };

export default async function handler(req) {
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });

  const origin = req.headers.get("origin") || "https://physiqrate.com";

  let body;
  try { body = await req.json(); } catch { return new Response(JSON.stringify({ error: "Invalid JSON" }), { status: 400 }); }

  const { type } = body; // "subscription" ou "one_time"

  const priceId = type === "one_time"
    ? "price_1TqsRGRvX2XjC4owhAdFoJD1" // 1,99€ one-time — à créer sur Stripe
    : "price_1TqsRGRvX2XjC4owhAdFoJD1"; // 4,99€/mois

  const session = await fetch("https://api.stripe.com/v1/checkout/sessions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${process.env.STRIPE_SECRET_KEY}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      "payment_method_types[]": "card",
      "payment_method_types[]": "apple_pay",
      "line_items[0][price]": priceId,
      "line_items[0][quantity]": "1",
      "mode": type === "one_time" ? "payment" : "subscription",
      "success_url": `${origin}/?session_id={CHECKOUT_SESSION_ID}&success=true`,
      "cancel_url": `${origin}/?canceled=true`,
      "allow_promotion_codes": "true",
      "locale": "fr",
    }).toString()
  });

  const data = await session.json();

  if (data.error) return new Response(JSON.stringify({ error: data.error.message }), { status: 500 });

  return new Response(JSON.stringify({ url: data.url }), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": origin,
    }
  });
}
