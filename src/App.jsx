import { useState, useRef, useEffect } from "react";

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);
  return isMobile;
}

const ARCHETYPES = {
  male: [
    { max: 6,   label: "Compétition",   icon: "⚡", ref: "Zyzz / Arnold peak",     color: "#FFD700", desc: "Strié de partout. Tu es un phénomène." },
    { max: 10,  label: "Athlète Elite", icon: "🔱", ref: "Brad Pitt Fight Club",    color: "#C0C0FF", desc: "Abdos visibles, vasculaire. Dedication pure." },
    { max: 14,  label: "Athlète",       icon: "🏆", ref: "Chris Hemsworth Thor",    color: "#7DF9AA", desc: "Physique de film d'action. Respect." },
    { max: 18,  label: "Fit",           icon: "💪", ref: "Ryan Reynolds Deadpool",  color: "#7DF9FF", desc: "En forme et ça se voit. Bon travail." },
    { max: 22,  label: "Lifestyle",     icon: "🌊", ref: "Chris Pratt post-Marvel", color: "#A0C4FF", desc: "Actif et détendu. Zone confortable." },
    { max: 27,  label: "Casual",        icon: "😎", ref: "Vibe bear mode",          color: "#FFB347", desc: "Du potentiel caché. Quelques mois de travail." },
    { max: 35,  label: "Bulk",          icon: "🐻", ref: "Off-season powerlifter",  color: "#FF8C69", desc: "On appelle ça la phase de prise de masse." },
    { max: 100, label: "Rebuild",       icon: "🔥", ref: "Mission transformation",  color: "#FF6B6B", desc: "Le voyage commence ici. Chaque champion a commencé quelque part." },
  ],
  female: [
    { max: 14,  label: "Compétition",   icon: "⚡", ref: "Bikini athlete",          color: "#FFD700", desc: "Définition extrême. Corps de compétitrice." },
    { max: 18,  label: "Athlète Elite", icon: "🔱", ref: "Serena Williams",         color: "#C0C0FF", desc: "Puissante et définie. Physique d'exception." },
    { max: 22,  label: "Athlète",       icon: "🏆", ref: "Margot Robbie Barbie",    color: "#7DF9AA", desc: "Tonique et équilibrée. Physique de rêve." },
    { max: 26,  label: "Fit",           icon: "💪", ref: "Jennifer Aniston",        color: "#7DF9FF", desc: "En forme, équilibrée. Très bien." },
    { max: 30,  label: "Lifestyle",     icon: "🌊", ref: "Healthy vibes",           color: "#A0C4FF", desc: "Actif et à l'aise. C'est une bonne base." },
    { max: 35,  label: "Casual",        icon: "😎", ref: "Du potentiel à débloquer",color: "#FFB347", desc: "Le corps répond vite quand on s'y met." },
    { max: 42,  label: "Bulk",          icon: "🐻", ref: "Zone de confort",         color: "#FF8C69", desc: "La transformation commence dans la tête." },
    { max: 100, label: "Rebuild",       icon: "🔥", ref: "Mission transformation",  color: "#FF6B6B", desc: "Chaque grande transformation commence par une décision." },
  ],
};

function getArchetype(bf, gender) {
  const list = ARCHETYPES[gender] || ARCHETYPES.male;
  return list.find(a => bf <= a.max) || list[list.length - 1];
}

function hexToRgb(hex) {
  return { r: parseInt(hex.slice(1,3),16), g: parseInt(hex.slice(3,5),16), b: parseInt(hex.slice(5,7),16) };
}

// Simulated analysis — remplace par /api/analyze en prod
function simulateAnalysis(gender, age) {
  const base = gender === "male" ? 14 : 22;
  const ageAdj = age > 35 ? 2 : 0;
  const bf = base + ageAdj + Math.floor(Math.random() * 4);
  return {
    bodyfat: bf,
    confidence: "medium",
    confidence_reason: "Simulation locale — déploie sur Vercel pour l'analyse IA réelle",
    key_indicators: [
      "Analyse basée sur les paramètres fournis",
      "Résultat indicatif uniquement",
      "L'analyse photo IA sera plus précise"
    ],
    note: "Déploie l'app sur Vercel pour activer l'analyse IA complète."
  };
}

// Gestion du freemium — 2 analyses instantanées gratuites, puis 1 par semaine
const STORAGE_KEY = "physiqrate_usage";
function getUsage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : { count: 0, weeklyUsed: null };
  } catch { return { count: 0, weeklyUsed: null }; }
}
function saveUsage(usage) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(usage)); } catch {}
}
function canAnalyze(usage) {
  // 2 analyses instantanées (count 0 et 1), ensuite 1 par semaine
  if (usage.count < 2) return { allowed: true };
  if (!usage.weeklyUsed) return { allowed: true };
  const diff = Date.now() - new Date(usage.weeklyUsed).getTime();
  const daysPassed = diff / (1000 * 60 * 60 * 24);
  if (daysPassed >= 7) return { allowed: true };
  return { allowed: false, daysLeft: Math.ceil(7 - daysPassed) };
}

// Historique des analyses (abonnés)
const HISTORY_KEY = "physiqrate_history";
function getHistory() {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}
function saveToHistory(entry) {
  try {
    const history = getHistory();
    history.unshift({ ...entry, date: new Date().toISOString() });
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history.slice(0, 50)));
  } catch {}
}

