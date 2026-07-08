export const config = { runtime: "edge" };

const SUPABASE_URL = "https://sgomsufulolxkrvuvpwy.supabase.co";
const SUPABASE_ANON = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNnb21zdWZ1bG9seGtydnV2cHd5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM1MDY3NTIsImV4cCI6MjA5OTA4Mjc1Mn0.9rp4PyV634wFEsvEvqH-vqslfBU4Z5SBJLQgf-az6Og";
const SUPABASE_SERVICE = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNnb21zdWZ1bG9seGtydnV2cHd5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MzUwNjc1MiwiZXhwIjoyMDk5MDgyNzUyfQ.53wMZkx1bPyHFtEQH21qpLDgt4vLLd-jcYaF5rHW1rU";

async function getEmail(token) {
  const res = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
    headers: { "apikey": SUPABASE_ANON, "Authorization": `Bearer ${token}` }
  });
  const user = await res.json();
  return user.email || null;
}

function db(path, method = "GET", body = null) {
  return fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      "apikey": SUPABASE_SERVICE,
      "Authorization": `Bearer ${SUPABASE_SERVICE}`,
      "Prefer": method === "POST" ? "resolution=merge-duplicates,return=minimal" : "return=minimal"
    },
    ...(body ? { body: JSON.stringify(body) } : {})
  });
}

export default async function handler(req) {
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });
  const origin = req.headers.get("origin") || "https://physiqrate.com";
  const headers = { "Content-Type": "application/json", "Access-Control-Allow-Origin": origin };

  let body;
  try { body = await req.json(); } catch { return new Response(JSON.stringify({ error: "Invalid JSON" }), { status: 400 }); }

  const { action, token, data } = body;
  if (!token) return new Response(JSON.stringify({ error: "No token" }), { status: 401, headers });

  const email = await getEmail(token);
  if (!email) return new Response(JSON.stringify({ error: "Invalid token" }), { status: 401, headers });

  // PUSH — sauvegarde tout dans Supabase
  if (action === "push") {
    const { journal, analyses, profile, savedFoods } = data;

    // Journal du jour
    if (journal) {
      await db(`journals?on_conflict=user_email,date`, "POST", {
        user_email: email,
        date: journal.date,
        meals: journal.meals || [],
        steps: journal.steps || 0,
        sessions: journal.sessions || [],
        water: journal.water || 0
      });
    }

    // Analyses corporelles (batch)
    if (analyses && analyses.length > 0) {
      for (const a of analyses) {
        await db("analyses", "POST", {
          user_email: email,
          date: a.date,
          bodyfat: a.bodyfat,
          weight: a.weight || null,
          note: a.note || null,
          confidence: a.confidence || null
        });
      }
    }

    // Profil
    if (profile) {
      await db(`profiles?on_conflict=user_email`, "POST", {
        user_email: email,
        gender: profile.gender,
        age: profile.age,
        weight: profile.weight,
        height: profile.height,
        goal: profile.goal,
        activity: profile.activity
      });
    }

    // Aliments enregistrés
    if (savedFoods && savedFoods.length > 0) {
      for (const f of savedFoods) {
        await db(`saved_foods?on_conflict=user_email,name`, "POST", {
          user_email: email,
          name: f.name,
          brand: f.brand || null,
          calories: f.calories || 0,
          protein: f.protein || 0,
          carbs: f.carbs || 0,
          fat: f.fat || 0
        });
      }
    }

    return new Response(JSON.stringify({ success: true }), { status: 200, headers });
  }

  // PULL — récupère tout depuis Supabase
  if (action === "pull") {
    const { date } = data || {};

    const [journalRes, analysesRes, profileRes, foodsRes] = await Promise.all([
      db(`journals?user_email=eq.${encodeURIComponent(email)}&date=eq.${date}&limit=1`),
      db(`analyses?user_email=eq.${encodeURIComponent(email)}&order=date.desc&limit=100`),
      db(`profiles?user_email=eq.${encodeURIComponent(email)}&limit=1`),
      db(`saved_foods?user_email=eq.${encodeURIComponent(email)}&order=created_at.desc&limit=50`)
    ]);

    const [journals, analyses, profiles, savedFoods] = await Promise.all([
      journalRes.json(),
      analysesRes.json(),
      profileRes.json(),
      foodsRes.json()
    ]);

    return new Response(JSON.stringify({
      journal: journals?.[0] || null,
      analyses: analyses || [],
      profile: profiles?.[0] || null,
      savedFoods: savedFoods || []
    }), { status: 200, headers });
  }

  return new Response(JSON.stringify({ error: "Unknown action" }), { status: 400, headers });
}
