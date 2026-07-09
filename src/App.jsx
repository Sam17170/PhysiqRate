import { useState, useRef, useEffect } from "react";

// ─── ARCHETYPES ───────────────────────────────────────────────────────────────
const ARCHETYPES = {
  male: [
    { max: 6,   label: "Compétition",   ref: "Zyzz / Arnold peak",      color: "#FFD700" },
    { max: 10,  label: "Athlète Elite", ref: "Brad Pitt Fight Club",     color: "#C0C0FF" },
    { max: 14,  label: "Athlète",       ref: "Chris Hemsworth Thor",     color: "#7DF9AA" },
    { max: 18,  label: "Fit",           ref: "Ryan Reynolds Deadpool",   color: "#7DF9FF" },
    { max: 22,  label: "Lifestyle",     ref: "Chris Pratt post-Marvel",  color: "#A0C4FF" },
    { max: 27,  label: "Casual",        ref: "Vibe bear mode",           color: "#FFB347" },
    { max: 35,  label: "Bulk",          ref: "Off-season powerlifter",   color: "#FF8C69" },
    { max: 100, label: "Rebuild",       ref: "Mission transformation",   color: "#FF6B6B" },
  ],
  female: [
    { max: 14,  label: "Compétition",   ref: "Bikini athlete",           color: "#FFD700" },
    { max: 18,  label: "Athlète Elite", ref: "Serena Williams",          color: "#C0C0FF" },
    { max: 22,  label: "Athlète",       ref: "Margot Robbie Barbie",     color: "#7DF9AA" },
    { max: 26,  label: "Fit",           ref: "Jennifer Aniston",         color: "#7DF9FF" },
    { max: 30,  label: "Lifestyle",     ref: "Healthy vibes",            color: "#A0C4FF" },
    { max: 35,  label: "Casual",        ref: "Du potentiel à débloquer", color: "#FFB347" },
    { max: 42,  label: "Bulk",          ref: "Zone de confort",          color: "#FF8C69" },
    { max: 100, label: "Rebuild",       ref: "Mission transformation",   color: "#FF6B6B" },
  ],
};
function getArchetype(bf, gender) {
  const list = ARCHETYPES[gender] || ARCHETYPES.male;
  return list.find(a => bf <= a.max) || list[list.length - 1];
}

// ─── TDEE — MIFFLIN-ST JEOR ──────────────────────────────────────────────────
const ACTIVITY_LEVELS = [
  { key: "sedentary",    label: "Sédentaire — peu ou pas d'exercice",     factor: 1.2   },
  { key: "light",        label: "Légèrement actif — 1 à 3x/sem",          factor: 1.375 },
  { key: "moderate",     label: "Modérément actif — 3 à 5x/sem",          factor: 1.55  },
  { key: "active",       label: "Très actif — 4 à 6x/sem",                factor: 1.725 },
  { key: "extra_active", label: "Extrêmement actif — 2x/jour",            factor: 1.9   },
];
const DAILY_STEPS = [
  { key: "under_3k",   label: "Moins de 3 000 pas/jour",    steps: 2000  },
  { key: "3k_6k",      label: "3 000 à 6 000 pas/jour",     steps: 4500  },
  { key: "6k_10k",     label: "6 000 à 10 000 pas/jour",    steps: 8000  },
  { key: "10k_15k",    label: "10 000 à 15 000 pas/jour",   steps: 12500 },
  { key: "over_15k",   label: "Plus de 15 000 pas/jour",    steps: 17500 },
];

const GOALS = [
  { key: "cut_hard",  label: "Perte de gras agressive (−25%)", factor: -0.25,
    // Protéines élevées pour préserver le muscle en déficit sévère (Helms et al. 2014)
    protein_per_kg: 2.4, fat_per_kg: 0.8 },
  { key: "cut",       label: "Perte de gras (−15%)",           factor: -0.15,
    // Déficit modéré — protéines hautes, lipides minimum hormonal (ISSN)
    protein_per_kg: 2.0, fat_per_kg: 0.9 },
  { key: "maintain",  label: "Maintien (0%)",                  factor: 0,
    // Entretien musculaire standard (Phillips & Van Loon 2011)
    protein_per_kg: 1.8, fat_per_kg: 1.0 },
  { key: "lean_bulk", label: "Prise de muscle (+10%)",         factor: 0.10,
    // Surplus léger — glucides élevés pour la performance et l'anabolisme
    protein_per_kg: 1.8, fat_per_kg: 1.0 },
  { key: "bulk",      label: "Prise de masse (+20%)",          factor: 0.20,
    // Surplus important — protéines modérées, glucides max pour l'énergie
    protein_per_kg: 1.6, fat_per_kg: 1.0 },
];

// Calcul macros cibles basé sur le poids corporel (méthode scientifique)
// 1. Protéines = protein_per_kg × poids (4 kcal/g)
// 2. Lipides = fat_per_kg × poids (9 kcal/g) — minimum hormonal ISSN ≥ 20% cals
// 3. Glucides = calories restantes / 4 kcal/g
function calcTargetMacros(calories, goalKey, weight) {
  if (!calories || !goalKey || !weight) return null;
  const goal = GOALS.find(g => g.key === goalKey);
  if (!goal) return null;
  const w = parseFloat(weight);
  const protein = Math.round(goal.protein_per_kg * w);
  const fat     = Math.round(goal.fat_per_kg * w);
  const proteinCals = protein * 4;
  const fatCals     = fat * 9;
  const remaining   = calories - proteinCals - fatCals;
  const carbs       = Math.max(0, Math.round(remaining / 4));
  return { protein, fat, carbs,
    proteinPct: Math.round(proteinCals / calories * 100),
    fatPct:     Math.round(fatCals / calories * 100),
    carbsPct:   Math.round(remaining / calories * 100),
  };
}
function calcTDEE(gender, age, height, weight, activityKey, stepsKey) {
  if (!gender || !age || !height || !weight) return null;
  const a = parseFloat(age), h = parseFloat(height), w = parseFloat(weight);
  const bmr = gender === "male"
    ? (10 * w) + (6.25 * h) - (5 * a) + 5
    : (10 * w) + (6.25 * h) - (5 * a) - 161;
  const factor = ACTIVITY_LEVELS.find(l => l.key === activityKey)?.factor || 1.55;
  const baseTDEE = bmr * factor;
  // Ajout calories brûlées par les pas (0.045 kcal × poids × pas / 1000)
  const stepsPerDay = DAILY_STEPS.find(s => s.key === stepsKey)?.steps || 0;
  const stepsCals = stepsPerDay > 0 ? Math.round(0.045 * w * stepsPerDay / 1000) : 0;
  return Math.round(baseTDEE + stepsCals);
}
function calcGoal(tdee, goalKey) {
  if (!tdee) return null;
  const factor = GOALS.find(g => g.key === goalKey)?.factor || 0;
  return Math.round(tdee * (1 + factor));
}

// ─── STORAGE HELPERS ─────────────────────────────────────────────────────────
const keys = {
  usage:      "pq_usage",
  nutrition:  "pq_nutrition",
  history:    "pq_history",
  profile:    "pq_profile",
  premium:    "pq_premium",
  journal:    "pq_journal",
  weight:     "pq_last_weight",
};
const get = (k) => { try { const r = localStorage.getItem(k); return r ? JSON.parse(r) : null; } catch { return null; } };
const set = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} };

function getProfile()  { return get(keys.profile)  || {}; }
function saveProfile(p){ set(keys.profile, p); syncPush({ profile: p }); }
function getCustomMacros() { return get("pq_custom_macros") || null; }
function saveCustomMacros(m) { set("pq_custom_macros", m); }
function isPremium()   { const v = localStorage.getItem(keys.premium); return v === true || v === "true"; }
function setPremium(v) { set(keys.premium, v); }

function getUsage()    { return get(keys.usage) || { count: 0, weeklyUsed: null }; }
function saveUsage(u)  { set(keys.usage, u); }
function canAnalyze(u) {
  if (u.count < 2) return { allowed: true };
  if (!u.weeklyUsed) return { allowed: true };
  const days = (Date.now() - new Date(u.weeklyUsed).getTime()) / 86400000;
  if (days >= 7) return { allowed: true };
  return { allowed: false, daysLeft: Math.ceil(7 - days) };
}

function getNutritionUsage() { return get(keys.nutrition) || { lastUsed: null, todayCount: 0 }; }
function canScanNutrition() {
  const u = getNutritionUsage();
  if (!u.lastUsed) return { allowed: true };
  const lastDate = new Date(u.lastUsed).toDateString();
  const today = new Date().toDateString();
  if (lastDate !== today) return { allowed: true };
  if (u.todayCount < 1) return { allowed: true };
  const next = new Date(); next.setHours(24, 0, 0, 0);
  return { allowed: false, hoursLeft: Math.ceil((next - Date.now()) / 3600000) };
}
function recordNutritionScan() {
  const u = getNutritionUsage();
  const today = new Date().toDateString();
  const lastDate = u.lastUsed ? new Date(u.lastUsed).toDateString() : null;
  set(keys.nutrition, { lastUsed: new Date().toISOString(), todayCount: lastDate === today ? u.todayCount + 1 : 1 });
}

function getHistory() { return get(keys.history) || []; }
function getSavedFoods() { return get("pq_saved_foods") || []; }
function saveFoodToList(food) {
  const list = getSavedFoods();
  const exists = list.find(f => f.name.toLowerCase() === food.name.toLowerCase());
  if (!exists) {
    list.unshift({ ...food, savedAt: new Date().toISOString() });
    set("pq_saved_foods", list.slice(0, 50));
    syncPush({ savedFoods: [food] });
  }
}
function removeSavedFood(name) {
  const list = getSavedFoods().filter(f => f.name !== name);
  set("pq_saved_foods", list);
}
function addToHistory(entry) {
  const h = getHistory();
  h.unshift({ ...entry, date: new Date().toISOString() });
  set(keys.history, h.slice(0, 50));
}

function getTodayJournal() {
  const today = new Date().toDateString();
  const all = get(keys.journal) || {};
  return all[today] || { meals: [], steps: null, session: null };
}
function saveTodayJournal(data) {
  const today = new Date().toDateString();
  const all = get(keys.journal) || {};
  all[today] = data;
  set(keys.journal, all);
}
function getAllJournal() { return get(keys.journal) || {}; }

function getProfileCompletion(p) {
  const fields = ["gender", "age", "height", "weight", "activity", "steps", "trainingType", "goal"];
  return Math.round(fields.filter(f => p[f]).length / fields.length * 100);
}

// ─── DESIGN TOKENS ───────────────────────────────────────────────────────────
const C = {
  bg:       "#0a0a0f",
  surface:  "rgba(255,255,255,0.04)",
  border:   "rgba(255,255,255,0.08)",
  gold:     "#FFD700",
  green:    "#7DF9AA",
  red:      "#FF6B6B",
  muted:    "#555",
  text:     "#ffffff",
  sub:      "#888",
};

const css = {
  app: { minHeight:"100dvh", background:C.bg, color:C.text, fontFamily:"'Space Grotesk',Arial,sans-serif", display:"flex", flexDirection:"column", alignItems:"center", padding:"0 16px 60px", paddingTop:"env(safe-area-inset-top, 0px)", paddingBottom:"calc(env(safe-area-inset-bottom, 0px) + 60px)", WebkitOverflowScrolling:"touch" },
  card: { background:C.surface, border:`1px solid ${C.border}`, borderRadius:"20px", padding:"20px", marginBottom:"12px", width:"100%", boxSizing:"border-box" },
  cardTitle: { fontSize:"10px", letterSpacing:"2px", color:C.muted, textTransform:"uppercase", marginBottom:"14px" },
  input: { width:"100%", padding:"12px 14px", borderRadius:"10px", border:`1.5px solid ${C.border}`, background:"rgba(255,255,255,0.04)", color:C.text, fontSize:"14px", fontFamily:"inherit", outline:"none", boxSizing:"border-box", marginTop:"6px" },
  label: { fontSize:"10px", letterSpacing:"2px", color:C.muted, textTransform:"uppercase", marginTop:"18px", display:"block" },
  btn: (color="#FFD700", textColor="#000") => ({ width:"100%", padding:"14px", borderRadius:"12px", border:"none", background:`linear-gradient(135deg,${color},${color}cc)`, color:textColor, fontSize:"14px", fontWeight:"700", cursor:"pointer", fontFamily:"inherit", boxShadow:`0 0 20px ${color}22`, marginBottom:"8px" }),
  btnSec: { width:"100%", padding:"12px", borderRadius:"12px", border:`1px solid ${C.border}`, background:"rgba(255,255,255,0.04)", color:C.text, fontSize:"13px", fontWeight:"600", cursor:"pointer", fontFamily:"inherit", marginBottom:"8px" },
  optBtn: (active, color=C.gold) => ({ padding:"10px 14px", borderRadius:"8px", border:`1.5px solid ${active ? color : C.border}`, background:active ? `${color}15` : "transparent", color:active ? color : C.muted, fontSize:"12px", fontWeight:"600", cursor:"pointer", fontFamily:"inherit", textAlign:"left" }),
  uploadZone: { border:`2px dashed rgba(255,215,0,0.25)`, borderRadius:"14px", padding:"32px 20px", textAlign:"center", cursor:"pointer", background:"rgba(255,215,0,0.02)", marginBottom:"12px" },
};


// ─── TOAST ───────────────────────────────────────────────────────────────────
function Toast({ message, visible }) {
  return visible ? (
    <div style={{position:"fixed",top:"20px",left:"50%",transform:"translateX(-50%)",background:"rgba(125,249,170,0.95)",color:"#000",padding:"10px 20px",borderRadius:"20px",fontSize:"12px",fontWeight:"700",zIndex:300,whiteSpace:"nowrap",boxShadow:"0 4px 20px rgba(0,0,0,0.3)"}}>
      {message}
    </div>
  ) : null;
}

// ─── COMPONENTS ──────────────────────────────────────────────────────────────

function Logo() {
  return (
    <div style={{display:"flex",alignItems:"center",gap:"8px",fontSize:"12px",letterSpacing:"4px",color:C.gold,fontWeight:"700"}}>
      <svg width="20" height="20" viewBox="0 0 40 40" style={{filter:`drop-shadow(0 0 4px ${C.gold}AA)`}}>
        <rect x="8" y="4" width="24" height="18" rx="5" fill="none" stroke={C.gold} strokeWidth="1.8"/>
        <rect x="11" y="8" width="6" height="5" rx="1.5" fill={C.gold}/>
        <rect x="23" y="8" width="6" height="5" rx="1.5" fill={C.gold}/>
        <rect x="15" y="16" width="10" height="3" rx="1.5" fill={C.gold} opacity="0.5"/>
        <line x1="20" y1="4" x2="20" y2="1" stroke={C.gold} strokeWidth="1.5"/>
        <circle cx="20" cy="0.5" r="2" fill={C.gold}/>
        <rect x="12" y="23" width="16" height="13" rx="4" fill="none" stroke={C.gold} strokeWidth="1.8"/>
        <rect x="5" y="25" width="6" height="9" rx="3" fill="none" stroke={C.gold} strokeWidth="1.5"/>
        <rect x="29" y="25" width="6" height="9" rx="3" fill="none" stroke={C.gold} strokeWidth="1.5"/>
      </svg>
      PHYSIQRATE
    </div>
  );
}

function GaugeRing({ percent, color }) {
  const r = 70, circ = 2 * Math.PI * r;
  const filled = (Math.min(percent, 50) / 50) * circ;
  return (
    <svg width="170" height="170" viewBox="0 0 180 180">
      <defs><filter id="glow"><feGaussianBlur stdDeviation="3" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>
      <circle cx="90" cy="90" r={r} fill="none" stroke="#1a1a2e" strokeWidth="14"/>
      <circle cx="90" cy="90" r={r} fill="none" stroke={color} strokeWidth="14"
        strokeDasharray={`${filled} ${circ}`} strokeLinecap="round"
        transform="rotate(-90 90 90)" filter="url(#glow)"
        style={{transition:"stroke-dasharray 1.2s cubic-bezier(0.34,1.56,0.64,1)"}}/>
      <text x="90" y="84" textAnchor="middle" fill="white" fontSize="28" fontWeight="800" fontFamily="Arial">{percent}%</text>
      <text x="90" y="106" textAnchor="middle" fill={C.muted} fontSize="11" fontFamily="Arial">BODY FAT</text>
    </svg>
  );
}

function ShareCard({ imagePreview, result, archetype, onReady }) {
  const ref = useRef();
  useEffect(() => {
    if (!result || !archetype) return;
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const W = 1080, H = 1350; // Format portrait 4:5 — parfait Instagram/TikTok
    canvas.width = W; canvas.height = H;

    const color = archetype.color;
    const r = parseInt(color.slice(1,3),16);
    const g = parseInt(color.slice(3,5),16);
    const b = parseInt(color.slice(5,7),16);

    const draw = (photo) => {
      // ── FOND ──────────────────────────────────────────────────────
      ctx.fillStyle = "#09090f";
      ctx.fillRect(0, 0, W, H);

      // Gradient radial ambient color
      const ambient = ctx.createRadialGradient(W/2, H*0.35, 0, W/2, H*0.35, W*0.8);
      ambient.addColorStop(0, `rgba(${r},${g},${b},0.18)`);
      ambient.addColorStop(1, "rgba(9,9,15,0)");
      ctx.fillStyle = ambient;
      ctx.fillRect(0, 0, W, H);

      // ── PHOTO ─────────────────────────────────────────────────────
      if (photo) {
        const ph = H * 0.52;
        const sc = Math.max(W / photo.width, ph / photo.height);
        ctx.drawImage(photo, (W - photo.width*sc)/2, 0, photo.width*sc, photo.height*sc);

        // Gradient fade bottom
        const fade = ctx.createLinearGradient(0, ph*0.2, 0, ph);
        fade.addColorStop(0, "rgba(9,9,15,0)");
        fade.addColorStop(1, "rgba(9,9,15,1)");
        ctx.fillStyle = fade;
        ctx.fillRect(0, 0, W, ph);

        // Vignette edges
        const vig = ctx.createRadialGradient(W/2, ph/2, W*0.3, W/2, ph/2, W*0.8);
        vig.addColorStop(0, "rgba(9,9,15,0)");
        vig.addColorStop(1, "rgba(9,9,15,0.5)");
        ctx.fillStyle = vig;
        ctx.fillRect(0, 0, W, ph);
      } else {
        // No photo — decorative grid lines
        ctx.strokeStyle = `rgba(${r},${g},${b},0.06)`;
        ctx.lineWidth = 1;
        for (let i = 0; i < W; i += 60) {
          ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, H*0.5); ctx.stroke();
        }
        for (let j = 0; j < H*0.5; j += 60) {
          ctx.beginPath(); ctx.moveTo(0, j); ctx.lineTo(W, j); ctx.stroke();
        }
      }

      // ── SCORE PANEL ───────────────────────────────────────────────
      const panelY = photo ? H * 0.52 : H * 0.22;
      const panelH = H - panelY;

      // Big bold score — hero element
      ctx.textAlign = "center";
      ctx.fillStyle = "white";
      ctx.font = `bold ${W*0.22}px Arial Black, Arial`;
      ctx.letterSpacing = "-4px";
      ctx.fillText(`${result.bodyfat}%`, W/2, panelY + panelH*0.22);

      // BODY FAT label under score
      ctx.fillStyle = `rgba(${r},${g},${b},0.8)`;
      ctx.font = `600 ${W*0.04}px Arial`;
      ctx.letterSpacing = "12px";
      ctx.fillText("BODY FAT", W/2, panelY + panelH*0.3);

      // ── ARCHETYPE BADGE ───────────────────────────────────────────
      const badgeY = panelY + panelH * 0.4;
      const badgeW = 440, badgeH = 76;
      const badgeX = (W - badgeW) / 2;

      // Badge background
      ctx.beginPath();
      ctx.roundRect(badgeX, badgeY, badgeW, badgeH, 38);
      ctx.fillStyle = `rgba(${r},${g},${b},0.15)`;
      ctx.fill();
      ctx.strokeStyle = `rgba(${r},${g},${b},0.5)`;
      ctx.lineWidth = 1.5;
      ctx.stroke();

      ctx.fillStyle = color;
      ctx.font = `bold ${W*0.048}px Arial`;
      ctx.letterSpacing = "4px";
      ctx.fillText(archetype.label.toUpperCase(), W/2, badgeY + badgeH*0.65);

      // Ref celeb
      ctx.fillStyle = "rgba(255,255,255,0.55)";
      ctx.font = `${W*0.03}px Arial`;
      ctx.letterSpacing = "0px";
      ctx.fillText(archetype.ref, W/2, panelY + panelH*0.57);

      // ── GAUGE BAR (horizontal) ────────────────────────────────────
      const barY = panelY + panelH * 0.65;
      const barW = W * 0.72;
      const barX = (W - barW) / 2;
      const barH2 = 12;
      const fillRatio = Math.min(result.bodyfat / 50, 1);

      // Track
      ctx.beginPath();
      ctx.roundRect(barX, barY, barW, barH2, 6);
      ctx.fillStyle = "rgba(255,255,255,0.08)";
      ctx.fill();

      // Fill with glow
      ctx.beginPath();
      ctx.roundRect(barX, barY, barW * fillRatio, barH2, 6);
      const barGrad = ctx.createLinearGradient(barX, 0, barX + barW, 0);
      barGrad.addColorStop(0, `rgba(${r},${g},${b},0.6)`);
      barGrad.addColorStop(1, color);
      ctx.fillStyle = barGrad;
      ctx.shadowColor = color;
      ctx.shadowBlur = 16;
      ctx.fill();
      ctx.shadowBlur = 0;

      // Scale labels
      ctx.fillStyle = "rgba(255,255,255,0.25)";
      ctx.font = `${W*0.022}px Arial`;
      ctx.letterSpacing = "0px";
      ["5%","15%","25%","40%+"].forEach((label, i) => {
        const x = barX + (barW / 3) * i;
        ctx.fillText(label, x, barY + barH2 + 32);
      });

      // ── DIVIDER ───────────────────────────────────────────────────
      const divY = panelY + panelH * 0.8;
      ctx.strokeStyle = `rgba(${r},${g},${b},0.2)`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(W*0.15, divY); ctx.lineTo(W*0.85, divY);
      ctx.stroke();

      // ── BRANDING ─────────────────────────────────────────────────
      // Logo mark
      ctx.fillStyle = color;
      ctx.font = `bold ${W*0.032}px Arial`;
      ctx.letterSpacing = "6px";
      ctx.fillText("◈ PHYSIQRATE", W/2, divY + 60);

      ctx.fillStyle = "rgba(255,255,255,0.2)";
      ctx.font = `${W*0.022}px Arial`;
      ctx.letterSpacing = "2px";
      ctx.fillText("physiqrate.com", W/2, divY + 100);

      // ── CORNER ACCENT ─────────────────────────────────────────────
      // Top left dot
      ctx.beginPath();
      ctx.arc(60, 60, 6, 0, Math.PI*2);
      ctx.fillStyle = color;
      ctx.shadowColor = color;
      ctx.shadowBlur = 20;
      ctx.fill();
      ctx.shadowBlur = 0;

      // Top right dot
      ctx.beginPath();
      ctx.arc(W-60, 60, 6, 0, Math.PI*2);
      ctx.fillStyle = color;
      ctx.shadowColor = color;
      ctx.shadowBlur = 20;
      ctx.fill();
      ctx.shadowBlur = 0;

      onReady(canvas.toDataURL("image/png"));
    };

    if (imagePreview) {
      const img = new Image();
      img.onload = () => draw(img);
      img.src = imagePreview;
    } else {
      draw(null);
    }
  }, [result]);
  return <canvas ref={ref} style={{display:"none"}}/>;
}

