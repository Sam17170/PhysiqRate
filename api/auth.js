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
  const rawOrigin = req.headers.get("origin") || "";
  const allowedOrigins = ["https://physiqrate.com", "https://www.physiqrate.com"];
  const origin = (allowedOrigins.includes(rawOrigin) || rawOrigin.includes("vercel.app")) ? rawOrigin : "https://physiqrate.com";
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
    // Le jeton d'auth est maintenant OBLIGATOIRE (plus une simple vérification optionnelle) —
    // sans ça, n'importe qui connaissant un sessionId payé valide pourrait l'utiliser pour
    // activer le Pro sur l'email de son choix.
    const authToken = req.headers.get("authorization")?.replace("Bearer ", "");
    if (!authToken) return new Response(JSON.stringify({ error: "Authentification requise." }), { status: 401, headers });
    const userRes = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
      headers: { "apikey": SUPABASE_ANON, "Authorization": `Bearer ${authToken}` }
    });
    const user = await userRes.json();
    if (!user.email || user.email.toLowerCase() !== email.toLowerCase()) {
      return new Response(JSON.stringify({ error: "Non autorisé." }), { status: 403, headers });
    }

    const stripeRes = await fetch(`https://api.stripe.com/v1/checkout/sessions/${sessionId}`, {
      headers: { "Authorization": `Bearer ${process.env.STRIPE_SECRET_KEY}` }
    });
    const session = await stripeRes.json();
    if (session.error) return new Response(JSON.stringify({ error: "Session invalide." }), { status: 400, headers });
    if (session.payment_status !== "paid") {
      return new Response(JSON.stringify({ error: "Paiement non confirmé." }), { status: 400, headers });
    }

    // Empêche la réutilisation d'une même session Stripe payée pour activer le Pro sur
    // plusieurs comptes différents — une session ne peut servir qu'une seule fois
    const usedRes = await fetch(`${SUPABASE_URL}/rest/v1/users?stripe_session_id=eq.${encodeURIComponent(sessionId)}&select=email`, {
      headers: { "apikey": SUPABASE_SERVICE, "Authorization": `Bearer ${SUPABASE_SERVICE}` }
    });
    const usedRows = await usedRes.json();
    const alreadyUsedForOtherEmail = Array.isArray(usedRows) && usedRows.some(r => r.email.toLowerCase() !== email.toLowerCase());
    if (alreadyUsedForOtherEmail) {
      return new Response(JSON.stringify({ error: "Cette session de paiement a déjà été utilisée." }), { status: 409, headers });
    }

    // Active le Pro directement sur l'email CHOISI par l'utilisateur (via la même fonction
    // fiable que le webhook) — plutôt que de tenter de renommer la ligne Stripe/Apple Pay,
    // ce qui entrait en conflit avec la ligne déjà créée par "signup" pour ce même email
    const rpcRes = await fetch(`${SUPABASE_URL}/rest/v1/rpc/upsert_user_pro`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "apikey": SUPABASE_SERVICE, "Authorization": `Bearer ${SUPABASE_SERVICE}` },
      body: JSON.stringify({
        p_email: email,
        p_is_pro: true,
        p_stripe_customer_id: session.customer || null,
        p_stripe_session_id: sessionId
      })
    });
    if (!rpcRes.ok) {
      const errText = await rpcRes.text().catch(()=>"(pas de détail)");
      console.error(`transfer_pro ÉCHEC pour ${email} — status ${rpcRes.status}: ${errText}`);
      return new Response(JSON.stringify({ error: "Impossible d'activer le Pro sur ce compte." }), { status: 500, headers });
    }
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
    // Vérifie le statut HTTP réel ET la présence d'un vrai token — ne se fie plus
    // uniquement au nom du champ d'erreur, qui varie selon la version de l'API Supabase
    // (error/error_description vs error_code/msg) et faisait passer un mauvais mot de
    // passe comme une connexion réussie.
    if (!res.ok || !data.access_token) {
      return new Response(JSON.stringify({ error: data.msg || data.error_description || data.error?.message || "Email ou mot de passe incorrect." }), { status: 400, headers });
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

    // Vérifie AVANT de créer l'identité Auth si une ligne existe déjà pour cet email
    // (ex: webhook Stripe qui a créé la ligne avec is_pro=true, mais sans mot de passe défini).
    // Sans ce garde-fou, n'importe qui pourrait "s'approprier" ce compte en tapant cet email
    // avec n'importe quel mot de passe, puisque Supabase Auth ne connaît pas encore d'identité.
    const existingRes = await fetch(`${SUPABASE_URL}/rest/v1/users?email=eq.${encodeURIComponent(email)}&select=email`, {
      headers: { "apikey": SUPABASE_SERVICE, "Authorization": `Bearer ${SUPABASE_SERVICE}` }
    });
    const existingRows = await existingRes.json();
    const rowAlreadyExists = Array.isArray(existingRows) && existingRows.length > 0;

    if (rowAlreadyExists) {
      // N'autorise la création que si on peut prouver un paiement Stripe récent, valide,
      // ET pas déjà utilisé pour un autre email (empêche la réutilisation d'une même
      // session payée pour s'approprier plusieurs comptes différents)
      let validPayment = false;
      if (sessionId) {
        try {
          const stripeRes = await fetch(`https://api.stripe.com/v1/checkout/sessions/${sessionId}`, {
            headers: { "Authorization": `Bearer ${process.env.STRIPE_SECRET_KEY}` }
          });
          const session = await stripeRes.json();
          if (!session.error && session.payment_status === "paid") {
            const usedRes = await fetch(`${SUPABASE_URL}/rest/v1/users?stripe_session_id=eq.${encodeURIComponent(sessionId)}&select=email`, {
              headers: { "apikey": SUPABASE_SERVICE, "Authorization": `Bearer ${SUPABASE_SERVICE}` }
            });
            const usedRows = await usedRes.json();
            const usedForOtherEmail = Array.isArray(usedRows) && usedRows.some(r => r.email.toLowerCase() !== email.toLowerCase());
            validPayment = !usedForOtherEmail;
          }
        } catch {}
      }
      if (!validPayment) {
        return new Response(JSON.stringify({ error: "Un compte existe déjà avec cet email. Connecte-toi, ou si tu viens de payer, réessaie depuis le lien de confirmation." }), { status: 409, headers });
      }
    }

    const res = await fetch(`${SUPABASE_URL}/auth/v1/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "apikey": SUPABASE_ANON, "Authorization": `Bearer ${SUPABASE_ANON}` },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    if (!res.ok || !data.user) {
      return new Response(JSON.stringify({ error: data.msg || data.error_description || data.error?.message || "Erreur d'inscription." }), { status: 400, headers });
    }
    if (data.user && !rowAlreadyExists) {
      // Vraiment nouveau compte — gratuit par défaut
      await fetch(`${SUPABASE_URL}/rest/v1/users`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "apikey": SUPABASE_SERVICE, "Authorization": `Bearer ${SUPABASE_SERVICE}`, "Prefer": "return=minimal" },
        body: JSON.stringify({ email: data.user.email, is_pro: false })
      });
    }
    // Si la ligne existe déjà (paiement déjà traité), on ne touche à rien —
    // is_pro garde sa valeur actuelle, jamais réinitialisé à false ici
    return new Response(JSON.stringify({ token: data.access_token, refresh_token: data.refresh_token, user: { email: data.user?.email } }), { status: 200, headers });
  }

  return new Response(JSON.stringify({ error: "Unknown action" }), { status: 400, headers });
}
