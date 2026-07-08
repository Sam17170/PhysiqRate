export const config = { runtime: "edge" };

const SUPABASE_URL = "https://sgomsufulolxkrvuvpwy.supabase.co";
const SUPABASE_ANON = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNnb21zdWZ1bG9seGtydnV2cHd5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM1MDY3NTIsImV4cCI6MjA5OTA4Mjc1Mn0.9rp4PyV634wFEsvEvqH-vqslfBU4Z5SBJLQgf-az6Og";

export default async function handler(req) {
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });
  const origin = req.headers.get("origin") || "https://physiqrate.com";

  let body;
  try { body = await req.json(); } catch { return new Response(JSON.stringify({ error: "Invalid JSON" }), { status: 400 }); }

  const { action, email, password } = body;

  const endpoint = action === "signup"
    ? `${SUPABASE_URL}/auth/v1/signup`
    : `${SUPABASE_URL}/auth/v1/token?grant_type=password`;

  const res = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json", "apikey": SUPABASE_ANON, "Authorization": `Bearer ${SUPABASE_ANON}` },
    body: JSON.stringify({ email, password })
  });

  const data = await res.json();

  if (data.error || data.error_description) {
    const msg = data.error_description || data.error?.message || "Erreur d'authentification";
    return new Response(JSON.stringify({ error: msg }), { status: 400, headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": origin } });
  }

  // Si signup réussi, crée l'entrée dans la table users
  if (action === "signup" && data.user) {
    await fetch(`${SUPABASE_URL}/rest/v1/users`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "apikey": SUPABASE_ANON, "Authorization": `Bearer ${SUPABASE_ANON}`, "Prefer": "return=minimal" },
      body: JSON.stringify({ email: data.user.email, is_pro: false })
    });
  }

  return new Response(JSON.stringify({
    token: data.access_token,
    user: { email: data.user?.email || data.user?.email }
  }), { status: 200, headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": origin } });
}
