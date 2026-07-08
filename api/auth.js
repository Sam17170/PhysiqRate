export const config = { runtime: "edge" };

const SUPABASE_URL = "https://sgomsufulolxkrvuvpwy.supabase.co";
const SUPABASE_ANON = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNnb21zdWZ1bG9seGtydnV2cHd5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM1MDY3NTIsImV4cCI6MjA5OTA4Mjc1Mn0.9rp4PyV634wFEsvEvqH-vqslfBU4Z5SBJLQgf-az6Og";
const SUPABASE_SERVICE = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNnb21zdWZ1bG9seGtydnV2cHd5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MzUwNjc1MiwiZXhwIjoyMDk5MDgyNzUyfQ.53wMZkx1bPyHFtEQH21qpLDgt4vLLd-jcYaF5rHW1rU";

export default async function handler(req) {
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });
  const origin = req.headers.get("origin") || "https://physiqrate.com";
  const headers = { "Content-Type": "application/json", "Access-Control-Allow-Origin": origin };

  let body;
  try { body = await req.json(); } catch { return new Response(JSON.stringify({ error: "Invalid JSON" }), { status: 400 }); }

  const { action, email, password, sessionId } = body;

  // Réinitialisation mot de passe
  if (action === "reset") {
    await fetch(`${SUPABASE_URL}/auth/v1/recover`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "apikey": SUPABASE_ANON },
      body: JSON.stringify({ email })
    });
    return new Response(JSON.stringify({ success: true }), { status: 200, headers });
  }

  // Transfert Pro vers le bon email
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

  // LOGIN — vérifie que le compte existe dans users avant de connecter
  if (action === "login") {
    // Vérifie d'abord que l'email existe dans notre table users
    const checkRes = await fetch(`${SUPABASE_URL}/rest/v1/users?email=eq.${encodeURIComponent(email)}&select=email`, {
      headers: { "apikey": SUPABASE_SERVICE, "Authorization": `Bearer ${SUPABASE_SERVICE}` }
    });
    const rows = await checkRes.json();
    if (!Array.isArray(rows) || rows.length === 0) {
      return new Response(JSON.stringify({ error: "Ce compte n'existe pas. Crée ton compte après le paiement." }), { status: 400, headers });
    }

    // Connecte l'utilisateur
    const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "apikey": SUPABASE_ANON, "Authorization": `Bearer ${SUPABASE_ANON}` },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    if (data.error || data.error_description) {
      const msg = data.error_description || data.error?.message || "Mot de passe incorrect.";
      return new Response(JSON.stringify({ error: msg }), { status: 400, headers });
    }
    return new Response(JSON.stringify({ token: data.access_token, user: { email } }), { status: 200, headers });
  }

  // SIGNUP — crée le compte
  if (action === "signup") {
    const res = await fetch(`${SUPABASE_URL}/auth/v1/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "apikey": SUPABASE_ANON, "Authorization": `Bearer ${SUPABASE_ANON}` },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    if (data.error || data.error_description) {
      const msg = data.error_description || data.error?.message || "Erreur d'inscription.";
      return new Response(JSON.stringify({ error: msg }), { status: 400, headers });
    }
    // Crée l'entrée dans users avec is_pro false par défaut
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
