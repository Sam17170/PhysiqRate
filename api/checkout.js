export const config = { runtime: "edge" };

const checkoutAttempts = new Map();
// Limite la création de sessions de paiement : 10 par IP par 10 minutes — empêche le
// spam de sessions Stripe sans gêner un utilisateur normal qui hésite/réessaie
function isCheckoutRateLimited(ip) {
  const now = Date.now();
  const windowMs = 10 * 60 * 1000;
  const maxAttempts = 10;
  if (!checkoutAttempts.has(ip)) { checkoutAttempts.set(ip, { count: 1, start: now }); return false; }
  const entry = checkoutAttempts.get(ip);
  if (now - entry.start > windowMs) { checkoutAttempts.set(ip, { count: 1, start: now }); return false; }
  if (entry.count >= maxAttempts) return true;
  entry.count++;
  return false;
}

export default async function handler(req) {
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });

  const rawOrigin = req.headers.get("origin") || "";
  const allowedOrigins = ["https://physiqrate.com", "https://www.physiqrate.com"];
  const origin = (allowedOrigins.includes(rawOrigin) || rawOrigin.includes("vercel.app")) ? rawOrigin : "https://physiqrate.com";

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (isCheckoutRateLimited(ip)) {
    return new Response(JSON.stringify({ error: "Trop de tentatives. Réessaie dans quelques minutes." }), { status: 429, headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": origin } });
  }

  let body;
  try { body = await req.json(); } catch { return new Response(JSON.stringify({ error: "Invalid JSON" }), { status: 400 }); }

  const { type, accountEmail } = body;
  const SINGLE_ANALYSIS_PRICE = "price_1Tsj2xRvX2XjC4ow5NcvOyqi";
  const SUBSCRIPTION_PRICE = "price_1TqsRGRvX2XjC4owhAdFoJD1";

  const params = new URLSearchParams();
  params.append("allow_promotion_codes", "true");
  params.append("locale", "fr");
  if (accountEmail) params.append("client_reference_id", accountEmail);

  if (type === "single_analysis") {
    // Achat ponctuel d'une analyse à 0,99€ — remplace le déblocage hebdomadaire par pub
    params.append("line_items[0][price]", SINGLE_ANALYSIS_PRICE);
    params.append("line_items[0][quantity]", "1");
    params.append("mode", "payment");
    params.append("metadata[product]", "single_analysis");
    params.append("success_url", `${origin}/?analysis_purchase=true&session_id={CHECKOUT_SESSION_ID}`);
    params.append("cancel_url", `${origin}/?canceled=true`);
  } else {
    params.append("line_items[0][price]", SUBSCRIPTION_PRICE);
    params.append("line_items[0][quantity]", "1");
    params.append("mode", "subscription");
    params.append("success_url", `${origin}/?session_id={CHECKOUT_SESSION_ID}&success=true`);
    params.append("cancel_url", `${origin}/?canceled=true`);
  }
  // Si l'utilisateur est déjà connecté à un compte, on le rattache explicitement à la session
  // pour que le Pro (ou le crédit) se lie à SON compte, peu importe l'email de paiement

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
