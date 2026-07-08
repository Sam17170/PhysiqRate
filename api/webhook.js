export const config = { runtime: "edge" };

const SUPABASE_URL = "https://sgomsufulolxkrvuvpwy.supabase.co";
const SUPABASE_SERVICE = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNnb21zdWZ1bG9seGtydnV2cHd5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MzUwNjc1MiwiZXhwIjoyMDk5MDgyNzUyfQ.53wMZkx1bPyHFtEQH21qpLDgt4vLLd-jcYaF5rHW1rU";

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

async function upsertUserSQL(email, isPro, stripeCustomerId = null, sessionId = null) {
  if (!email) return;

  // Utilise l'API SQL de Supabase pour un vrai ON CONFLICT
  const sql = `
    INSERT INTO users (email, is_pro, stripe_customer_id, stripe_session_id)
    VALUES ('${email.replace(/'/g, "''")}', ${isPro}, ${stripeCustomerId ? `'${stripeCustomerId}'` : 'NULL'}, ${sessionId ? `'${sessionId}'` : 'NULL'})
    ON CONFLICT (email)
    DO UPDATE SET is_pro = ${isPro}${stripeCustomerId ? `, stripe_customer_id = '${stripeCustomerId}'` : ''}${sessionId ? `, stripe_session_id = '${sessionId}'` : ''};
  `;

  const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "apikey": SUPABASE_SERVICE,
      "Authorization": `Bearer ${SUPABASE_SERVICE}`
    },
    body: JSON.stringify({ sql })
  });

  // Fallback — essaie aussi via l'API REST standard
  if (!res.ok) {
    // Tente d'abord un PATCH (update)
    const patchRes = await fetch(`${SUPABASE_URL}/rest/v1/users?email=eq.${encodeURIComponent(email)}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "apikey": SUPABASE_SERVICE,
        "Authorization": `Bearer ${SUPABASE_SERVICE}`,
        "Prefer": "return=minimal"
      },
      body: JSON.stringify({ is_pro: isPro, stripe_customer_id: stripeCustomerId, stripe_session_id: sessionId })
    });

    // Si aucune ligne mise à jour, fait un INSERT
    const patchText = await patchRes.text();
    if (patchRes.status === 200 && patchText === '') {
      await fetch(`${SUPABASE_URL}/rest/v1/users`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "apikey": SUPABASE_SERVICE,
          "Authorization": `Bearer ${SUPABASE_SERVICE}`,
          "Prefer": "return=minimal"
        },
        body: JSON.stringify({ email, is_pro: isPro, stripe_customer_id: stripeCustomerId, stripe_session_id: sessionId })
      });
    }
  }
}

export default async function handler(req) {
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });

  const body = await req.text();
  const signature = req.headers.get("stripe-signature") || "";
  const secret = process.env.STRIPE_WEBHOOK_SECRET;

  if (secret && signature) {
    const valid = await verifyStripeSignature(body, signature, secret);
    if (!valid) return new Response("Invalid signature", { status: 400 });
  }

  let event;
  try { event = JSON.parse(body); } catch { return new Response("Invalid payload", { status: 400 }); }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const email = session.customer_details?.email || session.customer_email;
    if (email) await upsertUserSQL(email, true, session.customer, session.id);
  }

  if (event.type === "customer.subscription.deleted") {
    const sub = event.data.object;
    try {
      const custRes = await fetch(`https://api.stripe.com/v1/customers/${sub.customer}`, {
        headers: { "Authorization": `Bearer ${process.env.STRIPE_SECRET_KEY}` }
      });
      const customer = await custRes.json();
      if (customer.email) await upsertUserSQL(customer.email, false);
    } catch {}
  }

  return new Response(JSON.stringify({ received: true }), { status: 200 });
}