const STRIPE_KEY = "pk_live_51Tqhv1RvX2XjC4owD0T32u2MRFIPduzrTsnnmM4J5Cy1GUlWzZXWh7YhHPAD2764ptAtR9bvohi0HMvI7tpEMkFE00DF7oM0Ol";

async function redirectToCheckout(type) {
  try {
    const res = await fetch("/api/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type })
    });
    const data = await res.json();
    if (data.url) window.location.href = data.url;
    else alert("Erreur de paiement. Réessaie.");
  } catch {
    alert("Erreur de connexion. Réessaie.");
  }
}

function Paywall({ daysLeft, onClose }) {
  const [loading, setLoading] = useState(false);

  async function handleCheckout() {
    setLoading(true);
    await redirectToCheckout("subscription");
    setLoading(false);
  }

  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.88)",backdropFilter:"blur(10px)",zIndex:100,display:"flex",alignItems:"center",justifyContent:"center",padding:"20px"}}>
      <div style={{background:"#0f0f1a",border:`1px solid rgba(255,215,0,0.2)`,borderRadius:"28px",padding:"32px 24px",maxWidth:"380px",width:"100%",textAlign:"center"}}>

        {/* Header */}
        <div style={{fontSize:"11px",letterSpacing:"3px",color:C.gold,marginBottom:"14px",opacity:0.7}}>PHYSIQRATE PRO</div>
        <div style={{fontSize:"22px",fontWeight:"800",marginBottom:"6px",lineHeight:"1.2"}}>Analyse ton physique sans limite</div>
        <div style={{fontSize:"13px",color:"#666",marginBottom:"28px"}}>
          {daysLeft > 0 ? `Prochaine analyse gratuite dans ${daysLeft} jour${daysLeft>1?"s":""}` : "Continue ta progression"}
        </div>

        {/* Features list */}
        <div style={{background:"rgba(255,255,255,0.03)",borderRadius:"16px",padding:"16px",marginBottom:"24px",textAlign:"left"}}>
          {[
            ["Analyses corporelles illimitées", "Scan photo IA chaque semaine"],
            ["Scans nutrition illimités", "Photo d'assiette · code-barres"],
            ["Comparatif photos IA", "Vois ton évolution en détail"],
            ["Historique complet", "Toutes tes données conservées"],
          ].map(([title, sub], i) => (
            <div key={i} style={{display:"flex",alignItems:"center",gap:"12px",marginBottom:i<3?"12px":"0"}}>
              <div style={{width:"20px",height:"20px",borderRadius:"50%",background:"rgba(125,249,170,0.15)",border:"1px solid rgba(125,249,170,0.3)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={C.green} strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
              </div>
              <div>
                <div style={{fontSize:"13px",fontWeight:"600",color:"white"}}>{title}</div>
                <div style={{fontSize:"11px",color:"#555"}}>{sub}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Price */}
        <div style={{marginBottom:"16px"}}>
          <div style={{display:"flex",alignItems:"baseline",justifyContent:"center",gap:"4px",marginBottom:"4px"}}>
            <span style={{fontSize:"42px",fontWeight:"800",color:C.gold}}>4,99€</span>
            <span style={{fontSize:"14px",color:"#555"}}>/mois</span>
          </div>
          <div style={{fontSize:"11px",color:"#444"}}>Résiliation à tout moment · Aucun engagement</div>
        </div>

        {/* CTA Button */}
        <button
          onClick={handleCheckout}
          disabled={loading}
          style={{width:"100%",padding:"16px",borderRadius:"14px",border:"none",background:loading?"#333":`linear-gradient(135deg,#FFD700,#FFA500)`,color:loading?"#666":"#000",fontSize:"15px",fontWeight:"800",cursor:loading?"not-allowed":"pointer",fontFamily:"inherit",marginBottom:"12px",transition:"all 0.2s"}}>
          {loading ? "Redirection…" : "Commencer maintenant"}
        </button>

        {/* Payment methods */}
        <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:"10px",marginBottom:"16px"}}>
          {/* Apple Pay */}
          <div style={{display:"flex",alignItems:"center",gap:"4px",background:"rgba(255,255,255,0.06)",borderRadius:"6px",padding:"4px 8px"}}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="#aaa"><path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/></svg>
            <span style={{fontSize:"10px",color:"#aaa"}}>Pay</span>
          </div>
          {/* Google Pay */}
          <div style={{display:"flex",alignItems:"center",gap:"4px",background:"rgba(255,255,255,0.06)",borderRadius:"6px",padding:"4px 8px"}}>
            <span style={{fontSize:"10px",color:"#aaa",fontWeight:"600"}}>G</span>
            <span style={{fontSize:"10px",color:"#aaa"}}>Pay</span>
          </div>
          {/* Cards */}
          <div style={{display:"flex",gap:"4px"}}>
            <div style={{width:"24px",height:"16px",borderRadius:"3px",background:"#1a1f71",display:"flex",alignItems:"center",justifyContent:"center"}}>
              <span style={{fontSize:"6px",color:"white",fontWeight:"800"}}>VISA</span>
            </div>
            <div style={{width:"24px",height:"16px",borderRadius:"3px",background:"rgba(255,255,255,0.1)",display:"flex",alignItems:"center",justifyContent:"center"}}>
              <div style={{display:"flex"}}>
                <div style={{width:"9px",height:"9px",borderRadius:"50%",background:"#EB001B",opacity:0.9}}/>
                <div style={{width:"9px",height:"9px",borderRadius:"50%",background:"#F79E1B",opacity:0.9,marginLeft:"-4px"}}/>
              </div>
            </div>
          </div>
          {/* Lock */}
          <div style={{display:"flex",alignItems:"center",gap:"3px"}}>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#444" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
            <span style={{fontSize:"10px",color:"#444"}}>SSL</span>
          </div>
        </div>

        <button style={{background:"transparent",border:"none",color:"#333",fontSize:"12px",cursor:"pointer",fontFamily:"inherit"}} onClick={onClose}>
          Continuer sans Pro
        </button>
      </div>
    </div>
  );
}

function WeightUpdateModal({ currentWeight, newWeight, onAccept, onDecline }) {
  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.7)",backdropFilter:"blur(6px)",zIndex:200,display:"flex",alignItems:"flex-end",justifyContent:"center",padding:"20px"}}>
      <div style={{background:"linear-gradient(135deg,#0f0f1a,#0a0a0f)",border:`1px solid ${C.border}`,borderRadius:"24px",padding:"24px",width:"100%",maxWidth:"420px",textAlign:"center",marginBottom:"10px"}}>
        <div style={{fontSize:"10px",color:C.gold,letterSpacing:"2px",marginBottom:"12px"}}>NOUVEAU POIDS DÉTECTÉ</div>
        <div style={{fontSize:"16px",fontWeight:"700",marginBottom:"6px"}}>Tu as indiqué <span style={{color:C.gold}}>{newWeight} kg</span></div>
        <div style={{fontSize:"13px",color:C.muted,marginBottom:"6px"}}>Ton profil indique {currentWeight} kg.</div>
        <div style={{fontSize:"11px",color:"#444",marginBottom:"20px"}}>Mettre à jour recalculera ton TDEE automatiquement.</div>
        <button style={css.btn(C.gold)} onClick={onAccept}>Mettre à jour ({currentWeight} → {newWeight} kg)</button>
        <button style={css.btnSec} onClick={onDecline}>Garder {currentWeight} kg</button>
      </div>
    </div>
  );
}



// ─── PWA INSTALL BANNER ───────────────────────────────────────────────────────
function PWABanner({ onDismiss }) {
  const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
  const isAndroid = /android/i.test(navigator.userAgent);
  const isInStandaloneMode = window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone;

  if (isInStandaloneMode) return null; // Déjà installée

  return (
    <div style={{position:"fixed",bottom:0,left:0,right:0,zIndex:500,padding:"12px 16px 24px",background:"linear-gradient(0deg,#0f0f1a 80%,transparent)",borderTop:`1px solid rgba(255,215,0,0.15)`}}>
      <div style={{maxWidth:"420px",margin:"0 auto"}}>
        <div style={{display:"flex",alignItems:"flex-start",gap:"12px",background:"linear-gradient(135deg,rgba(255,215,0,0.08),rgba(255,215,0,0.03))",border:`1px solid rgba(255,215,0,0.2)`,borderRadius:"16px",padding:"14px"}}>
          <div style={{width:"44px",height:"44px",borderRadius:"12px",background:"linear-gradient(135deg,#FFD700,#FFA500)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
            <svg width="22" height="22" viewBox="0 0 40 40">
              <rect x="8" y="4" width="24" height="18" rx="5" fill="none" stroke="#000" strokeWidth="2"/>
              <rect x="11" y="8" width="6" height="5" rx="1.5" fill="#000"/>
              <rect x="23" y="8" width="6" height="5" rx="1.5" fill="#000"/>
              <rect x="12" y="23" width="16" height="13" rx="4" fill="none" stroke="#000" strokeWidth="2"/>
              <rect x="5" y="25" width="6" height="9" rx="3" fill="none" stroke="#000" strokeWidth="1.8"/>
              <rect x="29" y="25" width="6" height="9" rx="3" fill="none" stroke="#000" strokeWidth="1.8"/>
            </svg>
          </div>
          <div style={{flex:1}}>
            <div style={{fontSize:"13px",fontWeight:"700",marginBottom:"3px"}}>Installe Physiqrate</div>
            <div style={{fontSize:"11px",color:"#888",marginBottom:"10px",lineHeight:"1.4"}}>
              {isIOS
                ? <>Appuie sur <strong style={{color:"#FFD700"}}>Partager</strong> puis <strong style={{color:"#FFD700"}}>"Sur l'écran d'accueil"</strong> pour l'installer</>
                : <>Ajoute l'app sur ton écran d'accueil pour un accès rapide et une meilleure expérience</>
              }
            </div>
            {isIOS ? (
              <div style={{display:"flex",flexDirection:"column",gap:"8px"}}>
                <a href="x-safari-https://physiqrate.com"
                  style={{display:"flex",alignItems:"center",justifyContent:"center",gap:"6px",padding:"9px 14px",borderRadius:"10px",background:"linear-gradient(135deg,#FFD700,#FFA500)",color:"#000",fontSize:"12px",fontWeight:"700",textDecoration:"none"}}>
                  Ouvrir dans Safari
                </a>
                <div style={{display:"flex",alignItems:"center",gap:"6px",fontSize:"11px",color:"#555"}}>
                  <span>puis</span>
                  <div style={{background:"rgba(255,255,255,0.08)",borderRadius:"6px",padding:"3px 8px"}}>Partager</div>
                  <span>→</span>
                  <div style={{background:"rgba(255,255,255,0.08)",borderRadius:"6px",padding:"3px 8px"}}>"Sur l'écran d'accueil"</div>
                </div>
              </div>
            ) : (
              <button
                onClick={()=>{ window._pwaInstallPrompt?.prompt(); onDismiss(); }}
                style={{padding:"8px 16px",borderRadius:"10px",border:"none",background:"linear-gradient(135deg,#FFD700,#FFA500)",color:"#000",fontSize:"12px",fontWeight:"700",cursor:"pointer",fontFamily:"inherit"}}>
                Installer l'app
              </button>
            )}
          </div>
          <button onClick={onDismiss} style={{background:"transparent",border:"none",color:"#444",fontSize:"20px",cursor:"pointer",lineHeight:1,padding:"0",flexShrink:0}}>×</button>
        </div>
      </div>
    </div>
  );
}



// ─── SUPABASE SYNC ────────────────────────────────────────────────────────────
async function syncPush(data) {
  const token = localStorage.getItem("pq_token");
  if (!token) return;
  try {
    await fetch("/api/sync", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "push", token, data })
    });
  } catch {}
}

async function syncPull(token, date) {
  try {
    const res = await fetch("/api/sync", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "pull", token, data: { date } })
    });
    return await res.json();
  } catch { return null; }
}

