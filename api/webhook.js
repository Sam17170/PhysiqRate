export const config = { runtime: "edge" };

async function verifyStripeSignature(body, signature, secret) {
  const parts = signature.split(",");
  const timestamp = parts.find(p => p.startsWith("t="))?.slice(2);
  const v1 = parts.find(p => p.startsWith("v1="))?.slice(3);
  if (!timestamp || !v1) return false;
  const payload = `${timestamp}.${body}`;
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payload));
  const hex = Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, "0")).join("");
  return hex === v1;
}

async function upsertUser(email, isPro, stripeCustomerId = null, sessionId = null) {
  if (!email) { console.error("upsertUser: email manquant"); return; }
  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_SERVICE = process.env.SUPABASE_SERVICE_KEY;

  const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/upsert_user_pro`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "apikey": SUPABASE_SERVICE,
      "Authorization": `Bearer ${SUPABASE_SERVICE}`
    },
    body: JSON.stringify({
      p_email: email,
      p_is_pro: isPro,
      p_stripe_customer_id: stripeCustomerId || null,
      p_stripe_session_id: sessionId || null
    })
  });
  if (!res.ok) {
    const errText = await res.text().catch(()=>"(pas de détail)");
    console.error(`upsertUser ÉCHEC pour ${email} — status ${res.status}: ${errText}`);
  }
  return res.status;
}

export default async function handler(req) {
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });

  const body = await req.text();
  const signature = req.headers.get("stripe-signature") || "";
  const secret = process.env.STRIPE_WEBHOOK_SECRET;

  // La vérification de signature est TOUJOURS obligatoire — jamais sautée, même si
  // la config ou l'en-tête semble manquant. Sans ça, n'importe qui pourrait forger
  // un faux événement Stripe (ex: s'attribuer le Pro gratuitement) en appelant
  // directement cet endpoint.
  if (!secret) {
    console.error("STRIPE_WEBHOOK_SECRET manquant côté serveur — requête refusée.");
    return new Response("Server misconfigured", { status: 500 });
  }
  if (!signature) {
    return new Response("Missing signature", { status: 400 });
  }
  const valid = await verifyStripeSignature(body, signature, secret);
  if (!valid) return new Response("Invalid signature", { status: 400 });

  let event;
  try { event = JSON.parse(body); } catch { return new Response("Invalid payload", { status: 400 }); }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    // Priorité au compte déjà connecté (passé via client_reference_id) — pas à l'email
    // de paiement, qui peut différer (Apple Pay, Google Pay...)
    const linkedAccountEmail = session.client_reference_id;
    const stripeEmail = session.customer_details?.email || session.customer_email;
    const targetEmail = linkedAccountEmail || stripeEmail;
    console.log(`checkout.session.completed — client_reference_id=${linkedAccountEmail || "(vide)"} stripeEmail=${stripeEmail || "(vide)"} targetEmail=${targetEmail || "(AUCUN)"}`);
    if (targetEmail) {
      await upsertUser(targetEmail, true, session.customer, session.id);
    } else {
      console.error("checkout.session.completed reçu SANS aucun email exploitable — session.id:", session.id);
    }
  }

  if (event.type === "customer.subscription.deleted") {
    const sub = event.data.object;
    try {
      const custRes = await fetch(`https://api.stripe.com/v1/customers/${sub.customer}`, {
        headers: { "Authorization": `Bearer ${process.env.STRIPE_SECRET_KEY}` }
      });
      const customer = await custRes.json();
      if (customer.email) await upsertUser(customer.email, false);
    } catch {}
  }

  return new Response(JSON.stringify({ received: true }), { status: 200 });
}
