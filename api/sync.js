export const config = { runtime: "edge" };

async function getEmailFromToken(token) {
  const res = await fetch(`${process.env.SUPABASE_URL}/auth/v1/user`, {
    headers: { "apikey": process.env.SUPABASE_ANON_KEY, "Authorization": `Bearer ${token}` }
  });
  if (!res.ok) return null;
  const user = await res.json();
  return user.email || null;
}

async function refreshAndGetEmail(refreshToken) {
  if (!refreshToken) return null;
  const res = await fetch(`${process.env.SUPABASE_URL}/auth/v1/token?grant_type=refresh_token`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "apikey": process.env.SUPABASE_ANON_KEY },
    body: JSON.stringify({ refresh_token: refreshToken })
  });
  if (!res.ok) return null;
  const data = await res.json();
  return data.access_token ? { email: data.user?.email, newToken: data.access_token, newRefresh: data.refresh_token } : null;
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

function validateJournal(journal) {
  if (!journal || typeof journal !== "object") return null;
  return {
    date: String(journal.date || "").slice(0, 10),
    meals: Array.isArray(journal.meals) ? journal.meals.slice(0, 50).map(m => ({
      name: String(m.name || "").slice(0, 100),
      calories: Math.min(Math.max(parseInt(m.calories) || 0, 0), 5000),
      protein: Math.min(Math.max(parseInt(m.protein) || 0, 0), 500),
      carbs: Math.min(Math.max(parseInt(m.carbs) || 0, 0), 500),
      fat: Math.min(Math.max(parseInt(m.fat) || 0, 0), 500),
      time: String(m.time || "").slice(0, 10),
    })) : [],
    steps: Math.min(Math.max(parseInt(journal.steps) || 0, 0), 100000),
    sessions: Array.isArray(journal.sessions) ? journal.sessions.slice(0, 10) : [],
    session: journal.session ? {
      type: String(journal.session.type || "").slice(0, 100),
      duration: Math.min(Math.max(parseInt(journal.session.duration) || 0, 0), 600),
      done: !!journal.session.done
    } : null,
    water: Math.min(Math.max(parseInt(journal.water) || 0, 0), 20),
  };
}

const VALID_STEPS = ["under_3k", "3k_6k", "6k_10k", "10k_15k", "over_15k"];
const VALID_TRAINING_TYPES = ["strength", "cardio", "mixed", "sport"];

function validateProfile(profile) {
  if (!profile || typeof profile !== "object") return null;
  return {
    gender: ["male", "female"].includes(profile.gender) ? profile.gender : null,
    age: Math.min(Math.max(parseInt(profile.age) || 0, 0), 120),
    weight: Math.min(Math.max(parseFloat(profile.weight) || 0, 0), 500),
    height: Math.min(Math.max(parseFloat(profile.height) || 0, 0), 300),
    goal: String(profile.goal || "").slice(0, 50),
    activity: String(profile.activity || "").slice(0, 50),
    steps: VALID_STEPS.includes(profile.steps) ? profile.steps : null,
    training_type: VALID_TRAINING_TYPES.includes(profile.trainingType) ? profile.trainingType : null,
  };
}

function validateAnalysis(a) {
  return {
    date: String(a.date || "").slice(0, 10),
    bodyfat: Math.min(Math.max(parseInt(a.bodyfat) || 0, 1), 70),
    weight: a.weight ? Math.min(Math.max(parseFloat(a.weight), 0), 500) : null,
    note: a.note ? String(a.note).slice(0, 200) : null,
    confidence: ["low", "medium", "high"].includes(a.confidence) ? a.confidence : null,
  };
}

function validateSavedSession(s) {
  if (!s || typeof s !== "object" || !s.type) return null;
  return {
    type: String(s.type).slice(0, 100),
    duration: Math.min(Math.max(parseInt(s.duration) || 0, 0), 600),
  };
}