// ─── BARCODE SCANNER ──────────────────────────────────────────────────────────
function BarcodeScanner({ onResult, onClose }) {
  const [status, setStatus] = useState("loading");
  const [error, setError] = useState(null);
  const quaggaRef = useRef(null);

  async function lookupBarcode(code) {
    try {
      const res = await fetch(`https://world.openfoodfacts.org/api/v0/product/${code}.json`);
      const data = await res.json();
      if (data.status === 1 && data.product) {
        const p = data.product;
        const n = p.nutriments || {};
        if (quaggaRef.current) quaggaRef.current.stop();
        onResult({
          name: p.product_name_fr || p.product_name || "Produit scanné",
          brand: p.brands || "",
          calories: Math.round(n["energy-kcal_100g"] || n["energy-kcal"] || 0),
          protein: Math.round(n["proteins_100g"] || 0),
          carbs: Math.round(n["carbohydrates_100g"] || 0),
          fat: Math.round(n["fat_100g"] || 0),
        });
      } else {
        setError("Produit non trouvé. Essaie un autre.");
        setStatus("error");
      }
    } catch {
      setError("Erreur réseau.");
      setStatus("error");
    }
  }

  useEffect(() => {
    // Charge Quagga2 via CDN
    const script = document.createElement("script");
    script.src = "https://cdn.jsdelivr.net/npm/@ericblade/quagga2@1.8.4/dist/quagga.min.js";
    script.onload = () => {
      const Quagga = window.Quagga;
      quaggaRef.current = Quagga;

      Quagga.init({
        inputStream: {
          name: "Live",
          type: "LiveStream",
          target: document.querySelector("#quagga-video"),
          constraints: {
            facingMode: "environment",
            width: { min: 640, ideal: 1280 },
            height: { min: 480, ideal: 720 },
          },
        },
        locator: { patchSize: "medium", halfSample: true },
        numOfWorkers: 2,
        frequency: 10,
        decoder: {
          readers: ["ean_reader","ean_8_reader","upc_reader","upc_e_reader","code_128_reader"],
        },
        locate: true,
      }, (err) => {
        if (err) {
          if (err.name === "NotAllowedError" || (err.message && err.message.includes("Permission"))) {
            setError("Accès caméra refusé.\nVa dans Réglages → Safari → Caméra → Autoriser.");
          } else {
            setError("Impossible de démarrer la caméra.");
          }
          setStatus("error");
          return;
        }
        Quagga.start();
        setStatus("scanning");
      });

      let lastCode = null;
      let codeCount = 0;

      Quagga.onDetected(async (result) => {
        const code = result.codeResult.code;
        const errors = result.codeResult.decodedCodes
          .filter(x => x.error !== undefined)
          .map(x => x.error);
        const avgError = errors.length ? errors.reduce((a,b) => a+b, 0) / errors.length : 1;

        // Confirme le même code 2 fois pour éviter les faux positifs
        if (avgError < 0.15) {
          if (code === lastCode) {
            codeCount++;
            if (codeCount >= 2) {
              Quagga.stop();
              setStatus("found");
              await lookupBarcode(code);
            }
          } else {
            lastCode = code;
            codeCount = 1;
          }
        }
      });
    };
    script.onerror = () => {
      setError("Impossible de charger le scanner.");
      setStatus("manual");
    };
    document.head.appendChild(script);

    return () => {
      if (quaggaRef.current) {
        try { quaggaRef.current.stop(); } catch {}
      }
    };
  }, []);

  return (
    <div style={{position:"fixed",inset:0,background:"#000",zIndex:300,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center"}}>

      {/* Container vidéo Quagga */}
      <div id="quagga-video" style={{
        position:"absolute",inset:0,
        display: status === "scanning" || status === "loading" ? "block" : "none"
      }}/>

      {status === "loading" && (
        <div style={{color:"white",fontSize:"13px",textAlign:"center",zIndex:10}}>
          Chargement du scanner…
        </div>
      )}

      {status === "scanning" && (
        <div style={{position:"absolute",inset:0,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",pointerEvents:"none",zIndex:10}}>
          <div style={{width:"280px",height:"140px",border:`3px solid ${C.gold}`,borderRadius:"12px",boxShadow:`0 0 0 2000px rgba(0,0,0,0.55)`}}/>
          <div style={{color:"white",fontSize:"13px",marginTop:"20px",textShadow:"0 1px 4px #000"}}>
            Place le code-barres dans le cadre
          </div>
          <div style={{color:"#aaa",fontSize:"11px",marginTop:"6px"}}>Tiens le téléphone à 15-20cm</div>
        </div>
      )}

      {status === "found" && (
        <div style={{color:C.green,fontSize:"16px",fontWeight:"700",zIndex:10}}>Produit trouvé !</div>
      )}

      {status === "error" && (
        <div style={{textAlign:"center",padding:"28px",maxWidth:"300px",zIndex:10}}>
          <div style={{fontSize:"13px",color:C.red,marginBottom:"20px",lineHeight:"1.7",whiteSpace:"pre-line"}}>{error}</div>
          <button style={{...css.btn(C.gold),marginBottom:"10px"}} onClick={()=>{ setStatus("loading"); setError(null); }}>
            Réessayer
          </button>
          <button style={{...css.btnSec,marginBottom:"10px"}} onClick={()=>setStatus("manual")}>
            Saisir manuellement
          </button>
          <button style={css.btnSec} onClick={onClose}>Annuler</button>
        </div>
      )}

      {status === "manual" && (
        <div style={{textAlign:"center",padding:"28px",maxWidth:"320px",width:"100%",zIndex:10}}>
          <div style={{fontSize:"10px",color:C.gold,letterSpacing:"3px",marginBottom:"20px"}}>SAISIE MANUELLE</div>
          <div style={{fontSize:"13px",color:"#aaa",marginBottom:"16px"}}>Entre les chiffres sous le code-barres</div>
          <input
            type="number"
            placeholder="Ex: 3017620422003"
            autoFocus
            style={{...css.input,marginBottom:"12px",textAlign:"center",fontSize:"16px",letterSpacing:"1px"}}
            onKeyDown={async(e)=>{
              if(e.key==="Enter" && e.target.value.length >= 8){
                setStatus("found");
                await lookupBarcode(e.target.value.trim());
              }
            }}
          />
          <div style={{fontSize:"11px",color:"#444",marginBottom:"16px"}}>Appuie sur Entrée pour chercher</div>
          <button style={css.btnSec} onClick={onClose}>Annuler</button>
        </div>
      )}

      {(status === "scanning" || status === "loading") && (
        <button style={{position:"absolute",top:"20px",right:"20px",background:"rgba(0,0,0,0.7)",border:`1px solid ${C.border}`,color:"white",borderRadius:"20px",padding:"8px 16px",fontSize:"12px",cursor:"pointer",fontFamily:"inherit",zIndex:20}}
          onClick={()=>{ if(quaggaRef.current) try{quaggaRef.current.stop();}catch{}; onClose(); }}>
          Fermer
        </button>
      )}
    </div>
  );
}


function ProductModal({ product, onConfirm, onClose }) {
  const [quantity, setQuantity] = useState("100");
  const [saveFood, setSaveFood] = useState(!getSavedFoods().find(f => f.name === product.name));

  const q = parseFloat(quantity) || 100;
  const factor = q / 100;
  const cal = Math.round(product.calories * factor);
  const prot = Math.round(product.protein * factor);
  const carb = Math.round(product.carbs * factor);
  const fat2 = Math.round(product.fat * factor);

  const alreadySaved = !!getSavedFoods().find(f => f.name === product.name);

  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.88)",backdropFilter:"blur(8px)",zIndex:300,display:"flex",alignItems:"flex-end",justifyContent:"center",padding:"20px"}}>
      <div style={{background:"#0f0f1a",border:`1px solid ${C.border}`,borderRadius:"24px",padding:"24px",width:"100%",maxWidth:"420px",marginBottom:"10px"}}>
        <div style={{fontSize:"10px",color:C.gold,letterSpacing:"2px",marginBottom:"12px"}}>
          {product.brand ? "PRODUIT SCANNÉ" : "ALIMENT"}
        </div>
        <div style={{fontSize:"16px",fontWeight:"700",marginBottom:"4px"}}>{product.name}</div>
        {product.brand && <div style={{fontSize:"12px",color:"#555",marginBottom:"12px"}}>{product.brand}</div>}

        <div style={{fontSize:"11px",color:C.muted,marginBottom:"6px"}}>Quantité consommée (g)</div>
        <input
          type="number"
          value={quantity}
          onChange={e=>setQuantity(e.target.value)}
          style={{...css.input,fontSize:"20px",fontWeight:"700",textAlign:"center",marginBottom:"12px"}}
        />

        <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:"8px",marginBottom:"14px"}}>
          {[{val:cal,label:"KCAL",color:C.gold},{val:`${prot}g`,label:"PROT.",color:"#7DF9FF"},{val:`${carb}g`,label:"GLUC.",color:"#FFB347"},{val:`${fat2}g`,label:"LIP.",color:"#FF8C69"}].map((m,i)=>(
            <div key={i} style={{background:"rgba(255,255,255,0.04)",borderRadius:"10px",padding:"8px",textAlign:"center"}}>
              <div style={{fontSize:"15px",fontWeight:"800",color:m.color}}>{m.val}</div>
              <div style={{fontSize:"9px",color:C.muted,marginTop:"2px"}}>{m.label}</div>
            </div>
          ))}
        </div>

        <div style={{fontSize:"10px",color:"#333",marginBottom:"14px",textAlign:"center"}}>
          Valeurs pour {quantity || 0}g · Base : {product.calories} kcal/100g
        </div>

        {/* Option sauvegarder */}
        {!alreadySaved && (
          <div
            onClick={()=>setSaveFood(!saveFood)}
            style={{display:"flex",alignItems:"center",gap:"10px",padding:"10px 12px",background:"rgba(255,255,255,0.03)",borderRadius:"10px",marginBottom:"14px",cursor:"pointer",border:`1px solid ${saveFood?"rgba(125,249,170,0.3)":C.border}`}}>
            <div style={{width:"20px",height:"20px",borderRadius:"6px",border:`1.5px solid ${saveFood?C.green:C.border}`,background:saveFood?"rgba(125,249,170,0.15)":"transparent",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
              {saveFood && <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={C.green} strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>}
            </div>
            <div>
              <div style={{fontSize:"12px",fontWeight:"600",color:saveFood?C.green:"#aaa"}}>Enregistrer cet aliment</div>
              <div style={{fontSize:"10px",color:"#444"}}>Accessible rapidement la prochaine fois</div>
            </div>
          </div>
        )}

        {alreadySaved && (
          <div style={{display:"flex",alignItems:"center",gap:"8px",padding:"8px 12px",background:"rgba(125,249,170,0.05)",borderRadius:"10px",marginBottom:"14px",border:"1px solid rgba(125,249,170,0.15)"}}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={C.green} strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
            <span style={{fontSize:"11px",color:C.green}}>Déjà dans tes aliments enregistrés</span>
          </div>
        )}

        <button style={{...css.btn(C.gold),marginBottom:"8px"}} onClick={()=>{
          if (saveFood && !alreadySaved) saveFoodToList({ name:product.name, brand:product.brand, calories:product.calories, protein:product.protein, carbs:product.carbs, fat:product.fat });
          onConfirm({ name:product.name, calories:cal, protein:prot, carbs:carb, fat:fat2 });
        }}>
          Ajouter au journal
        </button>
        <button style={css.btnSec} onClick={onClose}>Annuler</button>
      </div>
    </div>
  );
}



// ─── POST PAYMENT ACCOUNT MODAL ───────────────────────────────────────────────
function PostPaymentModal({ email: initialEmail, onSuccess, blocking = false }) {
  const [email] = useState(initialEmail === "unknown" ? "" : initialEmail);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [showConfirmPwd, setShowConfirmPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const needsEmail = !initialEmail || initialEmail === "unknown";

  async function handleCreate() {
    if (needsEmail && !email) { setError("Entre ton email de paiement."); return; }
    if (!password || password.length < 6) { setError("Minimum 6 caractères."); return; }
    if (password !== confirmPassword) { setError("Les mots de passe ne correspondent pas."); return; }
    setLoading(true); setError(null);

    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "signup", email, password })
      });
      const data = await res.json();
      if (data.error && !data.error.toLowerCase().includes("already")) {
        setError(data.error); setLoading(false); return;
      }

      const loginRes = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "login", email, password })
      });
      const loginData = await loginRes.json();

      if (loginData.token) {
        localStorage.setItem("pq_token", loginData.token);
        localStorage.setItem("pq_email", email);

        // Si email différent de l'email Stripe, transfère le Pro au bon email
        const sessionId = localStorage.getItem("pq_stripe_session");
        if (sessionId) {
          await fetch("/api/auth", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "transfer_pro", email, sessionId })
          });
        }

        onSuccess({ email, token: loginData.token });
      } else {
        setError("Erreur de connexion. Réessaie.");
      }
    } catch {
      setError("Erreur réseau. Réessaie.");
    }
    setLoading(false);
  }

  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.95)",backdropFilter:"blur(10px)",zIndex:600,display:"flex",alignItems:"center",justifyContent:"center",padding:"20px"}}>
      <div style={{background:"#0f0f1a",border:`1px solid rgba(255,215,0,0.2)`,borderRadius:"24px",padding:"28px 24px",maxWidth:"380px",width:"100%",textAlign:"center"}}>
        <div style={{fontSize:"28px",marginBottom:"12px"}}>🎉</div>
        <div style={{fontSize:"10px",color:C.gold,letterSpacing:"3px",marginBottom:"12px"}}>PAIEMENT CONFIRMÉ</div>
        <div style={{fontSize:"20px",fontWeight:"800",marginBottom:"8px"}}>Bienvenue dans le Pro !</div>
        <div style={{fontSize:"13px",color:"#555",marginBottom:"24px",lineHeight:"1.6"}}>
          Crée ton compte pour accéder à ton Pro sur tous tes appareils.
        </div>

        {needsEmail && (
          <>
            <span style={css.label}>Email utilisé pour le paiement</span>
            <input style={css.input} type="email" placeholder="ton@email.com"
              value={email} onChange={e=>setEmail(e.target.value)} autoCapitalize="none"/>
          </>
        )}

        {/* Email verrouillé sur celui du paiement Stripe */}
        {needsEmail ? (
          <>
            <span style={css.label}>Email</span>
            <input style={css.input} type="email"
              value={email}
              onChange={e=>setEmail(e.target.value)}
              autoCapitalize="none"
              placeholder="ton@email.com"
            />
          </>
        ) : (
          <>
            <div style={{background:"rgba(255,215,0,0.06)",border:`1px solid rgba(255,215,0,0.15)`,borderRadius:"12px",padding:"12px 14px",marginBottom:"8px"}}>
              <div style={{fontSize:"10px",color:C.gold,letterSpacing:"1px",marginBottom:"4px"}}>EMAIL DE PAIEMENT</div>
              <div style={{fontSize:"14px",fontWeight:"700"}}>{email}</div>
              <div style={{fontSize:"11px",color:"#555",marginTop:"4px",lineHeight:"1.5"}}>
                Ton compte sera créé avec l'email utilisé lors du paiement. C'est lui qui garantit ton accès Pro.
              </div>
            </div>
            <div style={{fontSize:"11px",color:"#444",marginBottom:"8px",lineHeight:"1.5"}}>
              Si tu as payé avec Apple Pay, l'email ci-dessus est celui de ton compte Apple.
            </div>
          </>
        )}

        <span style={css.label}>Choisis un mot de passe</span>
        <div style={{position:"relative",marginBottom:"8px"}}>
          <input style={{...css.input,paddingRight:"44px"}} type={showPwd?"text":"password"} placeholder="6 caractères minimum"
            value={password} onChange={e=>setPassword(e.target.value)} autoFocus={!needsEmail}/>
          <button type="button" onClick={()=>setShowPwd(!showPwd)}
            style={{position:"absolute",right:"12px",top:"50%",transform:"translateY(-50%)",background:"transparent",border:"none",color:"#555",cursor:"pointer",padding:"4px",display:"flex",alignItems:"center"}}>
            {showPwd
              ? <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
              : <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
            }
          </button>
        </div>

        <span style={css.label}>Confirme ton mot de passe</span>
        <div style={{position:"relative"}}>
          <input style={{...css.input,paddingRight:"44px",borderColor:confirmPassword && confirmPassword!==password?"rgba(255,80,80,0.5)":undefined}}
            type={showConfirmPwd?"text":"password"} placeholder="Répète ton mot de passe"
            value={confirmPassword} onChange={e=>setConfirmPassword(e.target.value)}
            onKeyDown={e=>e.key==="Enter"&&handleCreate()}/>
          <button type="button" onClick={()=>setShowConfirmPwd(!showConfirmPwd)}
            style={{position:"absolute",right:"12px",top:"50%",transform:"translateY(-50%)",background:"transparent",border:"none",color:"#555",cursor:"pointer",padding:"4px",display:"flex",alignItems:"center"}}>
            {showConfirmPwd
              ? <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
              : <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
            }
          </button>
        </div>
        {confirmPassword && confirmPassword !== password && (
          <div style={{fontSize:"11px",color:C.red,marginTop:"4px"}}>Les mots de passe ne correspondent pas</div>
        )}
        {confirmPassword && confirmPassword === password && (
          <div style={{fontSize:"11px",color:C.green,marginTop:"4px"}}>✓ Mots de passe identiques</div>
        )}

        {error && <div style={{fontSize:"12px",color:C.red,marginTop:"8px",lineHeight:"1.5"}}>{error}</div>}

        <button style={{...css.btn(C.gold),marginTop:"18px",opacity:loading?0.6:1}} onClick={handleCreate} disabled={loading}>
          {loading ? "Création…" : "Créer mon compte Pro"}
        </button>
        <div style={{fontSize:"11px",color:"#333",marginTop:"10px"}}>Accès Pro immédiat sur tous tes appareils</div>
      </div>
    </div>
  );
}

// ─── AUTH MODAL ───────────────────────────────────────────────────────────────
function AuthModal({ onSuccess, onClose, blocking = false, onGoToPay }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  async function handleSubmit() {
    if (!email || !password) { setError("Email et mot de passe requis."); return; }
    if (password.length < 6) { setError("Mot de passe minimum 6 caractères."); return; }
    setLoading(true); setError(null);

    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "login", email, password })
      });
      const data = await res.json();

      if (data.error) {
        // Message clair si compte inexistant
        const msg = data.error.toLowerCase();
        if (msg.includes("invalid") || msg.includes("not found") || msg.includes("credentials")) {
          if (true) {
            setError("Ce compte n'existe pas. Crée ton compte ci-dessous.");
            setMode("signup");
          } else {
            setError(data.error);
          }
        } else if (msg.includes("already") || msg.includes("existe")) {
          setError("Un compte existe déjà avec cet email. Connecte-toi.");
          setMode("login");
        } else {
          setError(data.error);
        }
        setLoading(false); return;
      }

      // Sauvegarde token et email
      localStorage.setItem("pq_token", data.token);
      localStorage.setItem("pq_email", email);

      if (false) {
        // Auto login après signup — pas de confirmation email
        const loginRes = await fetch("/api/auth", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "login", email, password })
        });
        const loginData = await loginRes.json();
        if (loginData.token) {
          localStorage.setItem("pq_token", loginData.token);
          localStorage.setItem("pq_email", email);
          const meRes = await fetch("/api/me", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ token: loginData.token })
          });
          const me = await meRes.json();
          onSuccess({ email, is_pro: me.is_pro || false, token: loginData.token });
        } else {
          setError("Compte créé. Connecte-toi maintenant.");
          setMode("login");
        }
      } else {
        // Récupère statut Pro
        const meRes = await fetch("/api/me", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token: data.token })
        });
        const me = await meRes.json();
        onSuccess({ email, is_pro: me.is_pro, token: data.token });
      }
    } catch {
      setError("Erreur de connexion. Réessaie.");
    }
    setLoading(false);
  }

  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.95)",backdropFilter:"blur(10px)",zIndex:600,display:"flex",alignItems:"center",justifyContent:"center",padding:"20px"}}>
      <div style={{background:"#0f0f1a",border:`1px solid ${C.border}`,borderRadius:"24px",padding:"28px 24px",maxWidth:"380px",width:"100%"}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:"20px"}}>
          <div style={{fontSize:"10px",color:C.gold,letterSpacing:"3px"}}>"CONNEXION"</div>
          {!blocking && <button onClick={onClose} style={{background:"transparent",border:"none",color:"#555",fontSize:"20px",cursor:"pointer"}}>×</button>}
        </div>

        {success ? (
          <div style={{textAlign:"center",padding:"20px"}}>
            <div style={{fontSize:"14px",color:C.green,marginBottom:"16px",lineHeight:"1.6"}}>{success}</div>
            <button style={css.btn(C.gold)} onClick={onClose}>Fermer</button>
          </div>
        ) : (
          <>
            <span style={css.label}>Email</span>
            <input style={css.input} type="email" placeholder="ton@email.com" value={email} onChange={e=>setEmail(e.target.value)} autoCapitalize="none"/>

            <span style={css.label}>Mot de passe</span>
            <div style={{position:"relative"}}>
              <input style={{...css.input,paddingRight:"44px"}} type={showPwd?"text":"password"} placeholder="Mot de passe" value={password} onChange={e=>setPassword(e.target.value)}
                onKeyDown={e=>e.key==="Enter"&&handleSubmit()}/>
              <button type="button" onClick={()=>setShowPwd(!showPwd)}
                style={{position:"absolute",right:"12px",top:"50%",transform:"translateY(-50%)",background:"transparent",border:"none",color:"#555",cursor:"pointer",padding:"4px",display:"flex",alignItems:"center"}}>
                {showPwd
                  ? <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                  : <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                }
              </button>
            </div>

            {error && <div style={{fontSize:"12px",color:C.red,marginTop:"10px",lineHeight:"1.5"}}>{error}</div>}

            <button style={{...css.btn(C.gold),marginTop:"18px",opacity:loading?0.6:1}} onClick={handleSubmit} disabled={loading}>
              {loading ? "Connexion…" : "Se connecter"}
            </button>

            <div style={{textAlign:"center",marginTop:"12px",display:"flex",flexDirection:"column",gap:"8px"}}>
              {/* Pas de compte → aller payer */}
              <button style={{background:"transparent",border:"none",color:"#555",fontSize:"12px",cursor:"pointer",fontFamily:"inherit"}}
                onClick={()=>{ if(onGoToPay) onGoToPay(); else if(onClose) onClose(); }}>
                Pas encore de compte ? Souscrire à Pro
              </button>
              {/* Mot de passe oublié */}
              <button style={{background:"transparent",border:"none",color:"#333",fontSize:"11px",cursor:"pointer",fontFamily:"inherit"}}
                onClick={async()=>{
                  if (!email) { setError("Entre ton email pour recevoir le lien."); return; }
                  setLoading(true); setError(null);
                  try {
                    const res = await fetch("/api/auth", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ action: "reset", email })
                    });
                    const data = await res.json();
                    if (data.error) { setError(data.error); }
                    else { setSuccess("Lien de réinitialisation envoyé. Vérifie ta boîte mail."); }
                  } catch { setError("Erreur réseau."); }
                  setLoading(false);
                }}>
                Mot de passe oublié ?
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ─── MACRO EDITOR ─────────────────────────────────────────────────────────────
function MacroEditor({ targets, custom, onSave }) {
  const init = custom || { protein: targets.protein, carbs: targets.carbs, fat: targets.fat };
  const [vals, setVals] = useState({
    protein: String(init.protein),
    carbs:   String(init.carbs),
    fat:     String(init.fat),
  });

  function handleChange(key, raw) {
    setVals(v => ({ ...v, [key]: raw }));
  }

  function handleBlur(key) {
    const num = parseInt(vals[key]);
    if (isNaN(num) || num < 0) {
      // Revert to last valid value
      const fallback = custom?.[key] ?? targets[key];
      setVals(v => ({ ...v, [key]: String(fallback) }));
    } else {
      const current = custom || { protein: targets.protein, carbs: targets.carbs, fat: targets.fat };
      onSave({ ...current, [key]: num });
    }
  }

  const fields = [
    { key: "protein", label: "Protéines (g)", color: "#7DF9FF" },
    { key: "carbs",   label: "Glucides (g)",  color: "#FFB347" },
    { key: "fat",     label: "Lipides (g)",   color: "#FF8C69" },
  ];

  return (
    <div style={{background:"rgba(255,255,255,0.02)",borderRadius:"10px",padding:"12px",border:"1px solid rgba(255,215,0,0.1)"}}>
      <div style={{fontSize:"10px",color:C.gold,letterSpacing:"1px",marginBottom:"10px"}}>MODIFIER MANUELLEMENT</div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:"8px",marginBottom:"8px"}}>
        {fields.map((m,i) => (
          <div key={i}>
            <div style={{fontSize:"9px",color:m.color,marginBottom:"4px"}}>{m.label}</div>
            <input
              type="number"
              value={vals[m.key]}
              onChange={e => handleChange(m.key, e.target.value)}
              onBlur={() => handleBlur(m.key)}
              style={{width:"100%",padding:"8px",borderRadius:"8px",border:`1.5px solid ${C.border}`,background:"rgba(255,255,255,0.04)",color:C.text,fontSize:"13px",fontWeight:"700",fontFamily:"inherit",outline:"none",textAlign:"center",boxSizing:"border-box"}}
            />
          </div>
        ))}
      </div>
      <div style={{fontSize:"10px",color:"#444",textAlign:"center"}}>
        Suggestion : {targets.protein}g · {targets.carbs}g · {targets.fat}g — Méthode g/kg
      </div>
    </div>
  );
}