// Profil utilisateur
const PROFILE_KEY = "physiqrate_profile";
function getProfile() {
  try {
    const raw = localStorage.getItem(PROFILE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch { return {}; }
}
function saveProfile(profile) {
  try { localStorage.setItem(PROFILE_KEY, JSON.stringify(profile)); } catch {}
}
function getProfileCompletion(profile) {
  const fields = ["age", "gender", "height", "activity", "training", "trainingType", "goal"];
  const filled = fields.filter(f => profile[f]);
  return Math.round((filled.length / fields.length) * 100);
}
function buildProfilePrompt(profile) {
  const parts = [];
  if (profile.age) parts.push(`Age: ${profile.age}`);
  if (profile.gender) parts.push(`Gender: ${profile.gender}`);
  if (profile.height) parts.push(`Height: ${profile.height}cm`);
  if (profile.activity) parts.push(`Activity level: ${profile.activity}`);
  if (profile.training) parts.push(`Training frequency: ${profile.training} sessions/week`);
  if (profile.trainingType) parts.push(`Training type: ${profile.trainingType}`);
  if (profile.goal) parts.push(`Goal: ${profile.goal}`);
  return parts.length > 0 ? `\n\nUser profile:\n${parts.join("\n")}` : "";
}


// Simulation abonnement premium (remplace par vrai check Stripe en prod)
const PREMIUM_KEY = "physiqrate_premium";
function isPremium() {
  try { return localStorage.getItem(PREMIUM_KEY) === "true"; } catch { return false; }
}
function setPremium(val) {
  try { localStorage.setItem(PREMIUM_KEY, val ? "true" : "false"); } catch {}
}



function ProgressChart({ history, color }) {
  if (!history || history.length < 2) return null;
  const data = [...history].reverse().slice(-8); // last 8 entries
  const values = data.map(h => h.bodyfat);
  const min = Math.max(0, Math.min(...values) - 3);
  const max = Math.min(50, Math.max(...values) + 3);
  const W = 320, H = 100;
  const points = data.map((h, i) => {
    const x = (i / (data.length - 1)) * (W - 40) + 20;
    const y = H - 20 - ((h.bodyfat - min) / (max - min)) * (H - 30);
    return { x, y, bf: h.bodyfat, date: h.date };
  });
  const pathD = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");

  return (
    <div style={{marginTop:"8px"}}>
      <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{overflow:"visible"}}>
        <defs>
          <linearGradient id="chartFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.3"/>
            <stop offset="100%" stopColor={color} stopOpacity="0"/>
          </linearGradient>
        </defs>
        <path d={`${pathD} L ${points[points.length-1].x} ${H-10} L ${points[0].x} ${H-10} Z`}
          fill="url(#chartFill)"/>
        <path d={pathD} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
        {points.map((p, i) => (
          <g key={i}>
            <circle cx={p.x} cy={p.y} r="4" fill={color} opacity="0.9"/>
            <text x={p.x} y={p.y - 10} textAnchor="middle" fill="white" fontSize="10" fontFamily="Arial">{p.bf}%</text>
          </g>
        ))}
      </svg>
    </div>
  );
}

function HistoryCard({ history, color }) {
  if (!history || history.length === 0) return null;
  return (
    <div style={{display:"flex", flexDirection:"column", gap:"8px"}}>
      {history.slice(0, 5).map((h, i) => {
        const arch = getArchetype(h.bodyfat, h.gender);
        const date = new Date(h.date).toLocaleDateString("fr-FR", {day:"numeric", month:"short"});
        return (
          <div key={i} style={{display:"flex", alignItems:"center", justifyContent:"space-between", padding:"12px 14px", background:"rgba(255,255,255,0.03)", borderRadius:"12px", border:"1px solid rgba(255,255,255,0.06)"}}>
            <div style={{display:"flex", alignItems:"center", gap:"10px"}}>
              <span style={{fontSize:"18px"}}>{arch.icon}</span>
              <div>
                <div style={{fontSize:"13px", fontWeight:"700", color:arch.color}}>{h.bodyfat}% · {arch.label}</div>
                <div style={{fontSize:"11px", color:"#555"}}>{date}</div>
              </div>
            </div>
            {i > 0 && (() => {
              const prev = history[i - 1];
              const diff = h.bodyfat - prev.bodyfat;
              return diff !== 0 ? (
                <div style={{fontSize:"12px", color: diff < 0 ? "#7DF9AA" : "#FF6B6B", fontWeight:"700"}}>
                  {diff < 0 ? "▼" : "▲"} {Math.abs(diff)}%
                </div>
              ) : null;
            })()}
          </div>
        );
      })}
    </div>
  );
}


function ProfileScreen({ onSave }) {
  const [profile, setProfile] = useState(getProfile());
  const completion = getProfileCompletion(profile);

  function update(key, val) {
    const updated = { ...profile, [key]: val };
    setProfile(updated);
    saveProfile(updated);
  }

  const s = {
    label: { fontSize:"11px", letterSpacing:"2px", color:"#555", textTransform:"uppercase", marginTop:"20px", display:"block" },
    input: { width:"100%", padding:"13px 16px", borderRadius:"12px", border:"1.5px solid rgba(255,255,255,0.08)", background:"rgba(255,255,255,0.04)", color:"white", fontSize:"15px", outline:"none", boxSizing:"border-box", marginTop:"6px" },
    optBtn: (active) => ({ flex:1, padding:"11px 8px", borderRadius:"10px", border:`1.5px solid ${active?"#FFD700":"rgba(255,255,255,0.08)"}`, background:active?"rgba(255,215,0,0.1)":"transparent", color:active?"#FFD700":"#555", fontSize:"12px", fontWeight:"600", cursor:"pointer" }),
    row: { display:"flex", gap:"8px", marginTop:"8px" },
  };

  return (
    <div style={{width:"100%", maxWidth:"420px", display:"flex", flexDirection:"column", gap:"16px"}}>

      {/* Completion bar */}
      <div style={{background:"linear-gradient(135deg,rgba(255,255,255,0.04),rgba(255,255,255,0.02))", border:"1px solid rgba(255,255,255,0.08)", borderRadius:"24px", padding:"20px 24px"}}>
        <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"10px"}}>
          <div style={{fontSize:"13px", fontWeight:"700"}}>Complétion du profil</div>
          <div style={{fontSize:"20px", fontWeight:"800", color: completion === 100 ? "#7DF9AA" : "#FFD700"}}>{completion}%</div>
        </div>
        <div style={{height:"6px", background:"rgba(255,255,255,0.06)", borderRadius:"3px", overflow:"hidden"}}>
          <div style={{height:"100%", width:`${completion}%`, background: completion === 100 ? "#7DF9AA" : "linear-gradient(90deg,#FFD700,#FFA500)", borderRadius:"3px", transition:"width 0.4s ease"}}/>
        </div>
        <div style={{fontSize:"12px", color:"#555", marginTop:"8px"}}>
          {completion < 50 ? "Plus ton profil est complet, plus l'analyse est précise" :
           completion < 100 ? "Bon début — encore quelques infos pour maximiser la précision" :
           "Profil complet — analyses au maximum de précision ✓"}
        </div>
      </div>

      {/* Form */}
      <div style={{background:"linear-gradient(135deg,rgba(255,255,255,0.04),rgba(255,255,255,0.02))", border:"1px solid rgba(255,255,255,0.08)", borderRadius:"24px", padding:"24px"}}>

        <span style={s.label}>Genre</span>
        <div style={{...s.row}}>
          <button style={s.optBtn(profile.gender==="male")} onClick={() => update("gender","male")}>♂ Homme</button>
          <button style={s.optBtn(profile.gender==="female")} onClick={() => update("gender","female")}>♀ Femme</button>
        </div>

        <span style={s.label}>Âge</span>
        <input style={s.input} type="number" placeholder="Ex : 24" value={profile.age||""} onChange={e=>update("age",e.target.value)} min="10" max="99"/>

        <span style={s.label}>Taille (cm)</span>
        <input style={s.input} type="number" placeholder="Ex : 178" value={profile.height||""} onChange={e=>update("height",e.target.value)}/>

        <span style={s.label}>Niveau d'activité</span>
        <div style={{...s.row, flexWrap:"wrap"}}>
          {[["sedentary","Sédentaire"],["active","Actif"],["very_active","Très actif"]].map(([val,label]) => (
            <button key={val} style={s.optBtn(profile.activity===val)} onClick={() => update("activity",val)}>{label}</button>
          ))}
        </div>

        <span style={s.label}>Séances / semaine</span>
        <div style={{...s.row}}>
          {["1-2","3-4","5-6","7+"].map(val => (
            <button key={val} style={s.optBtn(profile.training===val)} onClick={() => update("training",val)}>{val}</button>
          ))}
        </div>

        <span style={s.label}>Type d'entraînement</span>
        <div style={{...s.row, flexWrap:"wrap"}}>
          {[["strength","Muscu"],["cardio","Cardio"],["mixed","Mixte"],["sport","Sport"]].map(([val,label]) => (
            <button key={val} style={s.optBtn(profile.trainingType===val)} onClick={() => update("trainingType",val)}>{label}</button>
          ))}
        </div>

        <span style={s.label}>Objectif</span>
        <div style={{...s.row, flexWrap:"wrap"}}>
          {[["cut","Perdre du gras"],["bulk","Prendre du muscle"],["maintain","Maintenir"],["recomp","Recomposition"]].map(([val,label]) => (
            <button key={val} style={{...s.optBtn(profile.goal===val), flex:"none", padding:"10px 12px"}} onClick={() => update("goal",val)}>{label}</button>
          ))}
        </div>
      </div>
    </div>
  );
}

