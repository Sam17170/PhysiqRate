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

  const { token } = body;
  if (!token) return new Response(JSON.stringify({ error: "No token" }), { status: 401, headers });

  // Récupère l'email depuis le token Supabase Auth
  const userRes = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
    headers: { "apikey": SUPABASE_ANON, "Authorization": `Bearer ${token}` }
  });
  const user = await userRes.json();
  if (!user.email) return new Response(JSON.stringify({ error: "Invalid token" }), { status: 401, headers });

  // Vérifie que le compte existe dans notre table users
  const dbRes = await fetch(`${SUPABASE_URL}/rest/v1/users?email=eq.${encodeURIComponent(user.email)}&select=is_pro`, {
    headers: {
      "apikey": SUPABASE_SERVICE,
      "Authorization": `Bearer ${SUPABASE_SERVICE}`
    }
  });
  const rows = await dbRes.json();

  // Si l'email n'existe pas dans notre table → compte non reconnu
  if (!Array.isArray(rows) || rows.length === 0) {
    return new Response(JSON.stringify({ 
      error: "account_not_found",
      message: "Ce compte n'existe pas. Crée ton compte après le paiement."
    }), { status: 404, headers });
  }

  const isPro = rows[0].is_pro === true;
  return new Response(JSON.stringify({ email: user.email, is_pro: isPro }), { status: 200, headers });
}