// ─── VIEWS ───────────────────────────────────────────────────────────────────

function ViewAnalyze({ premium }) {
  const [step, setStep] = useState("upload");
  const [imagePreview, setImagePreview] = useState(null);
  const [imageBase64, setImageBase64] = useState(null);
  const [gender, setGender] = useState(null);
  const [age, setAge] = useState("");
  const [weight, setWeight] = useState("");
  const [result, setResult] = useState(null);
  const [shareUrl, setShareUrl] = useState(null);
  const [error, setError] = useState(null);
  const [showPaywall, setShowPaywall] = useState(false);
  const [syncVersion, setSyncVersion] = useState(0);
  const [showPWA, setShowPWA] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [showPostPayment, setShowPostPayment] = useState(false);
  const [postPaymentEmail, setPostPaymentEmail] = useState(null);
  const [user, setUser] = useState(() => {
    const email = localStorage.getItem("pq_email");
    return email ? { email } : null;
  });

  useEffect(() => {
    // Capture install prompt on Android
    window.addEventListener("beforeinstallprompt", (e) => {
      e.preventDefault();
      window._pwaInstallPrompt = e;
      setShowPWA(true);
    });
    // Show banner after 30s on iOS
    const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
    const isStandalone = window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone;
    const dismissed = localStorage.getItem("pq_pwa_dismissed");
    if (isIOS && !isStandalone && !dismissed) {
      setTimeout(() => setShowPWA(true), 30000);
    }

    // Handle Stripe success redirect
    const params = new URLSearchParams(window.location.search);
    if (params.get("success") === "true") {
      // Nettoie l'URL
      window.history.replaceState({}, "", window.location.pathname);
      // Récupère l'email Stripe et ouvre la modal de création de compte
      const sessionId = localStorage.getItem("pq_stripe_session");
      if (sessionId) {
        fetch("/api/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionId })
        }).then(r => r.json()).then(data => {
          setPostPaymentEmail(data.email || "unknown");
          setShowPostPayment(true);
        }).catch(() => {
          setPostPaymentEmail("unknown");
          setShowPostPayment(true);
        });
      } else {
        setPostPaymentEmail("unknown");
        setShowPostPayment(true);
      }
    }
    
    if (params.get("canceled") === "true") {
      window.history.replaceState({}, "", window.location.pathname);
    }

    // Pull automatique des données si déjà connecté
    const autoSync = async () => {
      const token = localStorage.getItem("pq_token");
      if (!token) return;
      const today = new Date().toISOString().slice(0,10);
      try {
        const remote = await syncPull(token, today);
        if (!remote) return;
        let changed = false;
        if (remote.profile) {
          const p = remote.profile;
          if (p.gender) { localStorage.setItem("pq_gender", p.gender); changed = true; }
          if (p.age) { localStorage.setItem("pq_age", String(p.age)); changed = true; }
          if (p.weight) { localStorage.setItem("pq_weight", String(p.weight)); changed = true; }
          if (p.height) { localStorage.setItem("pq_height", String(p.height)); changed = true; }
          if (p.goal) { localStorage.setItem("pq_goal", p.goal); changed = true; }
          if (p.activity) { localStorage.setItem("pq_activity", p.activity); changed = true; }
        }
        if (remote.journal) {
          const key = "pq_journal_" + today;
          const local = JSON.parse(localStorage.getItem(key) || '{"meals":[],"steps":0,"sessions":[],"water":0}');
          if ((remote.journal.meals?.length || 0) >= (local.meals?.length || 0)) {
            localStorage.setItem(key, JSON.stringify({
              meals: remote.journal.meals || [],
              steps: remote.journal.steps || local.steps || 0,
              sessions: remote.journal.sessions || local.sessions || [],
              water: remote.journal.water || local.water || 0
            }));
            changed = true;
          }
        }
        if (remote.analyses?.length > 0) {
          const localHistory = JSON.parse(localStorage.getItem("pq_history") || "[]");
          const merged = [...localHistory];
          for (const a of remote.analyses) {
            if (!merged.find(h => h.date === a.date && h.bodyfat === a.bodyfat)) {
              merged.push({ date: a.date, bodyfat: a.bodyfat, weight: a.weight, note: a.note, confidence: a.confidence });
              changed = true;
            }
          }
          if (changed) {
            merged.sort((a,b) => b.date.localeCompare(a.date));
            localStorage.setItem("pq_history", JSON.stringify(merged.slice(0,100)));
          }
        }
        if (remote.savedFoods?.length > 0) {
          const localFoods = JSON.parse(localStorage.getItem("pq_saved_foods") || "[]");
          const merged = [...localFoods];
          for (const f of remote.savedFoods) {
            if (!merged.find(lf => lf.name === f.name)) { merged.push(f); changed = true; }
          }
          if (changed) localStorage.setItem("pq_saved_foods", JSON.stringify(merged.slice(0,50)));
        }
        // Force re-render APRÈS que toutes les données sont écrites
        if (changed) setSyncVersion(v => v + 1);
      } catch {}
    };
    autoSync();

    // Vérifie le statut Pro via Supabase si connecté
    const verifyPro = async () => {
      const token = localStorage.getItem("pq_token");
      if (!token) {
        // Fallback ancien système session Stripe
        const sessionId = localStorage.getItem("pq_stripe_session");
        if (!sessionId) return;
        try {
          const res = await fetch("/api/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ sessionId })
          });
          const data = await res.json();
          if (data.active) { setPremium(true); setPremiumState(true); }
        } catch {}
        return;
      }
      try {
        const res = await fetch("/api/me", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token })
        });
        const data = await res.json();
        if (data.email) {
          setUser({ email: data.email });
          localStorage.setItem("pq_email", data.email);
          if (data.is_pro) { setPremium(true); setPremiumState(true); }
          else { setPremium(false); setPremiumState(false); }
        } else {
          // Token expiré
          localStorage.removeItem("pq_token");
          localStorage.removeItem("pq_email");
        }
      } catch {}
    };
    verifyPro();
  }, []);
  const [daysLeft, setDaysLeft] = useState(0);
  const [showWeightModal, setShowWeightModal] = useState(false);
  const [newWeight, setNewWeight] = useState(null);
  const fileRef = useRef();

  const profile = getProfile();

  function handleFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const MAX = 800;
        let w = img.width, h = img.height;
        if (w > MAX || h > MAX) { if(w>h){h=Math.round(h*MAX/w);w=MAX;}else{w=Math.round(w*MAX/h);h=MAX;} }
        canvas.width=w; canvas.height=h;
        canvas.getContext("2d").drawImage(img,0,0,w,h);
        const dataUrl = canvas.toDataURL("image/jpeg",0.85);
        setImagePreview(dataUrl);
        setImageBase64(dataUrl.split(",")[1]);
        // Pre-fill from profile
        if (profile.gender) setGender(profile.gender);
        if (profile.age) setAge(profile.age);
        setStep("form");
      };
      img.src = ev.target.result;
    };
    reader.readAsDataURL(file);
  }

  async function analyze() {
    setError(null);
    if (!gender) { setError("Sélectionne ton genre."); return; }

    if (!premium) {
      const usage = getUsage();
      const check = canAnalyze(usage);
      if (!check.allowed) { setDaysLeft(check.daysLeft); setShowPaywall(true); return; }
    }

    setStep("analyzing");
    try {
      const resolvedAge = age || profile.age || 25;
      const profilePrompt = (() => {
        const parts = [];
        if (profile.activity) parts.push(`Activity: ${ACTIVITY_LEVELS.find(a=>a.key===profile.activity)?.label}`);
        if (profile.trainingType) parts.push(`Training type: ${profile.trainingType}`);
        if (profile.goal) parts.push(`Goal: ${GOALS.find(g=>g.key===profile.goal)?.label}`);
        return parts.length ? `\n\nUser profile:\n${parts.join("\n")}` : "";
      })();

      // SIMULATION PREVIEW — remplace par l'appel API réel sur Vercel
      await new Promise(r => setTimeout(r, 2200));
      const bf = gender === "male"
        ? 10 + Math.floor(Math.random() * 10)
        : 18 + Math.floor(Math.random() * 10);
      const data = {
        bodyfat: bf,
        confidence: "medium",
        confidence_reason: "Simulation locale — l'analyse IA réelle fonctionne sur Vercel",
        key_indicators: [
          "Abdominaux partiellement visibles",
          "Légère couche de graisse sous-cutanée",
          "Bonne masse musculaire de base"
        ],
        note: "Configure ton profil pour des recommandations personnalisées."
      };

      const archetype = getArchetype(data.bodyfat, gender);
      const entry = { bodyfat: data.bodyfat, gender, age: resolvedAge, weight: parseFloat(weight)||null, archetype };
      addToHistory(entry);

      // Usage tracking
      if (!premium) {
        const usage = getUsage();
        saveUsage({ count: usage.count + 1, weeklyUsed: usage.count >= 1 ? new Date().toISOString() : usage.weeklyUsed });
      }

      // Weight update check
      if (weight) {
        set(keys.weight, weight);
        const profileW = parseFloat(profile.weight || 0);
        const analysisW = parseFloat(weight);
        if (profileW && Math.abs(profileW - analysisW) >= 0.5) {
          setNewWeight(analysisW);
          setShowWeightModal(true);
        } else if (!profileW) {
          saveProfile({ ...profile, weight: analysisW });
        }
      }

      setResult({ ...data, archetype });
      setStep("result");
    } catch (err) {
      setError(`Erreur : ${err.message}`);
      setStep("form");
    }
  }

  function reset() {
    setStep("upload"); setResult(null); setImagePreview(null); setImageBase64(null);
    setGender(null); setAge(""); setWeight(""); setShareUrl(null); setError(null);
  }

  const archetype = result?.archetype;

  return (
    <div style={{width:"100%",maxWidth:"420px"}}>
      {showPaywall && <Paywall daysLeft={daysLeft} onClose={()=>setShowPaywall(false)}/>}
      {showWeightModal && newWeight && (
        <WeightUpdateModal
          currentWeight={parseFloat(profile.weight)}
          newWeight={newWeight}
          onAccept={()=>{ saveProfile({...getProfile(),weight:newWeight}); setShowWeightModal(false); }}
          onDecline={()=>setShowWeightModal(false)}
        />
      )}

      {step === "upload" && (
        <>
          {/* Header compact */}
          <div style={{textAlign:"center",marginBottom:"16px",paddingTop:"4px"}}>
            <div style={{fontSize:"9px",letterSpacing:"4px",color:C.gold,marginBottom:"8px",opacity:0.8}}>ANALYSE IA · BODY FAT</div>
            <h1 style={{fontSize:"22px",fontWeight:"800",background:"linear-gradient(135deg,#fff,#aaa)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",marginBottom:"4px"}}>Connaît ton vrai physique</h1>
            <p style={{fontSize:"11px",color:C.muted}}>Résultats en secondes</p>
          </div>

          {/* Rappel analyse disponible */}
          {(() => {
            const usage = getUsage();
            if (usage.count >= 2 && usage.weeklyUsed) {
              const days = (Date.now() - new Date(usage.weeklyUsed).getTime()) / 86400000;
              if (days >= 7) return (
                <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"10px 14px",background:"rgba(125,249,170,0.08)",border:`1px solid rgba(125,249,170,0.2)`,borderRadius:"12px",marginBottom:"8px"}}>
                  <span style={{fontSize:"12px",color:"#aaa"}}>Analyse hebdomadaire disponible</span>
                  <span style={{fontSize:"11px",color:C.green,fontWeight:"600"}}>Go →</span>
                </div>
              );
            }
            return null;
          })()}

          {/* Rappel profil incomplet */}
          {getProfileCompletion(profile) < 100 && (
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"10px 14px",background:`rgba(255,215,0,0.06)`,border:`1px solid rgba(255,215,0,0.1)`,borderRadius:"12px",marginBottom:"8px",cursor:"pointer"}} onClick={()=>document.dispatchEvent(new CustomEvent("navigate",{detail:"profil"}))}>
              <div style={{display:"flex",alignItems:"center",gap:"8px"}}>
                <div style={{width:"6px",height:"6px",borderRadius:"50%",background:C.red,flexShrink:0}}/>
                <span style={{fontSize:"12px",color:"#aaa"}}>Complète ton profil pour plus de précision</span>
              </div>
              <span style={{fontSize:"11px",color:C.gold,fontWeight:"600"}}>Profil →</span>
            </div>
          )}

          {/* Zone upload grande et cliquable */}
          <input ref={fileRef} type="file" accept="image/*" style={{display:"none"}} onChange={handleFile}/>
          <div
            onClick={()=>fileRef.current.click()}
            style={{
              border:`2px dashed rgba(255,215,0,0.3)`,
              borderRadius:"20px",
              padding:"32px 20px",
              textAlign:"center",
              cursor:"pointer",
              background:"rgba(255,215,0,0.03)",
              marginBottom:"12px",
              display:"flex",
              flexDirection:"column",
              alignItems:"center",
              gap:"10px",
              minHeight:"180px",
              justifyContent:"center",
            }}>
            <div style={{width:"56px",height:"56px",borderRadius:"50%",background:"rgba(255,215,0,0.1)",border:`1.5px solid rgba(255,215,0,0.3)`,display:"flex",alignItems:"center",justifyContent:"center"}}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={C.gold} strokeWidth="2"><path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/><circle cx="12" cy="13" r="4"/></svg>
            </div>
            <div>
              <div style={{fontSize:"15px",fontWeight:"700",marginBottom:"3px"}}>Prendre ou choisir une photo</div>
              <div style={{fontSize:"12px",color:C.muted}}>Corps entier de préférence</div>
            </div>
          </div>

          {/* Conseils compacts en ligne */}
          <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:"8px"}}>
            {[
              {icon:"👕",text:"Tenue ajustée"},
              {icon:"💡",text:"Bonne lumière"},
              {icon:"📸",text:"De face"},
            ].map((c,i)=>(
              <div key={i} style={{background:"rgba(255,255,255,0.03)",border:`1px solid ${C.border}`,borderRadius:"12px",padding:"10px 6px",textAlign:"center"}}>
                <div style={{fontSize:"20px",marginBottom:"4px"}}>{c.icon}</div>
                <div style={{fontSize:"10px",color:"#777"}}>{c.text}</div>
              </div>
            ))}
          </div>
        </>
      )}

      {step === "form" && (
        <div style={css.card}>
          {imagePreview && (
            <div style={{borderRadius:"12px",overflow:"hidden",marginBottom:"16px",maxHeight:"200px",background:"#111"}}>
              <img src={imagePreview} alt="" style={{width:"100%",objectFit:"cover",maxHeight:"200px"}}/>
            </div>
          )}
          <span style={css.label}>Genre</span>
          <div style={{display:"flex",gap:"8px",marginTop:"8px"}}>
            <button style={{...css.optBtn(gender==="male"),flex:1,textAlign:"center"}} onClick={()=>setGender("male")}>Homme</button>
            <button style={{...css.optBtn(gender==="female"),flex:1,textAlign:"center"}} onClick={()=>setGender("female")}>Femme</button>
          </div>
          <span style={css.label}>Âge (optionnel)</span>
          <input style={css.input} type="number" placeholder="Ex : 24" value={age} onChange={e=>setAge(e.target.value)}/>
          <span style={css.label}>Poids (kg) · optionnel</span>
          <input style={css.input} type="number" placeholder="Ex : 75" value={weight} onChange={e=>setWeight(e.target.value)}/>
          {error && <div style={{marginTop:"10px",color:C.red,fontSize:"12px",textAlign:"center"}}>{error}</div>}
          <div style={{marginTop:"16px"}}>
            <button style={{...css.btn(C.gold),opacity:!gender?0.4:1,cursor:!gender?"not-allowed":"pointer"}} onClick={analyze} disabled={!gender}>Analyser mon physique</button>
            <button style={css.btnSec} onClick={()=>setStep("upload")}>Changer de photo</button>
          </div>
        </div>
      )}

      {step === "analyzing" && (
        <div style={{...css.card,textAlign:"center"}}>
          <div style={{fontSize:"17px",fontWeight:"700",marginBottom:"8px"}}>Analyse en cours</div>
          <div style={{fontSize:"12px",color:C.muted,marginBottom:"20px"}}>L'IA examine ta composition corporelle</div>
          {["Détection musculaire","Analyse sous-cutanée","Calibration archétype"].map((t,i)=>(
            <div key={i} style={{display:"flex",alignItems:"center",gap:"10px",padding:"10px 14px",background:"rgba(255,255,255,0.03)",borderRadius:"10px",marginBottom:"6px"}}>
              <div style={{width:"6px",height:"6px",borderRadius:"50%",background:C.gold,boxShadow:`0 0 8px ${C.gold}`}}/>
              <span style={{fontSize:"12px",color:"#777"}}>{t}</span>
            </div>
          ))}
        </div>
      )}

      {step === "result" && result && archetype && (
        <>
          <ShareCard imagePreview={imagePreview} result={result} archetype={archetype} onReady={setShareUrl}/>

          <div style={{...css.card,textAlign:"center"}}>
            <div style={{display:"inline-block",padding:"5px 14px",borderRadius:"20px",border:`1px solid ${archetype.color}33`,background:`${archetype.color}11`,color:archetype.color,fontSize:"11px",fontWeight:"700",letterSpacing:"2px",textTransform:"uppercase",marginBottom:"8px"}}>{archetype.label}</div>
            <div style={{fontSize:"17px",fontWeight:"800",color:archetype.color,marginBottom:"16px"}}>{archetype.ref}</div>
            <div style={{display:"flex",justifyContent:"center",marginBottom:"8px"}}>
              <GaugeRing percent={result.bodyfat} color={archetype.color}/>
            </div>
            <div style={{fontSize:"12px",color:C.sub,marginBottom:"12px",fontStyle:"italic"}}>"{archetype.desc || "Continue sur ta lancée."}"</div>
            <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:"6px",fontSize:"11px",color:"#444"}}>
              <div style={{width:"6px",height:"6px",borderRadius:"50%",background:result.confidence==="high"?C.green:result.confidence==="medium"?C.gold:C.red}}/>
              {result.confidence_reason}
            </div>
          </div>

          {result.key_indicators?.length > 0 && (
            <div style={css.card}>
              <div style={css.cardTitle}>INDICATEURS ANALYSÉS</div>
              {result.key_indicators.map((ind,i)=>(
                <div key={i} style={{display:"flex",gap:"10px",marginBottom:"8px"}}>
                  <span style={{color:archetype.color,fontSize:"12px",marginTop:"1px"}}>◆</span>
                  <span style={{fontSize:"12px",color:"#bbb",lineHeight:"1.5"}}>{ind}</span>
                </div>
              ))}
            </div>
          )}

          {result.note && (
            <div style={{...css.card,background:`linear-gradient(135deg,${archetype.color}08,transparent)`,borderColor:`${archetype.color}18`,textAlign:"center"}}>
              <div style={{fontSize:"13px",color:"#ccc",fontStyle:"italic"}}>{result.note}</div>
            </div>
          )}

          {/* Message personnalisé selon le score */}
          {(() => {
            const bf = result.bodyfat;
            let msg = null;
            if (bf <= 10)      msg = { text:"Tu es dans le top 2% mondial. Maintenir ce niveau demande de la rigueur — continue.", color:C.gold };
            else if (bf <= 14) msg = { text:"Encore 2-3% à perdre et tu atteins l'élite. En 6-8 semaines de déficit léger c'est atteignable.", color:C.green };
            else if (bf <= 18) msg = { text:"Physique athlétique solide. Un déficit de 300-400 kcal/jour te mène à la catégorie Athlète en 8-10 semaines.", color:C.green };
            else if (bf <= 22) msg = { text:"Bonne base. Combine déficit calorique et musculation pour une transformation visible en 12 semaines.", color:"#7DF9FF" };
            else if (bf <= 27) msg = { text:"Le potentiel est là. Configure ton profil pour obtenir ton plan calorique personnalisé.", color:"#FFB347" };
            else               msg = { text:"Chaque transformation commence ici. Configure ton profil — c'est la première étape.", color:"#FF8C69" };
            return (
              <div style={{...css.card,background:`linear-gradient(135deg,${msg.color}08,transparent)`,borderColor:`${msg.color}18`}}>
                <div style={{fontSize:"10px",color:msg.color,letterSpacing:"2px",marginBottom:"8px"}}>ANALYSE PERSONNALISÉE</div>
                <div style={{fontSize:"13px",color:"#ccc",lineHeight:"1.6"}}>{msg.text}</div>
              </div>
            );
          })()}

          {/* Install nudge — after result, peak engagement moment */}
          {(() => {
            const isStandalone = window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone;
            if (isStandalone) return null;
            const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
            return (
              <div style={{...css.card,background:"linear-gradient(135deg,rgba(255,215,0,0.06),transparent)",borderColor:"rgba(255,215,0,0.2)"}}>
                <div style={{display:"flex",alignItems:"center",gap:"12px"}}>
                  <div style={{width:"40px",height:"40px",borderRadius:"10px",background:"linear-gradient(135deg,#FFD700,#FFA500)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                    <svg width="20" height="20" viewBox="0 0 40 40">
                      <rect x="8" y="4" width="24" height="18" rx="5" fill="none" stroke="#000" strokeWidth="2"/>
                      <rect x="11" y="8" width="6" height="5" rx="1.5" fill="#000"/>
                      <rect x="23" y="8" width="6" height="5" rx="1.5" fill="#000"/>
                      <rect x="12" y="23" width="16" height="13" rx="4" fill="none" stroke="#000" strokeWidth="2"/>
                      <rect x="5" y="25" width="6" height="9" rx="3" fill="none" stroke="#000" strokeWidth="1.8"/>
                      <rect x="29" y="25" width="6" height="9" rx="3" fill="none" stroke="#000" strokeWidth="1.8"/>
                    </svg>
                  </div>
                  <div style={{flex:1}}>
                    <div style={{fontSize:"13px",fontWeight:"700",marginBottom:"3px"}}>Installe Physiqrate</div>
                    <div style={{fontSize:"11px",color:"#666"}}>Reviens chaque semaine suivre ta progression</div>
                  </div>
                </div>
                <div style={{marginTop:"12px"}}>
                  {isIOS ? (
                    <a href="x-safari-https://physiqrate.com"
                      style={{display:"block",textAlign:"center",padding:"12px",borderRadius:"10px",background:"linear-gradient(135deg,#FFD700,#FFA500)",color:"#000",fontSize:"13px",fontWeight:"700",textDecoration:"none"}}>
                      Ouvrir dans Safari pour installer
                    </a>
                  ) : (
                    <button onClick={()=>window._pwaInstallPrompt?.prompt()}
                      style={{...css.btn(C.gold),marginBottom:0}}>
                      Ajouter à l'écran d'accueil
                    </button>
                  )}
                </div>
              </div>
            );
          })()}

          <div style={css.card}>
            <div style={css.cardTitle}>CARTE DE PARTAGE</div>
            {shareUrl ? (
              <>
                <div style={{borderRadius:"12px",overflow:"hidden",marginBottom:"12px",border:`1px solid ${archetype.color}18`}}>
                  <img src={shareUrl} alt="carte" style={{width:"100%",display:"block"}}/>
                </div>
                <button style={css.btn(archetype.color)} onClick={async()=>{
                  const text=`Mon body fat : ${result.bodyfat}% — ${archetype.ref} | PHYSIQRATE`;
                  if(navigator.share){try{const blob=await(await fetch(shareUrl)).blob();const file=new File([blob],"physiqrate.png",{type:"image/png"});if(navigator.canShare?.({files:[file]})){await navigator.share({files:[file],text});return;}}catch{}}
                  const a=document.createElement("a");a.href=shareUrl;a.download="physiqrate.png";a.click();
                }}>Partager mon résultat</button>
              </>
            ) : <div style={{textAlign:"center",padding:"16px",color:C.muted,fontSize:"12px"}}>Génération en cours…</div>}
            <button style={css.btnSec} onClick={reset}>Nouvelle analyse</button>
          <button style={{...css.btnSec,color:C.gold,borderColor:"rgba(255,215,0,0.2)"}} onClick={()=>document.dispatchEvent(new CustomEvent("navigate",{detail:"progression"}))}>
            Voir ma progression
          </button>
          </div>
        </>
      )}
    </div>
  );
}

