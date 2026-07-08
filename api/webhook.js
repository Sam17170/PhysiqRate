export const config = { runtime: "edge" };

const SUPABASE_URL = "https://sgomsufulolxkrvuvpwy.supabase.co";
const SUPABASE_SERVICE = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNnb21zdWZ1bG9seGtydnV2cHd5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MzUwNjc1MiwiZXhwIjoyMDk5MDgyNzUyfQ.53wMZkx1bPyHFtEQH21qpLDgt4vLLd-jcYaF5rHW1rU";

async function upsertUser(email, isPro, stripeCustomerId = null, sessionId = null) {
  if (!email) return;
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
  return res.status;
}

export default async function handler(req) {
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });

  let event;
  try {
    const body = await req.text();
    event = JSON.parse(body);
  } catch {
    return new Response("Invalid payload", { status: 400 });
  }

  // Signature vérification désactivée temporairement pour debug
  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const email = session.customer_details?.email || session.customer_email;
    if (email) {
      const status = await upsertUser(email, true, session.customer, session.id);
      return new Response(JSON.stringify({ received: true, email, supabase_status: status }), { status: 200 });
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
