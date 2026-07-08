export const config = { runtime: "edge" };

export default async function handler(req) {
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });
  const origin = req.headers.get("origin") || "https://physiqrate.com";
  const headers = { "Content-Type": "application/json", "Access-Control-Allow-Origin": origin };

  let body;
  try { body = await req.json(); } catch { return new Response(JSON.stringify({ error: "Invalid JSON" }), { status: 400 }); }

  const { token } = body;
  if (!token) return new Response(JSON.stringify({ error: "No token" }), { status: 401, headers });

  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_ANON = process.env.SUPABASE_ANON_KEY;
  const SUPABASE_SERVICE = process.env.SUPABASE_SERVICE_KEY;

  const userRes = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
    headers: { "apikey": SUPABASE_ANON, "Authorization": `Bearer ${token}` }
  });
  const user = await userRes.json();
  if (!user.email) return new Response(JSON.stringify({ error: "Invalid token" }), { status: 401, headers });

  const dbRes = await fetch(`${SUPABASE_URL}/rest/v1/users?email=eq.${encodeURIComponent(user.email)}&select=is_pro`, {
    headers: { "apikey": SUPABASE_SERVICE, "Authorization": `Bearer ${SUPABASE_SERVICE}` }
  });
  const rows = await dbRes.json();

  if (!Array.isArray(rows) || rows.length === 0) {
    return new Response(JSON.stringify({ error: "account_not_found" }), { status: 404, headers });
  }

  return new Response(JSON.stringify({ email: user.email, is_pro: rows[0].is_pro === true }), { status: 200, headers });
}