function ViewJour() {
  const [journal, setJournal] = useState(getTodayJournal());
  const [showMealForm, setShowMealForm] = useState(false);
  const [showSessionForm, setShowSessionForm] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [showSavedFoods, setShowSavedFoods] = useState(false);
  const [scannedProduct, setScannedProduct] = useState(null);
  const [mealForm, setMealForm] = useState({ name:"", calories:"", protein:"", carbs:"", fat:"" });
  const [sessionForm, setSessionForm] = useState({ type:"", duration:"60" });
  const [toast, setToast] = useState({ visible:false, message:"" });

  function showToast(msg) {
    setToast({ visible:true, message:msg });
    setTimeout(()=>setToast({ visible:false, message:"" }), 2000);
  }

  const tdee = (() => {
    const p = getProfile();
    const w = parseFloat(get(keys.weight) || p.weight || 0);
    return calcTDEE(p.gender, p.age, p.height, w, p.activity, p.steps);
  })();
  const goalCals = calcGoal(tdee, getProfile().goal);
  const totalCals = journal.meals.reduce((s, m) => s + (m.calories || 0), 0);
  const remaining = goalCals ? goalCals - totalCals : null;
  const progress = goalCals ? Math.min(100, Math.round(totalCals / goalCals * 100)) : 0;

  function save(data) {
    setJournal(data);
    saveTodayJournal(data);
    // Sync vers Supabase
    const today = new Date().toISOString().slice(0,10);
    syncPush({ journal: { ...data, date: today } });
  }

  const macros = journal.meals.reduce((acc, m) => ({
    protein: acc.protein + (m.protein||0),
    carbs: acc.carbs + (m.carbs||0),
    fat: acc.fat + (m.fat||0),
  }), { protein:0, carbs:0, fat:0 });

  function addMeal() {
    if (!mealForm.name || !mealForm.calories) return;
    const now = new Date().toLocaleTimeString("fr-FR",{hour:"2-digit",minute:"2-digit"});
    const meal = { name:mealForm.name, calories:parseInt(mealForm.calories)||0, protein:parseInt(mealForm.protein)||0, carbs:parseInt(mealForm.carbs)||0, fat:parseInt(mealForm.fat)||0, time:now, detail:"Ajout manuel" };
    save({ ...journal, meals: [...journal.meals, meal] });
    setMealForm({ name:"", calories:"", protein:"", carbs:"", fat:"" });
    setShowMealForm(false);
    showToast(`${mealForm.name} ajouté — ${mealForm.calories} kcal`);
  }

  function addSession() {
    if (!sessionForm.type) return;
    save({ ...journal, session:{ type:sessionForm.type, duration:parseInt(sessionForm.duration)||60, done:false } });
    setSessionForm({ type:"", duration:"60" });
    setShowSessionForm(false);
    showToast(`Séance "${sessionForm.type}" ajoutée`);
  }

  const formStyle = { background:"rgba(255,215,0,0.04)", border:`1px solid rgba(255,215,0,0.15)`, borderRadius:"14px", padding:"16px", marginBottom:"10px" };
  const formInput = { ...css.input, marginTop:"0", marginBottom:"8px" };
  const formRow = { display:"flex", gap:"8px", marginBottom:"8px" };

  const profile = getProfile();
  const profileComplete = getProfileCompletion(profile) >= 60;

  return (
    <div style={{width:"100%",maxWidth:"420px"}}>
      <Toast message={toast.message} visible={toast.visible}/>

      {showScanner && (
        <BarcodeScanner
          onResult={(product) => {
            setShowScanner(false);
            setScannedProduct(product);
          }}
          onClose={() => setShowScanner(false)}
        />
      )}

      {scannedProduct && (
        <ProductModal
          product={scannedProduct}
          onConfirm={(meal) => {
            const now = new Date().toLocaleTimeString("fr-FR",{hour:"2-digit",minute:"2-digit"});
            const updated = { ...journal, meals: [...journal.meals, {...meal, time:now, detail:"Code-barres"}] };
            save(updated);
            showToast(`${meal.name} ajouté — ${meal.calories} kcal`);
            setScannedProduct(null);
          }}
          onClose={() => setScannedProduct(null)}
        />
      )}

      {/* Invitation profil si incomplet */}
      {!profileComplete && (
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"10px 14px",background:"rgba(255,215,0,0.06)",border:`1px solid rgba(255,215,0,0.15)`,borderRadius:"12px",marginBottom:"10px",cursor:"pointer"}} onClick={()=>document.dispatchEvent(new CustomEvent("navigate",{detail:"profil"}))}>
          <div style={{display:"flex",alignItems:"center",gap:"10px"}}>
            <div style={{width:"7px",height:"7px",borderRadius:"50%",background:C.red,flexShrink:0}}/>
            <span style={{fontSize:"12px",color:"#aaa"}}>Complète ton profil pour voir ton objectif calorique</span>
          </div>
          <span style={{fontSize:"11px",color:C.gold,fontWeight:"600"}}>Profil →</span>
        </div>
      )}

      {/* Objectif */}
      {tdee && (
        <div style={{background:`linear-gradient(135deg,rgba(255,215,0,0.08),rgba(255,215,0,0.02))`,border:`1px solid rgba(255,215,0,0.2)`,borderRadius:"16px",padding:"16px",marginBottom:"12px"}}>
          <div style={css.cardTitle}>OBJECTIF DU JOUR</div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:"8px",marginBottom:"12px"}}>
            {[{val:tdee.toLocaleString(),label:"Maintien"},{val:(goalCals||tdee).toLocaleString(),label:"Objectif",color:C.green},{val:totalCals.toLocaleString(),label:"Consommé"}].map((item,i)=>(
              <div key={i} style={{textAlign:"center"}}>
                <div style={{fontSize:"18px",fontWeight:"800",color:item.color||C.gold}}>{item.val}</div>
                <div style={{fontSize:"9px",color:C.muted,marginTop:"2px"}}>{item.label}</div>
              </div>
            ))}
          </div>
          <div style={{height:"5px",background:"rgba(255,255,255,0.06)",borderRadius:"3px",overflow:"hidden"}}>
            <div style={{height:"100%",width:`${progress}%`,background:`linear-gradient(90deg,${C.green},${C.gold})`,borderRadius:"3px",transition:"width 0.5s"}}/>
          </div>
          <div style={{display:"flex",justifyContent:"space-between",marginTop:"6px"}}>
            <span style={{fontSize:"10px",color:C.muted}}>{totalCals} kcal</span>
            {remaining !== null && <span style={{fontSize:"10px",color:remaining>=0?C.green:C.red}}>{remaining>=0?`${remaining} restantes`:`${Math.abs(remaining)} dépassées`}</span>}
          </div>
        </div>
      )}

      {/* Macros + Repas */}
      <div style={css.card}>
        <div style={css.cardTitle}>MACROS DU JOUR</div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:"8px",marginBottom:"16px"}}>
          {[{val:`${macros.protein}g`,label:"PROT.",color:"#7DF9FF"},{val:`${macros.carbs}g`,label:"GLUC.",color:"#FFB347"},{val:`${macros.fat}g`,label:"LIP.",color:"#FF8C69"},{val:totalCals,label:"KCAL",color:C.gold}].map((m,i)=>(
            <div key={i} style={{background:"rgba(255,255,255,0.04)",borderRadius:"12px",padding:"10px 6px",textAlign:"center"}}>
              <div style={{fontSize:"16px",fontWeight:"800",color:m.color}}>{m.val}</div>
              <div style={{fontSize:"9px",color:C.muted,marginTop:"2px",letterSpacing:"1px"}}>{m.label}</div>
            </div>
          ))}
        </div>

        {/* Objectifs macros — utilise les macros personnalisées si définies */}
        {(() => {
          const p = getProfile();
          const w = parseFloat(get(keys.weight) || p.weight || 0);
          const tdeeLocal = calcTDEE(p.gender, p.age, p.height, w, p.activity, p.steps);
          const goalCalsLocal = calcGoal(tdeeLocal, p.goal);
          const autoTargets = calcTargetMacros(goalCalsLocal, p.goal, w);
          const custom = getCustomMacros();
          const targets = custom || autoTargets;
          if (!targets) return null;
          return (
            <div style={{background:"rgba(255,255,255,0.02)",borderRadius:"12px",padding:"12px",marginBottom:"16px",border:`1px solid ${C.border}`}}>
              <div style={{fontSize:"10px",color:C.muted,letterSpacing:"1px",marginBottom:"10px"}}>OBJECTIFS MACROS</div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:"8px"}}>
                {[
                  {label:"Protéines",consumed:macros.protein,target:targets.protein,color:"#7DF9FF",pct:targets.proteinPct},
                  {label:"Glucides", consumed:macros.carbs,  target:targets.carbs,  color:"#FFB347",pct:targets.carbsPct},
                  {label:"Lipides",  consumed:macros.fat,    target:targets.fat,    color:"#FF8C69",pct:targets.fatPct},
                ].map((m,i)=>{
                  const progress = Math.min(100, Math.round(m.consumed / m.target * 100));
                  const over = m.consumed > m.target;
                  return (
                    <div key={i} style={{textAlign:"center"}}>
                      <div style={{fontSize:"11px",fontWeight:"700",color:over?C.red:m.color}}>{m.consumed}<span style={{fontSize:"9px",color:C.muted,fontWeight:"400"}}>/{m.target}g</span></div>
                      <div style={{height:"4px",background:"rgba(255,255,255,0.06)",borderRadius:"2px",margin:"4px 0",overflow:"hidden"}}>
                        <div style={{height:"100%",width:`${progress}%`,background:over?C.red:m.color,borderRadius:"2px",transition:"width 0.5s"}}/>
                      </div>
                      <div style={{fontSize:"9px",color:C.muted}}>{m.label} · {m.pct}%</div>
                    </div>
                  );
                })}
              </div>
              <div style={{fontSize:"10px",color:"#333",marginTop:"8px",textAlign:"center"}}>Basé sur {targets.protein}g prot · {targets.fat}g lip · {targets.carbs}g gluc</div>
            </div>
          );
        })()}

        <div style={css.cardTitle}>REPAS</div>
        {journal.meals.length === 0 && !showMealForm && (
          <div style={{fontSize:"12px",color:"#444",textAlign:"center",padding:"12px 0"}}>Aucun repas ajouté aujourd'hui</div>
        )}
        {journal.meals.map((meal,i)=>(
          <div key={i} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"10px 12px",background:"rgba(255,255,255,0.03)",borderRadius:"10px",marginBottom:"6px"}}>
            <div style={{flex:1}}>
              <div style={{fontSize:"13px",fontWeight:"600"}}>{meal.name}</div>
              <div style={{fontSize:"10px",color:C.muted}}>{meal.time} · P:{meal.protein}g G:{meal.carbs}g L:{meal.fat}g</div>
            </div>
            <div style={{display:"flex",alignItems:"center",gap:"10px"}}>
              <div style={{fontSize:"13px",color:C.gold,fontWeight:"700"}}>{meal.calories} kcal</div>
              <button onClick={()=>{
                const updated = {...journal, meals: journal.meals.filter((_,idx)=>idx!==i)};
                save(updated);
                showToast("Repas supprimé");
              }} style={{background:"transparent",border:"none",color:"#444",fontSize:"16px",cursor:"pointer",padding:"4px",lineHeight:1}}>×</button>
            </div>
          </div>
        ))}

        {/* Modal aliments enregistrés */}
        {showSavedFoods && (
          <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.88)",backdropFilter:"blur(8px)",zIndex:300,display:"flex",alignItems:"flex-end",justifyContent:"center",padding:"20px"}}>
            <div style={{background:"#0f0f1a",border:`1px solid ${C.border}`,borderRadius:"24px",padding:"24px",width:"100%",maxWidth:"420px",marginBottom:"10px",maxHeight:"70vh",overflowY:"auto"}}>
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:"16px"}}>
                <div style={{fontSize:"10px",color:C.gold,letterSpacing:"2px"}}>MES ALIMENTS</div>
                <button onClick={()=>setShowSavedFoods(false)} style={{background:"transparent",border:"none",color:"#555",fontSize:"20px",cursor:"pointer"}}>×</button>
              </div>
              {getSavedFoods().length === 0 ? (
                <div style={{textAlign:"center",padding:"20px",color:C.muted,fontSize:"12px"}}>
                  <div>Aucun aliment enregistré.</div>
                  <div style={{marginTop:"4px"}}>Scanne un produit et coche "Enregistrer cet aliment".</div>
                </div>
              ) : getSavedFoods().map((food,i)=>(
                <div key={i} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"12px 14px",background:"rgba(255,255,255,0.03)",borderRadius:"12px",marginBottom:"8px"}}>
                  <div style={{flex:1,cursor:"pointer"}} onClick={()=>{setShowSavedFoods(false);setScannedProduct(food);}}>
                    <div style={{fontSize:"13px",fontWeight:"600"}}>{food.name}</div>
                    <div style={{fontSize:"10px",color:C.muted}}>{food.brand && `${food.brand} · `}{food.calories} kcal · P:{food.protein}g G:{food.carbs}g L:{food.fat}g <span style={{color:"#444"}}>(pour 100g)</span></div>
                  </div>
                  <button onClick={()=>{removeSavedFood(food.name); setShowSavedFoods(false); setTimeout(()=>setShowSavedFoods(true),50);}}
                    style={{background:"transparent",border:"none",color:"#333",fontSize:"16px",cursor:"pointer",padding:"4px 8px",flexShrink:0}}>×</button>
                </div>
              ))}
            </div>
          </div>
        )}

        {showMealForm ? (
          <div style={formStyle}>
            <div style={{fontSize:"10px",color:C.gold,letterSpacing:"2px",marginBottom:"10px"}}>NOUVEAU REPAS</div>
            <div style={{display:"flex",gap:"8px",marginBottom:"8px"}}>
              <button style={{flex:1,padding:"10px",borderRadius:"10px",border:`1.5px solid rgba(255,215,0,0.3)`,background:"rgba(255,215,0,0.06)",color:C.gold,fontSize:"12px",fontWeight:"600",cursor:"pointer",fontFamily:"inherit"}} onClick={()=>{setShowMealForm(false);setShowScanner(true);}}>
                Scanner
              </button>
              <button style={{flex:1,padding:"10px",borderRadius:"10px",border:`1.5px solid ${C.border}`,background:"rgba(255,255,255,0.04)",color:"#aaa",fontSize:"12px",fontWeight:"600",cursor:"pointer",fontFamily:"inherit",position:"relative"}} onClick={()=>setShowSavedFoods(true)}>
                Mes aliments
                {getSavedFoods().length > 0 && <span style={{position:"absolute",top:"-6px",right:"-6px",background:C.gold,color:"#000",borderRadius:"10px",fontSize:"9px",fontWeight:"800",padding:"1px 5px",minWidth:"16px",textAlign:"center"}}>{getSavedFoods().length}</span>}
              </button>
            </div>
            <input style={formInput} placeholder="Nom du repas" value={mealForm.name} onChange={e=>setMealForm({...mealForm,name:e.target.value})}/>
            <input style={formInput} type="number" placeholder="Calories (kcal)" value={mealForm.calories} onChange={e=>setMealForm({...mealForm,calories:e.target.value})}/>
            <div style={formRow}>
              <input style={{...formInput,flex:1,marginBottom:0}} type="number" placeholder="Protéines (g)" value={mealForm.protein} onChange={e=>setMealForm({...mealForm,protein:e.target.value})}/>
              <input style={{...formInput,flex:1,marginBottom:0}} type="number" placeholder="Glucides (g)" value={mealForm.carbs} onChange={e=>setMealForm({...mealForm,carbs:e.target.value})}/>
              <input style={{...formInput,flex:1,marginBottom:0}} type="number" placeholder="Lipides (g)" value={mealForm.fat} onChange={e=>setMealForm({...mealForm,fat:e.target.value})}/>
            </div>
            <div style={{display:"flex",gap:"8px",marginTop:"10px"}}>
              <button style={{...css.btn(C.gold),flex:1,marginBottom:0,padding:"11px"}} onClick={addMeal}>Ajouter</button>
              <button style={{...css.btnSec,flex:1,marginBottom:0,padding:"11px"}} onClick={()=>setShowMealForm(false)}>Annuler</button>
            </div>
          </div>
        ) : (
          <div style={{display:"flex",gap:"8px",marginTop:"4px"}}>
            <div style={{flex:1,display:"flex",alignItems:"center",justifyContent:"space-between",padding:"10px 12px",border:`1.5px dashed rgba(255,215,0,0.2)`,borderRadius:"10px",cursor:"pointer"}} onClick={()=>setShowMealForm(true)}>
              <div style={{fontSize:"13px",color:C.muted}}>Ajouter un aliment</div>
              <div style={{color:C.muted,fontSize:"20px",fontWeight:"300"}}>+</div>
            </div>
            <button style={{padding:"10px 14px",border:`1px solid ${C.border}`,borderRadius:"10px",background:"rgba(255,255,255,0.03)",color:"#aaa",fontSize:"11px",fontWeight:"600",cursor:"pointer",fontFamily:"inherit",position:"relative",flexShrink:0}} onClick={()=>setShowSavedFoods(true)}>
              Mes aliments
              {getSavedFoods().length > 0 && <span style={{position:"absolute",top:"-6px",right:"-6px",background:C.gold,color:"#000",borderRadius:"10px",fontSize:"9px",fontWeight:"800",padding:"1px 5px",minWidth:"16px",textAlign:"center"}}>{getSavedFoods().length}</span>}
            </button>
          </div>
        )}
      </div>

      {/* Activité */}
      <div style={css.card}>
        <div style={css.cardTitle}>ACTIVITÉ</div>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"12px 14px",background:"rgba(255,255,255,0.03)",borderRadius:"12px",marginBottom:"8px"}}>
          <div>
            <div style={{fontSize:"13px",fontWeight:"600"}}>Pas effectués</div>
            <div style={{fontSize:"10px",color:C.muted}}>Objectif · 10 000 pas</div>
          </div>
          <input type="number" placeholder="0" value={journal.steps||""} onChange={e=>{const u={...journal,steps:parseInt(e.target.value)||null};save(u);}}
            style={{width:"80px",padding:"6px 10px",borderRadius:"8px",border:`1px solid ${C.border}`,background:"rgba(255,255,255,0.04)",color:C.gold,fontSize:"14px",fontWeight:"700",fontFamily:"inherit",outline:"none",textAlign:"right"}}/>
        </div>

        {journal.session ? (
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"12px 14px",background:"rgba(255,255,255,0.03)",borderRadius:"12px",marginBottom:"8px"}}>
            <div>
              <div style={{fontSize:"13px",fontWeight:"600"}}>{journal.session.type}</div>
              <div style={{fontSize:"10px",color:C.muted}}>{journal.session.duration} min · Dépense incluse dans ton TDEE</div>
            </div>
            <div style={{width:"24px",height:"24px",borderRadius:"50%",border:`1.5px solid ${journal.session.done?C.green:C.border}`,background:journal.session.done?C.green:"transparent",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",color:"#000",fontSize:"11px",fontWeight:"800"}}
              onClick={()=>{const done=!journal.session.done;const u={...journal,session:{...journal.session,done}};save(u);if(done)showToast("Séance marquée comme faite !");}} >
              {journal.session.done?"✓":""}
            </div>
          </div>
        ) : null}

        {showSessionForm ? (
          <div style={formStyle}>
            <div style={{fontSize:"10px",color:C.gold,letterSpacing:"2px",marginBottom:"10px"}}>NOUVELLE SÉANCE</div>
            <input style={formInput} placeholder="Type de séance (ex: Musculation)" value={sessionForm.type} onChange={e=>setSessionForm({...sessionForm,type:e.target.value})}/>
            <input style={formInput} type="number" placeholder="Durée (minutes)" value={sessionForm.duration} onChange={e=>setSessionForm({...sessionForm,duration:e.target.value})}/>
            <div style={{display:"flex",gap:"8px",marginTop:"4px"}}>
              <button style={{...css.btn(C.gold),flex:1,marginBottom:0,padding:"11px"}} onClick={addSession}>Ajouter</button>
              <button style={{...css.btnSec,flex:1,marginBottom:0,padding:"11px"}} onClick={()=>setShowSessionForm(false)}>Annuler</button>
            </div>
          </div>
        ) : (
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"10px 12px",border:`1.5px dashed ${C.border}`,borderRadius:"10px",cursor:"pointer"}} onClick={()=>setShowSessionForm(true)}>
            <div style={{fontSize:"13px",color:C.muted}}>{journal.session?"Modifier la séance":"Ajouter une séance"}</div>
            <div style={{color:C.muted,fontSize:"20px",fontWeight:"300"}}>+</div>
          </div>
        )}
      </div>
    </div>
  );
}