function GaugeRing({ percent, color }) {
  const radius = 70, circ = 2 * Math.PI * radius;
  const filled = (Math.min(percent, 50) / 50) * circ;
  return (
    <svg width="180" height="180" viewBox="0 0 180 180">
      <defs><filter id="glow"><feGaussianBlur stdDeviation="3" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>
      <circle cx="90" cy="90" r={radius} fill="none" stroke="#1a1a2e" strokeWidth="14"/>
      <circle cx="90" cy="90" r={radius} fill="none" stroke={color} strokeWidth="14"
        strokeDasharray={`${filled} ${circ}`} strokeLinecap="round"
        transform="rotate(-90 90 90)" filter="url(#glow)"
        style={{transition:"stroke-dasharray 1.2s cubic-bezier(0.34,1.56,0.64,1)"}}/>
      <text x="90" y="85" textAnchor="middle" fill="white" fontSize="28" fontWeight="800" fontFamily="Arial">{percent}%</text>
      <text x="90" y="108" textAnchor="middle" fill="#888" fontSize="11" fontFamily="Arial">BODY FAT</text>
    </svg>
  );
}

function ShareCard({ imagePreview, result, archetype, onReady }) {
  const ref = useRef();
  useState(() => {
    if (!result || !archetype) return;
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const W = 1080, H = 1080;
    canvas.width = W; canvas.height = H;
    const draw = (photo) => {
      const bg = ctx.createLinearGradient(0,0,W,H);
      bg.addColorStop(0,"#0a0a0f"); bg.addColorStop(1,"#0d0d1a");
      ctx.fillStyle = bg; ctx.fillRect(0,0,W,H);
      if (photo) {
        const ph = H*0.56, sc = Math.max(W/photo.width, ph/photo.height);
        ctx.drawImage(photo,(W-photo.width*sc)/2,0,photo.width*sc,photo.height*sc);
        const fade = ctx.createLinearGradient(0,ph*0.3,0,ph);
        fade.addColorStop(0,"rgba(10,10,15,0)"); fade.addColorStop(1,"rgba(10,10,15,1)");
        ctx.fillStyle=fade; ctx.fillRect(0,0,W,ph);
      }
      const {r,g,b} = hexToRgb(archetype.color);
      const side = ctx.createLinearGradient(0,0,W,0);
      side.addColorStop(0,`rgba(${r},${g},${b},0.2)`); side.addColorStop(0.5,`rgba(${r},${g},${b},0)`); side.addColorStop(1,`rgba(${r},${g},${b},0.2)`);
      ctx.fillStyle=side; ctx.fillRect(0,0,W,H);
      const cy = photo ? H*0.56+110 : H*0.38;
      ctx.beginPath(); ctx.arc(W/2,cy,106,0,Math.PI*2); ctx.fillStyle="rgba(10,10,15,0.92)"; ctx.fill();
      ctx.beginPath(); ctx.arc(W/2,cy,90,-Math.PI/2,Math.PI*2-Math.PI/2); ctx.strokeStyle="#1a1a2e"; ctx.lineWidth=16; ctx.stroke();
      const fa = (Math.min(result.bodyfat,50)/50)*Math.PI*2;
      ctx.beginPath(); ctx.arc(W/2,cy,90,-Math.PI/2,fa-Math.PI/2); ctx.strokeStyle=archetype.color; ctx.lineWidth=16; ctx.lineCap="round"; ctx.shadowColor=archetype.color; ctx.shadowBlur=24; ctx.stroke(); ctx.shadowBlur=0;
      ctx.fillStyle="#fff"; ctx.font="bold 72px Arial"; ctx.textAlign="center"; ctx.fillText(`${result.bodyfat}%`,W/2,cy+22);
      ctx.fillStyle="#666"; ctx.font="26px Arial"; ctx.fillText("BODY FAT",W/2,cy+62);
      const by = cy+130;
      ctx.fillStyle=archetype.color; ctx.font="bold 54px Arial"; ctx.fillText(`${archetype.icon} ${archetype.label.toUpperCase()}`,W/2,by);
      ctx.fillStyle="rgba(255,255,255,0.45)"; ctx.font="32px Arial"; ctx.fillText(archetype.ref,W/2,by+52);
      ctx.strokeStyle=`rgba(${r},${g},${b},0.3)`; ctx.lineWidth=1; ctx.beginPath(); ctx.moveTo(W*0.2,by+82); ctx.lineTo(W*0.8,by+82); ctx.stroke();
      ctx.fillStyle=archetype.color; ctx.font="bold 28px Arial"; ctx.fillText("PHYSIQRATE",W/2,by+130);
      ctx.fillStyle="rgba(255,255,255,0.2)"; ctx.font="22px Arial"; ctx.fillText("physiqrate.com",W/2,by+168);
      onReady(canvas.toDataURL("image/png"));
    };
    if (imagePreview) { const img=new Image(); img.onload=()=>draw(img); img.src=imagePreview; } else draw(null);
  }, []);
  return <canvas ref={ref} style={{display:"none"}}/>;
}

