export const config = { runtime: "edge" };

const loginAttempts = new Map();
const signupAttempts = new Map();

function isRateLimited(ip) {
  const now = Date.now();
  const windowMs = 60 * 1000;
  const maxAttempts = 5;
  if (!loginAttempts.has(ip)) { loginAttempts.set(ip, { count: 1, start: now }); return false; }
  const entry = loginAttempts.get(ip);
  if (now - entry.start > windowMs) { loginAttempts.set(ip, { count: 1, start: now }); return false; }
  if (entry.count >= maxAttempts) return true;
  entry.count++;
  return false;
}

// Limite les créations de compte : 3 par IP par heure — empêche la création
// massive de comptes gratuits en boucle, sans gêner un utilisateur normal
function isSignupRateLimited(ip) {
  const now = Date.now();
  const windowMs = 60 * 60 * 1000; // 1 heure
  const maxAttempts = 3;
  if (!signupAttempts.has(ip)) { signupAttempts.set(ip, { count: 1, start: now }); return false; }
  const entry = signupAttempts.get(ip);
  if (now - entry.start > windowMs) { signupAttempts.set(ip, { count: 1, start: now }); return false; }
  if (entry.count >= maxAttempts) return true;
  entry.count++;
  return false;
}

export default async function handler(req) {
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });
  const origin = req.headers.get("origin") || "https://physiqrate.com";
  const headers = { "Content-Type": "application/json", "Access-Control-Allow-Origin": origin };

  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_ANON = process.env.SUPABASE_ANON_KEY;
  const SUPABASE_SERVICE = process.env.SUPABASE_SERVICE_KEY;

  let body;
  try { body = await req.json(); } catch { return new Response(JSON.stringify({ error: "Invalid JSON" }), { status: 400 }); }

  const { action, email, password, sessionId, refreshToken } = body;

  // Refresh token
  if (action === "refresh") {
    if (!refreshToken) return new Response(JSON.stringify({ error: "No refresh token" }), { status: 400, headers });
    const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=refresh_token`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "apikey": SUPABASE_ANON },
      body: JSON.stringify({ refresh_token: refreshToken })
    });
    const data = await res.json();
    if (data.access_token) {
      return new Response(JSON.stringify({ token: data.access_token, refresh_token: data.refresh_token }), { status: 200, headers });
    }
    return new Response(JSON.stringify({ error: "Token expired" }), { status: 401, headers });
  }

  if (email && (typeof email !== "string" || !email.includes("@") || email.length > 254)) {
    return new Response(JSON.stringify({ error: "Email invalide." }), { status: 400, headers });
  }

  if (action === "reset") {
    if (!email) return new Response(JSON.stringify({ error: "Email requis." }), { status: 400, headers });
    await fetch(`${SUPABASE_URL}/auth/v1/recover`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "apikey": SUPABASE_ANON },
      body: JSON.stringify({ email })
    });
    return new Response(JSON.stringify({ success: true }), { status: 200, headers });
  }

  if (action === "transfer_pro") {
    if (!email || !sessionId) return new Response(JSON.stringify({ error: "Missing params" }), { status: 400, headers });
    const authToken = req.headers.get("authorization")?.replace("Bearer ", "");
    if (authToken) {
      const userRes = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
        headers: { "apikey": SUPABASE_ANON, "Authorization": `Bearer ${authToken}` }
      });
      const user = await userRes.json();
      if (user.email && user.email.toLowerCase() !== email.toLowerCase()) {
        return new Response(JSON.stringify({ error: "Non autorisé." }), { status: 403, headers });
      }
    }
    const stripeRes = await fetch(`https://api.stripe.com/v1/checkout/sessions/${sessionId}`, {
      headers: { "Authorization": `Bearer ${process.env.STRIPE_SECRET_KEY}` }
    });
    const session = await stripeRes.json();
    if (session.error) return new Response(JSON.stringify({ error: "Session invalide." }), { status: 400, headers });
    const stripeEmail = session.customer_details?.email || session.customer_email;
    const targetEmail = stripeEmail && stripeEmail !== email ? stripeEmail : email;
    await fetch(`${SUPABASE_URL}/rest/v1/users?email=eq.${encodeURIComponent(targetEmail)}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", "apikey": SUPABASE_SERVICE, "Authorization": `Bearer ${SUPABASE_SERVICE}`, "Prefer": "return=minimal" },
      body: JSON.stringify({ email, is_pro: true })
    });
    return new Response(JSON.stringify({ success: true }), { status: 200, headers });
  }

  if (action === "login") {
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    if (isRateLimited(ip)) {
      return new Response(JSON.stringify({ error: "Trop de tentatives. Réessaie dans 1 minute." }), { status: 429, headers });
    }
    if (!email || !password) return new Response(JSON.stringify({ error: "Email et mot de passe requis." }), { status: 400, headers });
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
    return new Response(JSON.stringify({ token: data.access_token, refresh_token: data.refresh_token, user: { email } }), { status: 200, headers });
  }

  if (action === "signup") {
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    if (isSignupRateLimited(ip)) {
      return new Response(JSON.stringify({ error: "Trop de comptes créés depuis cette connexion. Réessaie dans 1 heure." }), { status: 429, headers });
    }
    if (!email || !password || password.length < 6) {
      return new Response(JSON.stringify({ error: "Email et mot de passe (6 caractères min) requis." }), { status: 400, headers });
    }
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
    return new Response(JSON.stringify({ token: data.access_token, refresh_token: data.refresh_token, user: { email: data.user?.email } }), { status: 200, headers });
  }

  return new Response(JSON.stringify({ error: "Unknown action" }), { status: 400, headers });
}