function ViewHistorique({ premium, onShowPaywall }) {
  if (!premium) {
    return (
      <div style={{width:"100%",maxWidth:"420px"}}>
        <div style={{position:"relative"}}>
          <div style={{filter:"blur(5px)",pointerEvents:"none",userSelect:"none"}}>
            <div style={{...css.card,marginBottom:"12px"}}>
              <div style={css.cardTitle}>HISTORIQUE</div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:"4px"}}>
                {[...Array(21)].map((_,i)=>(
                  <div key={i} style={{aspectRatio:"1",borderRadius:"6px",background:i%3===0?"rgba(125,249,170,0.3)":i%5===0?"rgba(255,179,71,0.3)":"rgba(255,255,255,0.05)"}}/>
                ))}
              </div>
            </div>
            <div style={{...css.card}}>
              <div style={css.cardTitle}>ANALYSES</div>
              {[{bf:"14%",date:"30 juin"},{bf:"16%",date:"15 juin"},{bf:"18%",date:"1 juin"}].map((a,i)=>(
                <div key={i} style={{display:"flex",justifyContent:"space-between",padding:"10px 0",borderBottom:i<2?`1px solid ${C.border}`:"none"}}>
                  <span style={{fontSize:"13px",color:"#aaa"}}>{a.date}</span>
                  <span style={{fontSize:"13px",fontWeight:"700",color:"#7DF9AA"}}>{a.bf}</span>
                </div>
              ))}
            </div>
          </div>
          <div style={{position:"absolute",inset:0,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",background:"rgba(10,10,15,0.75)",backdropFilter:"blur(3px)",borderRadius:"20px",padding:"28px 20px",textAlign:"center"}}>
            <div style={{fontSize:"10px",color:C.gold,letterSpacing:"3px",marginBottom:"14px"}}>PHYSIQRATE PRO</div>
            <div style={{fontSize:"20px",fontWeight:"800",marginBottom:"10px"}}>Ton historique complet</div>
            <div style={{fontSize:"13px",color:"#666",marginBottom:"8px"}}>Calendrier de tes analyses</div>
            <div style={{fontSize:"13px",color:"#666",marginBottom:"8px"}}>Historique body fat sur tous tes appareils</div>
            <div style={{fontSize:"13px",color:"#666",marginBottom:"24px"}}>Synchronisation cloud sécurisée</div>
            <button style={{...css.btn(C.gold),width:"auto",padding:"14px 28px",marginBottom:"8px",fontSize:"14px"}} onClick={onShowPaywall}>
              Débloquer Pro — 4,99€/mois
            </button>
            <div style={{fontSize:"11px",color:"#333"}}>Résiliation à tout moment</div>
          </div>
        </div>
      </div>
    );
  }

  const [selectedDay, setSelectedDay] = useState(null);
  const journal = getAllJournal();
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const monthNames = ["Janvier","Février","Mars","Avril","Mai","Juin","Juillet","Août","Septembre","Octobre","Novembre","Décembre"];
  const today = now.toDateString();

  function getDayData(day) {
    const date = new Date(year, month, day).toDateString();
    return journal[date] || null;
  }

  function getDayColor(data) {
    if (!data) return "no-data";
    const totalCals = data.meals?.reduce((s,m)=>s+(m.calories||0),0) || 0;
    const profile = getProfile();
    const w = parseFloat(get(keys.weight) || profile.weight || 0);
    const tdee = calcTDEE(profile.gender, profile.age, profile.height, w, profile.activity, profile.steps);
    const goal = calcGoal(tdee, profile.goal) || tdee;
    if (!goal || totalCals === 0) return "no-data";
    return totalCals <= goal * 1.05 ? "good" : "over";
  }

  const dayStyle = (type, isToday) => {
    const base = { height:"38px", borderRadius:"8px", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", cursor:"pointer", fontSize:"10px" };
    if (isToday) return { ...base, background:"rgba(255,215,0,0.2)", border:"1px solid rgba(255,215,0,0.5)" };
    if (type === "good") return { ...base, background:"rgba(125,249,170,0.1)", border:"1px solid rgba(125,249,170,0.2)" };
    if (type === "over") return { ...base, background:"rgba(255,107,107,0.1)", border:"1px solid rgba(255,107,107,0.2)" };
    return { ...base, background:"rgba(255,255,255,0.03)" };
  };

  return (
    <div style={{width:"100%",maxWidth:"420px"}}>
      {selectedDay && (() => {
        const date = new Date(year, month, selectedDay);
        const dateStr = date.toDateString();
        const data = journal[dateStr] || {};
        const totalCals = data.meals?.reduce((s,m)=>s+(m.calories||0),0) || 0;
        const macros = data.meals?.reduce((acc,m)=>({protein:acc.protein+(m.protein||0),carbs:acc.carbs+(m.carbs||0),fat:acc.fat+(m.fat||0)}),{protein:0,carbs:0,fat:0}) || {};
        return (
          <div style={{background:`linear-gradient(135deg,rgba(255,215,0,0.06),transparent)`,border:`1px solid rgba(255,215,0,0.15)`,borderRadius:"16px",padding:"16px",marginBottom:"12px"}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:"14px"}}>
              <div style={{fontSize:"14px",fontWeight:"700",color:C.gold}}>{date.toLocaleDateString("fr-FR",{weekday:"long",day:"numeric",month:"long"})}</div>
              <button style={{background:"transparent",border:"none",color:C.muted,fontSize:"20px",cursor:"pointer"}} onClick={()=>setSelectedDay(null)}>×</button>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:"8px",marginBottom:"14px"}}>
              {[{val:totalCals||"—",label:"KCAL"},{val:data.steps||"—",label:"PAS"},{val:data.session?.done?"Faite":"Non",label:"SÉANCE",color:data.session?.done?C.green:C.muted}].map((s,i)=>(
                <div key={i} style={{background:"rgba(255,255,255,0.04)",borderRadius:"10px",padding:"10px",textAlign:"center"}}>
                  <div style={{fontSize:"16px",fontWeight:"800",color:s.color||C.text}}>{s.val}</div>
                  <div style={{fontSize:"9px",color:C.muted,marginTop:"2px"}}>{s.label}</div>
                </div>
              ))}
            </div>
            {data.meals?.length > 0 && (
              <>
                <div style={{fontSize:"10px",color:C.muted,letterSpacing:"1px",marginBottom:"8px"}}>REPAS</div>
                {data.meals.map((m,i)=>(
                  <div key={i} style={{display:"flex",justifyContent:"space-between",padding:"7px 0",borderBottom:`1px solid rgba(255,255,255,0.04)`,fontSize:"12px"}}>
                    <span style={{color:"#bbb"}}>{m.name}</span>
                    <span style={{color:C.gold,fontWeight:"600"}}>{m.calories} kcal</span>
                  </div>
                ))}
              </>
            )}
            {(macros.protein > 0 || macros.carbs > 0) && (
              <>
                <div style={{fontSize:"10px",color:C.muted,letterSpacing:"1px",margin:"12px 0 8px"}}>MACROS</div>
                <div style={{display:"flex",gap:"8px"}}>
                  {[{val:`${macros.protein}g`,label:"Protéines",color:"#7DF9FF"},{val:`${macros.carbs}g`,label:"Glucides",color:"#FFB347"},{val:`${macros.fat}g`,label:"Lipides",color:"#FF8C69"}].map((m,i)=>(
                    <div key={i} style={{flex:1,background:"rgba(255,255,255,0.03)",borderRadius:"8px",padding:"8px",textAlign:"center"}}>
                      <div style={{fontSize:"13px",fontWeight:"700",color:m.color}}>{m.val}</div>
                      <div style={{fontSize:"9px",color:C.muted,marginTop:"2px"}}>{m.label}</div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        );
      })()}

      <div style={css.card}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:"12px"}}>
          <div style={{fontSize:"14px",fontWeight:"700"}}>{monthNames[month]} {year}</div>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:"3px"}}>
          {["L","M","M","J","V","S","D"].map((d,i)=>(
            <div key={i} style={{fontSize:"9px",color:"#444",textAlign:"center",padding:"3px 0"}}>{d}</div>
          ))}
          {Array.from({length:(firstDay===0?6:firstDay-1)}).map((_,i)=>(
            <div key={`e${i}`}/>
          ))}
          {Array.from({length:daysInMonth}).map((_,i)=>{
            const day = i+1;
            const isToday = new Date(year,month,day).toDateString()===today;
            const data = getDayData(day);
            const colorType = getDayColor(data);
            const totalCals = data?.meals?.reduce((s,m)=>s+(m.calories||0),0)||0;
            return (
              <div key={day} style={dayStyle(colorType,isToday)} onClick={()=>setSelectedDay(day)}>
                <div style={{fontSize:"11px",fontWeight:"600",color:isToday?C.gold:C.text}}>{day}</div>
                {totalCals > 0 && <div style={{fontSize:"8px",color:colorType==="good"?C.green:colorType==="over"?C.red:C.muted}}>{totalCals}</div>}
              </div>
            );
          })}
        </div>
        <div style={{display:"flex",gap:"14px",marginTop:"10px"}}>
          {[{color:"rgba(125,249,170,0.4)",label:"Dans l'objectif"},{color:"rgba(255,107,107,0.4)",label:"Au-dessus"},{color:"rgba(255,215,0,0.4)",label:"Aujourd'hui"}].map((l,i)=>(
            <div key={i} style={{display:"flex",alignItems:"center",gap:"5px"}}>
              <div style={{width:"10px",height:"10px",borderRadius:"3px",background:l.color}}/>
              <span style={{fontSize:"10px",color:C.muted}}>{l.label}</span>
            </div>
          ))}
        </div>
        <p style={{fontSize:"11px",color:"#333",marginTop:"8px",textAlign:"center"}}>Clique sur un jour pour voir le détail</p>
      </div>
    </div>
  );
}

