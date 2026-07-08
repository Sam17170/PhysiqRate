export const config = { runtime: "edge" };

const SUPABASE_URL = "https://sgomsufulolxkrvuvpwy.supabase.co";
const SUPABASE_ANON = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNnb21zdWZ1bG9seGtydnV2cHd5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM1MDY3NTIsImV4cCI6MjA5OTA4Mjc1Mn0.9rp4PyV634wFEsvEvqH-vqslfBU4Z5SBJLQgf-az6Og";

// Vérifie la signature Stripe pour sécuriser le webhook
async function verifyStripeSignature(body, signature, secret) {
  const parts = signature.split(",");
  const timestamp = parts.find(p => p.startsWith("t="))?.slice(2);
  const v1 = parts.find(p => p.startsWith("v1="))?.slice(3);
  if (!timestamp || !v1) return false;

  const payload = `${timestamp}.${body}`;
  const key = await crypto.subtle.importKey(
    "raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payload));
  const hex = Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, "0")).join("");
  return hex === v1;
}

async function updateUserPro(email, isPro, stripeCustomerId = null, sessionId = null) {
  if (!email) return;
  const body = { is_pro: isPro };
  if (stripeCustomerId) body.stripe_customer_id = stripeCustomerId;
  if (sessionId) body.stripe_session_id = sessionId;

  await fetch(`${SUPABASE_URL}/rest/v1/users?email=eq.${encodeURIComponent(email)}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", "apikey": SUPABASE_ANON, "Authorization": `Bearer ${SUPABASE_ANON}`, "Prefer": "return=minimal" },
    body: JSON.stringify(body)
  });
}

export default async function handler(req) {
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });

  const body = await req.text();
  const signature = req.headers.get("stripe-signature") || "";
  const secret = process.env.STRIPE_WEBHOOK_SECRET;

  // Vérifie la signature si le secret est configuré
  if (secret && signature) {
    const valid = await verifyStripeSignature(body, signature, secret);
    if (!valid) return new Response("Invalid signature", { status: 400 });
  }

  let event;
  try { event = JSON.parse(body); } catch { return new Response("Invalid payload", { status: 400 }); }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const email = session.customer_details?.email || session.customer_email;
    await updateUserPro(email, true, session.customer, session.id);
  }

  if (event.type === "customer.subscription.deleted") {
    const sub = event.data.object;
    try {
      const custRes = await fetch(`https://api.stripe.com/v1/customers/${sub.customer}`, {
        headers: { "Authorization": `Bearer ${process.env.STRIPE_SECRET_KEY}` }
      });
      const customer = await custRes.json();
      await updateUserPro(customer.email, false);
    } catch {}
  }

  return new Response(JSON.stringify({ received: true }), { status: 200 });
}
