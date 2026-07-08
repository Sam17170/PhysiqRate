export const config = { runtime: "edge" };

async function getEmail(token) {
  const res = await fetch(`${process.env.SUPABASE_URL}/auth/v1/user`, {
    headers: { "apikey": process.env.SUPABASE_ANON_KEY, "Authorization": `Bearer ${token}` }
  });
  const user = await res.json();
  return user.email || null;
}

function db(path, method = "GET", body = null) {
  return fetch(`${process.env.SUPABASE_URL}/rest/v1/${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      "apikey": process.env.SUPABASE_SERVICE_KEY,
      "Authorization": `Bearer ${process.env.SUPABASE_SERVICE_KEY}`,
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

  if (action === "push") {
    const { journal, analyses, profile, savedFoods } = data;

    if (journal) {
      await db(`journals?on_conflict=user_email,date`, "POST", {
        user_email: email, date: journal.date,
        meals: journal.meals || [], steps: journal.steps || 0,
        sessions: journal.sessions || [], water: journal.water || 0
      });
    }

    if (analyses?.length > 0) {
      for (const a of analyses) {
        await db("analyses", "POST", {
          user_email: email, date: a.date, bodyfat: a.bodyfat,
          weight: a.weight || null, note: a.note || null, confidence: a.confidence || null
        });
      }
    }

    if (profile) {
      await db(`profiles?on_conflict=user_email`, "POST", {
        user_email: email, gender: profile.gender, age: profile.age,
        weight: profile.weight, height: profile.height, goal: profile.goal, activity: profile.activity
      });
    }

    if (savedFoods?.length > 0) {
      for (const f of savedFoods) {
        await db(`saved_foods?on_conflict=user_email,name`, "POST", {
          user_email: email, name: f.name, brand: f.brand || null,
          calories: f.calories || 0, protein: f.protein || 0, carbs: f.carbs || 0, fat: f.fat || 0
        });
      }
    }

    return new Response(JSON.stringify({ success: true }), { status: 200, headers });
  }

  if (action === "pull") {
    const { date } = data || {};
    const [journalRes, analysesRes, profileRes, foodsRes] = await Promise.all([
      db(`journals?user_email=eq.${encodeURIComponent(email)}&date=eq.${date}&limit=1`),
      db(`analyses?user_email=eq.${encodeURIComponent(email)}&order=date.desc&limit=100`),
      db(`profiles?user_email=eq.${encodeURIComponent(email)}&limit=1`),
      db(`saved_foods?user_email=eq.${encodeURIComponent(email)}&order=created_at.desc&limit=50`)
    ]);

    const [journals, analyses, profiles, savedFoods] = await Promise.all([
      journalRes.json(), analysesRes.json(), profileRes.json(), foodsRes.json()
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