function ViewProgression({ premium, onShowPaywall }) {
  const history = getHistory();
  const [selected, setSelected] = useState([]);
  const [showCompare, setShowCompare] = useState(false);

  // Toute la progression est Pro
  if (!premium) {
    return (
      <div style={{width:"100%",maxWidth:"420px"}}>
        <div style={{position:"relative"}}>
          {/* Teaser flouté */}
          <div style={{filter:"blur(5px)",pointerEvents:"none",userSelect:"none"}}>
            <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:"8px",marginBottom:"12px"}}>
              {[{val:"14%",label:"ACTUEL",color:"#7DF9AA"},{val:"−3%",label:"ÉVOLUTION",color:"#7DF9AA"},{val:"8",label:"ANALYSES"}].map((s,i)=>(
                <div key={i} style={{background:"rgba(255,255,255,0.03)",borderRadius:"12px",padding:"12px",textAlign:"center"}}>
                  <div style={{fontSize:"22px",fontWeight:"800",color:s.color||C.text}}>{s.val}</div>
                  <div style={{fontSize:"9px",color:C.muted,marginTop:"3px"}}>{s.label}</div>
                </div>
              ))}
            </div>
            <div style={{...css.card,marginBottom:"12px"}}>
              <div style={css.cardTitle}>HISTORIQUE PHOTOS</div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:"8px"}}>
                {["#7DF9AA","#7DF9FF","#FFB347","#FFB347","#FF8C69","#FF6B6B"].map((color,i)=>(
                  <div key={i} style={{aspectRatio:"3/4",background:"rgba(255,255,255,0.05)",borderRadius:"10px",display:"flex",flexDirection:"column",justifyContent:"flex-end",padding:"6px 8px"}}>
                    <div style={{fontSize:"14px",fontWeight:"800",color}}>{["14%","15%","17%","18%","19%","21%"][i]}</div>
                    <div style={{fontSize:"9px",color:"#aaa"}}>{["30 juin","15 juin","1 juin","15 mai","1 mai","1 avr."][i]}</div>
                  </div>
                ))}
              </div>
            </div>
            <div style={{...css.card}}>
              <div style={css.cardTitle}>COURBE BODY FAT</div>
              <svg width="100%" viewBox="0 0 340 80">
                <path d="M20 65 L70 58 L120 50 L170 44 L220 38 L270 34 L320 28 L320 75 L20 75 Z" fill="rgba(125,249,170,0.1)"/>
                <path d="M20 65 L70 58 L120 50 L170 44 L220 38 L270 34 L320 28" fill="none" stroke="#7DF9AA" strokeWidth="2.5" strokeLinecap="round"/>
              </svg>
            </div>
          </div>

          {/* Overlay Pro */}
          <div style={{position:"absolute",inset:0,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",background:"rgba(10,10,15,0.75)",backdropFilter:"blur(3px)",borderRadius:"20px",padding:"28px 20px",textAlign:"center"}}>
            <div style={{fontSize:"10px",color:C.gold,letterSpacing:"3px",marginBottom:"14px"}}>PHYSIQRATE PRO</div>
            <div style={{fontSize:"20px",fontWeight:"800",marginBottom:"10px",lineHeight:"1.3"}}>Suis ta transformation</div>
            <div style={{fontSize:"13px",color:"#666",marginBottom:"8px",lineHeight:"1.6"}}>Historique de tes photos</div>
            <div style={{fontSize:"13px",color:"#666",marginBottom:"8px",lineHeight:"1.6"}}>Courbe de progression body fat</div>
            <div style={{fontSize:"13px",color:"#666",marginBottom:"24px",lineHeight:"1.6"}}>Comparatif IA entre deux dates</div>
            <button style={{...css.btn(C.gold),width:"auto",padding:"14px 28px",marginBottom:"8px",fontSize:"14px"}} onClick={onShowPaywall}>
              Débloquer Pro — 4,99€/mois
            </button>
            <div style={{fontSize:"11px",color:"#333"}}>Résiliation à tout moment</div>
          </div>
        </div>
      </div>
    );
  }

  function togglePhoto(i) {
    if (selected.includes(i)) { setSelected(selected.filter(s=>s!==i)); return; }
    if (selected.length >= 2) { setSelected([selected[1], i]); return; }
    setSelected([...selected, i]);
  }

  const stats = history.length > 0 ? {
    current: history[0].bodyfat,
    diff: history.length > 1 ? history[0].bodyfat - history[history.length-1].bodyfat : null,
    count: history.length,
  } : null;

  // Milestone detection
  const milestone = (() => {
    if (!stats || stats.diff === null) return null;
    const diff = stats.diff;
    if (diff <= -5) return { text:`Incroyable — tu as perdu ${Math.abs(diff)}% de body fat. C'est une transformation majeure.`, color:C.green };
    if (diff <= -3) return { text:`Excellente progression — ${Math.abs(diff)}% de body fat en moins. Tu es sur la bonne voie.`, color:C.green };
    if (diff <= -1) return { text:`Bonne progression — ${Math.abs(diff)}% de body fat perdu. Continue ta consistance.`, color:"#7DF9FF" };
    if (diff >= 3 && history[0].bodyfat <= 18) return { text:`Prise de muscle détectée — +${diff}% sur un physique déjà sec. Probablement de la masse musculaire.`, color:C.gold };
    if (diff >= 3) return { text:`+${diff}% de body fat depuis le début. Il est temps d'ajuster ton alimentation.`, color:"#FFB347" };
    return null;
  })();

  return (
    <div style={{width:"100%",maxWidth:"420px"}}>
      {stats && (
        <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:"8px",marginBottom:"12px"}}>
          {[
            {val:`${stats.current}%`,label:"ACTUEL",color:getArchetype(stats.current,getProfile().gender||"male").color},
            {val:stats.diff!==null?`${stats.diff>0?"+":""}${stats.diff}%`:"—",label:"ÉVOLUTION",color:stats.diff<0?C.green:stats.diff>0?C.red:C.text},
            {val:stats.count,label:"ANALYSES"},
          ].map((s,i)=>(
            <div key={i} style={{background:"rgba(255,255,255,0.03)",borderRadius:"12px",padding:"12px",textAlign:"center"}}>
              <div style={{fontSize:"22px",fontWeight:"800",color:s.color||C.text}}>{s.val}</div>
              <div style={{fontSize:"9px",color:C.muted,marginTop:"3px",letterSpacing:"1px"}}>{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Milestone */}
      {milestone && (
        <div style={{...css.card,background:`linear-gradient(135deg,${milestone.color}08,transparent)`,borderColor:`${milestone.color}22`,marginBottom:"12px"}}>
          <div style={{fontSize:"10px",color:milestone.color,letterSpacing:"2px",marginBottom:"8px"}}>MILESTONE</div>
          <div style={{fontSize:"13px",color:"#ccc",lineHeight:"1.6"}}>{milestone.text}</div>
        </div>
      )}

      {/* Photos */}
      <div style={css.card}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:"14px"}}>
          <div style={css.cardTitle}>HISTORIQUE PHOTOS</div>
          {!premium && <div style={{fontSize:"10px",color:C.gold,background:"rgba(255,215,0,0.1)",border:`1px solid rgba(255,215,0,0.25)`,padding:"3px 10px",borderRadius:"20px",fontWeight:"600"}}>Comparatif — Pro</div>}
        </div>
        {history.length === 0 ? (
          <div style={{textAlign:"center",padding:"20px",color:C.muted,fontSize:"12px"}}>Aucune analyse encore. Lance ta première analyse photo.</div>
        ) : (
          <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:"8px",marginBottom:"10px"}}>
            {history.slice(0,9).map((h,i)=>{
              const arch = getArchetype(h.bodyfat, h.gender||"male");
              const date = new Date(h.date).toLocaleDateString("fr-FR",{day:"numeric",month:"short"});
              const isSel = selected.includes(i);
              return (
                <div key={i} onClick={()=>togglePhoto(i)} style={{position:"relative",borderRadius:"10px",overflow:"hidden",cursor:"pointer",aspectRatio:"3/4",background:"rgba(255,255,255,0.03)",border:`${isSel?"2px":"1px"} solid ${isSel?C.gold:C.border}`,display:"flex",flexDirection:"column",justifyContent:"flex-end"}}>
                  {isSel && <div style={{position:"absolute",top:"6px",right:"6px",width:"18px",height:"18px",borderRadius:"50%",background:C.gold,display:"flex",alignItems:"center",justifyContent:"center",fontSize:"9px",color:"#000",fontWeight:"800"}}>✓</div>}
                  <div style={{padding:"6px 8px",background:"linear-gradient(transparent,rgba(0,0,0,0.7))"}}>
                    <div style={{fontSize:"14px",fontWeight:"800",color:arch.color}}>{h.bodyfat}%</div>
                    <div style={{fontSize:"9px",color:"#aaa"}}>{date}</div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Teaser comparatif pour non-abonnés */}
        {!premium && history.length >= 2 && (
          <div style={{position:"relative",marginBottom:"10px",borderRadius:"12px",overflow:"hidden",cursor:"pointer"}} onClick={onShowPaywall}>
            <div style={{filter:"blur(4px)",pointerEvents:"none",background:"rgba(125,249,170,0.05)",border:`1px solid rgba(125,249,170,0.15)`,borderRadius:"12px",padding:"14px"}}>
              <div style={{fontSize:"13px",fontWeight:"700",color:C.green,marginBottom:"4px"}}>Comparatif IA disponible</div>
              <div style={{fontSize:"11px",color:C.muted}}>Sélectionne 2 photos pour voir l'évolution de ton physique analysée par l'IA</div>
            </div>
            <div style={{position:"absolute",inset:0,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",background:"rgba(10,10,15,0.7)",backdropFilter:"blur(2px)",borderRadius:"12px"}}>
              <div style={{fontSize:"10px",color:C.gold,letterSpacing:"2px",marginBottom:"6px"}}>PRO</div>
              <div style={{fontSize:"13px",fontWeight:"700",color:"white",marginBottom:"4px"}}>Comparatif IA</div>
              <div style={{fontSize:"11px",color:C.muted}}>Débloquer pour 4,99€/mois</div>
            </div>
          </div>
        )}

        {premium && selected.length === 2 && (
          <button style={css.btn(C.gold)} onClick={()=>setShowCompare(true)}>
            Comparer les 2 photos sélectionnées
          </button>
        )}
      </div>

      {/* Compare result */}
      {showCompare && selected.length === 2 && (() => {
        const a = history[selected[0]], b = history[selected[1]];
        const diff = a.bodyfat - b.bodyfat;
        const improved = diff < 0;
        return (
          <div style={{...css.card,background:`rgba(125,249,170,0.05)`,borderColor:`rgba(125,249,170,0.2)`}}>
            <div style={{...css.cardTitle,color:C.green}}>COMPARATIF IA</div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"10px",marginBottom:"12px"}}>
              {[b,a].map((h,i)=>(
                <div key={i} style={{textAlign:"center"}}>
                  <div style={{height:"80px",background:"rgba(255,255,255,0.04)",borderRadius:"10px",display:"flex",alignItems:"center",justifyContent:"center",marginBottom:"6px",border:`1px solid ${getArchetype(h.bodyfat,h.gender||"male").color}22`}}>
                    <span style={{fontSize:"20px",fontWeight:"800",color:getArchetype(h.bodyfat,h.gender||"male").color}}>{h.bodyfat}%</span>
                  </div>
                  <p style={{fontSize:"10px",color:C.muted}}>{new Date(h.date).toLocaleDateString("fr-FR",{day:"numeric",month:"short"})}</p>
                </div>
              ))}
            </div>
            <div style={{background:`rgba(125,249,170,0.08)`,borderRadius:"12px",padding:"12px",textAlign:"center"}}>
              <div style={{fontSize:"14px",fontWeight:"800",color:improved?C.green:C.red,marginBottom:"4px"}}>
                {improved?"Perte de graisse confirmée":"Prise de masse détectée"}
              </div>
              <div style={{fontSize:"11px",color:C.sub,lineHeight:"1.5"}}>
                {Math.abs(diff)}% de body fat {improved?"en moins":"en plus"} entre ces deux analyses.
                {improved?" Définition musculaire améliorée.":" Continue ton travail."}
              </div>
            </div>
          </div>
        );
      })()}

      {/* Courbe */}
      {history.length >= 2 && (
        <div style={css.card}>
          <div style={css.cardTitle}>COURBE BODY FAT</div>
          <svg width="100%" viewBox="0 0 340 100" style={{overflow:"visible"}}>
            <defs>
              <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={C.green} stopOpacity="0.25"/>
                <stop offset="100%" stopColor={C.green} stopOpacity="0"/>
              </linearGradient>
            </defs>
            {(() => {
              const data = [...history].reverse().slice(-8);
              const vals = data.map(h=>h.bodyfat);
              const min = Math.max(0,Math.min(...vals)-3), max = Math.min(50,Math.max(...vals)+3);
              const pts = data.map((h,i)=>({
                x: data.length===1?170:(i/(data.length-1))*(340-40)+20,
                y: 90-((h.bodyfat-min)/(max-min))*(80),
                bf: h.bodyfat,
              }));
              const path = pts.map((p,i)=>`${i===0?"M":"L"}${p.x} ${p.y}`).join(" ");
              return (
                <>
                  <path d={`${path} L${pts[pts.length-1].x} 90 L${pts[0].x} 90 Z`} fill="url(#chartGrad)"/>
                  <path d={path} fill="none" stroke={C.green} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                  {pts.map((p,i)=>(
                    <g key={i}>
                      <circle cx={p.x} cy={p.y} r="4" fill={C.green}/>
                      <text x={p.x} y={p.y-10} textAnchor="middle" fill="white" fontSize="9" fontFamily="Arial">{p.bf}%</text>
                    </g>
                  ))}
                </>
              );
            })()}
          </svg>
        </div>
      )}
    </div>
  );
}

function ViewProfil({ user, premium, onShowAuth, setPremiumState }) {
  const [profile, setProfile] = useState(getProfile());
  const completion = getProfileCompletion(profile);
  const w = parseFloat(get(keys.weight) || profile.weight || 0);
  const tdee = calcTDEE(profile.gender, profile.age, profile.height, w, profile.activity, profile.steps);
  const goalCals = calcGoal(tdee, profile.goal);

  function update(key, val) {
    const updated = { ...profile, [key]: val };
    setProfile(updated);
    saveProfile(updated);
  }

  return (
    <div style={{width:"100%",maxWidth:"420px"}}>
      <div style={css.card}>
        <div style={css.cardTitle}>COMPLÉTION DU PROFIL</div>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"8px"}}>
          <span style={{fontSize:"13px",fontWeight:"700"}}>Profil</span>
          <span style={{fontSize:"20px",fontWeight:"800",color:completion===100?C.green:C.gold}}>{completion}%</span>
        </div>
        <div style={{height:"5px",background:"rgba(255,255,255,0.06)",borderRadius:"3px",overflow:"hidden",marginBottom:"6px"}}>
          <div style={{height:"100%",width:`${completion}%`,background:`linear-gradient(90deg,${C.gold},#FFA500)`,borderRadius:"3px",transition:"width 0.4s"}}/>
        </div>
        <div style={{fontSize:"11px",color:"#444",marginBottom:"6px"}}>Plus ton profil est complet, plus l'analyse est précise</div>

        <span style={css.label}>Genre</span>
        <div style={{display:"flex",gap:"8px",marginTop:"8px"}}>
          <button style={{...css.optBtn(profile.gender==="male"),flex:1,textAlign:"center"}} onClick={()=>update("gender","male")}>Homme</button>
          <button style={{...css.optBtn(profile.gender==="female"),flex:1,textAlign:"center"}} onClick={()=>update("gender","female")}>Femme</button>
        </div>

        <span style={css.label}>Âge</span>
        <input style={css.input} type="number" placeholder="Ex : 24" value={profile.age||""} onChange={e=>update("age",e.target.value)}/>

        <span style={css.label}>Taille (cm)</span>
        <input style={css.input} type="number" placeholder="Ex : 178" value={profile.height||""} onChange={e=>update("height",e.target.value)}/>

        <span style={css.label}>Poids de référence (kg)</span>
        <input style={css.input} type="number" placeholder="Ex : 75" value={profile.weight||""} onChange={e=>update("weight",e.target.value)}/>
        <div style={{fontSize:"11px",color:"#444",marginTop:"4px"}}>Mis à jour automatiquement à chaque analyse</div>

        <span style={css.label}>Niveau d'activité</span>
        <div style={{display:"flex",flexDirection:"column",gap:"6px",marginTop:"8px"}}>
          {ACTIVITY_LEVELS.map(l=>(
            <button key={l.key} style={css.optBtn(profile.activity===l.key)} onClick={()=>update("activity",l.key)}>{l.label}</button>
          ))}
        </div>

        <span style={css.label}>Pas moyens par jour</span>
        <div style={{display:"flex",flexDirection:"column",gap:"6px",marginTop:"8px"}}>
          {DAILY_STEPS.map(s=>(
            <button key={s.key} style={css.optBtn(profile.steps===s.key)} onClick={()=>update("steps",s.key)}>{s.label}</button>
          ))}
        </div>

        <span style={css.label}>Type d'entraînement</span>
        <div style={{display:"flex",gap:"6px",flexWrap:"wrap",marginTop:"8px"}}>
          {[["strength","Muscu"],["cardio","Cardio"],["mixed","Mixte"],["sport","Sport"]].map(([val,label])=>(
            <button key={val} style={css.optBtn(profile.trainingType===val)} onClick={()=>update("trainingType",val)}>{label}</button>
          ))}
        </div>

        <span style={css.label}>Objectif</span>
        <div style={{display:"flex",flexDirection:"column",gap:"6px",marginTop:"8px"}}>
          {GOALS.map(g=>(
            <button key={g.key} style={css.optBtn(profile.goal===g.key)} onClick={()=>update("goal",g.key)}>{g.label}</button>
          ))}
        </div>
      </div>

      {tdee && (
        <div style={{background:`linear-gradient(135deg,rgba(255,215,0,0.08),rgba(255,215,0,0.02))`,border:`1px solid rgba(255,215,0,0.2)`,borderRadius:"16px",padding:"16px",marginBottom:"12px"}}>
          <div style={css.cardTitle}>TDEE — FORMULE MIFFLIN-ST JEOR</div>
          <div style={{fontSize:"11px",color:"#444",marginBottom:"14px"}}>
            {profile.gender==="male"?"Homme":"Femme"} · {profile.age} ans · {profile.height} cm · {w} kg · {ACTIVITY_LEVELS.find(l=>l.key===profile.activity)?.label?.split("—")[0].trim()}
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"10px",marginBottom:"14px"}}>
            <div style={{background:"rgba(255,255,255,0.04)",borderRadius:"12px",padding:"14px",textAlign:"center"}}>
              <div style={{fontSize:"20px",fontWeight:"800",color:C.gold}}>{tdee.toLocaleString()}</div>
              <div style={{fontSize:"9px",color:C.muted,marginTop:"3px"}}>Maintien (kcal/jour)</div>
            </div>
            {goalCals && (
              <div style={{background:"rgba(125,249,170,0.06)",border:`1px solid rgba(125,249,170,0.15)`,borderRadius:"12px",padding:"14px",textAlign:"center"}}>
                <div style={{fontSize:"20px",fontWeight:"800",color:C.green}}>{goalCals.toLocaleString()}</div>
                <div style={{fontSize:"9px",color:C.muted,marginTop:"3px"}}>Objectif (kcal/jour)</div>
              </div>
            )}
          </div>
          <div style={{background:"rgba(255,255,255,0.03)",borderRadius:"10px",padding:"12px"}}>
            <div style={{fontSize:"10px",color:C.muted,letterSpacing:"1px",marginBottom:"8px"}}>DÉTAIL DU CALCUL</div>
            {[
              {label:"Métabolisme de base (TMB)", val:`${Math.round(profile.gender==="male"?(10*w)+(6.25*parseFloat(profile.height))-(5*parseFloat(profile.age))+5:(10*w)+(6.25*parseFloat(profile.height))-(5*parseFloat(profile.age))-161)} kcal`},
              {label:"Multiplicateur activité", val:`×${ACTIVITY_LEVELS.find(l=>l.key===profile.activity)?.factor}`},
              ...(profile.steps ? [{label:"Bonus pas quotidiens", val:`+${Math.round(0.045 * w * (DAILY_STEPS.find(s=>s.key===profile.steps)?.steps||0) / 1000)} kcal`}] : []),
            ].map((row,i)=>(
              <div key={i} style={{display:"flex",justifyContent:"space-between",fontSize:"11px",marginBottom:"5px"}}>
                <span style={{color:"#666"}}>{row.label}</span>
                <span style={{color:"#aaa"}}>{row.val}</span>
              </div>
            ))}
            <div style={{display:"flex",justifyContent:"space-between",fontSize:"11px",borderTop:`1px solid ${C.border}`,paddingTop:"6px",marginTop:"4px"}}>
              <span style={{color:C.gold,fontWeight:"700"}}>TDEE</span>
              <span style={{color:C.gold,fontWeight:"700"}}>{tdee.toLocaleString()} kcal</span>
            </div>
          </div>
          <div style={{fontSize:"10px",color:"#444",marginTop:"10px",textAlign:"center"}}>Formule Mifflin-St Jeor · Référence clinique internationale</div>

          {/* Objectifs macros avec édition manuelle */}
          {goalCals && profile.weight && (() => {
            const targets = calcTargetMacros(goalCals, profile.goal, profile.weight);
            if (!targets) return null;
            const custom = getCustomMacros();
            const display = custom || targets;
            const isCustom = !!custom;
            return (
              <div style={{marginTop:"14px",background:"rgba(255,255,255,0.03)",borderRadius:"12px",padding:"12px"}}>
                <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:"10px"}}>
                  <div style={{fontSize:"10px",color:C.muted,letterSpacing:"1px"}}>OBJECTIFS MACROS JOURNALIERS</div>
                  <div style={{display:"flex",gap:"6px",alignItems:"center"}}>
                    {isCustom && (
                      <button onClick={()=>{saveCustomMacros(null);setProfile({...profile});}}
                        style={{fontSize:"9px",color:C.muted,background:"transparent",border:`1px solid ${C.border}`,borderRadius:"6px",padding:"2px 8px",cursor:"pointer",fontFamily:"inherit"}}>
                        Réinitialiser
                      </button>
                    )}
                    {isCustom && <div style={{fontSize:"9px",color:C.gold,background:"rgba(255,215,0,0.1)",padding:"2px 8px",borderRadius:"6px"}}>Modifié</div>}
                  </div>
                </div>

                <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:"8px",marginBottom:"8px"}}>
                  {[
                    {key:"protein",label:"Protéines",val:display.protein,color:"#7DF9FF",base:isCustom?"Personnalisé":`${GOALS.find(g=>g.key===profile.goal)?.protein_per_kg}g/kg`},
                    {key:"carbs",  label:"Glucides", val:display.carbs,  color:"#FFB347",base:isCustom?"Personnalisé":"Reste des cals"},
                    {key:"fat",    label:"Lipides",  val:display.fat,    color:"#FF8C69",base:isCustom?"Personnalisé":`${GOALS.find(g=>g.key===profile.goal)?.fat_per_kg}g/kg`},
                  ].map((m,i)=>(
                    <div key={i} style={{background:"rgba(255,255,255,0.04)",borderRadius:"10px",padding:"10px",textAlign:"center"}}>
                      <div style={{fontSize:"18px",fontWeight:"800",color:m.color}}>{m.val}g</div>
                      <div style={{fontSize:"9px",color:C.muted,marginTop:"2px"}}>{m.label}</div>
                      <div style={{fontSize:"8px",color:"#333",marginTop:"2px"}}>{m.base}</div>
                    </div>
                  ))}
                </div>

                {/* Calories totales custom */}
                <div style={{display:"flex",justifyContent:"space-between",fontSize:"11px",padding:"8px 0",borderTop:`1px solid ${C.border}`,marginBottom:"10px"}}>
                  <span style={{color:C.muted}}>Total calculé</span>
                  <span style={{color:C.gold,fontWeight:"700"}}>{display.protein*4 + display.carbs*4 + display.fat*9} kcal</span>
                </div>

                {/* Formulaire édition manuelle — avec état local pour saisie libre */}
                <MacroEditor targets={targets} custom={custom} onSave={(updated)=>{ saveCustomMacros(updated); setProfile({...profile}); }} />
              </div>
            );
          })()}
        </div>
      )}
    {/* Section compte utilisateur */}
    <div style={{...css.card,marginTop:"4px"}}>
      <div style={css.cardTitle}>MON COMPTE</div>
      {user ? (
        <>
          <div style={{display:"flex",alignItems:"center",gap:"10px",marginBottom:"14px"}}>
            <div style={{width:"36px",height:"36px",borderRadius:"50%",background:"rgba(255,215,0,0.15)",border:`1px solid rgba(255,215,0,0.3)`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:"14px",fontWeight:"700",color:C.gold,flexShrink:0}}>
              {user.email[0].toUpperCase()}
            </div>
            <div>
              <div style={{fontSize:"13px",fontWeight:"600"}}>{user.email}</div>
              <div style={{fontSize:"11px",color:premium?C.green:C.muted}}>{premium?"Abonné Pro":"Gratuit"}</div>
            </div>
          </div>
          <button onClick={()=>{
            localStorage.removeItem("pq_token");
            localStorage.removeItem("pq_email");
            localStorage.removeItem("pq_premium");
            localStorage.removeItem("pq_stripe_session");
            window.location.reload();
          }} style={{...css.btnSec,marginBottom:0,fontSize:"12px",color:"#444"}}>
            Se déconnecter
          </button>
        </>
      ) : (
        <>
          <div style={{fontSize:"12px",color:"#555",marginBottom:"14px",lineHeight:"1.5"}}>
            Crée un compte pour que ton abonnement Pro soit lié à ton email et accessible sur tous tes appareils.
          </div>
          <button style={css.btn(C.gold)} onClick={onShowAuth}>
            Créer un compte / Se connecter
          </button>
        </>
      )}
    </div>

    {/* Section abonnement Pro */}
    {isPremium() && (
      <div style={{...css.card,marginTop:"4px"}}>
        <div style={css.cardTitle}>MON ABONNEMENT</div>
        <div style={{display:"flex",alignItems:"center",gap:"10px",marginBottom:"14px"}}>
          <div style={{width:"8px",height:"8px",borderRadius:"50%",background:C.green}}/>
          <span style={{fontSize:"13px",fontWeight:"600",color:C.green}}>Physiqrate Pro — Actif</span>
        </div>
        <div style={{fontSize:"12px",color:"#555",marginBottom:"14px",lineHeight:"1.5"}}>
          Analyses illimitées · Scans nutrition illimités · Historique complet
        </div>
        <a
          href="https://billing.stripe.com/p/login/dRm5kFdx61v70SadROaEE00"
          target="_blank"
          rel="noopener noreferrer"
          style={{...css.btnSec,marginBottom:"4px",display:"block",textDecoration:"none",textAlign:"center"}}>
          Gérer mon abonnement
        </a>
        <div style={{fontSize:"11px",color:"#333",textAlign:"center"}}>
          Modifier ta carte · Annuler à tout moment
        </div>
      </div>
    )}

    {/* Section installation PWA */}
    <div style={{...css.card, marginTop:"4px"}}>
      <div style={css.cardTitle}>INSTALLER L'APPLICATION</div>
      {(() => {
        const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
        const isStandalone = window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone;
        if (isStandalone) return (
          <div style={{display:"flex",alignItems:"center",gap:"10px",padding:"10px 0"}}>
            <div style={{width:"8px",height:"8px",borderRadius:"50%",background:C.green}}/>
            <span style={{fontSize:"13px",color:C.green,fontWeight:"600"}}>Application installée</span>
          </div>
        );
        return (
          <>
            <div style={{fontSize:"12px",color:"#666",marginBottom:"14px",lineHeight:"1.5"}}>
              Installe Physiqrate sur ton écran d'accueil pour un accès rapide, sans passer par le navigateur.
            </div>
            {isIOS ? (
              <div style={{background:"rgba(255,215,0,0.06)",border:`1px solid rgba(255,215,0,0.15)`,borderRadius:"12px",padding:"14px"}}>
                <div style={{fontSize:"10px",color:C.gold,letterSpacing:"2px",marginBottom:"10px"}}>SUR IPHONE / IPAD</div>

                {/* Bouton ouvrir dans Safari */}
                <a href="x-safari-https://physiqrate.com"
                  style={{display:"flex",alignItems:"center",justifyContent:"center",gap:"8px",width:"100%",padding:"11px",borderRadius:"10px",background:"linear-gradient(135deg,#FFD700,#FFA500)",color:"#000",fontSize:"13px",fontWeight:"700",textDecoration:"none",marginBottom:"14px",boxSizing:"border-box"}}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/></svg>
                  Ouvrir dans Safari
                </a>

                <div style={{fontSize:"10px",color:"#444",textAlign:"center",marginBottom:"12px"}}>puis suis ces étapes :</div>

                {[
                  "Appuie sur le bouton Partager en bas de Safari",
                  `Sélectionne "Sur l'écran d'accueil"`,
                  'Appuie sur "Ajouter"'
                ].map((step, i) => (
                  <div key={i} style={{display:"flex",alignItems:"flex-start",gap:"10px",marginBottom:"8px"}}>
                    <div style={{width:"20px",height:"20px",borderRadius:"50%",background:"rgba(255,215,0,0.15)",border:`1px solid rgba(255,215,0,0.3)`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:"10px",color:C.gold,fontWeight:"800",flexShrink:0}}>{i+1}</div>
                    <span style={{fontSize:"12px",color:"#aaa",lineHeight:"1.5",paddingTop:"2px"}}>{step}</span>
                  </div>
                ))}
              </div>
            ) : (
              <button
                onClick={()=>{ if(window._pwaInstallPrompt){ window._pwaInstallPrompt.prompt(); } else { alert("Ouvre le menu de ton navigateur et sélectionne 'Ajouter à l\'écran d\'accueil'"); } }}
                style={css.btn(C.gold)}>
                Installer Physiqrate
              </button>
            )}
          </>
        );
      })()}
    </div>
    </div>
  );
}

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
export default function App() {
  const [view, setView] = useState("analyser");
  const [premium, setPremiumState] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("success") === "true") {
      const sessionId = params.get("session_id");
      if (sessionId) localStorage.setItem("pq_stripe_session", sessionId);
      localStorage.setItem("pq_premium", "true");
      return true;
    }
    return isPremium();
  });
  const [showPaywall, setShowPaywall] = useState(false);
  const [syncVersion, setSyncVersion] = useState(0);
  const [showPWA, setShowPWA] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [showPostPayment, setShowPostPayment] = useState(false);
  const [postPaymentEmail, setPostPaymentEmail] = useState(null);
  const [user, setUser] = useState(() => {
    const email = localStorage.getItem("pq_email");
    return email ? { email } : null;
  });

  useEffect(() => {
    // Capture install prompt on Android
    window.addEventListener("beforeinstallprompt", (e) => {
      e.preventDefault();
      window._pwaInstallPrompt = e;
      setShowPWA(true);
    });
    // Show banner after 30s on iOS
    const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
    const isStandalone = window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone;
    const dismissed = localStorage.getItem("pq_pwa_dismissed");
    if (isIOS && !isStandalone && !dismissed) {
      setTimeout(() => setShowPWA(true), 30000);
    }

    // Handle Stripe success redirect
    const params = new URLSearchParams(window.location.search);
    if (params.get("success") === "true") {
      const sessionId = params.get("session_id");
      if (sessionId) localStorage.setItem("pq_stripe_session", sessionId);
      // Active le Pro immédiatement
      set(keys.premium, true);
      // Nettoie l'URL sans recharger
      window.history.replaceState({}, "", window.location.pathname);
      // Force re-render propre
      setPremiumState(true);

      // Affiche modal création de compte si pas connecté
      const token = localStorage.getItem("pq_token");
      if (!token && sessionId) {
        setTimeout(() => {
          fetch("/api/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ sessionId })
          }).then(r=>r.json()).then(data=>{
            const email = data.email;
            if (email) {
              setPostPaymentEmail(email);
              setShowPostPayment(true);
            } else {
              // Fallback — demande l'email manuellement
              setPostPaymentEmail("unknown");
              setShowPostPayment(true);
            }
          }).catch(()=>{
            setPostPaymentEmail("unknown");
            setShowPostPayment(true);
          });
        }, 800);
      }
    }
    if (params.get("canceled") === "true") {
      window.history.replaceState({}, "", window.location.pathname);
    }

    // Pull automatique des données si déjà connecté
    const autoSync = async () => {
      const token = localStorage.getItem("pq_token");
      if (!token) return;
      const today = new Date().toISOString().slice(0,10);
      try {
        const remote = await syncPull(token, today);
        if (!remote) return;
        let changed = false;
        if (remote.profile) {
          const p = remote.profile;
          if (p.gender) { localStorage.setItem("pq_gender", p.gender); changed = true; }
          if (p.age) { localStorage.setItem("pq_age", String(p.age)); changed = true; }
          if (p.weight) { localStorage.setItem("pq_weight", String(p.weight)); changed = true; }
          if (p.height) { localStorage.setItem("pq_height", String(p.height)); changed = true; }
          if (p.goal) { localStorage.setItem("pq_goal", p.goal); changed = true; }
          if (p.activity) { localStorage.setItem("pq_activity", p.activity); changed = true; }
        }
        if (remote.journal) {
          const key = "pq_journal_" + today;
          const local = JSON.parse(localStorage.getItem(key) || '{"meals":[],"steps":0,"sessions":[],"water":0}');
          if ((remote.journal.meals?.length || 0) >= (local.meals?.length || 0)) {
            localStorage.setItem(key, JSON.stringify({
              meals: remote.journal.meals || [],
              steps: remote.journal.steps || local.steps || 0,
              sessions: remote.journal.sessions || local.sessions || [],
              water: remote.journal.water || local.water || 0
            }));
            changed = true;
          }
        }
        if (remote.analyses?.length > 0) {
          const localHistory = JSON.parse(localStorage.getItem("pq_history") || "[]");
          const merged = [...localHistory];
          for (const a of remote.analyses) {
            if (!merged.find(h => h.date === a.date && h.bodyfat === a.bodyfat)) {
              merged.push({ date: a.date, bodyfat: a.bodyfat, weight: a.weight, note: a.note, confidence: a.confidence });
              changed = true;
            }
          }
          if (changed) {
            merged.sort((a,b) => b.date.localeCompare(a.date));
            localStorage.setItem("pq_history", JSON.stringify(merged.slice(0,100)));
          }
        }
        if (remote.savedFoods?.length > 0) {
          const localFoods = JSON.parse(localStorage.getItem("pq_saved_foods") || "[]");
          const merged = [...localFoods];
          for (const f of remote.savedFoods) {
            if (!merged.find(lf => lf.name === f.name)) { merged.push(f); changed = true; }
          }
          if (changed) localStorage.setItem("pq_saved_foods", JSON.stringify(merged.slice(0,50)));
        }
        // Force re-render APRÈS que toutes les données sont écrites
        if (changed) setSyncVersion(v => v + 1);
      } catch {}
    };
    autoSync();

    // Vérifie le statut Pro via Supabase si connecté
    const verifyPro = async () => {
      const token = localStorage.getItem("pq_token");
      if (!token) {
        // Fallback ancien système session Stripe
        const sessionId = localStorage.getItem("pq_stripe_session");
        if (!sessionId) return;
        try {
          const res = await fetch("/api/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ sessionId })
          });
          const data = await res.json();
          if (data.active) { setPremium(true); setPremiumState(true); }
        } catch {}
        return;
      }
      try {
        const res = await fetch("/api/me", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token })
        });
        const data = await res.json();
        if (data.email) {
          setUser({ email: data.email });
          localStorage.setItem("pq_email", data.email);
          if (data.is_pro) { setPremium(true); setPremiumState(true); }
          else { setPremium(false); setPremiumState(false); }
        } else {
          // Token expiré
          localStorage.removeItem("pq_token");
          localStorage.removeItem("pq_email");
        }
      } catch {}
    };
    verifyPro();
  }, []);
  const [daysLeft] = useState(3);

  const profile = getProfile();
  const profileComplete = getProfileCompletion(profile) === 100;

  // Listen for navigate events from child components
  useEffect(() => {
    const handler = (e) => setView(e.detail);
    document.addEventListener("navigate", handler);
    return () => document.removeEventListener("navigate", handler);
  }, []);

  // Admin URL activation
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("admin") === "PHYSIQRATE2024") {
      setPremium(true); setPremiumState(true);
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, []);

  const tabs = [
    { key: "analyser",    label: "Analyser" },
    { key: "jour",        label: "Journée"  },
    { key: "historique",  label: "Historique" },
    { key: "progression", label: "Progression" },
    { key: "profil",      label: "Profil", dot: !profileComplete },
  ];

  return (
    <div style={css.app}>
      <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700;800&display=swap" rel="stylesheet"/>

      {showPaywall && (
        <Paywall daysLeft={daysLeft} onClose={()=>setShowPaywall(false)}/>
      )}

      {showPWA && (
        <PWABanner onDismiss={()=>{ setShowPWA(false); localStorage.setItem("pq_pwa_dismissed","1"); }}/>
      )}

      {showAuth && (
        <AuthModal
          onGoToPay={()=>{ setShowAuth(false); setShowPaywall(true); }}
          onSuccess={async ({ email, is_pro, token }) => {
            setUser({ email });
            if (is_pro) {
              setPremium(true); setPremiumState(true);
            } else {
              const sessionId = localStorage.getItem("pq_stripe_session");
              if (sessionId && premium) {
                try {
                  const res = await fetch("/api/auth", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ action: "transfer_pro", email, sessionId })
                  });
                  const data = await res.json();
                  if (data.success) { setPremium(true); setPremiumState(true); }
                } catch {}
              } else {
                setPremium(false); setPremiumState(false);
                localStorage.removeItem("pq_stripe_session");
                localStorage.removeItem("pq_premium");
              }
            }
            // Pull données depuis Supabase
            const today = new Date().toISOString().slice(0,10);
            syncPull(token, today).then(remote => {
              if (!remote) { setShowAuth(false); return; }
              if (remote.profile) {
                const p = remote.profile;
                if (p.gender) localStorage.setItem("pq_gender", p.gender);
                if (p.age) localStorage.setItem("pq_age", String(p.age));
                if (p.weight) localStorage.setItem("pq_weight", String(p.weight));
                if (p.height) localStorage.setItem("pq_height", String(p.height));
                if (p.goal) localStorage.setItem("pq_goal", p.goal);
                if (p.activity) localStorage.setItem("pq_activity", p.activity);
              }
              if (remote.journal) {
                const key = "pq_journal_" + today;
                const local = JSON.parse(localStorage.getItem(key) || '{"meals":[],"steps":0,"sessions":[],"water":0}');
                if ((remote.journal.meals?.length || 0) >= (local.meals?.length || 0)) {
                  localStorage.setItem(key, JSON.stringify({
                    meals: remote.journal.meals || [],
                    steps: remote.journal.steps || local.steps || 0,
                    sessions: remote.journal.sessions || local.sessions || [],
                    water: remote.journal.water || local.water || 0
                  }));
                }
              }
              if (remote.analyses?.length > 0) {
                const localHistory = JSON.parse(localStorage.getItem("pq_history") || "[]");
                const merged = [...localHistory];
                for (const a of remote.analyses) {
                  if (!merged.find(h => h.date === a.date && h.bodyfat === a.bodyfat)) {
                    merged.push({ date: a.date, bodyfat: a.bodyfat, weight: a.weight, note: a.note, confidence: a.confidence });
                  }
                }
                merged.sort((a,b) => b.date.localeCompare(a.date));
                localStorage.setItem("pq_history", JSON.stringify(merged.slice(0,100)));
              }
              if (remote.savedFoods?.length > 0) {
                const localFoods = JSON.parse(localStorage.getItem("pq_saved_foods") || "[]");
                const merged = [...localFoods];
                for (const f of remote.savedFoods) {
                  if (!merged.find(lf => lf.name === f.name)) merged.push(f);
                }
                localStorage.setItem("pq_saved_foods", JSON.stringify(merged.slice(0,50)));
              }
              setShowAuth(false);
              window.location.reload();
            }).catch(() => setShowAuth(false));
          }}
          onClose={()=>{ if(premium && !localStorage.getItem("pq_token")) return; setShowAuth(false); }}
          blocking={premium && !localStorage.getItem("pq_token")}
        />
      )}

      {showPostPayment && postPaymentEmail && (
        <PostPaymentModal
          email={postPaymentEmail}
          onSuccess={({ email, token }) => {
            setUser({ email });
            setShowPostPayment(false);
            setPostPaymentEmail(null);
          }}
          blocking={premium && !user}
        />
      )}

      {/* Force connexion si Pro local sans token Supabase */}
      {premium && !localStorage.getItem("pq_token") && !showAuth && !showPostPayment && (
        <div style={{position:"fixed",inset:0,background:"#09090f",zIndex:500,display:"flex",alignItems:"center",justifyContent:"center",padding:"20px"}}>
          <div style={{background:"#0f0f1a",border:`1px solid rgba(255,215,0,0.2)`,borderRadius:"24px",padding:"28px 24px",maxWidth:"380px",width:"100%",textAlign:"center"}}>
            <div style={{fontSize:"10px",color:C.gold,letterSpacing:"3px",marginBottom:"16px"}}>COMPTE REQUIS</div>
            <div style={{fontSize:"20px",fontWeight:"800",marginBottom:"8px"}}>Finalise ton inscription</div>
            <div style={{fontSize:"13px",color:"#555",marginBottom:"24px",lineHeight:"1.6"}}>
              Crée ton compte pour accéder à Physiqrate Pro sur tous tes appareils.
            </div>
            <button style={{...css.btn(C.gold),marginBottom:"0"}} onClick={()=>{
              const sessionId = localStorage.getItem("pq_stripe_session");
              if (sessionId) {
                fetch("/api/verify", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ sessionId })
                }).then(r=>r.json()).then(data=>{
                  setPostPaymentEmail(data.email || "unknown");
                  setShowPostPayment(true);
                }).catch(()=>{ setPostPaymentEmail("unknown"); setShowPostPayment(true); });
              } else {
                setPostPaymentEmail("unknown");
                setShowPostPayment(true);
              }
            }}>
              Créer mon compte Pro
            </button>
          </div>
        </div>
      )}

      {/* NAV */}
      <div style={{width:"100%",maxWidth:"420px",paddingTop:"14px",marginBottom:"16px"}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:"12px"}}>
          <Logo/>
          <div style={{display:"flex",alignItems:"center",gap:"8px"}}>
            {/* Install icon */}
            {!window.matchMedia("(display-mode: standalone)").matches && !window.navigator.standalone && (
              <button onClick={()=>setShowPWA(true)} title="Installer l'app"
                style={{width:"32px",height:"32px",borderRadius:"8px",border:`1px solid ${C.border}`,background:"rgba(255,255,255,0.04)",color:C.gold,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",padding:0}}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={C.gold} strokeWidth="2.5">
                  <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
                  <polyline points="7 10 12 15 17 10"/>
                  <line x1="12" y1="15" x2="12" y2="3"/>
                </svg>
              </button>
            )}
            {/* Auth button */}
            {!user ? (
              <button onClick={()=>setShowAuth(true)}
                style={{padding:"5px 12px",borderRadius:"20px",border:`1px solid ${C.border}`,background:"rgba(255,255,255,0.04)",color:"#aaa",fontSize:"11px",fontWeight:"600",cursor:"pointer",fontFamily:"inherit"}}>
                Connexion
              </button>
            ) : null}
            {/* Pro badge or upgrade */}
            {premium
              ? <div style={{fontSize:"11px",color:C.green,fontWeight:"700",border:`1px solid rgba(125,249,170,0.3)`,padding:"4px 10px",borderRadius:"20px"}}>✓ PRO</div>
              : <button onClick={()=>setShowPaywall(true)}
                  style={{padding:"5px 12px",borderRadius:"20px",border:`1px solid rgba(255,215,0,0.4)`,background:"rgba(255,215,0,0.08)",color:C.gold,fontSize:"11px",fontWeight:"700",cursor:"pointer",fontFamily:"inherit"}}>
                  PREMIUM
                </button>
            }
          </div>
        </div>
        <div style={{display:"flex",gap:"2px",background:"rgba(255,255,255,0.03)",borderRadius:"14px",padding:"4px",overflowX:"auto",WebkitOverflowScrolling:"touch",scrollbarWidth:"none"}}>
          {tabs.map(tab=>(
            <button key={tab.key} onClick={()=>setView(tab.key)} style={{flexShrink:0,padding:"7px 10px",borderRadius:"10px",border:"none",background:view===tab.key?"rgba(255,215,0,0.15)":"transparent",color:view===tab.key?C.gold:C.muted,fontSize:"11px",fontWeight:"600",cursor:"pointer",fontFamily:"inherit",position:"relative",whiteSpace:"nowrap"}}>
              {tab.label}
              {tab.dot && <span style={{position:"absolute",top:"3px",right:"3px",width:"6px",height:"6px",borderRadius:"50%",background:C.red}}/>}
            </button>
          ))}
        </div>
      </div>

      {/* VIEWS */}
      {view === "analyser"    && <ViewAnalyze key={syncVersion} premium={premium}/>}
      {view === "jour"        && <ViewJour key={syncVersion}/>}
      {view === "historique"  && <ViewHistorique key={syncVersion} premium={premium} onShowPaywall={()=>setShowPaywall(true)}/>}
      {view === "progression" && <ViewProgression key={syncVersion} premium={premium} onShowPaywall={()=>setShowPaywall(true)}/>}
      {view === "profil"      && <ViewProfil key={syncVersion} user={user} premium={premium} onShowAuth={()=>setShowAuth(true)} setPremiumState={setPremiumState}/>}
    </div>
  );
}