export default async function handler(req) {
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });
  const rawOrigin = req.headers.get("origin") || "";
  const allowedOrigins = ["https://physiqrate.com", "https://www.physiqrate.com"];
  const origin = (allowedOrigins.includes(rawOrigin) || rawOrigin.includes("vercel.app")) ? rawOrigin : "https://physiqrate.com";
  const headers = { "Content-Type": "application/json", "Access-Control-Allow-Origin": origin };

  let body;
  try { body = await req.json(); } catch { return new Response(JSON.stringify({ error: "Invalid JSON" }), { status: 400 }); }

  const { action, token, refreshToken, data } = body;
  if (!token || typeof token !== "string" || token.length > 2000) {
    return new Response(JSON.stringify({ error: "Invalid token" }), { status: 401, headers });
  }

  // Tente d'abord avec le token actuel
  let email = await getEmailFromToken(token);
  let newToken = null;
  let newRefresh = null;

  // Si token expiré, tente un refresh
  if (!email && refreshToken) {
    const refreshed = await refreshAndGetEmail(refreshToken);
    if (refreshed) {
      email = refreshed.email;
      newToken = refreshed.newToken;
      newRefresh = refreshed.newRefresh;
    }
  }

  if (!email) return new Response(JSON.stringify({ error: "Invalid token", code: "TOKEN_EXPIRED" }), { status: 401, headers });

  const responseHeaders = { ...headers };
  // Retourne le nouveau token si refresh effectué
  const meta = newToken ? { newToken, newRefresh } : {};

  if (action === "push") {
    const { journal, analyses, profile, savedFoods, savedSessions, deleteSavedFood, deleteSavedSession } = data || {};

    if (journal) {
      const j = validateJournal(journal);
      if (j && j.date) {
        await db(`journals?on_conflict=user_email,date`, "POST", {
          user_email: email, date: j.date, meals: j.meals,
          steps: j.steps, sessions: j.sessions, session: j.session, water: j.water
        });
      }
    }

    if (Array.isArray(analyses)) {
      for (const a of analyses.slice(0, 10)) {
        const v = validateAnalysis(a);
        if (v.date && v.bodyfat) {
          await db("analyses", "POST", { user_email: email, ...v });
        }
      }
    }

    if (profile) {
      const p = validateProfile(profile);
      if (p) await db(`profiles?on_conflict=user_email`, "POST", { 
        user_email: email, ...p, 
        updated_at: profile.updated_at || new Date().toISOString()
      });
    }

    if (Array.isArray(savedFoods)) {
      for (const f of savedFoods.slice(0, 10)) {
        if (!f.name) continue;
        await db(`saved_foods?on_conflict=user_email,name`, "POST", {
          user_email: email,
          name: String(f.name).slice(0, 100),
          brand: f.brand ? String(f.brand).slice(0, 100) : null,
          calories: Math.min(Math.max(parseInt(f.calories) || 0, 0), 5000),
          protein: Math.min(Math.max(parseInt(f.protein) || 0, 0), 500),
          carbs: Math.min(Math.max(parseInt(f.carbs) || 0, 0), 500),
          fat: Math.min(Math.max(parseInt(f.fat) || 0, 0), 500),
        });
      }
    }

    if (Array.isArray(savedSessions)) {
      for (const s of savedSessions.slice(0, 20)) {
        const v = validateSavedSession(s);
        if (!v) continue;
        await db(`saved_sessions?on_conflict=user_email,type`, "POST", {
          user_email: email, ...v
        });
      }
    }

    // Suppression d'un aliment ou d'une séance enregistrée — sans ça, l'élément supprimé
    // localement réapparaissait après une resynchronisation, puisque Supabase ne recevait
    // jamais l'ordre de suppression.
    if (deleteSavedFood) {
      await db(`saved_foods?user_email=eq.${encodeURIComponent(email)}&name=eq.${encodeURIComponent(String(deleteSavedFood).slice(0,100))}`, "DELETE");
    }
    if (deleteSavedSession) {
      await db(`saved_sessions?user_email=eq.${encodeURIComponent(email)}&type=eq.${encodeURIComponent(String(deleteSavedSession).slice(0,100))}`, "DELETE");
    }

    return new Response(JSON.stringify({ success: true, ...meta }), { status: 200, headers });
  }

  if (action === "pull") {
    const date = String((data || {}).date || "").slice(0, 10) || new Date().toISOString().slice(0, 10);

    const [journalRes, analysesRes, profileRes, foodsRes, sessionsRes] = await Promise.all([
      db(`journals?user_email=eq.${encodeURIComponent(email)}&date=eq.${date}&select=*&limit=1`),
      db(`analyses?user_email=eq.${encodeURIComponent(email)}&order=date.desc&limit=100`),
      db(`profiles?user_email=eq.${encodeURIComponent(email)}&select=*&limit=1`),
      db(`saved_foods?user_email=eq.${encodeURIComponent(email)}&order=created_at.desc&limit=50`),
      db(`saved_sessions?user_email=eq.${encodeURIComponent(email)}&order=created_at.desc&limit=20`)
    ]);

    const [journals, analyses, profiles, savedFoods, savedSessions] = await Promise.all([
      journalRes.json(), analysesRes.json(), profileRes.json(), foodsRes.json(), sessionsRes.json()
    ]);

    return new Response(JSON.stringify({
      journal: journals?.[0] || null,
      analyses: analyses || [],
      profile: profiles?.[0] || null,
      savedFoods: savedFoods || [],
      savedSessions: savedSessions || [],
      ...meta
    }), { status: 200, headers });
  }

  return new Response(JSON.stringify({ error: "Unknown action" }), { status: 400, headers });
}