function Paywall({ daysLeft, onClose }) {
  return (
    <div style={{position:"fixed", inset:0, background:"rgba(0,0,0,0.85)", backdropFilter:"blur(8px)", zIndex:100, display:"flex", alignItems:"center", justifyContent:"center", padding:"20px"}}>
      <div style={{background:"linear-gradient(135deg,#0f0f1a,#0a0a0f)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:"28px", padding:"32px 24px", maxWidth:"380px", width:"100%", textAlign:"center"}}>
        <div style={{fontSize:"40px", marginBottom:"16px"}}>⏳</div>
        <div style={{fontSize:"20px", fontWeight:"800", marginBottom:"8px"}}>Prochaine analyse gratuite</div>
        <div style={{fontSize:"36px", fontWeight:"800", color:"#FFD700", marginBottom:"4px"}}>dans {daysLeft}j</div>
        <div style={{fontSize:"13px", color:"#555", marginBottom:"4px"}}>Reviens dans <strong style={{color:"#FFD700"}}>{daysLeft} jour{daysLeft > 1 ? "s" : ""}</strong> pour ton analyse gratuite</div>
        <div style={{fontSize:"12px", color:"#444", marginBottom:"28px"}}>ou débloque l'accès illimité maintenant</div>

        {/* Option analyse unitaire */}
        <div style={{background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.08)", borderRadius:"16px", padding:"18px", marginBottom:"12px", cursor:"pointer"}}
          onClick={() => alert("Intègre Stripe ici — paiement 1,99€")}>
          <div style={{fontSize:"13px", color:"#888", marginBottom:"4px"}}>UNE ANALYSE</div>
          <div style={{fontSize:"28px", fontWeight:"800"}}>1,99€</div>
          <div style={{fontSize:"12px", color:"#555", marginTop:"4px"}}>Sans engagement</div>
        </div>

        {/* Option abonnement */}
        <div style={{background:"linear-gradient(135deg,rgba(255,215,0,0.1),rgba(255,215,0,0.05))", border:"1px solid rgba(255,215,0,0.3)", borderRadius:"16px", padding:"18px", marginBottom:"8px", cursor:"pointer", position:"relative"}}
          onClick={() => { setPremium(true); setPremiumState(true); setShowPaywall(false); }}>
          <div style={{position:"absolute", top:"-10px", left:"50%", transform:"translateX(-50%)", background:"#FFD700", color:"#000", fontSize:"10px", fontWeight:"800", padding:"3px 12px", borderRadius:"20px", letterSpacing:"1px"}}>MEILLEUR CHOIX</div>
          <div style={{fontSize:"13px", color:"#FFD700", marginBottom:"4px"}}>ILLIMITÉ</div>
          <div style={{fontSize:"28px", fontWeight:"800", color:"#FFD700"}}>4,99€<span style={{fontSize:"14px", fontWeight:"400", color:"#888"}}>/mois</span></div>
          <div style={{fontSize:"12px", color:"#888", marginTop:"4px"}}>Analyses illimitées · Historique · Notifications</div>
        </div>

        <button style={{background:"transparent", border:"none", color:"#444", fontSize:"13px", cursor:"pointer", marginTop:"12px"}} onClick={onClose}>
          Attendre {daysLeft} jour{daysLeft > 1 ? "s" : ""}
        </button>
      </div>
    </div>
  );
}

export default function App() {
  const [step, setStep] = useState("upload");
  const [imagePreview, setImagePreview] = useState(null);
  const [imageBase64, setImageBase64] = useState(null);
  const [gender, setGender] = useState(null);
  const [age, setAge] = useState("");
  const [weight, setWeight] = useState("");
  const [result, setResult] = useState(null);
  const [shareUrl, setShareUrl] = useState(null);
  const [error, setError] = useState(null);
  const isMobile = useIsMobile();
  const [showPaywall, setShowPaywall] = useState(false);
  const [daysLeft, setDaysLeft] = useState(0);
  const [premium, setPremiumState] = useState(isPremium());
  const [history, setHistory] = useState(getHistory());
  const [view, setView] = useState("home"); // home | dashboard | profile
  const fileRef = useRef();

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
        if (w > MAX || h > MAX) {
          if (w > h) { h = Math.round(h*MAX/w); w = MAX; }
          else { w = Math.round(w*MAX/h); h = MAX; }
        }
        canvas.width = w; canvas.height = h;
        canvas.getContext("2d").drawImage(img, 0, 0, w, h);
        const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
        setImagePreview(dataUrl);
        setImageBase64(dataUrl.split(",")[1]);
        setStep("form");
      };
      img.src = ev.target.result;
    };
    reader.readAsDataURL(file);
  }

  async function analyze() {
    setError(null);
    if (!gender) { setError("Sélectionne ton genre."); return; }

    // Vérification freemium (skip si premium)
    if (!isPremium()) {
      const usage = getUsage();
      const check = canAnalyze(usage);
      if (!check.allowed) {
        setDaysLeft(check.daysLeft);
        setShowPaywall(true);
        return;
      }
    }

    setStep("analyzing");
    try {
      // En prod : remplace par fetch("/api/analyze", ...)
      await new Promise(r => setTimeout(r, 2200)); // simulate API delay
      const profile = getProfile();
      const resolvedGender = gender || profile.gender || "male";
      const resolvedAge = parseInt(age) || parseInt(profile.age) || 25;
      const data = simulateAnalysis(resolvedGender, resolvedAge);
      const archetype = getArchetype(data.bodyfat, gender);

      // Enregistre l'utilisation
      const usage = getUsage();
      const now = new Date().toISOString();
      saveUsage({
        count: usage.count + 1,
        weeklyUsed: usage.count >= 1 ? now : usage.weeklyUsed,
      });

      const entry = { bodyfat: data.bodyfat, gender, age: parseInt(age)||25, weight: parseFloat(weight)||null, archetype: { label: archetype.label, icon: archetype.icon, color: archetype.color, ref: archetype.ref } };
      saveToHistory(entry);
      setHistory(getHistory());
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

  const s = {
    app: { minHeight:"100vh", background:"linear-gradient(135deg,#0a0a0f 0%,#0d0d1a 50%,#0a0a0f 100%)", fontFamily:"'Space Grotesk',Arial,sans-serif", color:"white", display:"flex", flexDirection:"column", alignItems:"center", padding: isMobile ? "20px 16px 40px" : "32px 40px 60px" },
    card: { background:"linear-gradient(135deg,rgba(255,255,255,0.04),rgba(255,255,255,0.02))", border:"1px solid rgba(255,255,255,0.08)", borderRadius:"24px", padding: isMobile ? "28px 24px" : "36px 32px", width:"100%", maxWidth: isMobile ? "420px" : "480px", boxSizing:"border-box" },
    uploadZone: { border:"2px dashed rgba(255,215,0,0.3)", borderRadius:"16px", padding:"36px 20px", textAlign:"center", cursor:"pointer", background:"rgba(255,215,0,0.03)" },
    genderBtn: (a) => ({ flex:1, padding:"14px", borderRadius:"12px", border:`1.5px solid ${a?"#FFD700":"rgba(255,255,255,0.1)"}`, background:a?"rgba(255,215,0,0.1)":"transparent", color:a?"#FFD700":"#666", fontSize:"14px", fontWeight:"600", cursor:"pointer" }),
    input: { width:"100%", padding:"14px 16px", borderRadius:"12px", border:"1.5px solid rgba(255,255,255,0.08)", background:"rgba(255,255,255,0.04)", color:"white", fontSize:"16px", outline:"none", boxSizing:"border-box", marginTop:"6px" },
    label: { fontSize:"11px", letterSpacing:"2px", color:"#555", textTransform:"uppercase", marginTop:"18px", display:"block" },
    btn: (color="#FFD700") => ({ width:"100%", padding:"16px", borderRadius:"14px", border:"none", background:`linear-gradient(135deg,${color},${color}cc)`, color:"#000", fontSize:"15px", fontWeight:"700", cursor:"pointer", marginTop:"16px", boxShadow:`0 0 20px ${color}33` }),
    secondaryBtn: { background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:"12px", color:"white", padding:"14px", fontSize:"14px", fontWeight:"600", cursor:"pointer", width:"100%", marginTop:"10px" },
    archetypeBadge: (color) => ({ display:"inline-block", padding:"6px 16px", borderRadius:"20px", border:`1px solid ${color}44`, background:`${color}11`, color, fontSize:"12px", fontWeight:"700", letterSpacing:"2px", textTransform:"uppercase", marginBottom:"8px" }),
  };

  return (
    <div style={s.app}>
      <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;600;700;800&display=swap" rel="stylesheet"/>
      {showPaywall && <Paywall daysLeft={daysLeft} onClose={() => setShowPaywall(false)}/>}

      {/* Nav */}
      <div style={{width:"100%", maxWidth: isMobile ? "420px" : "900px", paddingTop:"12px", marginBottom:"20px"}}>
        {/* Logo + badge PRO */}
        <div style={{display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:"14px"}}>
          <div style={{fontSize:"14px", letterSpacing:"4px", color:"#FFD700", fontWeight:"700"}}>◈ PHYSIQRATE</div>
          {premium
            ? <div style={{fontSize:"11px", color:"#7DF9AA", fontWeight:"700", letterSpacing:"1px", border:"1px solid rgba(125,249,170,0.3)", padding:"4px 10px", borderRadius:"20px"}}>✓ PRO</div>
            : <button onClick={() => { setDaysLeft(0); setShowPaywall(true); }} style={{padding:"5px 12px", borderRadius:"20px", border:"1px solid rgba(255,215,0,0.4)", background:"rgba(255,215,0,0.08)", color:"#FFD700", fontSize:"11px", fontWeight:"700", cursor:"pointer", letterSpacing:"1px"}}>PASSER PRO</button>
          }
        </div>
        {/* Tabs */}
        <div style={{display:"flex", gap:"6px", background:"rgba(255,255,255,0.03)", borderRadius:"14px", padding:"4px", maxWidth: isMobile ? "100%" : "400px", margin: isMobile ? "0" : "0 auto"}}>
          <button onClick={() => { setView("home"); setStep("upload"); }} style={{flex:1, padding:"9px", borderRadius:"10px", border:"none", background: view==="home" ? "rgba(255,215,0,0.15)" : "transparent", color: view==="home" ? "#FFD700" : "#555", fontSize:"12px", fontWeight:"600", cursor:"pointer", transition:"all 0.2s"}}>
            Analyser
          </button>
          <button onClick={() => setView("dashboard")} style={{flex:1, padding:"9px", borderRadius:"10px", border:"none", background: view==="dashboard" ? "rgba(255,215,0,0.15)" : "transparent", color: view==="dashboard" ? "#FFD700" : "#555", fontSize:"12px", fontWeight:"600", cursor:"pointer", transition:"all 0.2s", position:"relative"}}>
            Progression
            {!premium && <span style={{position:"absolute", top:"4px", right:"6px", background:"#FFD700", borderRadius:"50%", width:"6px", height:"6px", display:"block"}}/>}
          </button>
          {premium && (
            <button onClick={() => setView("profile")} style={{flex:1, padding:"9px", borderRadius:"10px", border:"none", background: view==="profile" ? "rgba(255,215,0,0.15)" : "transparent", color: view==="profile" ? "#FFD700" : "#555", fontSize:"12px", fontWeight:"600", cursor:"pointer", transition:"all 0.2s"}}>
              Profil
            </button>
          )}
        </div>
      </div>

      {/* Tagline — only on home upload */}
      {view === "home" && step === "upload" && (
        <div style={{textAlign:"center", marginBottom:"28px"}}>
          <h1 style={{fontSize: isMobile ? "26px" : "36px", fontWeight:"800", letterSpacing:"-1px", margin:"0 0 6px", background:"linear-gradient(135deg,#fff,#aaa)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent"}}>Connaît ton vrai physique</h1>
          <div style={{color:"#555", fontSize:"13px"}}>Analyse IA · Résultats en secondes</div>
        </div>
      )}

      {view === "home" && step === "upload" && (
        <div style={{...s.card, maxWidth: isMobile ? "420px" : "600px"}}>
          <input ref={fileRef} type="file" accept="image/*" style={{display:"none"}} onChange={handleFile}/>
        {/* desktop hint */}
          <div style={s.uploadZone} onClick={() => fileRef.current.click()}>
            <div style={{fontSize:"48px", marginBottom:"12px"}}>📸</div>
            <div style={{fontSize:"16px", fontWeight:"700", marginBottom:"6px"}}>Dépose ta photo ici</div>
            <div style={{fontSize:"12px", color:"#555"}}>ou clique pour sélectionner · obligatoire</div>
          </div>

          <div style={{marginTop:"20px", padding:"14px", background:"rgba(255,215,0,0.04)", borderRadius:"12px", border:"1px solid rgba(255,215,0,0.1)"}}>
            <div style={{fontSize:"11px", color:"#FFD700", letterSpacing:"2px", marginBottom:"8px"}}>CONSEILS PHOTO</div>
            {["Tenue ajustée (sport, maillot)", "Bonne lumière, de face", "Photo récente de toi"].map((t,i) => (
              <div key={i} style={{display:"flex", alignItems:"center", gap:"8px", marginBottom:"6px"}}>
                <span style={{color:"#FFD700", fontSize:"10px"}}>✦</span>
                <span style={{fontSize:"13px", color:"#aaa"}}>{t}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {view === "home" && step === "form" && (
        <div style={{...s.card, maxWidth: isMobile ? "420px" : "520px"}}>
          {imagePreview && (
            <div style={{borderRadius:"16px", overflow:"hidden", marginBottom:"20px", maxHeight:"200px", background:"#111"}}>
              <img src={imagePreview} alt="" style={{width:"100%", objectFit:"cover", maxHeight:"200px"}}/>
            </div>
          )}
          <span style={s.label}>Genre</span>
          <div style={{display:"flex", gap:"10px", marginTop:"8px"}}>
            <button style={s.genderBtn(gender==="male")} onClick={() => setGender("male")}>♂ Homme</button>
            <button style={s.genderBtn(gender==="female")} onClick={() => setGender("female")}>♀ Femme</button>
          </div>
          <span style={s.label}>Âge (optionnel)</span>
          <input style={s.input} type="number" placeholder="Ex : 24" value={age} onChange={e=>setAge(e.target.value)} min="10" max="99"/>
          <span style={s.label}>Poids (kg) · optionnel</span>
          <input style={s.input} type="number" placeholder="Ex : 75" value={weight} onChange={e=>setWeight(e.target.value)} min="30" max="300"/>
          {error && <div style={{marginTop:"12px", color:"#FF6B6B", fontSize:"13px", textAlign:"center"}}>{error}</div>}
          <button style={{...s.btn(), opacity:!gender?0.4:1, cursor:!gender?"not-allowed":"pointer"}} onClick={analyze} disabled={!gender}>
            Analyser mon physique →
          </button>
          <button style={s.secondaryBtn} onClick={() => setStep("upload")}>← Changer de photo</button>
        </div>
      )}

      {view === "home" && step === "analyzing" && (
        <div style={{...s.card, textAlign:"center", maxWidth: isMobile ? "420px" : "520px"}}>
          <div style={{fontSize:"48px", marginBottom:"20px"}}>🔬</div>
          <div style={{fontSize:"18px", fontWeight:"700", marginBottom:"8px"}}>Analyse en cours…</div>
          <div style={{fontSize:"13px", color:"#555"}}>L'IA examine ta composition corporelle</div>
          <div style={{marginTop:"24px", display:"flex", flexDirection:"column", gap:"8px"}}>
            {["Détection musculaire…","Analyse sous-cutanée…","Calibration archétype…"].map((t,i) => (
              <div key={i} style={{display:"flex", alignItems:"center", gap:"10px", padding:"10px 14px", background:"rgba(255,255,255,0.03)", borderRadius:"10px"}}>
                <div style={{width:"6px", height:"6px", borderRadius:"50%", background:"#FFD700", boxShadow:"0 0 8px #FFD700"}}/>
                <span style={{fontSize:"13px", color:"#777"}}>{t}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {view === "home" && step === "result" && result && archetype && (
        <div style={{width:"100%", maxWidth: isMobile ? "420px" : "900px"}}>
          <ShareCard imagePreview={imagePreview} result={result} archetype={archetype} onReady={setShareUrl}/>
          <div style={{display:"flex", flexDirection: isMobile ? "column" : "row", gap:"20px", alignItems:"flex-start"}}>
          <div style={{flex: isMobile ? "none" : "0 0 420px", display:"flex", flexDirection:"column", gap:"16px"}}>

          <div style={{...s.card, textAlign:"center"}}>
            <div style={s.archetypeBadge(archetype.color)}>{archetype.icon} {archetype.label}</div>
            <div style={{fontSize:"22px", fontWeight:"800", color:archetype.color, marginBottom:"4px"}}>{archetype.ref}</div>
            <div style={{display:"flex", justifyContent:"center", margin:"20px 0 8px"}}>
              <GaugeRing percent={result.bodyfat} color={archetype.color}/>
            </div>
            <div style={{fontSize:"14px", color:"#aaa", fontStyle:"italic", marginBottom:"12px"}}>"{archetype.desc}"</div>
            <div style={{fontSize:"12px", color:"#444"}}>
              <span style={{display:"inline-block", width:"7px", height:"7px", borderRadius:"50%", background:result.confidence==="high"?"#7DF9AA":result.confidence==="medium"?"#FFD700":"#FF6B6B", marginRight:"6px", verticalAlign:"middle"}}/>
              {result.confidence_reason}
            </div>
          </div>

          {result.key_indicators?.length > 0 && (
            <div style={s.card}>
              <div style={{fontSize:"11px", letterSpacing:"2px", color:"#555", marginBottom:"14px"}}>INDICATEURS ANALYSÉS</div>
              {result.key_indicators.map((ind,i) => (
                <div key={i} style={{display:"flex", gap:"10px", marginBottom:"10px"}}>
                  <span style={{color:archetype.color, fontSize:"14px"}}>◆</span>
                  <span style={{fontSize:"13px", color:"#bbb", lineHeight:"1.5"}}>{ind}</span>
                </div>
              ))}
            </div>
          )}

          {result.note && (
            <div style={{...s.card, background:`linear-gradient(135deg,${archetype.color}0d,transparent)`, border:`1px solid ${archetype.color}22`, textAlign:"center"}}>
              <div style={{fontSize:"20px", marginBottom:"8px"}}>💬</div>
              <div style={{fontSize:"14px", color:"#ccc", fontStyle:"italic"}}>{result.note}</div>
            </div>
          )}

          </div>
          <div style={{flex:1, display:"flex", flexDirection:"column", gap:"16px"}}>
          <div style={s.card}>
            <div style={{fontSize:"11px", letterSpacing:"2px", color:"#555", marginBottom:"14px"}}>TA CARTE DE PARTAGE</div>
            {shareUrl ? (
              <>
                <div style={{borderRadius:"16px", overflow:"hidden", marginBottom:"14px", border:`1px solid ${archetype.color}22`}}>
                  <img src={shareUrl} alt="carte" style={{width:"100%", display:"block"}}/>
                </div>
                <button style={s.btn(archetype.color)} onClick={async () => {
                  const text = `Mon body fat : ${result.bodyfat}% — ${archetype.ref} ${archetype.icon} | PHYSIQRATE`;
                  if (navigator.share) {
                    try {
                      const blob = await (await fetch(shareUrl)).blob();
                      const file = new File([blob],"physiqrate.png",{type:"image/png"});
                      if (navigator.canShare?.({files:[file]})) { await navigator.share({files:[file],text}); return; }
                    } catch {}
                  }
                  const a = document.createElement("a"); a.href=shareUrl; a.download="physiqrate.png"; a.click();
                }}>📤 Partager mon résultat</button>
              </>
            ) : (
              <div style={{textAlign:"center", padding:"16px", color:"#555", fontSize:"13px"}}>Génération…</div>
            )}
            <button style={s.secondaryBtn} onClick={reset}>🔄 Nouvelle analyse</button>
          </div>
          </div>
          </div>
        </div>
      )}

      {/* PROFILE */}
      {view === "profile" && premium && (
        <div style={{width:"100%", maxWidth: isMobile ? "420px" : "600px"}}><ProfileScreen /></div>
      )}

      {/* DASHBOARD */}
      {view === "dashboard" && (
        <div style={{width:"100%", maxWidth: isMobile ? "420px" : "900px", display:"flex", flexDirection:"column", gap:"16px"}}>
          {!premium ? (
            <div style={{...s.card, textAlign:"center"}}>
              <div style={{fontSize:"40px", marginBottom:"16px"}}>📈</div>
              <div style={{fontSize:"20px", fontWeight:"800", marginBottom:"8px"}}>Ta progression</div>
              <div style={{fontSize:"13px", color:"#555", marginBottom:"24px", lineHeight:"1.6"}}>Suis l'évolution de ton body fat semaine après semaine. Courbe de progression, historique complet.</div>
              {history.length > 0 && (
                <div style={{filter:"blur(5px)", pointerEvents:"none", marginBottom:"16px"}}>
                  <ProgressChart history={history} color="#FFD700"/>
                </div>
              )}
              <button style={{...s.btn(), marginTop:"0"}} onClick={() => { setDaysLeft(0); setShowPaywall(true); }}>
                Débloquer Physiqrate Pro
              </button>
              <div style={{fontSize:"12px", color:"#444", marginTop:"10px"}}>Abonnement 4,99€/mois</div>
            </div>
          ) : (
            <>
              {history.length > 0 && (() => {
                const latest = history[0];
                const oldest = history[history.length - 1];
                const diff = latest.bodyfat - oldest.bodyfat;
                const arch = getArchetype(latest.bodyfat, latest.gender || "male");
                return (
                  <div style={s.card}>
                    <div style={{fontSize:"11px", letterSpacing:"2px", color:"#555", marginBottom:"16px"}}>RÉSUMÉ</div>
                    <div style={{display:"flex", gap:"12px"}}>
                      <div style={{flex:1, textAlign:"center", padding:"14px", background:"rgba(255,255,255,0.03)", borderRadius:"12px"}}>
                        <div style={{fontSize:"24px", fontWeight:"800", color:arch.color}}>{latest.bodyfat}%</div>
                        <div style={{fontSize:"11px", color:"#555", marginTop:"4px"}}>Actuel</div>
                      </div>
                      <div style={{flex:1, textAlign:"center", padding:"14px", background:"rgba(255,255,255,0.03)", borderRadius:"12px"}}>
                        <div style={{fontSize:"24px", fontWeight:"800", color: diff < 0 ? "#7DF9AA" : diff > 0 ? "#FF6B6B" : "#888"}}>
                          {diff === 0 ? "=" : `${diff > 0 ? "+" : ""}${diff}%`}
                        </div>
                        <div style={{fontSize:"11px", color:"#555", marginTop:"4px"}}>Évolution</div>
                      </div>
                      <div style={{flex:1, textAlign:"center", padding:"14px", background:"rgba(255,255,255,0.03)", borderRadius:"12px"}}>
                        <div style={{fontSize:"24px", fontWeight:"800", color:"#fff"}}>{history.length}</div>
                        <div style={{fontSize:"11px", color:"#555", marginTop:"4px"}}>Analyses</div>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {history.length >= 2 && (
                <div style={s.card}>
                  <div style={{fontSize:"11px", letterSpacing:"2px", color:"#555", marginBottom:"8px"}}>COURBE DE PROGRESSION</div>
                  <ProgressChart history={history} color={getArchetype(history[0].bodyfat, history[0].gender || "male").color}/>
                </div>
              )}

              <div style={s.card}>
                <div style={{fontSize:"11px", letterSpacing:"2px", color:"#555", marginBottom:"14px"}}>HISTORIQUE</div>
                {history.length > 0 ? (
                  <HistoryCard history={history}/>
                ) : (
                  <div style={{textAlign:"center", padding:"20px"}}>
                    <div style={{fontSize:"13px", color:"#555", marginBottom:"12px"}}>Aucune analyse encore.</div>
                    <button style={s.btn()} onClick={() => { setView("home"); setStep("upload"); }}>Analyser maintenant →</button>
                  </div>
                )}
              </div>

              {/* Dev helper — remove in prod */}
              <button style={{...s.secondaryBtn, fontSize:"11px", color:"#333"}} onClick={() => { setPremium(false); setPremiumState(false); }}>
                [Dev] Désactiver premium
              </button>
            </>
          )}
        </div>
      )}

    </div>
  );
}
