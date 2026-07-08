export const config = { runtime: "edge" };

export default async function handler(req) {
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });

  const origin = req.headers.get("origin") || "https://physiqrate.com";

  let body;
  try { body = await req.json(); } catch { return new Response(JSON.stringify({ error: "Invalid JSON" }), { status: 400 }); }

  const priceId = "price_1TqsRGRvX2XjC4owhAdFoJD1";

  const params = new URLSearchParams();
  params.append("line_items[0][price]", priceId);
  params.append("line_items[0][quantity]", "1");
  params.append("mode", "subscription");
  params.append("success_url", `${origin}/?session_id={CHECKOUT_SESSION_ID}&success=true`);
  params.append("cancel_url", `${origin}/?canceled=true`);
  params.append("allow_promotion_codes", "true");
  params.append("locale", "fr");

  const session = await fetch("https://api.stripe.com/v1/checkout/sessions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${process.env.STRIPE_SECRET_KEY}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: params.toString()
  });

  const data = await session.json();

  if (data.error) return new Response(JSON.stringify({ error: data.error.message }), { status: 500 });
  if (!data.url) return new Response(JSON.stringify({ error: "No URL returned" }), { status: 500 });

  return new Response(JSON.stringify({ url: data.url }), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": origin,
    }
  });
}
