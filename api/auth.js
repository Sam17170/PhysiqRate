export const config = { runtime: "edge" };

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON = process.env.SUPABASE_ANON_KEY;
const SUPABASE_SERVICE = process.env.SUPABASE_SERVICE_KEY;

export default async function handler(req) {
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });
  const origin = req.headers.get("origin") || "https://physiqrate.com";
  const headers = { "Content-Type": "application/json", "Access-Control-Allow-Origin": origin };

  let body;
  try { body = await req.json(); } catch { return new Response(JSON.stringify({ error: "Invalid JSON" }), { status: 400 }); }

  const { action, email, password, sessionId } = body;

  if (action === "reset") {
    await fetch(`${SUPABASE_URL}/auth/v1/recover`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "apikey": SUPABASE_ANON },
      body: JSON.stringify({ email })
    });
    return new Response(JSON.stringify({ success: true }), { status: 200, headers });
  }

  if (action === "transfer_pro") {
    if (!email || !sessionId) return new Response(JSON.stringify({ error: "Missing params" }), { status: 400, headers });
    const stripeRes = await fetch(`https://api.stripe.com/v1/checkout/sessions/${sessionId}`, {
      headers: { "Authorization": `Bearer ${process.env.STRIPE_SECRET_KEY}` }
    });
    const session = await stripeRes.json();
    const stripeEmail = session.customer_details?.email || session.customer_email;
    if (stripeEmail && stripeEmail !== email) {
      await fetch(`${SUPABASE_URL}/rest/v1/users?email=eq.${encodeURIComponent(stripeEmail)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "apikey": SUPABASE_SERVICE, "Authorization": `Bearer ${SUPABASE_SERVICE}`, "Prefer": "return=minimal" },
        body: JSON.stringify({ email, is_pro: true })
      });
    } else {
      await fetch(`${SUPABASE_URL}/rest/v1/users?email=eq.${encodeURIComponent(email)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "apikey": SUPABASE_SERVICE, "Authorization": `Bearer ${SUPABASE_SERVICE}`, "Prefer": "return=minimal" },
        body: JSON.stringify({ is_pro: true })
      });
    }
    return new Response(JSON.stringify({ success: true }), { status: 200, headers });
  }

  if (action === "login") {
    const checkRes = await fetch(`${SUPABASE_URL}/rest/v1/users?email=eq.${encodeURIComponent(email)}&select=email`, {
      headers: { "apikey": SUPABASE_SERVICE, "Authorization": `Bearer ${SUPABASE_SERVICE}` }
    });
    const rows = await checkRes.json();
    if (!Array.isArray(rows) || rows.length === 0) {
      return new Response(JSON.stringify({ error: "Ce compte n'existe pas. Crée ton compte après le paiement." }), { status: 400, headers });
    }
    const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "apikey": SUPABASE_ANON, "Authorization": `Bearer ${SUPABASE_ANON}` },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    if (data.error || data.error_description) {
      return new Response(JSON.stringify({ error: data.error_description || data.error?.message || "Mot de passe incorrect." }), { status: 400, headers });
    }
    return new Response(JSON.stringify({ token: data.access_token, user: { email } }), { status: 200, headers });
  }

  if (action === "signup") {
    const res = await fetch(`${SUPABASE_URL}/auth/v1/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "apikey": SUPABASE_ANON, "Authorization": `Bearer ${SUPABASE_ANON}` },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    if (data.error || data.error_description) {
      return new Response(JSON.stringify({ error: data.error_description || data.error?.message || "Erreur d'inscription." }), { status: 400, headers });
    }
    if (data.user) {
      await fetch(`${SUPABASE_URL}/rest/v1/users?on_conflict=email`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "apikey": SUPABASE_SERVICE, "Authorization": `Bearer ${SUPABASE_SERVICE}`, "Prefer": "resolution=merge-duplicates,return=minimal" },
        body: JSON.stringify({ email: data.user.email, is_pro: false })
      });
    }
    return new Response(JSON.stringify({ token: data.access_token, user: { email: data.user?.email } }), { status: 200, headers });
  }

  return new Response(JSON.stringify({ error: "Unknown action" }), { status: 400, headers });
}
