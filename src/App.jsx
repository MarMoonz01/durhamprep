import { useState, useEffect } from "react";
import { fetchAllData, isSheetsConfigured } from "./services/googleSheets";
import {
  defaultAccom,
  defaultCollegeAccom,
  defaultVaccines,
  defaultPacking,
  defaultShopping,
  defaultIntrovert,
  defaultTimeline,
  defaultPlaces,
  defaultContacts,
  defaultChecklist,
  defaultChecklistGroups,
  defaultHomeStatus,
  defaultAcademic,
  defaultCareer,
  defaultLifeUK,
  defaultBudgetData,
} from "./data/defaults";

// ─── Shared Components ───────────────────────────────────────────────────────

function Stars({ val, size }) {
  size = size || 10;
  var full = Math.floor(val);
  var half = val % 1 >= 0.5 ? 1 : 0;
  var empty = 5 - full - half;
  var out = [];
  for (var i = 0; i < full; i++)
    out.push(<span key={"f" + i} style={{ color: "#FFB300", fontSize: size }}>★</span>);
  if (half)
    out.push(<span key="h" style={{ color: "#FFB300", fontSize: size }}>⯪</span>);
  for (var j = 0; j < empty; j++)
    out.push(<span key={"e" + j} style={{ color: "#ddd", fontSize: size }}>★</span>);
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 0 }}>
      {out}
      <span style={{ fontSize: size - 1, color: "#888", marginLeft: 2 }}>{val}</span>
    </span>
  );
}

// ─── App ────────────────────────────────────────────────────────────────────

export default function App() {
  const [tab, setTab] = useState(function() {
    var h = window.location.hash.replace('#', '');
    return h || "home";
  });
  const [openA, setOpenA] = useState(-1);
  const [accomQuiz, setAccomQuiz] = useState({ budget: null, priority: null, deposit: null });
  const [rate, setRate] = useState(44);
  const [openIntro, setOpenIntro] = useState(0);
  const [openShop, setOpenShop] = useState(0);

  // Dark mode
  const [dark, setDark] = useState(() => localStorage.getItem('durham_dark') === '1');

  var C = {
    bg:     dark ? "#0f0f1a" : "#f0f2f8",
    card:   dark ? "#1a1f35" : "#fff",
    text:   dark ? "#e2e2e2" : "#1a1a2e",
    sub:    dark ? "#7a7a9a" : "#6b7280",
    border: dark ? "#252a42" : "#e8eaf2",
    tabBg:  dark ? "#1a1f35" : "#fff",
    tabText:dark ? "#9090b0" : "#6b7280",
    shadow: dark ? "none"    : "0 2px 12px rgba(26,35,126,0.08)",
    pill:   dark ? "#252a42" : "#eff0f8",
  };

  function toggleDark() {
    setDark(function(d) {
      localStorage.setItem('durham_dark', !d ? '1' : '0');
      return !d;
    });
  }

  // localStorage checkboxes
  const [checked, setChecked] = useState(function() {
    try { return JSON.parse(localStorage.getItem('durham_checked') || '{}'); } catch { return {}; }
  });
  useEffect(function() { localStorage.setItem('durham_checked', JSON.stringify(checked)); }, [checked]);
  function toggle(key) { setChecked(function(prev) { return Object.assign({}, prev, { [key]: !prev[key] }); }); }

  // Search state
  const [packSearch, setPackSearch] = useState('');
  const [shopSearch, setShopSearch] = useState('');

  // Cost Calculator — selected accommodation (legacy single-select, unused in new UI)
  const [selectedAccomIdx, setSelectedAccomIdx] = useState(0);
  // Multi-select cost comparison
  const [accomFull, setAccomFull] = useState([]);
  const [selectedRoomIds, setSelectedRoomIds] = useState([]);

  // Navigation drawer
  const [showMore, setShowMore] = useState(false);

  // PWA install banner
  const [installPrompt, setInstallPrompt] = useState(null);
  const [showInstall, setShowInstall] = useState(false);

  // Quick memo
  const [memo, setMemo] = useState(function() { return localStorage.getItem('durham_memo') || ''; });

  // ─── User Profile ─────────────────────────────────────────────────────────
  var DEFAULT_PROFILE = { ieltsL:'', ieltsR:'', ieltsW:'', ieltsS:'', budget:'', preference:'balanced', risk:'medium', courseStart:'2026-09-28', preSess:true, preSessWeeks:6, fundsAmount:'' };
  const [profile, setProfile] = useState(function() {
    try { return Object.assign({}, DEFAULT_PROFILE, JSON.parse(localStorage.getItem('durham_profile') || '{}')); } catch { return DEFAULT_PROFILE; }
  });
  useEffect(function() { localStorage.setItem('durham_profile', JSON.stringify(profile)); }, [profile]);
  function updateProfile(key, val) { setProfile(function(p) { return Object.assign({}, p, { [key]: val }); }); }

  // ─── Decision Engine ───────────────────────────────────────────────────────
  function computeDecision(p) {
    var L = parseFloat(p.ieltsL)||0, R = parseFloat(p.ieltsR)||0, W = parseFloat(p.ieltsW)||0, S = parseFloat(p.ieltsS)||0;
    var hasIELTS = L>0 && R>0 && W>0 && S>0;
    var overall = hasIELTS ? Math.round((L+R+W+S)/4*10)/10 : 0;
    var minComp = hasIELTS ? Math.min(L,R,W,S) : 9;
    // Durham LLM requirement: Overall 7.0, Writing 7.0, all other bands min 6.5
    var weak = hasIELTS ? [['L',L,6.5],['R',R,6.5],['W',W,7.0],['S',S,6.5]].filter(function(c){return c[1]<c[2];}).map(function(c){return c[0]+' (ต้อง '+c[2]+', ได้ '+c[1]+')';}) : [];
    var meetsDurham = hasIELTS && overall >= 7.0 && W >= 7.0 && L >= 6.5 && R >= 6.5 && S >= 6.5;

    var ielts = null;
    if (hasIELTS) {
      if (meetsDurham)
        ielts = { status:'pass', label:'✅ ผ่านเกณฑ์ Durham LLM', msg:'IELTS ผ่านครบ — Overall 7.0, W 7.0+, ทุก band ≥6.5', color:'#2E7D32', bg:'#E8F5E9' };
      else if (overall >= 6.5 || (overall >= 6.0 && minComp >= 5.5))
        ielts = { status:'presess', label:'📚 ต้องผ่าน Pre-sessional', msg:'ยังไม่ผ่านเกณฑ์ Durham'+(weak.length?' · ต้องปรับ: '+weak.join(', '):''), color:'#E65100', bg:'#FFF3E0' };
      else
        ielts = { status:'retake', label:'🔄 Retake IELTS', msg:'Overall ต่ำกว่า 6.5 — ควร retake ก่อนยื่นสมัคร', color:'#C62828', bg:'#FFEBEE' };
    }

    var budget = parseFloat(p.budget)||0, pref = p.preference;
    var accomRec = null;
    if (pref === 'social')
      accomRec = { name:'College Accommodation', sub:'Josephine Butler / Ustinov College', reason:'Community events, social life, ถูกกว่า private — เหมาะคนชอบเจอผู้คน', badge:'👥 SOCIAL PICK', color:'#1565C0', bg:'#E3F2FD', tab:'accom' };
    else if (pref === 'privacy' && budget >= 350)
      accomRec = { name:'Student Castle — Bellamy Studio', sub:'£360/wk via uhomes · 20 Claypath', reason:'Facilities ดีสุด 24/7 Gym + Cinema ใกล้กลางเมือง ห้องส่วนตัวสมบูรณ์แบบ No Deposit!', badge:'🎬 BEST FACILITIES', color:'#6A1B9A', bg:'#F3E5F5', tab:'accom' };
    else if (budget > 0 && budget < 270)
      accomRec = { name:'St Giles Studios — Standard Studio', sub:'£255/wk via uhomes · 110 Gilesgate', reason:'ราคาถูกที่สุด King-size bed ประหยัดได้ ~£1,734/ปีเมื่อเทียบ Duresme', badge:'💰 BEST VALUE', color:'#0D47A1', bg:'#E8EAF6', tab:'accom' };
    else
      accomRec = { name:'Duresme Court — Classic Studio', sub:'£289/wk via uhomes · Newcastle Road', reason:'ใกล้ Law School มากที่สุด ส่วนตัว คุ้มค่า รีวิว 4.8 — สมดุลที่สุด', badge:'🏆 BEST PICK', color:'#1B5E20', bg:'#E8F5E9', tab:'accom' };

    return { ielts, accomRec, overall, hasIELTS, minComp, weak, meetsDurham, L, R, W, S };
  }

  // ─── Dynamic Timeline ──────────────────────────────────────────────────────
  function computeTimeline(p) {
    var start = new Date(p.courseStart || '2026-09-28');
    var preSessWks = p.preSess ? (parseInt(p.preSessWeeks)||6) : 0;
    var today = new Date(); today.setHours(0,0,0,0);
    function addDays(d,n) { var x=new Date(d); x.setDate(x.getDate()+n); return x; }
    function fmt(d) { return d.toLocaleDateString('th-TH',{day:'numeric',month:'short',year:'2-digit'}); }
    function days(d) { return Math.ceil((d-today)/864e5); }

    var preSessStart = addDays(start, -preSessWks*7);
    var arrival     = addDays(preSessStart, -1);
    var visaApply   = addDays(arrival, -70);   // target: 10wk before arrival
    var fundsDeposit= addDays(visaApply, -28);  // 28 days before visa app
    var casExpected = addDays(start, -90);       // ~3 months before start
    var vaccineDue  = addDays(arrival, -42);     // 6wk before departure

    return [
      { key:'funds',   label:'💰 ฝากเงินค้ำวีซ่า £37,579',       date:fundsDeposit,  fmt:fmt(fundsDeposit),  days:days(fundsDeposit),  risk:'high' },
      { key:'vaccine', label:'💉 ฉีดวัคซีน MenACWY + MenB',      date:vaccineDue,    fmt:fmt(vaccineDue),    days:days(vaccineDue),    risk:'high' },
      { key:'cas',     label:'📋 รับ CAS จาก Durham',             date:casExpected,   fmt:fmt(casExpected),   days:days(casExpected),   risk:'medium' },
      { key:'visa',    label:'📋 ยื่นวีซ่า Student UK ที่ VFS',   date:visaApply,     fmt:fmt(visaApply),     days:days(visaApply),     risk:'high' },
      { key:'arrival', label:'✈️ บินถึง UK',                       date:arrival,       fmt:fmt(arrival),       days:days(arrival),       risk:'high' },
      { key:'presess', label:'🎓 Pre-sessional เริ่ม',             date:preSessStart,  fmt:fmt(preSessStart),  days:days(preSessStart),  risk:'high' },
      { key:'course',  label:'🎓 เริ่มเรียน LLM',                 date:start,         fmt:fmt(start),         days:days(start),         risk:'low'  },
    ].sort(function(a,b){ return a.date-b.date; });
  }

  // ─── Next Actions ──────────────────────────────────────────────────────────
  function computeNextActions(p, chk, tl, dec) {
    var actions = [];
    var checkKey = function(txt) { return !!chk['check_'+txt]; };

    if (!p.ieltsL) actions.push({ id:'setup', task:'👤 กรอก IELTS scores ของคุณ', sub:'ให้ระบบแนะนำได้แม่นยำขึ้น', days:null, risk:'medium', tab:'decide' });
    if (dec.ielts && dec.ielts.status==='retake') actions.push({ id:'ielts_retake', task:'🔄 จอง IELTS Retake ด่วน!', sub:'Overall ยังต่ำกว่าเกณฑ์ Durham 7.0', days:null, risk:'high', tab:'decide' });
    if (!checkKey('จอง Private PBSA ผ่าน uhomes.com')) actions.push({ id:'accom', task:'🏠 จองที่พัก (No Visa No Pay!)', sub:'จองก่อน ยกเลิกได้ถ้าวีซ่าไม่ผ่าน ไม่เสียเงิน', days:null, risk:'high', tab:'accom' });

    var deadlineActions = {
      funds:   { task:'💰 ฝากเงิน £37,579 เข้าบัญชี', sub:'ต้องอยู่ครบ 28 วันติดต่อกันก่อนยื่นวีซ่า', tab:'decide' },
      vaccine: { task:'💉 ฉีดวัคซีน MenACWY + MenB', sub:'ต้องฉีด 2 เข็มห่าง 1 เดือน ทำก่อนได้เลย', tab:'vax' },
      cas:     { task:'📋 ติดตาม CAS จาก Durham', sub:'ต้องได้ CAS ก่อนยื่นวีซ่า — email Durham ถ้าช้า', tab:'visa' },
      visa:    { task:'📋 ยื่น Student Visa ที่ VFS', sub:'ค่าวีซ่า £524 + IHS £388 — เตรียมเอกสารให้ครบ', tab:'visa' },
    };
    var doneMap = {
      funds: checkKey('เริ่มเตรียมเงิน £37,579 ในบัญชี 28 วัน'),
      cas:   checkKey('รอ CAS จาก Durham'),
      visa:  checkKey('ยื่น Visa ที่ VFS (ค่าวีซ่า £524 / IHS £388)'),
    };

    tl.forEach(function(t) {
      if (deadlineActions[t.key] && !doneMap[t.key] && t.days > 0 && t.days <= 120) {
        actions.push({ id:t.key, task:deadlineActions[t.key].task, sub:deadlineActions[t.key].sub, days:t.days, risk:t.risk, tab:deadlineActions[t.key].tab });
      }
    });

    return actions.slice(0, 3);
  }

  // Expense Tracker state
  var BUDGETS = { "🍽️ อาหาร": 250, "🚌 เดินทาง": 25, "📚 หนังสือ/เรียน": 50, "🎉 สังสรรค์": 60, "🛒 ของใช้": 40, "💊 สุขภาพ": 20, "✈️ ท่องเที่ยว": 80, "📦 อื่นๆ": 50 };
  var EXPENSE_CATS = Object.keys(BUDGETS);
  const [expenses, setExpenses] = useState(function() {
    try { return JSON.parse(localStorage.getItem('durham_expenses') || '[]'); } catch { return []; }
  });
  useEffect(function() { localStorage.setItem('durham_expenses', JSON.stringify(expenses)); }, [expenses]);
  const [expForm, setExpForm] = useState({ desc: '', amount: '', cat: EXPENSE_CATS[0], date: new Date().toISOString().slice(0, 10) });
  function addExpense() {
    if (!expForm.desc || !expForm.amount) return;
    setExpenses(function(prev) { return [{ id: Date.now(), ...expForm, amount: parseFloat(expForm.amount) }, ...prev]; });
    setExpForm(function(f) { return { ...f, desc: '', amount: '' }; });
  }
  function delExpense(id) { setExpenses(function(prev) { return prev.filter(function(e) { return e.id !== id; }); }); }

  // Accommodation view toggle
  const [accomView, setAccomView] = useState("private"); // "private" | "college"

  // Data state — starts with defaults, replaced by Google Sheets if configured
  const [accom, setAccom] = useState(defaultAccom);
  const [colAccom, setColAccom] = useState(defaultCollegeAccom);
  const [vaccines, setVaccines] = useState(defaultVaccines);
  const [packing, setPacking] = useState(defaultPacking);
  const [shopping, setShopping] = useState(defaultShopping);
  const [introvert, setIntrovert] = useState(defaultIntrovert);
  const [timeline, setTimeline] = useState(defaultTimeline);
  const [places, setPlaces] = useState(defaultPlaces);
  const [contacts, setContacts] = useState(defaultContacts);
  const [checklist, setChecklist] = useState(defaultChecklist);
  // Sheets-driven content states (initialized with built-in defaults)
  const [checklistGroups, setChecklistGroups] = useState(defaultChecklistGroups);
  const [homeStatus, setHomeStatus] = useState(defaultHomeStatus);
  const [academic, setAcademic] = useState(defaultAcademic);
  const [career, setCareer] = useState(defaultCareer);
  const [lifeuk, setLifeUK] = useState(defaultLifeUK);
  const [priceComparison, setPriceComparison] = useState([]);
  const [accomRating, setAccomRating] = useState({ headers: [], rows: [] });
  const [sheetExpenses, setSheetExpenses] = useState([]);
  // Budget Planner state
  const [budgetLifestyle, setBudgetLifestyle] = useState("balanced");
  const [budgetData, setBudgetData] = useState(defaultBudgetData);
  const [openBudgetCat, setOpenBudgetCat] = useState(-1);
  const [sheetsStatus, setSheetsStatus] = useState(
    isSheetsConfigured() ? "loading" : "not-configured"
  );

  // Fetch live exchange rate
  useEffect(function () {
    fetch("https://api.exchangerate-api.com/v4/latest/GBP")
      .then(function (r) { return r.json(); })
      .then(function (d) { if (d && d.rates && d.rates.THB) setRate(d.rates.THB); })
      .catch(function () {});
  }, []);

  // Fetch data from Google Sheets (falls back to defaults if not configured or on error)
  useEffect(function () {
    if (!isSheetsConfigured()) return;
    fetchAllData()
      .then(function (data) {
        if (data.accom.length) setAccom(data.accom);
        if (data.accomFull && data.accomFull.length) setAccomFull(data.accomFull);
        if (data.colAccom && data.colAccom.length) setColAccom(data.colAccom);
        if (data.vaccines.length) setVaccines(data.vaccines);
        if (data.packing.length) setPacking(data.packing);
        if (data.shopping.length) setShopping(data.shopping);
        if (data.introvert.length) setIntrovert(data.introvert);
        if (data.timeline.length) setTimeline(data.timeline);
        if (data.places.length) setPlaces(data.places);
        if (data.contacts.length) setContacts(data.contacts);
        if (data.checklist.length) setChecklist(data.checklist);
        // Do NOT replace checklistGroups from Sheets — the phase-based grouping
        // (✅ เสร็จแล้ว, 🔴 มี.ค.-เม.ย., etc.) is the designed UI structure.
        // Sheets `checklist` above already provides updated deadline dates via deadlineMap.
        if (data.homeStatus.length) setHomeStatus(data.homeStatus);
        if (data.academic.length) setAcademic(data.academic);
        if (data.career.length) setCareer(data.career);
        if (data.lifeuk.length) setLifeUK(data.lifeuk);
        if (data.priceComparison && data.priceComparison.length) setPriceComparison(data.priceComparison);
        if (data.accomRating && data.accomRating.headers && data.accomRating.headers.length) setAccomRating(data.accomRating);
        if (data.sheetExpenses && data.sheetExpenses.length) setSheetExpenses(data.sheetExpenses);
        if (data.checklistGroups && data.checklistGroups.length) setChecklistGroups(data.checklistGroups);
        if (data.budget && data.budget.lifestyle && data.budget.lifestyle.balanced.categories.length) setBudgetData(data.budget);
        setSheetsStatus("ok");
      })
      .catch(function (err) {
        console.warn("Google Sheets fetch failed, using defaults:", err.message);
        setSheetsStatus("error");
      });
  }, []);

  // URL hash sync — keep browser URL in sync with active tab
  useEffect(function() {
    window.history.pushState(null, '', '#' + tab);
  }, [tab]);
  useEffect(function() {
    function onHash() {
      var h = window.location.hash.replace('#', '');
      if (h) setTab(h);
    }
    window.addEventListener('hashchange', onHash);
    return function() { window.removeEventListener('hashchange', onHash); };
  }, []);

  // PWA install prompt
  useEffect(function() {
    function onPrompt(e) {
      e.preventDefault();
      setInstallPrompt(e);
      if (!localStorage.getItem('durham_install_dismissed')) setShowInstall(true);
    }
    window.addEventListener('beforeinstallprompt', onPrompt);
    return function() { window.removeEventListener('beforeinstallprompt', onPrompt); };
  }, []);

  // Memo persistence
  useEffect(function() { localStorage.setItem('durham_memo', memo); }, [memo]);

  // Google Sheets link
  var SHEETS_URL = import.meta.env.VITE_GOOGLE_SHEETS_ID
    ? "https://docs.google.com/spreadsheets/d/" + import.meta.env.VITE_GOOGLE_SHEETS_ID + "/edit"
    : null;

  // Navigation constants
  var BOTTOM_NAV = [
    { id: "home",   icon: "📊", l: "สรุป" },
    { id: "decide", icon: "🎯", l: "แนะนำ" },
    { id: "check",  icon: "✅", l: "Checklist" },
    { id: "accom",  icon: "🏠", l: "ที่พัก" },
    { id: "_more",  icon: "⋯",  l: "อื่นๆ" },
  ];
  var MORE_GROUPS = [
    { g: "📅 แผนการ",     ids: ["timeline", "visa", "vax", "fly"] },
    { g: "🛍️ จัดเตรียม",  ids: ["shop", "pack", "life"] },
    { g: "📍 Durham",      ids: ["places", "contacts"] },
    { g: "💰 การเงิน",    ids: ["budget", "money", "cost", "expense"] },
    { g: "🎓 เรียน/งาน",  ids: ["academic", "career", "intro"] },
  ];

  var tabs = [
    { id: "home",      l: "📊 สรุป" },
    { id: "decide",    l: "🎯 แนะนำเลย" },
    { id: "check",     l: "✅ Checklist" },
    { id: "timeline",  l: "📅 Timeline" },
    { id: "accom",     l: "🏠 ที่พัก" },
    { id: "places",    l: "🗺️ Durham" },
    { id: "contacts",  l: "📞 ติดต่อ" },
    { id: "cost",      l: "🧮 คำนวณงบ" },
    { id: "money",     l: "💰 งบทั้งหมด" },
    { id: "visa",      l: "📋 วีซ่า" },
    { id: "vax",       l: "💉 วัคซีน" },
    { id: "fly",       l: "✈️ เดินทาง" },
    { id: "shop",      l: "🛒 ของที่ต้องซื้อ" },
    { id: "pack",      l: "🧳 เตรียมของ" },
    { id: "intro",     l: "🧠 Introvert Guide" },
    { id: "life",      l: "📱 ชีวิต UK" },
    { id: "budget",    l: "💰 Budget Planner" },
    { id: "expense",   l: "💷 Expense Tracker" },
    { id: "academic",  l: "🎓 Academic Prep" },
    { id: "career",    l: "💼 Career" },
  ];

  var r = rate;

  // checkGroups — derived from Sheets state (defaults to built-in data in defaults.js)
  var checkGroups = checklistGroups.map(function(g) { return [g.preDone ? 1 : 0, g.phase, g.color, g.items]; });

  // Count done items across all groups
  var checkDone = checkGroups.reduce(function(a, g) {
    return a + (g[0] ? g[3].length : g[3].filter(function(it) { return checked['check_' + it]; }).length);
  }, 0);
  var checkTotal = checkGroups.reduce(function(a, g) { return a + g[3].length; }, 0);

  // Unchecked non-preDone items (for badge)
  var checkUrgent = checkGroups.reduce(function(a, g) {
    if (g[0]) return a;
    return a + g[3].filter(function(it) { return !checked['check_' + it]; }).length;
  }, 0);

  // ─── Decision Engine Outputs (computed on every render, cheap pure functions) ─
  var decision    = computeDecision(profile);
  var dynTimeline = computeTimeline(profile);
  var nextActions = computeNextActions(profile, checked, dynTimeline, decision);

  // Deadline map from flat checklist: { itemText: "YYYY-MM-DD" }
  var deadlineMap = {};
  checklist.forEach(function(it) {
    if (it.item && it.deadline) deadlineMap[it.item] = it.deadline;
  });
  function daysUntil(dateStr) {
    if (!dateStr) return null;
    var s = String(dateStr).trim();
    // Handle GViz format: "Date(2026,2,30)" — month is 0-indexed
    var gviz = s.match(/^Date\((\d+),(\d+),(\d+)\)$/);
    if (gviz) s = gviz[1] + '-' + String(+gviz[2]+1).padStart(2,'0') + '-' + String(+gviz[3]).padStart(2,'0');
    var deadline = new Date(s + 'T00:00:00');
    if (isNaN(deadline.getTime())) return null;
    var today = new Date(); today.setHours(0,0,0,0);
    return Math.ceil((deadline - today) / 864e5);
  }

  return (
    <div
      style={{
        fontFamily: "-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif",
        maxWidth: 700,
        margin: "0 auto",
        padding: "0 12px 96px",
        background: C.bg,
        minHeight: "100vh",
      }}
    >
      {/* Header */}
      <div
        style={{
          background: "linear-gradient(135deg,#0d1b3e 0%,#1a3a8a 60%,#2a4494 100%)",
          borderRadius: "0 0 24px 24px",
          padding: "16px 16px 14px",
          color: "#fff",
          marginBottom: 8,
          boxShadow: "0 4px 24px rgba(13,27,62,0.35)",
        }}
      >
        {/* Top action row */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
          <div style={{ fontSize: 9, opacity: 0.5, letterSpacing: 2, fontWeight: 700 }}>DURHAM UNIVERSITY 2026/27</div>
          <div style={{ display: "flex", gap: 6 }}>
            {SHEETS_URL && (
              <a
                href={SHEETS_URL}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  background: "rgba(255,255,255,0.18)",
                  border: "1px solid rgba(255,255,255,0.25)",
                  borderRadius: 20,
                  padding: "5px 12px",
                  color: "#fff",
                  fontSize: 11,
                  fontWeight: 700,
                  textDecoration: "none",
                  display: "flex",
                  alignItems: "center",
                  gap: 5,
                  backdropFilter: "blur(4px)",
                }}
              >
                <span style={{ fontSize: 13 }}>📊</span> Sheets ↗
              </a>
            )}
            <button
              onClick={toggleDark}
              style={{
                background: "rgba(255,255,255,0.18)",
                border: "1px solid rgba(255,255,255,0.25)",
                borderRadius: 20,
                padding: "5px 10px",
                color: "#fff",
                cursor: "pointer",
                fontSize: 14,
                display: "flex",
                alignItems: "center",
              }}
            >
              {dark ? "☀️" : "🌙"}
            </button>
          </div>
        </div>

        <h1 style={{ margin: "0 0 2px", fontSize: 18, fontWeight: 800, letterSpacing: -0.5 }}>
          🎓 Durham Go
        </h1>
        <div style={{ fontSize: 11, opacity: 0.75 }}>
          LLM International Trade &amp; Commercial Law · Pannathorn
        </div>

        {/* Sheets status badge */}
        {sheetsStatus !== "not-configured" && (
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
              marginTop: 6,
              padding: "3px 10px",
              borderRadius: 20,
              fontSize: 9,
              fontWeight: 700,
              background:
                sheetsStatus === "ok"
                  ? "rgba(76,175,80,0.25)"
                  : sheetsStatus === "loading"
                  ? "rgba(255,255,255,0.12)"
                  : "rgba(244,67,54,0.25)",
              border: "1px solid " + (sheetsStatus === "ok" ? "rgba(76,175,80,0.4)" : sheetsStatus === "loading" ? "rgba(255,255,255,0.2)" : "rgba(244,67,54,0.4)"),
              color: "#fff",
            }}
          >
            {sheetsStatus === "ok"
              ? "● Live จาก Google Sheets"
              : sheetsStatus === "loading"
              ? "○ กำลังโหลด..."
              : "⚠ Sheets error — ใช้ข้อมูล default"}
          </div>
        )}

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr 1fr",
            gap: 4,
            marginTop: 8,
          }}
        >
          {[
            {
              l: "Exchange Rate",
              v: "฿" + r.toFixed(2) + "/GBP",
              s:
                r <= 42
                  ? "🟢 ดีมาก แลกเลย!"
                  : r <= 43.5
                  ? "🟡 โอเค"
                  : r <= 45
                  ? "🟠 ปกติ"
                  : "🔴 แพง รอก่อน",
            },
            {
              l: "เงินค้ำวีซ่า",
              v: "฿" + Math.round(37579 * r).toLocaleString(),
              s: "£37,579 อยู่ 28 วัน",
            },
            {
              l: "Pre-sess เริ่ม",
              v: "3 ส.ค. 2026",
              s:
                "อีก ~" +
                Math.max(
                  0,
                  Math.ceil((new Date("2026-08-03") - new Date()) / 864e5)
                ) +
                " วัน",
            },
          ].map(function (x, i) {
            return (
              <div
                key={i}
                style={{
                  background: "rgba(255,255,255,0.1)",
                  borderRadius: 8,
                  padding: "6px 4px",
                  textAlign: "center",
                }}
              >
                <div style={{ fontSize: 8, opacity: 0.5 }}>{x.l}</div>
                <div style={{ fontSize: 13, fontWeight: 800 }}>{x.v}</div>
                <div style={{ fontSize: 8, opacity: 0.6 }}>{x.s}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* PWA Install Banner */}
      {showInstall && (
        <div style={{
          background: "linear-gradient(135deg,#1a237e,#283593)",
          borderRadius: 12, padding: "10px 14px", marginBottom: 6,
          display: "flex", alignItems: "center", gap: 10, color: "#fff",
        }}>
          <span style={{ fontSize: 20 }}>📲</span>
          <div style={{ flex: 1, fontSize: 12, fontWeight: 700 }}>
            ติดตั้งเป็น App บนมือถือ<br/>
            <span style={{ fontSize: 10, fontWeight: 400, opacity: 0.8 }}>เปิดได้แบบออฟไลน์ ไม่ต้องเปิดเบราว์เซอร์</span>
          </div>
          <button
            onClick={function() {
              if (installPrompt) { installPrompt.prompt(); }
              setShowInstall(false);
              localStorage.setItem('durham_install_dismissed', '1');
            }}
            style={{ background: "#fff", color: "#1a237e", border: "none", borderRadius: 20, padding: "6px 14px", fontSize: 11, fontWeight: 800, cursor: "pointer", flexShrink: 0 }}
          >ติดตั้ง</button>
          <button
            onClick={function() { setShowInstall(false); localStorage.setItem('durham_install_dismissed', '1'); }}
            style={{ background: "rgba(255,255,255,0.2)", color: "#fff", border: "none", borderRadius: 20, width: 28, height: 28, fontSize: 14, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}
          >✕</button>
        </div>
      )}

      {/* Current tab label pill */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 0 4px" }}>
        <div style={{ fontSize: 13, fontWeight: 800, color: C.text }}>
          {tabs.find(function(t) { return t.id === tab; }) ? tabs.find(function(t) { return t.id === tab; }).l : ""}
        </div>
      </div>

      {/* ── HOME ── */}
      {tab === "home" && (
        <div>
          {/* ── Next Actions Hero ── */}
          {nextActions.length > 0 && (
            <div style={{ marginBottom: 8 }}>
              <div style={{ fontSize: 10, fontWeight: 800, color: C.sub, letterSpacing: 1, padding: "0 2px 4px", textTransform: "uppercase" }}>🎯 ทำสิ่งนี้ก่อน</div>
              {nextActions.map(function(a, i) {
                var rc = a.risk==='high' ? "#C62828" : a.risk==='medium' ? "#E65100" : "#2E7D32";
                var rb = a.risk==='high' ? "#FFEBEE" : a.risk==='medium' ? "#FFF3E0" : "#E8F5E9";
                return (
                  <div key={a.id} onClick={function() { setTab(a.tab||'decide'); setShowMore(false); }}
                    style={{ background: i===0 ? rb : C.card, borderRadius: 12, padding: "10px 12px", marginBottom: 5, cursor:"pointer", border:"1px solid "+(i===0?rc:C.border), display:"flex", alignItems:"center", gap:10 }}>
                    <div style={{ width:26, height:26, borderRadius:"50%", background:rc, color:"#fff", display:"flex", alignItems:"center", justifyContent:"center", fontSize:11, fontWeight:800, flexShrink:0 }}>{i+1}</div>
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:11, fontWeight:800, color:i===0?rc:C.text }}>{a.task}</div>
                      <div style={{ fontSize:9, color:C.sub, marginTop:1 }}>{a.sub}</div>
                    </div>
                    {a.days !== null && (
                      <div style={{ textAlign:"center", flexShrink:0 }}>
                        <div style={{ fontSize:18, fontWeight:800, color:rc, lineHeight:1 }}>{a.days}</div>
                        <div style={{ fontSize:8, color:C.sub }}>วัน</div>
                      </div>
                    )}
                    <span style={{ color:C.sub, fontSize:12 }}>›</span>
                  </div>
                );
              })}
              <button onClick={function(){ setTab('decide'); setShowMore(false); }}
                style={{ width:"100%", padding:"8px", border:"1px dashed "+C.border, borderRadius:10, background:"none", color:C.sub, fontSize:10, cursor:"pointer", marginTop:2 }}>
                ดูคำแนะนำทั้งหมด →
              </button>
            </div>
          )}
          {/* Progress bars */}
          <div style={{ background: C.card, borderRadius: 12, padding: 12, marginBottom: 8 }}>
            <div style={{ fontSize: 12, fontWeight: 800, color: "#1a237e", marginBottom: 8 }}>📊 ความคืบหน้า</div>
            {[
              {
                label: "✅ Checklist",
                total: checkTotal,
                done: checkDone,
              },
              {
                label: "🧳 Packing",
                total: packing.reduce(function(a, c) { return a + c.i.length; }, 0),
                done: packing.reduce(function(a, c) {
                  return a + c.i.filter(function(item) { return checked['pack_' + c.c + '_' + item]; }).length;
                }, 0),
              },
              {
                label: "💉 วัคซีน",
                total: vaccines.length,
                done: vaccines.filter(function(v) { return checked['vax_' + v.n]; }).length,
              },
            ].map(function(p, pi) {
              return (
                <div key={pi} style={{ marginBottom: 8 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 2 }}>
                    <span style={{ fontSize: 10, color: C.text }}>{p.label}</span>
                    <span style={{ fontSize: 10, fontWeight: 700, color: "#1a237e" }}>{p.done}/{p.total}</span>
                  </div>
                  <div style={{ background: C.border, borderRadius: 4, height: 8 }}>
                    <div style={{ background: p.done === p.total && p.total > 0 ? "#2E7D32" : "#1a237e", borderRadius: 4, height: 8, width: (p.total ? (p.done / p.total * 100) : 0) + "%", transition: "width 0.3s" }} />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Status list — from Sheets tab "📊 Status", section="status" */}
          {homeStatus.filter(function(s) { return s.section === 'status'; }).length > 0 && (
            <div style={{ background: C.card, borderRadius: 12, padding: 14, marginBottom: 8 }}>
              <div style={{ fontSize: 12, fontWeight: 800, color: "#1a237e", marginBottom: 8 }}>📋 สถานะ</div>
              {homeStatus.filter(function(s) { return s.section === 'status'; }).map(function(s, i, arr) {
                return (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", borderBottom: i < arr.length - 1 ? "1px solid " + C.border : "none" }}>
                    <span style={{ fontSize: 11, color: C.text }}>{s.c2}</span>
                    <span style={{ fontSize: 10, fontWeight: 700, color: s.c4 || "#333" }}>{s.c3}</span>
                  </div>
                );
              })}
            </div>
          )}

          {/* Urgent actions — from Sheets tab "📊 Status", section="urgent" */}
          {homeStatus.filter(function(s) { return s.section === 'urgent'; }).length > 0 && (
            <div style={{ background: "#C62828", borderRadius: 12, padding: 12, color: "#fff", marginBottom: 8 }}>
              <div style={{ fontSize: 12, fontWeight: 800, marginBottom: 4 }}>🔥 ทำตอนนี้!</div>
              {homeStatus.filter(function(s) { return s.section === 'urgent'; }).map(function(a, i) {
                return <div key={i} style={{ fontSize: 11, marginBottom: 2 }}>→ {a.c2}</div>;
              })}
            </div>
          )}

          {/* Mini-timeline — from Sheets tab "📊 Status", section="timeline" */}
          {homeStatus.filter(function(s) { return s.section === 'timeline'; }).length > 0 && (
            <div style={{ background: C.card, borderRadius: 12, padding: 14, marginBottom: 8 }}>
              <div style={{ fontSize: 12, fontWeight: 800, color: "#1a237e", marginBottom: 8 }}>📅 Timeline</div>
              {homeStatus.filter(function(s) { return s.section === 'timeline'; }).map(function(e, i) {
                var hi = e.c5 === '1';
                return (
                  <div key={i} style={{ display: "flex", gap: 8, marginBottom: 5 }}>
                    <div style={{ width: 65, fontSize: 9, fontWeight: 700, color: hi ? "#C62828" : C.sub, textAlign: "right", flexShrink: 0 }}>{e.c3}</div>
                    <div style={{ width: 6, height: 6, borderRadius: "50%", background: hi ? "#C62828" : "#ccc", flexShrink: 0, marginTop: 4 }} />
                    <div style={{ fontSize: 11, color: hi ? C.text : C.sub, fontWeight: hi ? 700 : 400 }}>{e.c2}</div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Quick Memo */}
          <div style={{ background: C.card, borderRadius: 12, padding: 14, marginBottom: 8 }}>
            <div style={{ fontSize: 12, fontWeight: 800, color: "#1a237e", marginBottom: 8 }}>📝 บันทึกของฉัน</div>
            <textarea
              value={memo}
              onChange={function(e) { setMemo(e.target.value); }}
              placeholder="จดบันทึกสิ่งที่ต้องทำ, ข้อมูลสำคัญ, หรืออะไรก็ได้..."
              style={{
                width: "100%", boxSizing: "border-box",
                minHeight: 90, border: "1px solid " + C.border,
                borderRadius: 8, padding: "8px 10px", fontSize: 12,
                background: C.bg, color: C.text, resize: "vertical",
                fontFamily: "inherit", lineHeight: 1.5,
              }}
            />
          </div>
        </div>
      )}

      {/* ── CHECKLIST ── */}
      {tab === "check" && (
        <div>
          {/* Progress bar */}
          <div style={{ background: C.card, borderRadius: 12, padding: 12, marginBottom: 8 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: "#1a237e" }}>📊 ความคืบหน้า Checklist</span>
              <span style={{ fontSize: 11, fontWeight: 800, color: "#1a237e" }}>{checkDone}/{checkTotal}</span>
            </div>
            <div style={{ background: C.border, borderRadius: 4, height: 10 }}>
              <div style={{ background: checkDone === checkTotal ? "#2E7D32" : "#1a237e", borderRadius: 4, height: 10, width: (checkTotal ? (checkDone / checkTotal * 100) : 0) + "%", transition: "width 0.3s" }} />
            </div>
          </div>

          {checkGroups.map(function (cat, ci) {
            var isDoneGroup = !!cat[0];
            return (
              <div
                key={ci}
                style={{ background: C.card, borderRadius: 12, padding: 12, marginBottom: 6 }}
              >
                <div style={{ fontSize: 12, fontWeight: 800, color: cat[2], marginBottom: 6 }}>
                  {cat[1]}
                </div>
                {(cat[3] || []).map(function (it, ii) {
                  var key = 'check_' + it;
                  var isCh = isDoneGroup ? true : !!checked[key];
                  var days = daysUntil(deadlineMap[it]);
                  return (
                    <div
                      key={ii}
                      onClick={isDoneGroup ? undefined : function() { toggle(key); }}
                      style={{ display: "flex", gap: 6, marginBottom: 3, cursor: isDoneGroup ? "default" : "pointer", opacity: isCh && !isDoneGroup ? 0.6 : 1 }}
                    >
                      <div
                        style={{
                          width: 16,
                          height: 16,
                          borderRadius: 3,
                          border: "2px solid " + (isCh ? "#4CAF50" : C.border),
                          background: isCh ? "#E8F5E9" : C.card,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: 9,
                          flexShrink: 0,
                        }}
                      >
                        {isCh ? "✓" : ""}
                      </div>
                      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 6 }}>
                        <div
                          style={{
                            fontSize: 11,
                            color: isCh ? C.sub : C.text,
                            textDecoration: isCh ? "line-through" : "none",
                          }}
                        >
                          {it}
                        </div>
                        {days !== null && !isCh && (
                          <span style={{
                            fontSize: 9, fontWeight: 700, flexShrink: 0,
                            padding: "2px 7px", borderRadius: 8, textAlign: "center", lineHeight: 1.4,
                            background: days < 0 ? "#F3E5F5" : days <= 7 ? "#FFEBEE" : days <= 30 ? "#FFF3E0" : "#E8F5E9",
                            color: days < 0 ? "#6A1B9A" : days <= 7 ? "#C62828" : days <= 30 ? "#E65100" : "#2E7D32",
                          }}>
                            {days < 0
                              ? "เลย " + Math.abs(days) + " วัน"
                              : days === 0
                              ? "🔴 วันนี้!"
                              : days <= 30
                              ? days + " วัน"
                              : (function(){ var d=new Date(); var s=String(deadlineMap[it]||'').trim(); var g=s.match(/^Date\((\d+),(\d+),(\d+)\)$/); if(g) s=g[1]+'-'+String(+g[2]+1).padStart(2,'0')+'-'+String(+g[3]).padStart(2,'0'); d=new Date(s+'T00:00:00'); return isNaN(d.getTime())?'':d.toLocaleDateString('th-TH',{day:'numeric',month:'short'}); })()
                            }
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      )}

      {/* ── TIMELINE ── */}
      {tab === "timeline" && (
        <div>
          <div style={{ background: "linear-gradient(135deg,#1a237e,#283593)", borderRadius: 12, padding: 12, color: "#fff", marginBottom: 8 }}>
            <div style={{ fontSize: 13, fontWeight: 800 }}>📅 Timeline — เดือนไหนทำอะไร</div>
            <div style={{ fontSize: 10, opacity: 0.8, marginTop: 2 }}>มี.ค. 2026 → ก.ย. 2026</div>
          </div>
          {timeline.length === 0 ? (
            <div style={{ textAlign: "center", padding: 40, color: C.sub, fontSize: 12 }}>⏳ กำลังโหลด Timeline จาก Google Sheets...</div>
          ) : timeline.map(function(month, mi) {
            return (
              <div key={mi} style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 12, fontWeight: 800, color: "#1a237e", padding: "6px 8px", borderBottom: "2px solid #1a237e", marginBottom: 6, background: C.card, borderRadius: "8px 8px 0 0" }}>
                  {month.month}
                </div>
                {month.tasks.map(function(task, ti) {
                  var bc = task.imp && task.imp.includes("🔴") ? "#C62828" : task.imp && task.imp.includes("🟠") ? "#E65100" : "#F9A825";
                  var done = task.status && task.status.includes("✅");
                  return (
                    <div key={ti} style={{ background: C.card, padding: "8px 12px", marginBottom: 3, borderLeft: "4px solid " + bc, opacity: done ? 0.6 : 1 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 11, fontWeight: done ? 400 : 600, color: C.text, textDecoration: done ? "line-through" : "none" }}>{task.item}</div>
                          {task.cat && <div style={{ fontSize: 9, color: C.sub }}>{task.cat}</div>}
                        </div>
                        <span style={{ fontSize: 8, padding: "2px 6px", borderRadius: 8, background: done ? "#E8F5E9" : task.status && task.status.includes("🔴") ? "#FFEBEE" : "#FFF3E0", color: done ? "#2E7D32" : task.status && task.status.includes("🔴") ? "#C62828" : "#E65100", fontWeight: 700, whiteSpace: "nowrap", alignSelf: "flex-start" }}>{task.status || "⏳"}</span>
                      </div>
                      {task.note && <div style={{ fontSize: 9, color: C.sub, marginTop: 3, fontStyle: "italic" }}>💡 {task.note}</div>}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      )}

      {/* ── ACCOMMODATION ── */}
      {tab === "accom" && (
        <div>
          {/* Toggle: Private / College */}
          <div style={{ display: "flex", background: C.border, borderRadius: 10, padding: 3, marginBottom: 10, gap: 3 }}>
            {[["private","🏠 Private"],["college","🏛️ College"],["prices","💰 Prices"]].map(function(v) {
              var active = accomView === v[0];
              return (
                <button key={v[0]} onClick={function(){ setAccomView(v[0]); }}
                  style={{ flex:1, padding:"8px 0", borderRadius:8, border:"none", cursor:"pointer", fontWeight:active?800:500, fontSize:12,
                    background: active ? "#1a237e" : "transparent", color: active ? "#fff" : C.sub, transition:"all 0.2s" }}>
                  {v[1]}
                </button>
              );
            })}
          </div>

          {/* ── COLLEGE ACCOMMODATION VIEW ── */}
          {accomView === "college" && (
            <div>
              <div style={{ background:"linear-gradient(135deg,#1a237e,#283593)", borderRadius:12, padding:12, color:"#fff", marginBottom:8 }}>
                <div style={{ fontSize:13, fontWeight:800 }}>🏛️ University College Accommodation</div>
                <div style={{ fontSize:10, opacity:0.8, marginTop:2 }}>รวม Bills · มีอาหาร Formal Dinner · Community life — สมัครผ่าน College Preference</div>
              </div>
              <div style={{ background:"#FFF9C4", borderRadius:8, padding:10, marginBottom:8, fontSize:10 }}>
                <strong>💡 วิธีสมัคร:</strong> Durham Applicant Portal → College Preference → เลือก 1st/2nd/3rd choice<br/>
                <strong>Deadline:</strong> ~30 มี.ค. 2026 · ไม่ได้การันตี แต่มีโอกาสได้สูงถ้าสมัครเร็ว
              </div>
              {colAccom.map(function(c, ci) {
                var isOpen = openA === (100 + ci);
                return (
                  <div key={ci} style={{ background:C.card, borderRadius:12, marginBottom:6, borderLeft:"4px solid "+c.color, overflow:"hidden" }}>
                    <div onClick={function(){ setOpenA(isOpen ? -1 : 100+ci); }} style={{ padding:"10px 14px", cursor:"pointer" }}>
                      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
                        <div style={{ flex:1 }}>
                          <span style={{ background:c.color, color:"#fff", padding:"2px 8px", borderRadius:10, fontSize:9, fontWeight:700 }}>{c.badge}</span>
                          <div style={{ fontSize:14, fontWeight:800, color:c.color, marginTop:3 }}>{c.name}</div>
                          <div style={{ fontSize:10, color:C.sub }}>{c.forWho} · {c.dist}</div>
                        </div>
                        <div style={{ textAlign:"right", flexShrink:0, marginLeft:8 }}>
                          <div style={{ fontSize:13, fontWeight:800, color:c.color }}>£{c.rooms[0]?.pw}<span style={{ fontSize:9, fontWeight:400 }}>/wk</span></div>
                          <div style={{ fontSize:9, color:C.sub }}>{isOpen?"▲ ซ่อน":"▼ รายละเอียด"}</div>
                        </div>
                      </div>
                    </div>
                    {isOpen && (
                      <div style={{ padding:"0 14px 14px", borderTop:"1px solid "+C.border }}>
                        {c.why && <div style={{ fontSize:10, color:C.text, marginBottom:8, background:c.bg, padding:"6px 8px", borderRadius:6 }}>{c.why}</div>}
                        <div style={{ fontSize:11, fontWeight:700, color:c.color, marginBottom:4 }}>🛏️ ตัวเลือกห้อง:</div>
                        <div style={{ display:"flex", flexDirection:"column", gap:4, marginBottom:8 }}>
                          {c.rooms.map(function(rm, ri) {
                            return (
                              <div key={ri} style={{ display:"grid", gridTemplateColumns:"1fr auto auto auto", gap:4, alignItems:"center", background:C.border, borderRadius:6, padding:"6px 8px" }}>
                                <div style={{ fontSize:10, fontWeight:600, color:C.text }}>{rm.type}</div>
                                <div style={{ fontSize:10, color:C.sub }}>{rm.bath}</div>
                                <div style={{ fontSize:10, color:C.sub }}>{rm.wk}wk</div>
                                <div style={{ fontSize:13, fontWeight:800, color:c.color }}>£{rm.pw}/wk</div>
                              </div>
                            );
                          })}
                        </div>
                        {c.features.length > 0 && (
                          <>
                            <div style={{ fontSize:11, fontWeight:700, color:c.color, marginBottom:4 }}>✨ Facilities & สิ่งอำนวยความสะดวก:</div>
                            <div style={{ display:"flex", flexWrap:"wrap", gap:3, marginBottom:8 }}>
                              {c.features.map(function(f,fi){ return <span key={fi} style={{ fontSize:9, padding:"2px 8px", background:c.bg, borderRadius:10, color:c.color }}>{f}</span>; })}
                            </div>
                          </>
                        )}
                        {/* Cost comparison */}
                        <div style={{ background:C.border, borderRadius:6, padding:"6px 8px", fontSize:10 }}>
                          <strong>💰 ค่าใช้จ่ายรวม:</strong>{" "}
                          {c.rooms.map(function(rm,ri){
                            return <span key={ri} style={{ marginRight:8 }}>{rm.type}: <strong>£{(rm.pw*rm.wk).toLocaleString()}</strong> (~฿{Math.round(rm.pw*rm.wk*rate).toLocaleString()})</span>;
                          })}
                        </div>
                        {c.note && <div style={{ fontSize:9, color:"#E65100", fontWeight:700, marginTop:6 }}>💡 {c.note}</div>}
                      </div>
                    )}
                  </div>
                );
              })}
              {/* vs Private comparison note */}
              <div style={{ background:C.card, borderRadius:10, padding:10, marginTop:4, fontSize:10, borderLeft:"3px solid #1a237e" }}>
                <strong style={{ color:"#1a237e" }}>🆚 College vs Private Studio</strong>
                <div style={{ marginTop:4, color:C.sub }}>
                  College (~£150-200/wk): Bills รวม, Formal Dinners, Community life — แต่ครัวรวม ห้องเล็กกว่า<br/>
                  Private (~£265-363/wk): ครัวส่วนตัว ห้องน้ำส่วนตัว privacy สูง — แต่แพงกว่าและโดดเดี่ยวกว่า
                </div>
              </div>
            </div>
          )}

          {/* ── PRICE COMPARISON VIEW ── */}
          {accomView === "prices" && (
            <div>
              <div style={{ background: "linear-gradient(135deg,#1565C0,#1976D2)", borderRadius: 12, padding: 12, color: "#fff", marginBottom: 8 }}>
                <div style={{ fontSize: 13, fontWeight: 800 }}>💰 เปรียบเทียบราคา Direct vs uhomes vs Casita</div>
                <div style={{ fontSize: 10, opacity: 0.85, marginTop: 2 }}>ราคาจากหลาย platform — เลือกถูกที่สุดก่อนจอง</div>
              </div>

              {/* Quick links */}
              <div style={{ display: "flex", gap: 6, marginBottom: 8 }}>
                {[
                  { label: "Casita", url: "https://casita.com/search/durham-city", bg: "#6A1B9A" },
                  { label: "Durhomes", url: "https://www.durhomes.co.uk", bg: "#1565C0" },
                  { label: "Uhomes", url: "https://www.uhomes.com/uk/durham", bg: "#00695C" },
                ].map(function(p, pi) {
                  return (
                    <a key={pi} href={p.url} target="_blank" rel="noopener noreferrer"
                      style={{ flex: 1, padding: "8px 4px", background: p.bg, borderRadius: 8, color: "#fff", fontSize: 10, fontWeight: 700, textAlign: "center", textDecoration: "none" }}>
                      {p.label} →
                    </a>
                  );
                })}
              </div>

              {priceComparison.length === 0 ? (
                <div style={{ textAlign: "center", padding: 40, color: C.sub }}>⏳ กำลังโหลด...</div>
              ) : (
                (function() {
                  var providers = [...new Set(priceComparison.map(function(r) { return r.provider; }).filter(Boolean))];
                  return providers.map(function(prov, pi) {
                    var rooms = priceComparison.filter(function(r) { return r.provider === prov; });
                    return (
                      <div key={pi} style={{ background: C.card, borderRadius: 12, marginBottom: 8, overflow: "hidden" }}>
                        <div style={{ padding: "10px 14px", background: C.border, fontWeight: 800, fontSize: 12, color: "#1a237e" }}>{prov}</div>
                        {rooms.map(function(rm, ri) {
                          var cheapestIsUhomes = rm.cheapest && rm.cheapest.toLowerCase().includes("uhomes");
                          var cheapestIsCasita = rm.cheapest && rm.cheapest.toLowerCase().includes("casita");
                          return (
                            <div key={ri} style={{ padding: "10px 14px", borderBottom: ri < rooms.length - 1 ? "1px solid " + C.border : "none" }}>
                              <div style={{ fontSize: 11, fontWeight: 700, color: C.text, marginBottom: 6 }}>{rm.room}</div>
                              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 4, marginBottom: 4 }}>
                                {[
                                  { l: "Direct", v: rm.direct ? "£" + rm.direct : "–", hi: !cheapestIsUhomes && !cheapestIsCasita },
                                  { l: "uhomes", v: rm.uhomes || "–", hi: cheapestIsUhomes },
                                  { l: "Casita", v: rm.casita || "–", hi: cheapestIsCasita },
                                ].map(function(p, pli) {
                                  return (
                                    <div key={pli} style={{ background: p.hi ? "#E8F5E9" : C.border, borderRadius: 6, padding: "5px 6px", textAlign: "center", border: p.hi ? "1px solid #4CAF50" : "none" }}>
                                      <div style={{ fontSize: 8, color: p.hi ? "#2E7D32" : C.sub }}>{p.l}{p.hi ? " ✓" : ""}</div>
                                      <div style={{ fontSize: 11, fontWeight: 800, color: p.hi ? "#1B5E20" : C.text }}>{p.v}</div>
                                    </div>
                                  );
                                })}
                              </div>
                              {rm.diff && <div style={{ fontSize: 9, color: "#2E7D32", fontWeight: 700 }}>💰 ประหยัด: {rm.diff}</div>}
                              {rm.cashback && <div style={{ fontSize: 9, color: "#E65100", fontWeight: 700 }}>🎁 {rm.cashback}</div>}
                              {rm.note && <div style={{ fontSize: 9, color: C.sub, marginTop: 2 }}>💡 {rm.note}</div>}
                            </div>
                          );
                        })}
                      </div>
                    );
                  });
                })()
              )}
            </div>
          )}

          {/* ── PRIVATE ACCOMMODATION VIEW ── */}
          {accomView === "private" && (
          <div>

          {/* ── Quick Links: Booking Platforms ── */}
          <div style={{ background: C.card, borderRadius: 12, padding: 12, marginBottom: 8 }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: "#1a237e", marginBottom: 8 }}>🔗 จองที่พักได้ที่ — Quick Links</div>
            <div style={{ display: "flex", gap: 8 }}>
              <a href="https://casita.com/search/durham-city" target="_blank" rel="noopener noreferrer"
                style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4, padding: "10px 8px",
                  background: "linear-gradient(135deg,#6A1B9A,#8E24AA)", borderRadius: 10, textDecoration: "none", color: "#fff" }}>
                <span style={{ fontSize: 18 }}>🏠</span>
                <span style={{ fontSize: 11, fontWeight: 800 }}>Casita</span>
                <span style={{ fontSize: 9, opacity: 0.85 }}>casita.com</span>
              </a>
              <a href="https://www.durhomes.co.uk" target="_blank" rel="noopener noreferrer"
                style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4, padding: "10px 8px",
                  background: "linear-gradient(135deg,#1565C0,#1976D2)", borderRadius: 10, textDecoration: "none", color: "#fff" }}>
                <span style={{ fontSize: 18 }}>🏡</span>
                <span style={{ fontSize: 11, fontWeight: 800 }}>Durhomes</span>
                <span style={{ fontSize: 9, opacity: 0.85 }}>durhomes.co.uk</span>
              </a>
              <a href="https://www.uhomes.com/uk/durham" target="_blank" rel="noopener noreferrer"
                style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4, padding: "10px 8px",
                  background: "linear-gradient(135deg,#00695C,#00897B)", borderRadius: 10, textDecoration: "none", color: "#fff" }}>
                <span style={{ fontSize: 18 }}>🌐</span>
                <span style={{ fontSize: 11, fontWeight: 800 }}>Uhomes</span>
                <span style={{ fontSize: 9, opacity: 0.85 }}>uhomes.com</span>
              </a>
            </div>
            <div style={{ fontSize: 9, color: C.sub, marginTop: 6, textAlign: "center" }}>กดเพื่อเปิดเว็บไซต์ · เปรียบเทียบราคาก่อนจอง</div>
          </div>

          {(function() {
            var jb = colAccom.find(function(c) { return c.name && c.name.includes("Josephine"); }) || {};
            var jbRoom = (jb.rooms || []).find(function(rm) { return rm.wk <= 6; }) || (jb.rooms || [])[0] || {};
            return (
              <div style={{ background: C.card, borderRadius: 12, padding: 14, marginBottom: 8 }}>
                <div style={{ fontSize: 12, fontWeight: 800, color: "#E65100", marginBottom: 8 }}>🏨 Pre-sessional 6wk (3 ส.ค.-11 ก.ย.)</div>
                <div style={{ background: "#FFF3E0", borderRadius: 8, padding: 10, fontSize: 11 }}>
                  <strong>{jb.name || "Josephine Butler College"}</strong>
                  {jbRoom.type ? " · " + jbRoom.type : ""}
                  {jbRoom.pw && jbRoom.wk ? " · £" + jbRoom.pw + "/wk × " + jbRoom.wk + "wk = £" + (jbRoom.pw * jbRoom.wk).toLocaleString() : ""}
                  {jb.why && <div style={{ fontSize: 10, color: "#2E7D32", fontWeight: 700, marginTop: 3 }}>✅ {jb.why}</div>}
                </div>
              </div>
            );
          })()}

          {accomRating.rows.length > 0 && (
            <div style={{ background: C.card, borderRadius: 12, padding: 14, marginBottom: 8 }}>
              <div style={{ fontSize: 12, fontWeight: 800, color: "#333", marginBottom: 8 }}>⚔️ เปรียบเทียบที่พัก</div>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", fontSize: 10, borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ background: C.border }}>
                      <td style={{ padding: "6px 8px", fontWeight: 700, color: C.sub }}></td>
                      {accomRating.headers.map(function(h, hi) {
                        return <td key={hi} style={{ padding: "6px 8px", fontWeight: 800, color: "#1a237e", textAlign: "center", whiteSpace: "nowrap" }}>{h}</td>;
                      })}
                    </tr>
                  </thead>
                  <tbody>
                    {accomRating.rows.map(function(row, ri) {
                      return (
                        <tr key={ri} style={{ borderBottom: "1px solid " + C.border }}>
                          <td style={{ padding: "5px 8px", fontWeight: 600, color: C.sub, whiteSpace: "nowrap" }}>{row.label}</td>
                          {row.vals.slice(0, accomRating.headers.length).map(function(v, vi) {
                            var n = parseFloat(v);
                            var isStar = !isNaN(n) && n >= 0 && n <= 5 && /^\d+\.?\d*$/.test(v.trim());
                            return (
                              <td key={vi} style={{ padding: "5px 8px", textAlign: "center" }}>
                                {isStar ? <Stars val={n} /> : <span style={{ fontSize: 10, color: C.text }}>{v}</span>}
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div style={{ fontSize: 12, fontWeight: 800, color: C.text, padding: "4px 4px 2px" }}>
            🏠 Studio 51wk แนะนำ 3 อันดับ (แตะดูรายละเอียด)
          </div>
          {accom.map(function (a, i) {
            var isOpen = openA === i;
            var rm = a.room;
            var total = rm.pw * rm.wk;
            return (
              <div
                key={i}
                style={{
                  background: C.card,
                  borderRadius: 12,
                  marginBottom: 6,
                  borderLeft: "4px solid " + a.color,
                  overflow: "hidden",
                }}
              >
                <div
                  onClick={function () { setOpenA(isOpen ? -1 : i); }}
                  style={{ padding: "10px 14px", cursor: "pointer" }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <div>
                      <span style={{ background: a.color, color: "#fff", padding: "2px 8px", borderRadius: 10, fontSize: 9, fontWeight: 700 }}>{a.badge}</span>
                      <div style={{ fontSize: 14, fontWeight: 800, color: a.color, marginTop: 3 }}>{a.name}</div>
                      <div style={{ fontSize: 10, color: C.sub }}>
                        {a.provider}
                        {a.dist ? (
                          <span> · <a
                            href={"https://www.google.com/maps/dir/?api=1&origin=" + encodeURIComponent((a.addr || a.name) + ", Durham, UK") + "&destination=Palatine+Centre+Stockton+Road+Durham+DH1+3LE&travelmode=walking"}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ color: "#1565C0", textDecoration: "none" }}
                            onClick={function(e) { e.stopPropagation(); }}
                          >🗺️ {a.dist}</a></span>
                        ) : null}
                      </div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: 18, fontWeight: 800, color: a.color }}>£{rm.pw}<span style={{ fontSize: 10, fontWeight: 400 }}>/wk</span></div>
                      <div style={{ fontSize: 9, color: C.sub }}>{isOpen ? "▲ ซ่อน" : "▼ ดูรายละเอียด"}</div>
                    </div>
                  </div>
                </div>
                {isOpen && (
                  <div style={{ padding: "0 14px 14px", borderTop: "1px solid " + C.border }}>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 4, marginBottom: 10 }}>
                      {[
                        { l: "ห้อง", v: rm.name + " " + rm.size },
                        { l: "เตียง", v: rm.bed },
                        { l: "รวม/ปี", v: "£" + total.toLocaleString() + " (฿" + Math.round(total * r).toLocaleString() + ")" },
                        { l: "Deposit", v: rm.dep === 0 ? "ไม่มี!" : "£" + rm.dep },
                      ].map(function (x, j) {
                        return (
                          <div key={j} style={{ background: a.bg, borderRadius: 6, padding: "4px 6px", textAlign: "center" }}>
                            <div style={{ fontSize: 8, color: "#888" }}>{x.l}</div>
                            <div style={{ fontSize: 10, fontWeight: 700, color: a.color }}>{x.v}</div>
                          </div>
                        );
                      })}
                    </div>
                    {a.stars && (
                      <div style={{ marginBottom: 10 }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: a.color, marginBottom: 4 }}>⭐ Rating แยกด้าน:</div>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 3 }}>
                          {[["📍 ทำเล", a.stars.location], ["🧹 สะอาด", a.stars.clean], ["🏢 Facilities", a.stars.facilities], ["💰 คุ้มค่า", a.stars.value], ["🔒 ปลอดภัย", a.stars.safety]].map(function (s, si) {
                            return (
                              <div key={si} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "3px 8px", background: a.bg, borderRadius: 6 }}>
                                <span style={{ fontSize: 9, color: "#555" }}>{s[0]}</span>
                                <Stars val={s[1]} size={10} />
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                    <div style={{ fontSize: 11, fontWeight: 700, color: a.color, marginBottom: 3 }}>🛏️ ในห้องมีอะไร:</div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2, marginBottom: 8 }}>
                      {a.roomHas.map(function (x, j) { return <div key={j} style={{ fontSize: 10, color: C.text, padding: "2px 6px", background: C.border, borderRadius: 3 }}>• {x}</div>; })}
                    </div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: a.color, marginBottom: 3 }}>🏢 Facilities ส่วนกลาง:</div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 3, marginBottom: 8 }}>
                      {a.facilities.map(function (x, j) { return <span key={j} style={{ fontSize: 9, padding: "2px 8px", background: a.bg, borderRadius: 10, color: a.color }}>{x}</span>; })}
                    </div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: a.color, marginBottom: 3 }}>🔒 ความปลอดภัย:</div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 3, marginBottom: 8 }}>
                      {a.security.map(function (x, j) { return <span key={j} style={{ fontSize: 9, padding: "2px 8px", background: C.border, borderRadius: 10, color: C.sub }}>{x}</span>; })}
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                      <div>
                        <div style={{ fontSize: 10, fontWeight: 700, color: "#2E7D32", marginBottom: 3 }}>✅ ข้อดี</div>
                        {a.pros.map(function (x, j) { return <div key={j} style={{ fontSize: 10, color: C.text, marginBottom: 2, paddingLeft: 6, borderLeft: "2px solid #C8E6C9" }}>{x}</div>; })}
                      </div>
                      <div>
                        <div style={{ fontSize: 10, fontWeight: 700, color: "#C62828", marginBottom: 3 }}>⚠️ ข้อเสีย</div>
                        {a.cons.map(function (x, j) { return <div key={j} style={{ fontSize: 10, color: C.sub, marginBottom: 2, paddingLeft: 6, borderLeft: "2px solid #FFCDD2" }}>{x}</div>; })}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
          </div>
          )}

        </div>
      )}

      {/* ── PLACES ── */}
      {tab === "places" && (
        <div>
          <div style={{ background: "linear-gradient(135deg,#004D40,#00796B)", borderRadius: 12, padding: 12, color: "#fff", marginBottom: 8 }}>
            <div style={{ fontSize: 13, fontWeight: 800 }}>🗺️ สถานที่สำคัญใน Durham</div>
            <div style={{ fontSize: 10, opacity: 0.8, marginTop: 2 }}>{places.length} สถานที่ — ที่อยู่ + ระยะทาง</div>
          </div>
          {places.length === 0 ? (
            <div style={{ textAlign: "center", padding: 40, color: C.sub }}>⏳ กำลังโหลด...</div>
          ) : (
            [...new Set(places.map(function(p) { return p.cat; }))].map(function(cat, ci) {
              return (
                <div key={ci} style={{ marginBottom: 10 }}>
                  <div style={{ fontSize: 11, fontWeight: 800, color: "#00695C", padding: "4px 4px 6px", borderBottom: "1px solid #B2DFDB", marginBottom: 6 }}>{cat}</div>
                  {places.filter(function(p) { return p.cat === cat; }).map(function(p, pi) {
                    return (
                      <div key={pi} style={{ background: C.card, borderRadius: 8, padding: 10, marginBottom: 4 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                          <div style={{ fontSize: 11, fontWeight: 700, color: C.text, flex: 1 }}>{p.name}</div>
                          {p.dist && <span style={{ fontSize: 9, color: "#00695C", fontWeight: 700, flexShrink: 0, marginLeft: 8 }}>{p.dist}</span>}
                        </div>
                        {p.addr && <div style={{ fontSize: 9, color: C.sub, marginTop: 2 }}>📍 {p.addr}</div>}
                        {p.why && <div style={{ fontSize: 10, color: C.text, marginTop: 4, lineHeight: 1.5 }}>{p.why}</div>}
                        {p.note && <div style={{ fontSize: 9, color: C.sub, marginTop: 3, fontStyle: "italic" }}>💡 {p.note}</div>}
                      </div>
                    );
                  })}
                </div>
              );
            })
          )}
        </div>
      )}

      {/* ── CONTACTS ── */}
      {tab === "contacts" && (
        <div>
          <div style={{ background: "linear-gradient(135deg,#B71C1C,#C62828)", borderRadius: 12, padding: 12, color: "#fff", marginBottom: 8 }}>
            <div style={{ fontSize: 13, fontWeight: 800 }}>📞 Contact Directory</div>
            <div style={{ fontSize: 10, opacity: 0.8, marginTop: 2 }}>{contacts.length} รายชื่อ — กดเบอร์โทรได้เลย</div>
          </div>
          {contacts.length === 0 ? (
            <div style={{ textAlign: "center", padding: 40, color: C.sub }}>⏳ กำลังโหลด...</div>
          ) : (
            [...new Set(contacts.map(function(c) { return c.cat; }))].map(function(cat, ci) {
              return (
                <div key={ci} style={{ marginBottom: 10 }}>
                  <div style={{ fontSize: 11, fontWeight: 800, color: (cat.includes("ฉุกเฉิน") || cat.includes("Emergency")) ? "#C62828" : C.text, padding: "4px 4px 6px", borderBottom: "1px solid " + C.border, marginBottom: 4 }}>{cat}</div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4 }}>
                    {contacts.filter(function(c) { return c.cat === cat; }).map(function(c, ci2) {
                      var isEmg = cat.includes("ฉุกเฉิน") || cat.includes("Emergency") || c.contact === "999" || c.contact === "111";
                      return (
                        <div key={ci2} style={{ background: isEmg ? "#FFEBEE" : C.card, borderRadius: 8, padding: "8px 10px", borderLeft: isEmg ? "3px solid #C62828" : "none" }}>
                          <div style={{ fontSize: 10, fontWeight: 700, color: isEmg ? "#C62828" : C.text }}>{c.name}</div>
                          {c.contact && (
                            <a href={"tel:" + c.contact.replace(/[^0-9+]/g, "")} style={{ fontSize: 12, fontWeight: 800, color: isEmg ? "#C62828" : "#1a237e", textDecoration: "none", display: "block", marginTop: 2 }}>{c.contact}</a>
                          )}
                          {c.hours && <div style={{ fontSize: 8, color: C.sub, marginTop: 2 }}>{c.hours}</div>}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* ── COST CALCULATOR ── */}
      {tab === "cost" && (function() {
        // All available rooms — fall back to accom (one room per property) if accomFull not yet loaded
        var allRooms = accomFull.length > 0 ? accomFull : accom.map(function(a) {
          return {
            id: a.name + " · " + (a.room ? a.room.name : ""),
            propName: a.name,
            provider: a.provider,
            badge: a.badge,
            color: a.color,
            bg: a.bg,
            dist: a.dist,
            addr: a.addr,
            room: a.room || { pw: 0, wk: 51, dep: 0, name: "", size: "" },
          };
        });

        function toggleRoom(id) {
          setSelectedRoomIds(function(prev) {
            return prev.includes(id) ? prev.filter(function(x) { return x !== id; }) : prev.concat([id]);
          });
        }

        // Fixed costs common to all options (GBP)
        var FIXED_ROWS = [
          { l: "📚 ค่าเรียน LLM + Pre-sess (หลัง scholarship & deposit)", v: 22040 },
          { l: "🏡 Pre-sess Accom 6wk (Josephine Butler)", v: 1300 },
          { l: "🛂 Student Visa + IHS + TB Test", v: 977 },
          { l: "💉 วัคซีน (MenACWY + MenB + MMR)", v: 120 },
          { l: "✈️ ตั๋วเครื่องบิน ไป+กลับ", v: 950 },
          { l: "🛒 ของเตรียมก่อนไป", v: 120 },
          { l: "🍽️ ค่าครองชีพ ~12 เดือน", v: 5420 },
        ];
        var FIXED_TOTAL = FIXED_ROWS.reduce(function(a, x) { return a + x.v; }, 0);

        // Group allRooms by property for the selector UI
        var propGroups = [];
        allRooms.forEach(function(rm) {
          var grp = propGroups.find(function(g) { return g.propName === rm.propName; });
          if (!grp) {
            grp = { propName: rm.propName, color: rm.color, bg: rm.bg, rooms: [] };
            propGroups.push(grp);
          }
          grp.rooms.push(rm);
        });

        // Resolved selected room objects in selection order
        var selectedRooms = selectedRoomIds.map(function(id) {
          return allRooms.find(function(rm) { return rm.id === id; });
        }).filter(Boolean);

        return (
          <div>
            {/* Room selector */}
            <div style={{ background: C.card, borderRadius: 12, padding: 14, marginBottom: 8 }}>
              <div style={{ fontSize: 12, fontWeight: 800, color: "#1a237e", marginBottom: 4 }}>🏠 เลือกห้องที่ต้องการเปรียบเทียบ</div>
              <div style={{ fontSize: 10, color: C.sub, marginBottom: 10 }}>กดเลือกได้หลายห้อง — ตารางด้านล่างจะแสดงต้นทุนรวมทุกอย่าง</div>
              {propGroups.map(function(grp, gi) {
                return (
                  <div key={gi} style={{ marginBottom: 8 }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: grp.color, marginBottom: 4 }}>{grp.propName}</div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                      {grp.rooms.map(function(rm, ri) {
                        var sel = selectedRoomIds.includes(rm.id);
                        return (
                          <div
                            key={ri}
                            onClick={function() { toggleRoom(rm.id); }}
                            style={{
                              padding: "5px 10px", borderRadius: 8, cursor: "pointer",
                              border: "2px solid " + (sel ? grp.color : C.border),
                              background: sel ? grp.bg : C.card,
                              fontSize: 10, fontWeight: sel ? 700 : 400,
                              color: sel ? grp.color : C.sub,
                            }}
                          >
                            {rm.room.name || rm.propName} <strong>£{rm.room.pw}/wk</strong>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
              {selectedRooms.length > 0 && (
                <div style={{ marginTop: 8, display: "flex", justifyContent: "flex-end" }}>
                  <div
                    onClick={function() { setSelectedRoomIds([]); }}
                    style={{ fontSize: 9, color: C.sub, cursor: "pointer", padding: "3px 8px", border: "1px solid " + C.border, borderRadius: 6 }}
                  >
                    ✕ ล้างทั้งหมด
                  </div>
                </div>
              )}
            </div>

            {/* Prompt when nothing selected */}
            {selectedRooms.length === 0 && (
              <div style={{ textAlign: "center", padding: "30px 20px", color: C.sub, fontSize: 11, background: C.card, borderRadius: 12, marginBottom: 8 }}>
                ☝️ กดเลือกห้องด้านบนเพื่อดูเปรียบเทียบค่าใช้จ่ายทั้งหมด
              </div>
            )}

            {/* Comparison table */}
            {selectedRooms.length > 0 && (
              <div style={{ background: C.card, borderRadius: 12, padding: 14, marginBottom: 8 }}>
                <div style={{ fontSize: 12, fontWeight: 800, color: "#1a237e", marginBottom: 10 }}>📊 เปรียบเทียบต้นทุนรวมทั้งหมด</div>
                <div style={{ overflowX: "auto" }}>
                  <table style={{ borderCollapse: "collapse", fontSize: 10, width: "100%" }}>
                    <thead>
                      <tr>
                        <th style={{ padding: "6px 8px", textAlign: "left", background: C.border, fontWeight: 700, fontSize: 9, minWidth: 130 }}>รายการ</th>
                        {selectedRooms.map(function(rm, ci) {
                          return (
                            <th key={ci} style={{ padding: "6px 8px", textAlign: "center", background: rm.bg, color: rm.color, fontWeight: 800, fontSize: 9, minWidth: 120, whiteSpace: "nowrap" }}>
                              <div style={{ fontSize: 9 }}>{rm.propName}</div>
                              <div style={{ fontSize: 8, opacity: 0.75 }}>{rm.room.name}</div>
                              <div style={{ fontSize: 12, fontWeight: 800 }}>£{rm.room.pw}/wk</div>
                              <div style={{ fontSize: 8, opacity: 0.75 }}>× {rm.room.wk}wk</div>
                            </th>
                          );
                        })}
                      </tr>
                    </thead>
                    <tbody>
                      {/* Room cost */}
                      <tr style={{ background: "#E8F5E9" }}>
                        <td style={{ padding: "5px 8px", fontWeight: 700, fontSize: 9, color: "#1B5E20" }}>🏠 ค่าห้องรวม</td>
                        {selectedRooms.map(function(rm, ci) {
                          var roomTotal = rm.room.pw * rm.room.wk;
                          return (
                            <td key={ci} style={{ padding: "5px 8px", textAlign: "center", fontWeight: 800, color: "#1B5E20", fontSize: 11 }}>
                              £{roomTotal.toLocaleString()}
                            </td>
                          );
                        })}
                      </tr>
                      {/* Deposit */}
                      <tr>
                        <td style={{ padding: "5px 8px", fontSize: 9, color: C.sub }}>Deposit</td>
                        {selectedRooms.map(function(rm, ci) {
                          return (
                            <td key={ci} style={{ padding: "5px 8px", textAlign: "center", fontSize: 9, color: rm.room.dep === 0 ? "#2E7D32" : C.text }}>
                              {rm.room.dep === 0 ? "ไม่มี 🎉" : "£" + rm.room.dep}
                            </td>
                          );
                        })}
                      </tr>
                      {/* Fixed cost rows */}
                      {FIXED_ROWS.map(function(fixRow, fi) {
                        return (
                          <tr key={fi} style={{ background: fi % 2 === 0 ? C.card : C.border + "44" }}>
                            <td style={{ padding: "5px 8px", fontSize: 9, color: C.sub }}>{fixRow.l}</td>
                            {selectedRooms.map(function(rm, ci) {
                              return (
                                <td key={ci} style={{ padding: "5px 8px", textAlign: "center", fontSize: 9, color: C.text }}>
                                  £{fixRow.v.toLocaleString()}
                                </td>
                              );
                            })}
                          </tr>
                        );
                      })}
                      {/* Grand Total GBP */}
                      <tr style={{ borderTop: "2px solid #1a237e" }}>
                        <td style={{ padding: "8px 8px", fontWeight: 800, fontSize: 10, color: "#1a237e" }}>💰 รวมทั้งหมด £</td>
                        {selectedRooms.map(function(rm, ci) {
                          var grand = FIXED_TOTAL + (rm.room.pw * rm.room.wk) + rm.room.dep;
                          return (
                            <td key={ci} style={{ padding: "8px 8px", textAlign: "center", fontWeight: 800, fontSize: 13, color: "#C62828" }}>
                              £{grand.toLocaleString()}
                            </td>
                          );
                        })}
                      </tr>
                      {/* Grand Total THB */}
                      <tr style={{ background: "#FFF3E0" }}>
                        <td style={{ padding: "5px 8px", fontWeight: 800, fontSize: 10, color: "#E65100" }}>฿ เงินไทย</td>
                        {selectedRooms.map(function(rm, ci) {
                          var grand = FIXED_TOTAL + (rm.room.pw * rm.room.wk) + rm.room.dep;
                          return (
                            <td key={ci} style={{ padding: "5px 8px", textAlign: "center", fontWeight: 800, fontSize: 11, color: "#E65100" }}>
                              ฿{Math.round(grand * r).toLocaleString()}
                            </td>
                          );
                        })}
                      </tr>
                      {/* Per month */}
                      <tr>
                        <td style={{ padding: "5px 8px", fontSize: 9, color: C.sub }}>เฉลี่ย/เดือน ~14 เดือน</td>
                        {selectedRooms.map(function(rm, ci) {
                          var grand = FIXED_TOTAL + (rm.room.pw * rm.room.wk) + rm.room.dep;
                          return (
                            <td key={ci} style={{ padding: "5px 8px", textAlign: "center", fontSize: 9, color: C.sub }}>
                              ฿{Math.round(grand * r / 14).toLocaleString()}/เดือน
                            </td>
                          );
                        })}
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Best option highlight */}
                {selectedRooms.length > 1 && (function() {
                  var cheapest = selectedRooms.reduce(function(min, rm) {
                    return (FIXED_TOTAL + rm.room.pw * rm.room.wk + rm.room.dep) < (FIXED_TOTAL + min.room.pw * min.room.wk + min.room.dep) ? rm : min;
                  }, selectedRooms[0]);
                  var mostExp = selectedRooms.reduce(function(max, rm) {
                    return (FIXED_TOTAL + rm.room.pw * rm.room.wk + rm.room.dep) > (FIXED_TOTAL + max.room.pw * max.room.wk + max.room.dep) ? rm : max;
                  }, selectedRooms[0]);
                  var saving = (FIXED_TOTAL + mostExp.room.pw * mostExp.room.wk + mostExp.room.dep) - (FIXED_TOTAL + cheapest.room.pw * cheapest.room.wk + cheapest.room.dep);
                  return (
                    <div style={{ marginTop: 10, padding: "8px 12px", background: "#E8F5E9", borderRadius: 8, borderLeft: "3px solid #2E7D32" }}>
                      <div style={{ fontSize: 11, fontWeight: 800, color: "#1B5E20" }}>✅ ถูกสุด: {cheapest.propName} — {cheapest.room.name || cheapest.propName}</div>
                      <div style={{ fontSize: 10, color: "#2E7D32", marginTop: 2 }}>
                        ประหยัดกว่าแพงสุดถึง <strong>£{saving.toLocaleString()} (~฿{Math.round(saving * r).toLocaleString()})</strong>
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}

            {/* Monthly breakdown for first selected room */}
            {selectedRooms.length > 0 && (function() {
              var selA = selectedRooms[0];
              var studioPW = selA.room.pw;
              var studioWK = selA.room.wk || 51;
              return (
                <div style={{ background: C.card, borderRadius: 12, padding: 14, marginBottom: 8 }}>
                  <div style={{ fontSize: 12, fontWeight: 800, color: "#1a237e", marginBottom: 8 }}>📅 งบต่อเดือน — {selA.propName}</div>
                  {[
                    { l: "อาหาร", v: 250, note: "ทำเองที่ครัวหอ" },
                    { l: "Studio rent", v: Math.round(studioPW * studioWK / 12), note: selA.propName },
                    { l: "เดินทาง + Bus", v: 25, note: "Arriva bus pass" },
                    { l: "หนังสือ + เรียน", v: 25, note: "เฉลี่ยตลอดปี" },
                    { l: "สังสรรค์ + เที่ยว", v: 100, note: "UK weekends" },
                    { l: "เสื้อผ้า + ของใช้", v: 42, note: "เฉลี่ยตลอดปี" },
                    { l: "SIM + Internet", v: 10, note: "giffgaff/Three" },
                  ].map(function(it, i, arr) {
                    var monthlyTotal = arr.reduce(function(a, x) { return a + x.v; }, 0);
                    var pct = (it.v / monthlyTotal * 100).toFixed(0);
                    return (
                      <div key={i} style={{ marginBottom: 8 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 2 }}>
                          <span style={{ fontSize: 10, color: C.text }}>{it.l} <span style={{ fontSize: 9, color: C.sub }}>— {it.note}</span></span>
                          <span style={{ fontSize: 10, fontWeight: 700, color: "#1a237e" }}>£{it.v}/เดือน</span>
                        </div>
                        <div style={{ background: C.border, borderRadius: 3, height: 6 }}>
                          <div style={{ background: "#1a237e", borderRadius: 3, height: 6, width: pct + "%" }} />
                        </div>
                      </div>
                    );
                  })}
                  <div style={{ borderTop: "1px solid " + C.border, paddingTop: 8, marginTop: 4, display: "flex", justifyContent: "space-between" }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: C.text }}>รวมต่อเดือน</span>
                    <span style={{ fontSize: 12, fontWeight: 800, color: "#C62828" }}>
                      £{(250 + Math.round(studioPW * studioWK / 12) + 25 + 25 + 100 + 42 + 10).toLocaleString()}
                      {" ≈ ฿"}
                      {Math.round((250 + Math.round(studioPW * studioWK / 12) + 25 + 25 + 100 + 42 + 10) * r).toLocaleString()}
                    </span>
                  </div>
                </div>
              );
            })()}
          </div>
        );
      })()}

      {/* ── BUDGET PLANNER ── */}
      {tab === "budget" && (function() {
        var lsData = budgetData.lifestyle[budgetLifestyle] || budgetData.lifestyle.balanced;
        var lsTotal = lsData.total || 527;

        // Accommodation — dynamic from selected room
        var selA = accom[selectedAccomIdx] || accom[0] || {};
        var studioPW = selA.room ? selA.room.pw : 289;
        var studioWK = selA.room ? (selA.room.wk || 51) : 51;
        var studioCost = studioPW * studioWK;
        var studioDeposit = selA.room ? (selA.room.dep || 250) : 250;

        // Pre-sess accommodation (pull from fixedCosts or default)
        var presessAccom = (budgetData.fixedCosts.accommodation.find(function(i) {
          return i.name.includes("Pre-sess") || i.name.includes("Josephine");
        }) || { amount: 1200 }).amount;

        // Living cost periods
        var presessLiving  = Math.round(lsTotal * 1.5);
        var termLiving     = Math.round(lsTotal * 9);
        var dissertLiving  = Math.round(lsTotal * 0.8 * 3);
        var totalLiving    = presessLiving + termLiving + dissertLiving;

        // Totals
        var accomTotal    = presessAccom + studioCost + studioDeposit;
        var beforeGoTotal = budgetData.fixedCosts.beforeGo.reduce(function(a, i) { return a + i.amount; }, 0);
        var emergency     = budgetData.fixedCosts.emergencyFund || 500;
        var grandTotal    = beforeGoTotal + accomTotal + totalLiving + emergency;

        // Money runway
        var fundsGBP = profile.fundsAmount ? Math.round(parseFloat(profile.fundsAmount) / r) : 0;
        var surplus = fundsGBP - grandTotal;

        // Lifestyle config
        var lsConfig = {
          minimal:     { color: "#2E7D32", bg: "#E8F5E9", barColor: "#2E7D32" },
          balanced:    { color: "#E65100", bg: "#FFF3E0", barColor: "#E65100" },
          comfortable: { color: "#C62828", bg: "#FFEBEE", barColor: "#C62828" },
        };
        var lsCfg = lsConfig[budgetLifestyle] || lsConfig.balanced;

        return (
          <div>
            {/* Header */}
            <div style={{ background: "linear-gradient(135deg,#1B5E20,#2E7D32)", borderRadius: 12, padding: 14, color: "#fff", marginBottom: 8 }}>
              <div style={{ fontSize: 14, fontWeight: 800 }}>💰 Budget Planner 2026/27</div>
              <div style={{ fontSize: 10, opacity: 0.85, marginTop: 3 }}>ประมาณงบ LLM Durham 14 เดือน — เลือก lifestyle เพื่อคำนวณทันที</div>
              <div style={{ marginTop: 8, padding: "4px 10px", background: "rgba(255,255,255,0.15)", borderRadius: 8, display: "inline-block", fontSize: 10 }}>
                TOTAL ≈ £{grandTotal.toLocaleString()} · ฿{Math.round(grandTotal * r).toLocaleString()}
              </div>
            </div>

            {/* ① Lifestyle Selector */}
            <div style={{ background: C.card, borderRadius: 12, padding: 14, marginBottom: 8 }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: C.text, marginBottom: 10 }}>① เลือก Lifestyle — ค่าครองชีพ/เดือน (ไม่รวมค่าหอ)</div>
              <div style={{ display: "flex", gap: 6 }}>
                {[
                  { id: "minimal",     label: "🟢 ประหยัดสุด", sub: "ทำเองทุกมื้อ", color: "#2E7D32", bg: "#E8F5E9" },
                  { id: "balanced",    label: "🟡 สมดุล",      sub: "Balance ดี",   color: "#E65100", bg: "#FFF3E0" },
                  { id: "comfortable", label: "🔴 สะดวก",      sub: "ไม่ยั้งมือ",   color: "#C62828", bg: "#FFEBEE" },
                ].map(function(ls) {
                  var tot = budgetData.lifestyle[ls.id].total;
                  var sel = budgetLifestyle === ls.id;
                  return (
                    <div
                      key={ls.id}
                      onClick={function() { setBudgetLifestyle(ls.id); setOpenBudgetCat(-1); }}
                      style={{
                        flex: 1, padding: "10px 6px", borderRadius: 10, textAlign: "center",
                        border: "2px solid " + (sel ? ls.color : C.border),
                        background: sel ? ls.bg : C.card,
                        cursor: "pointer", transition: "all 0.2s",
                      }}
                    >
                      <div style={{ fontSize: 10, fontWeight: 800, color: ls.color, marginBottom: 3 }}>{ls.label}</div>
                      <div style={{ fontSize: 18, fontWeight: 800, color: ls.color }}>£{tot}</div>
                      <div style={{ fontSize: 8, color: sel ? ls.color : C.sub }}>/เดือน</div>
                      <div style={{ fontSize: 8, color: C.sub, marginTop: 2 }}>{ls.sub}</div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* ② Accommodation Selector */}
            <div style={{ background: C.card, borderRadius: 12, padding: 14, marginBottom: 8 }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: C.text, marginBottom: 8 }}>② เลือกที่พัก — เปลี่ยนงบรวมทันที</div>
              <div style={{ overflowX: "auto", display: "flex", gap: 6, paddingBottom: 4 }}>
                {accom.map(function(a, i) {
                  var sel = selectedAccomIdx === i;
                  var pw = a.room ? a.room.pw : 0;
                  return (
                    <div
                      key={i}
                      onClick={function() { setSelectedAccomIdx(i); }}
                      style={{
                        flexShrink: 0, minWidth: 100, padding: "8px 8px", borderRadius: 10,
                        border: "2px solid " + (sel ? a.color : C.border),
                        background: sel ? a.bg : C.card,
                        cursor: "pointer",
                      }}
                    >
                      <div style={{ fontSize: 7, fontWeight: 800, color: a.color, marginBottom: 1 }}>{a.badge}</div>
                      <div style={{ fontSize: 8, fontWeight: 700, color: sel ? a.color : C.text, lineHeight: 1.3 }}>{a.name}</div>
                      <div style={{ fontSize: 14, fontWeight: 800, color: a.color, marginTop: 3 }}>£{pw}<span style={{ fontSize: 8, fontWeight: 400 }}>/wk</span></div>
                      <div style={{ fontSize: 8, color: a.color, fontWeight: 700 }}>= £{pw ? (pw * (a.room ? (a.room.wk||51) : 51)).toLocaleString() : "--"}</div>
                    </div>
                  );
                })}
              </div>
              {selA.room && (
                <div style={{ marginTop: 8, padding: "6px 10px", background: selA.bg || C.border, borderRadius: 8, borderLeft: "3px solid " + (selA.color || "#333"), display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <div style={{ fontSize: 10, fontWeight: 700, color: selA.color }}>{selA.name} · {selA.room.name}</div>
                    <div style={{ fontSize: 9, color: C.sub }}>{selA.dist}</div>
                  </div>
                  <div style={{ fontSize: 10, fontWeight: 800, color: selA.color }}>£{studioCost.toLocaleString()}/ปี</div>
                </div>
              )}
            </div>

            {/* ③ Monthly Budget Breakdown */}
            <div style={{ background: C.card, borderRadius: 12, padding: 14, marginBottom: 8 }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: C.text, marginBottom: 2 }}>③ ค่าครองชีพ/เดือน — {lsData.label}</div>
              <div style={{ fontSize: 9, color: C.sub, marginBottom: 10 }}>{lsData.desc}</div>
              {lsData.categories.map(function(cat, ci) {
                var pct = lsTotal > 0 ? Math.round(cat.amount / lsTotal * 100) : 0;
                var isOpen = openBudgetCat === ci;
                return (
                  <div key={ci} style={{ marginBottom: 6 }}>
                    <div onClick={function() { setOpenBudgetCat(isOpen ? -1 : ci); }} style={{ cursor: "pointer", padding: "5px 0" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 3 }}>
                        <span style={{ fontSize: 11, color: C.text }}>{cat.emoji} {cat.name}</span>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <span style={{ fontSize: 11, fontWeight: 800, color: lsCfg.color }}>£{cat.amount}</span>
                          <span style={{ fontSize: 9, color: C.sub, minWidth: 28, textAlign: "right" }}>{pct}%</span>
                          <span style={{ fontSize: 9, color: C.sub }}>{isOpen ? "▲" : "▼"}</span>
                        </div>
                      </div>
                      <div style={{ background: C.border, borderRadius: 3, height: 7, overflow: "hidden" }}>
                        <div style={{ background: lsCfg.barColor, height: 7, width: pct + "%", borderRadius: 3, transition: "width 0.4s" }} />
                      </div>
                    </div>
                    {isOpen && (
                      <div style={{ margin: "4px 0 6px", padding: "8px 10px", background: C.bg, borderRadius: 8 }}>
                        {cat.items.map(function(it, ii) {
                          return (
                            <div key={ii} style={{ paddingBottom: ii < cat.items.length - 1 ? 6 : 0, marginBottom: ii < cat.items.length - 1 ? 6 : 0, borderBottom: ii < cat.items.length - 1 ? "1px solid " + C.border : "none" }}>
                              <div style={{ display: "flex", justifyContent: "space-between" }}>
                                <span style={{ fontSize: 10, color: C.text }}>{it.name}</span>
                                <span style={{ fontSize: 10, fontWeight: 700, color: lsCfg.color, flexShrink: 0, marginLeft: 8 }}>£{it.amount}</span>
                              </div>
                              {it.tip && <div style={{ fontSize: 9, color: C.sub, marginTop: 2 }}>💡 {it.tip}</div>}
                            </div>
                          );
                        })}
                        <div style={{ marginTop: 6, paddingTop: 4, borderTop: "1px solid " + C.border, display: "flex", justifyContent: "space-between" }}>
                          <span style={{ fontSize: 9, color: C.sub }}>รวม</span>
                          <span style={{ fontSize: 10, fontWeight: 800, color: lsCfg.color }}>£{cat.amount}/เดือน ≈ ฿{Math.round(cat.amount * r).toLocaleString()}</span>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
              <div style={{ borderTop: "2px solid " + C.border, paddingTop: 8, marginTop: 4, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: C.text }}>รวม/เดือน</span>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 15, fontWeight: 800, color: "#C62828" }}>£{lsTotal}/เดือน</div>
                  <div style={{ fontSize: 9, color: C.sub }}>≈ ฿{Math.round(lsTotal * r).toLocaleString()}/เดือน</div>
                </div>
              </div>
            </div>

            {/* ④ Total Cost of Attendance */}
            <div style={{ background: C.card, borderRadius: 12, padding: 14, marginBottom: 8 }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: C.text, marginBottom: 10 }}>④ Total Cost of Attendance — 14 เดือน</div>

              {/* Before going */}
              <div style={{ marginBottom: 10 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: "#1a237e", marginBottom: 4 }}>📚 ก่อนไป (Tuition, Visa, วัคซีน, ตั๋ว)</div>
                {budgetData.fixedCosts.beforeGo.map(function(it, i) {
                  return (
                    <div key={i} style={{ display: "flex", justifyContent: "space-between", paddingLeft: 8, paddingBottom: 2 }}>
                      <span style={{ fontSize: 9, color: C.sub }}>{it.name}</span>
                      <span style={{ fontSize: 9, fontWeight: 700, color: C.text }}>£{it.amount.toLocaleString()}</span>
                    </div>
                  );
                })}
                <div style={{ display: "flex", justifyContent: "space-between", paddingLeft: 8, paddingTop: 2, borderTop: "1px solid " + C.border, marginTop: 2 }}>
                  <span style={{ fontSize: 9, fontWeight: 700, color: "#1a237e" }}>รวม</span>
                  <span style={{ fontSize: 10, fontWeight: 800, color: "#1a237e" }}>£{beforeGoTotal.toLocaleString()}</span>
                </div>
              </div>

              {/* Accommodation */}
              <div style={{ marginBottom: 10 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: "#1B5E20", marginBottom: 4 }}>🏠 ที่พัก</div>
                <div style={{ display: "flex", justifyContent: "space-between", paddingLeft: 8, paddingBottom: 2 }}>
                  <span style={{ fontSize: 9, color: C.sub }}>Pre-sess 6wk (Josephine Butler)</span>
                  <span style={{ fontSize: 9, fontWeight: 700, color: C.text }}>£{presessAccom.toLocaleString()}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", paddingLeft: 8, paddingBottom: 2 }}>
                  <span style={{ fontSize: 9, color: selA.color || "#1B5E20", fontWeight: 700 }}>
                    {selA.name || "Studio"} ({studioWK}wk @ £{studioPW}/wk)
                  </span>
                  <span style={{ fontSize: 9, fontWeight: 700, color: selA.color || "#1B5E20" }}>£{studioCost.toLocaleString()}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", paddingLeft: 8, paddingBottom: 2 }}>
                  <span style={{ fontSize: 9, color: C.sub }}>Deposit</span>
                  <span style={{ fontSize: 9, fontWeight: 700, color: C.text }}>£{studioDeposit.toLocaleString()}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", paddingLeft: 8, paddingTop: 2, borderTop: "1px solid " + C.border, marginTop: 2 }}>
                  <span style={{ fontSize: 9, fontWeight: 700, color: "#1B5E20" }}>รวม</span>
                  <span style={{ fontSize: 10, fontWeight: 800, color: "#1B5E20" }}>£{accomTotal.toLocaleString()}</span>
                </div>
              </div>

              {/* Living */}
              <div style={{ marginBottom: 10 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: lsCfg.color, marginBottom: 4 }}>🍽️ ค่าครองชีพ ({lsData.label})</div>
                {[
                  { l: "Pre-sess 1.5 เดือน (× 1.5)", v: presessLiving },
                  { l: "Term 9 เดือน (× 9)", v: termLiving },
                  { l: "Dissertation 3 เดือน (× 0.8 × 3)", v: dissertLiving },
                ].map(function(it, i) {
                  return (
                    <div key={i} style={{ display: "flex", justifyContent: "space-between", paddingLeft: 8, paddingBottom: 2 }}>
                      <span style={{ fontSize: 9, color: C.sub }}>{it.l}</span>
                      <span style={{ fontSize: 9, fontWeight: 700, color: C.text }}>£{it.v.toLocaleString()}</span>
                    </div>
                  );
                })}
                <div style={{ display: "flex", justifyContent: "space-between", paddingLeft: 8, paddingTop: 2, borderTop: "1px solid " + C.border, marginTop: 2 }}>
                  <span style={{ fontSize: 9, fontWeight: 700, color: lsCfg.color }}>รวม</span>
                  <span style={{ fontSize: 10, fontWeight: 800, color: lsCfg.color }}>£{totalLiving.toLocaleString()}</span>
                </div>
              </div>

              {/* Emergency */}
              <div style={{ display: "flex", justifyContent: "space-between", paddingBottom: 8 }}>
                <span style={{ fontSize: 9, color: C.sub }}>🆘 Emergency Fund</span>
                <span style={{ fontSize: 9, fontWeight: 700, color: C.text }}>£{emergency.toLocaleString()}</span>
              </div>

              {/* Grand Total */}
              <div style={{ borderTop: "2px solid #1a237e", paddingTop: 10 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                  <span style={{ fontSize: 13, fontWeight: 800, color: "#1a237e" }}>TOTAL</span>
                  <span style={{ fontSize: 13, fontWeight: 800, color: "#C62828" }}>£{grandTotal.toLocaleString()}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                  <span style={{ fontSize: 10, color: C.sub }}>เงินไทย (฿{r.toFixed(2)}/£)</span>
                  <span style={{ fontSize: 12, fontWeight: 800, color: "#C62828" }}>฿{Math.round(grandTotal * r).toLocaleString()}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ fontSize: 9, color: C.sub }}>เฉลี่ย ~14 เดือน</span>
                  <span style={{ fontSize: 10, fontWeight: 700, color: "#E65100" }}>฿{Math.round(grandTotal * r / 14).toLocaleString()}/เดือน</span>
                </div>
              </div>
            </div>

            {/* ⑤ Money Runway */}
            <div style={{ background: C.card, borderRadius: 12, padding: 14, marginBottom: 8 }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: C.text, marginBottom: 8 }}>⑤ เงินพอไหม? Money Runway</div>
              {profile.fundsAmount ? (
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                    <span style={{ fontSize: 10, color: C.sub }}>เงินที่มี (฿{parseFloat(profile.fundsAmount).toLocaleString()})</span>
                    <span style={{ fontSize: 10, fontWeight: 700, color: "#1a237e" }}>≈ £{fundsGBP.toLocaleString()}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
                    <span style={{ fontSize: 10, color: C.sub }}>ต้องใช้ทั้งหมด</span>
                    <span style={{ fontSize: 10, fontWeight: 700, color: "#C62828" }}>£{grandTotal.toLocaleString()}</span>
                  </div>
                  {surplus >= 0 ? (
                    <div style={{ background: "#E8F5E9", borderRadius: 8, padding: 10, borderLeft: "4px solid #2E7D32" }}>
                      <div style={{ fontSize: 11, fontWeight: 800, color: "#1B5E20" }}>✅ เงินพอ!</div>
                      <div style={{ fontSize: 10, color: "#2E7D32", marginTop: 4 }}>
                        เหลือ <strong>£{surplus.toLocaleString()} (~฿{Math.round(surplus * r).toLocaleString()})</strong> หลังจบ LLM
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div style={{ background: "#FFEBEE", borderRadius: 8, padding: 10, borderLeft: "4px solid #C62828", marginBottom: 8 }}>
                        <div style={{ fontSize: 11, fontWeight: 800, color: "#C62828" }}>⚠️ ขาดอีก £{Math.abs(surplus).toLocaleString()}</div>
                        <div style={{ fontSize: 10, color: "#C62828", marginTop: 4 }}>≈ ฿{Math.round(Math.abs(surplus) * r).toLocaleString()} — ต้องหางาน part-time</div>
                      </div>
                      <div style={{ background: "#E3F2FD", borderRadius: 8, padding: 10, borderLeft: "4px solid #1565C0" }}>
                        <div style={{ fontSize: 10, fontWeight: 700, color: "#1565C0" }}>💼 ทำงาน part-time 10 ชม./wk ตลอดปี</div>
                        <div style={{ fontSize: 10, color: "#1565C0", marginTop: 3 }}>£12/ชม. × 10 ชม. × 40 wk = <strong>£4,800/ปี</strong></div>
                        <div style={{ fontSize: 9, color: C.sub, marginTop: 2 }}>
                          {Math.abs(surplus) <= 4800 ? "✅ ช่วยปิดส่วนต่างได้ครบ!" : "ช่วยปิดส่วนต่างได้บางส่วน"}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div style={{ padding: "8px 0", fontSize: 10, color: C.sub }}>
                  กรอกเงินที่มีในหน้า{" "}
                  <strong onClick={function() { setTab("decide"); setShowMore(false); }} style={{ color: "#1a237e", cursor: "pointer" }}>
                    🎯 แนะนำ
                  </strong>{" "}
                  เพื่อดูว่าเงินพอไหม
                </div>
              )}
            </div>

            {/* ⑥ Peak Month Warning */}
            <div style={{ background: C.card, borderRadius: 12, padding: 14, marginBottom: 8 }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: C.text, marginBottom: 8 }}>⑥ เดือนที่จ่ายหนักสุด</div>
              {budgetData.peakMonths.map(function(pm, i) {
                return (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "7px 0", borderBottom: i < budgetData.peakMonths.length - 1 ? "1px solid " + C.border : "none" }}>
                    <div>
                      <div style={{ fontSize: 10, fontWeight: 700, color: pm.color }}>{pm.month}</div>
                      <div style={{ fontSize: 9, color: C.sub }}>{pm.note}</div>
                    </div>
                    <div style={{ fontSize: 12, fontWeight: 800, color: pm.color }}>~£{pm.amount.toLocaleString()}</div>
                  </div>
                );
              })}
            </div>

            {/* ⑦ Exchange Rate Impact */}
            <div style={{ background: C.card, borderRadius: 12, padding: 14, marginBottom: 8 }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: C.text, marginBottom: 4 }}>⑦ ผลกระทบจาก Exchange Rate</div>
              <div style={{ fontSize: 9, color: C.sub, marginBottom: 8 }}>Total £{grandTotal.toLocaleString()} แลกที่ rate ต่างกัน</div>
              {[41, 44, 46].map(function(testRate) {
                var thb = Math.round(grandTotal * testRate);
                var diff = thb - Math.round(grandTotal * 44);
                var isCurrent = Math.abs(testRate - r) < 1.5;
                return (
                  <div key={testRate} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 0", borderBottom: "1px solid " + C.border }}>
                    <span style={{ fontSize: 10, fontWeight: isCurrent ? 800 : 400, color: isCurrent ? "#E65100" : C.text }}>
                      ฿{testRate}/£{isCurrent ? " ← ปัจจุบัน" : ""}
                    </span>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: 10, fontWeight: 800, color: C.text }}>฿{thb.toLocaleString()}</div>
                      {testRate !== 44 && (
                        <div style={{ fontSize: 9, color: diff < 0 ? "#2E7D32" : "#C62828" }}>
                          {diff < 0 ? "ประหยัด" : "เพิ่ม"} ฿{Math.abs(diff).toLocaleString()}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
              <div style={{ marginTop: 8, padding: "6px 10px", background: "#FFF3E0", borderRadius: 6 }}>
                <div style={{ fontSize: 9, fontWeight: 700, color: "#E65100" }}>
                  ต่างกัน ฿{Math.round(grandTotal * (46 - 41)).toLocaleString()} ระหว่าง rate ดีสุด (฿41) vs แย่สุด (฿46)!
                </div>
                <div style={{ fontSize: 9, color: C.sub, marginTop: 2 }}>
                  💡 ทยอยแลกตอน rate ≤ ฿42 ผ่าน Wise หรือ SCB Travel Card
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ── MONEY ── */}
      {tab === "money" && (
        <div>
          <div style={{ background: "linear-gradient(135deg,#1B5E20,#388E3C)", borderRadius: 12, padding: 14, color: "#fff", textAlign: "center", marginBottom: 8 }}>
            <div style={{ fontSize: 9, opacity: 0.6 }}>Realtime Exchange Rate</div>
            <div style={{ fontSize: 26, fontWeight: 800 }}>1 GBP = ฿{r.toFixed(2)}</div>
            <div style={{ fontSize: 11, marginTop: 4, padding: "4px 12px", background: "rgba(255,255,255,0.15)", borderRadius: 8, display: "inline-block" }}>
              {r <= 42 ? "🟢 ถูกมาก! แลกเยอะๆ เลย" : r <= 43.5 ? "🟡 โอเค ทยอยแลกได้" : r <= 45 ? "🟠 ปกติ แลกบางส่วน" : "🔴 แพง รอก่อนถ้าได้"}
            </div>
            <div style={{ fontSize: 9, opacity: 0.5, marginTop: 4 }}>YouTrip/SCB Travel Card เรทใกล้เคียง Visa rate · Wise เรทดีกว่า ~0.3-0.5%</div>
          </div>

          <div style={{ background: C.card, borderRadius: 12, padding: 14, marginBottom: 8 }}>
            <div style={{ fontSize: 12, fontWeight: 800, color: "#1a237e", marginBottom: 8 }}>💰 งบประมาณรวมทั้งหมด (ประมาณ)</div>
            {[
              { c: "ค่าเรียน", items: [["Tuition LLM (หลังหัก Scholarship £5k)", "£25,500"], ["Pre-sessional 6wk", "£3,540"], ["Deposit (หักจาก Tuition แล้ว)", "-£2,000"]] },
              { c: "ค่าที่พัก", items: [["Pre-sess 6wk (Josephine Butler)", "~£1,300"], ["Studio 51wk (Duresme Court Classic ⭐)", "£14,739"], ["หรือ Studio 51wk (Student Castle Bellamy)", "£18,360"]] },
              { c: "ค่าวีซ่า+เอกสาร", items: [["Student Visa", "£524"], ["Health Surcharge (IHS) 6 เดือน", "£388"], ["TB Test", "~£65 (฿3,800)"]] },
              { c: "วัคซีน", items: [["MenACWY + MenB + MMR", "~£120 (฿5,000-8,000)"]] },
              { c: "ตั๋วเครื่องบิน", items: [["BKK → NCL (เที่ยวเดียว)", "~£500"], ["กลับ NCL → BKK", "~£450"]] },
              { c: "ค่าครองชีพ ~12 เดือน", items: [["อาหาร (ทำเอง)", "~£3,000"], ["ค่าเดินทางในเมือง", "~£300"], ["หนังสือ+อุปกรณ์", "~£300"], ["สังสรรค์+ท่องเที่ยว", "~£1,200"], ["เสื้อผ้า+ของใช้", "~£500"]] },
            ].map(function (cat, ci) {
              return (
                <div key={ci} style={{ marginBottom: 10 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "#1a237e", marginBottom: 3 }}>{cat.c}</div>
                  {cat.items.map(function (it, ii) {
                    return (
                      <div key={ii} style={{ display: "flex", justifyContent: "space-between", padding: "2px 0" }}>
                        <span style={{ fontSize: 10, color: C.sub }}>{it[0]}</span>
                        <span style={{ fontSize: 10, fontWeight: 600, color: C.text }}>{it[1]}</span>
                      </div>
                    );
                  })}
                </div>
              );
            })}
            <div style={{ borderTop: "2px solid #1a237e", paddingTop: 8, marginTop: 4 }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ fontSize: 13, fontWeight: 800, color: "#1a237e" }}>รวมทั้งหมด (ประมาณ)</span><span style={{ fontSize: 13, fontWeight: 800, color: "#C62828" }}>~£45,676</span></div>
              <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ fontSize: 12, fontWeight: 700, color: C.sub }}>เป็นเงินไทย</span><span style={{ fontSize: 14, fontWeight: 800, color: "#C62828" }}>~฿{Math.round(45676 * r).toLocaleString()}</span></div>
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 2 }}><span style={{ fontSize: 10, color: C.sub }}>เฉลี่ยต่อเดือน (~14 เดือน)</span><span style={{ fontSize: 11, fontWeight: 700, color: "#E65100" }}>~฿{Math.round(45676 * r / 14).toLocaleString()}/เดือน</span></div>
            </div>
          </div>

          <div style={{ background: C.card, borderRadius: 12, padding: 14, marginBottom: 8 }}>
            <div style={{ fontSize: 12, fontWeight: 800, color: "#1565C0", marginBottom: 8 }}>💳 แนะนำ Travel Card + แลกเงิน</div>
            <div style={{ fontSize: 10, color: C.text, lineHeight: 1.7 }}>
              <strong>Wise</strong> — แนะนำมากสุด! เรทดีสุด ค่าธรรมเนียมต่ำ สมัครจากไทยได้ ใช้จ่าย UK ได้เลย<br />
              <strong>YouTrip</strong> — สะดวก เรท Visa/Mastercard ไม่มี markup สมัครง่าย<br />
              <strong>SCB Travel Card</strong> — ดีสำหรับคนใช้ SCB อยู่แล้ว เรทค่อนข้างดี
            </div>
            <div style={{ background: "#E3F2FD", borderRadius: 8, padding: 8, marginTop: 6, fontSize: 10, color: "#0D47A1", lineHeight: 1.6 }}>
              <strong>กลยุทธ์แลกเงิน:</strong><br />
              • เปิด Wise ตอนนี้เลย → ตั้ง Rate Alert<br />
              • ทยอยแลก 3-5 ครั้ง อย่าแลกทีเดียวหมด<br />
              • <strong style={{ color: "#2E7D32" }}>≤41 ฿/GBP = ดีที่สุด แลกเยอะ!</strong><br />
              • <strong style={{ color: "#2E7D32" }}>≤42 = ดีมาก แลกได้เลย</strong><br />
              • ≤43.5 = โอเค ทยอยแลก<br />
              • ≤45 = ปกติ แลกบางส่วน<br />
              • &gt;45 = แพง รอถ้าได้<br />
              • เก็บเงินสด GBP ~£200 (แลก Superrich เรทดี)
            </div>
          </div>
        </div>
      )}

      {/* ── VISA ── */}
      {tab === "visa" && (
        <div>
          <div style={{ background: C.card, borderRadius: 12, padding: 14, marginBottom: 8 }}>
            <div style={{ fontSize: 12, fontWeight: 800, color: "#C62828", marginBottom: 8 }}>📋 เอกสารยื่น Student Visa (ครบทุกอย่าง)</div>
            <div style={{ fontSize: 10, color: C.sub, marginBottom: 6 }}>ยื่นผ่าน VFS Global · เวลา 08:30-14:00 · ผล 10-15 วันทำการ · Priority 5 วัน (+£500) · Super Priority 1-2 วัน (+£1,000)</div>
            {[
              { c: "📄 เอกสารหลัก", i: ["ใบสมัคร Online กรอกเสร็จ (ผ่าน GOV.UK) + ชำระค่าวีซ่า £524", "ใบนัดหมาย VFS Online", "IHS Reference Number (จ่าย Health Surcharge £388 สำหรับ 6 เดือน)", "Passport ตัวจริง + สำเนาหน้าแรก 2 ชุด + สำเนาทุกหน้าที่มีตราเข้า-ออก", "Passport เล่มเก่า (ถ้ามี)", "สำเนาบัตร ปชช. 1 ชุด", "CAS Statement จาก Durham", "เอกสารการเรียนตาม CAS: Transcript + ปริญญาบัตร + IELTS certificate", "TB Certificate (ผลตรวจวัณโรค จาก IOM/BNH)"] },
              { c: "💰 หลักฐานการเงิน", i: ["Bank Statement จากธนาคาร (อายุไม่เกิน 1 เดือน)", "ยอดเงินขั้นต่ำ: £37,579 (~฿1.65M) อยู่ในบัญชี 28 วัน+", "ถ้าเป็นบัญชีผู้ปกครอง ต้องมี:", "  — สูติบัตร ภาษาไทย + แปลอังกฤษ", "  — จดหมาย Sponsorship Letter จากผู้ปกครอง + ลายเซ็น", "  — สำเนาบัตร ปชช. ผู้ปกครอง + ลายเซ็น", "  — ใบเปลี่ยนชื่อ/นามสกุล + แปลอังกฤษ (ถ้ามี)"] },
            ].map(function (sec, si) {
              return (
                <div key={si} style={{ marginBottom: 10 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "#C62828", marginBottom: 3 }}>{sec.c}</div>
                  {sec.i.map(function (it, ii) {
                    return <div key={ii} style={{ fontSize: 10, color: it.startsWith("  ") ? C.sub : C.text, marginBottom: 2, paddingLeft: it.startsWith("  ") ? 16 : 8, borderLeft: "2px solid #FFCDD2" }}>{it}</div>;
                  })}
                </div>
              );
            })}
            <div style={{ background: "#FFF3E0", borderRadius: 8, padding: 8, fontSize: 10, color: "#E65100" }}>
              ⚠️ เอกสารทุกอย่างต้องเป็นภาษาอังกฤษ ถ้าเป็นภาษาอื่นต้องแปลโดยผู้แปลที่ได้รับการรับรอง
            </div>
          </div>

          <div style={{ background: C.card, borderRadius: 12, padding: 14, marginBottom: 8 }}>
            <div style={{ fontSize: 12, fontWeight: 800, color: "#1B5E20", marginBottom: 8 }}>💼 Part-time Work + หลังจบ</div>
            <div style={{ fontSize: 10, color: C.text, lineHeight: 1.7 }}>
              <strong>ระหว่างเรียน:</strong> ทำงานได้สูงสุด 20 ชม./สัปดาห์ (part-time)<br />
              <strong>ช่วงปิดเทอม:</strong> ทำงาน full-time ได้<br />
              <strong>งานที่ นศ. Law นิยม:</strong> Library assistant, Café/Bar staff, Tutor, Legal intern<br />
              <strong>ค่าแรงขั้นต่ำ UK:</strong> ~£12/ชม. (อายุ 21+) ≈ ฿528/ชม.<br /><br />
              <strong>🎓 หลังจบ LLM:</strong><br />
              <strong>Graduate Route Visa</strong> — อยู่ทำงานใน UK ได้ 2 ปี หลังจบ! ไม่ต้องมี sponsor<br />
              <span style={{ color: "#C62828", fontWeight: 700 }}>⚠️ รัฐบาล UK อาจลดเหลือ 18 เดือน — ติดตามข่าวก่อนสมัคร</span><br />
              <strong>สมัครได้ตอน:</strong> ก่อน Student Visa หมดอายุ ค่าสมัคร ~£822 + IHS<br />
              <strong>ทำงานได้:</strong> ทุกประเภท ไม่จำกัดชั่วโมง ไม่ต้องมี employer sponsor
            </div>
          </div>

          <div style={{ background: C.card, borderRadius: 12, padding: 14, marginBottom: 8 }}>
            <div style={{ fontSize: 12, fontWeight: 800, color: "#4285F4", marginBottom: 8 }}>📅 Add to Google Calendar</div>
            <div style={{ fontSize: 10, color: C.sub, marginBottom: 6 }}>กดปุ่มเพื่อเพิ่ม deadline สำคัญลง Google Calendar</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              {[
                { t: "College Preference เปิด", d: "20260330", de: "20260331", c: "สมัคร College Preference! เลือก Ustinov > St Cuthbert's > South" },
                { t: "เริ่มเตรียมเงินในบัญชี 28 วัน", d: "20260420", de: "20260421", c: "ฝากเงิน £37,579 เข้าบัญชี ต้องอยู่ครบ 28 วันก่อนยื่นวีซ่า" },
                { t: "นัดตรวจ TB Test", d: "20260501", de: "20260502", c: "ตรวจ TB ที่ IOM (฿3,800) หรือ BNH (฿4,000)" },
                { t: "ฉีดวัคซีน MenACWY + MenB เข็ม 1", d: "20260505", de: "20260506", c: "ฉีดที่ รพ.เอกชน หรือสถานเสาวภา MenB ต้อง 2 เข็มห่าง 1 เดือน" },
                { t: "ฉีดวัคซีน MenB เข็ม 2", d: "20260605", de: "20260606", c: "MenB เข็มที่ 2 ห่างจากเข็มแรก 1 เดือน" },
                { t: "ยื่น Student Visa ที่ VFS", d: "20260615", de: "20260616", c: "เตรียมเอกสารทั้งหมด + ค่าวีซ่า £524 + IHS £388" },
                { t: "Deadline สมัคร Pre-sessional", d: "20260706", de: "20260707", c: "Deadline! สมัคร Pre-sessional 6wk ใน Applicant Portal" },
                { t: "จองตั๋วเครื่องบิน BKK→NCL", d: "20260710", de: "20260711", c: "จอง Qatar/Emirates/Thai ถึงก่อน 3 ส.ค.!" },
                { t: "✈️ บินไป Durham!", d: "20260801", de: "20260802", c: "บิน BKK→NCL ถึงก่อน 3 ส.ค.!" },
                { t: "🎓 Pre-sessional เริ่ม!", d: "20260803", de: "20260804", c: "เริ่ม Pre-sessional 6wk ที่ Josephine Butler College" },
                { t: "Pre-sessional จบ", d: "20260911", de: "20260912", c: "จบ Pre-sessional → เตรียมย้ายเข้า Private Studio" },
                { t: "🎓 LLM เริ่มเรียน!", d: "20260928", de: "20260929", c: "Enrolment + เริ่ม LLM International Trade & Commercial Law" },
              ].map(function (ev, i) {
                var url = "https://calendar.google.com/calendar/render?action=TEMPLATE&text=" + encodeURIComponent("Durham: " + ev.t) + "&dates=" + ev.d + "T090000Z/" + ev.de + "T090000Z&details=" + encodeURIComponent(ev.c);
                return (
                  <a key={i} href={url} target="_blank" rel="noopener noreferrer" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 10px", background: i < 1 ? "#E8F5E9" : C.border, borderRadius: 6, textDecoration: "none", color: C.text }}>
                    <div>
                      <div style={{ fontSize: 10, fontWeight: 700, color: C.text }}>{ev.t}</div>
                      <div style={{ fontSize: 9, color: C.sub }}>{ev.d.substring(6, 8) + "/" + ev.d.substring(4, 6) + "/" + ev.d.substring(0, 4)}</div>
                    </div>
                    <div style={{ background: "#4285F4", color: "#fff", padding: "3px 8px", borderRadius: 6, fontSize: 9, fontWeight: 700, flexShrink: 0 }}>+ Calendar</div>
                  </a>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── VACCINES ── */}
      {tab === "vax" && (
        <div>
          <div style={{ background: "#C62828", borderRadius: 12, padding: 12, color: "#fff", marginBottom: 8 }}>
            <div style={{ fontSize: 12, fontWeight: 800 }}>⚠️ Meningitis ระบาดใน UK! มี.ค. 2026</div>
            <div style={{ fontSize: 10, opacity: 0.9 }}>นศ.เสียชีวิต 2 คน + 11 ป่วยหนัก Kent · สายพันธุ์ MenB · แนะนำฉีด MenACWY + MenB ก่อนไป!</div>
          </div>

          {/* Vaccine progress bar */}
          <div style={{ background: C.card, borderRadius: 12, padding: 12, marginBottom: 8 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: "#1a237e" }}>📊 วัคซีนที่ฉีดแล้ว</span>
              <span style={{ fontSize: 11, fontWeight: 800, color: "#1a237e" }}>{vaccines.filter(function(v) { return checked['vax_' + v.n]; }).length}/{vaccines.length}</span>
            </div>
            <div style={{ background: C.border, borderRadius: 4, height: 10 }}>
              <div style={{ background: "#2E7D32", borderRadius: 4, height: 10, width: (vaccines.length ? (vaccines.filter(function(v) { return checked['vax_' + v.n]; }).length / vaccines.length * 100) : 0) + "%", transition: "width 0.3s" }} />
            </div>
          </div>

          {vaccines.map(function (v, i) {
            var vKey = 'vax_' + v.n;
            var vChecked = !!checked[vKey];
            return (
              <div
                key={i}
                onClick={function() { toggle(vKey); }}
                style={{ background: C.card, borderRadius: 10, padding: 10, marginBottom: 5, borderLeft: v.u ? "4px solid #C62828" : "4px solid #ddd", cursor: "pointer", opacity: vChecked ? 0.6 : 1 }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <div style={{ width: 18, height: 18, borderRadius: 3, border: "2px solid " + (vChecked ? "#4CAF50" : "#ddd"), background: vChecked ? "#E8F5E9" : C.card, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, flexShrink: 0 }}>
                      {vChecked ? "✓" : ""}
                    </div>
                    <span style={{ fontSize: 12, fontWeight: 700, color: v.u ? "#C62828" : C.text, textDecoration: vChecked ? "line-through" : "none" }}>{v.n}</span>
                  </div>
                  {v.u && <span style={{ background: "#C62828", color: "#fff", padding: "1px 6px", borderRadius: 8, fontSize: 8, fontWeight: 700 }}>เร่งด่วน!</span>}
                </div>
                <div style={{ fontSize: 10, color: C.sub, marginTop: 3 }}>{v.d}</div>
                <div style={{ fontSize: 9, color: C.sub, marginTop: 2 }}>📍 {v.w} · 💰 {v.p} · 💉 {v.dos}</div>
              </div>
            );
          })}
          <div style={{ background: "#FFF3E0", borderRadius: 8, padding: 10, fontSize: 10, color: "#E65100" }}>
            💡 ฉีด MenACWY+MenB ที่ไทย พ.ค. เพราะ MenB 2 เข็มห่าง 1 เดือน ฉีด พ.ค.+มิ.ย. ทันก่อนบิน ส.ค.
          </div>
        </div>
      )}

      {/* ── FLIGHTS ── */}
      {tab === "fly" && (
        <div>
          <div style={{ background: C.card, borderRadius: 12, padding: 14, marginBottom: 8 }}>
            <div style={{ fontSize: 12, fontWeight: 800, color: "#1a237e", marginBottom: 8 }}>✈️ BKK → Newcastle · 3 สายการบิน + กระเป๋า + Business vs Economy</div>
            <div style={{ fontSize: 10, color: C.sub, marginBottom: 8 }}>ไม่มีไฟลท์ตรง BKK-NCL ต้อง transit 1 ครั้ง · ไป Durham ครั้งแรก ขนของ ~25-35 kg!</div>
            {[
              { a: "🇶🇦 Qatar Airways", hi: true, rt: ["BKK → Doha (~6.5 ชม.)", "Doha → Newcastle NCL (~7 ชม.)"], eco: "£450-700", ecoBag: "30-35 kg + cabin 7kg", biz: "£2,500-4,000", bizBag: "40 kg (2x32) + cabin 15kg x2", stu: "สมัคร Student Club ฟรี → extra 10kg + ส่วนลด + Free WiFi!", note: "✅ แนะนำ Economy + Student Club! บินตรง NCL ไม่ต้องต่อ train กระเป๋า 40-45kg พอ!" },
              { a: "🇦🇪 Emirates", hi: false, rt: ["BKK → Dubai (~6.5 ชม.)", "Dubai → Newcastle NCL (~7.5 ชม.)"], eco: "£500-800", ecoBag: "30 kg + cabin 7kg", biz: "£3,000-5,000", bizBag: "40 kg (2x32) + cabin 2 ใบ", stu: "ไม่มี Student Club", note: "Service ดี ICE entertainment แต่ราคาสูงกว่า Qatar ~£50-100 ไม่มี Student discount" },
              { a: "🇹🇭 Thai Airways", hi: false, rt: ["BKK → London Heathrow (TG ตรง ~11.5 ชม.)", "London → Durham (LNER train ~3 ชม. +£30-50)"], eco: "£600-900", ecoBag: "23 kg เท่านั้น (Saver!) หรือ 46kg (Flex)", biz: "£3,000-5,000", bizBag: "64 kg (2x32)! เยอะสุด! + cabin 2 ใบ", stu: "Student baggage 40 kg (ต้องแจ้ง)", note: "⚠️ ต้องต่อ train London→Durham 3 ชม.! Eco Saver แค่ 23kg ไม่พอ!" },
            ].map(function (f, i) {
              return (
                <div key={i} style={{ background: f.hi ? "#E8F5E9" : C.border, borderRadius: 10, padding: 12, marginBottom: 8, border: f.hi ? "2px solid #2E7D32" : "1px solid " + C.border }}>
                  <div style={{ fontSize: 14, fontWeight: 800, color: C.text }}>{f.a} {f.hi && <span style={{ background: "#2E7D32", color: "#fff", padding: "1px 8px", borderRadius: 8, fontSize: 9, fontWeight: 700 }}>แนะนำ!</span>}</div>
                  <div style={{ margin: "6px 0" }}>
                    {f.rt.map(function (leg, li) {
                      return <div key={li} style={{ display: "flex", gap: 6, marginBottom: 2 }}><div style={{ width: 16, height: 16, borderRadius: "50%", background: "#E3F2FD", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 8, fontWeight: 700, color: "#1565C0", flexShrink: 0 }}>{li + 1}</div><div style={{ fontSize: 10, color: C.sub }}>{leg}</div></div>;
                    })}
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
                    <div style={{ background: C.card, borderRadius: 6, padding: 6, border: "1px solid " + C.border }}><div style={{ fontSize: 9, fontWeight: 700, color: "#1565C0" }}>💺 Economy</div><div style={{ fontSize: 13, fontWeight: 800, color: C.text }}>{f.eco}</div><div style={{ fontSize: 9, color: C.sub }}>🧳 {f.ecoBag}</div></div>
                    <div style={{ background: C.card, borderRadius: 6, padding: 6, border: "1px solid #CE93D8" }}><div style={{ fontSize: 9, fontWeight: 700, color: "#6A1B9A" }}>👔 Business</div><div style={{ fontSize: 13, fontWeight: 800, color: "#6A1B9A" }}>{f.biz}</div><div style={{ fontSize: 9, color: C.sub }}>🧳 {f.bizBag}</div></div>
                  </div>
                  <div style={{ fontSize: 9, color: "#2E7D32", marginTop: 4 }}>🎓 {f.stu}</div>
                  <div style={{ fontSize: 10, color: C.text, background: C.card, borderRadius: 6, padding: 6, marginTop: 4 }}>{f.note}</div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── SHOPPING ── */}
      {tab === "shop" && (
        <div>
          <div style={{ background: "linear-gradient(135deg,#1a237e,#3949AB)", borderRadius: 12, padding: 12, color: "#fff", marginBottom: 8 }}>
            <div style={{ fontSize: 13, fontWeight: 800 }}>🛒 อุปกรณ์ที่ต้องซื้อ — ซื้อที่ไหนคุ้มกว่า?</div>
            <div style={{ fontSize: 10, opacity: 0.8, marginTop: 2 }}>เปรียบเทียบราคา 🇹🇭 ไทย vs 🇬🇧 UK พร้อมเหตุผลว่าซื้อที่ไหนดีกว่า</div>
            <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
              {[
                { l: "🇹🇭 ซื้อไทย", n: shopping.reduce(function (a, c) { return a + c.items.filter(function (x) { return x.buyWhere === "TH"; }).length; }, 0) },
                { l: "🇬🇧 ซื้อ UK", n: shopping.reduce(function (a, c) { return a + c.items.filter(function (x) { return x.buyWhere === "UK"; }).length; }, 0) },
                { l: "ที่ไหนก็ได้", n: shopping.reduce(function (a, c) { return a + c.items.filter(function (x) { return x.buyWhere === "EITHER"; }).length; }, 0) },
              ].map(function (b, bi) {
                return <div key={bi} style={{ background: "rgba(255,255,255,0.15)", borderRadius: 8, padding: "4px 10px", fontSize: 10 }}><span style={{ fontWeight: 700 }}>{b.n}</span> {b.l}</div>;
              })}
            </div>
          </div>

          {/* Shopping search */}
          <input
            value={shopSearch}
            onChange={function(e) { setShopSearch(e.target.value); }}
            placeholder="🔍 ค้นหาสินค้า..."
            style={{ width: "100%", padding: "8px 10px", borderRadius: 8, border: "1px solid " + C.border, fontSize: 11, background: C.card, color: C.text, outline: "none", marginBottom: 8, boxSizing: "border-box" }}
          />

          {shopping.map(function (cat, ci) {
            var filteredItems = shopSearch ? cat.items.filter(function(item) { return item.name.toLowerCase().includes(shopSearch.toLowerCase()); }) : cat.items;
            if (filteredItems.length === 0) return null;
            var isOpenCat = openShop === ci;
            return (
              <div key={ci} style={{ background: C.card, borderRadius: 12, marginBottom: 6, overflow: "hidden" }}>
                <div onClick={function () { setOpenShop(isOpenCat ? -1 : ci); }} style={{ padding: "10px 14px", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ fontSize: 12, fontWeight: 800, color: "#1a237e" }}>{cat.c}</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ fontSize: 10, color: C.sub }}>{filteredItems.length} รายการ</span>
                    <span style={{ fontSize: 10, color: C.sub }}>{isOpenCat ? "▲" : "▼"}</span>
                  </div>
                </div>
                {isOpenCat && (
                  <div style={{ padding: "0 10px 10px" }}>
                    {filteredItems.map(function (item, ii) {
                      var shopKey = 'shop_' + cat.c + '_' + item.name;
                      var isBought = !!checked[shopKey];
                      var tagColor = item.tag.includes("MUST") ? "#C62828" : item.tag.includes("แนะนำ") ? "#E65100" : item.tag.includes("ซื้อ UK") ? "#0D47A1" : "#888";
                      var whereColor = item.buyWhere === "TH" ? "#1B5E20" : item.buyWhere === "UK" ? "#E65100" : "#1565C0";
                      var whereBg = item.buyWhere === "TH" ? "#E8F5E9" : item.buyWhere === "UK" ? "#FFF3E0" : "#E3F2FD";
                      var whereText = item.buyWhere === "TH" ? "🇹🇭 ซื้อไทย" : item.buyWhere === "UK" ? "🇬🇧 ซื้อ UK" : "🌍 ที่ไหนก็ได้";
                      return (
                        <div key={ii} style={{ background: C.border, borderRadius: 10, padding: 10, marginBottom: 5, borderLeft: "3px solid " + tagColor, opacity: isBought ? 0.5 : 1 }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 }}>
                            <div style={{ flex: 1 }}>
                              <div style={{ display: "flex", gap: 4, alignItems: "center", flexWrap: "wrap" }}>
                                <div
                                  onClick={function() { toggle(shopKey); }}
                                  style={{ width: 14, height: 14, borderRadius: 3, border: "2px solid " + (isBought ? "#4CAF50" : "#ddd"), background: isBought ? "#E8F5E9" : C.card, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, flexShrink: 0, cursor: "pointer" }}
                                >
                                  {isBought ? "✓" : ""}
                                </div>
                                <span style={{ fontSize: 8, padding: "1px 6px", borderRadius: 8, background: tagColor, color: "#fff", fontWeight: 700 }}>{item.tag}</span>
                                <span style={{ fontSize: 8, padding: "1px 6px", borderRadius: 8, background: whereBg, color: whereColor, fontWeight: 700 }}>{whereText}</span>
                              </div>
                              <div style={{ fontSize: 11, fontWeight: 700, color: C.text, marginTop: 3, textDecoration: isBought ? "line-through" : "none" }}>{item.name}</div>
                            </div>
                            <div style={{ textAlign: "right", flexShrink: 0, marginLeft: 8 }}>
                              <div style={{ fontSize: 12, fontWeight: 800, color: "#1a237e" }}>{item.price}</div>
                            </div>
                          </div>
                          {(item.priceTH || item.priceUK) && (
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4, marginBottom: 4 }}>
                              {item.priceTH && item.priceTH !== "-" && <div style={{ background: "#E8F5E9", borderRadius: 6, padding: "3px 6px", textAlign: "center" }}><div style={{ fontSize: 8, color: "#888" }}>🇹🇭 ไทย</div><div style={{ fontSize: 10, fontWeight: 700, color: "#1B5E20" }}>{item.priceTH}</div></div>}
                              {item.priceUK && item.priceUK !== "-" && <div style={{ background: "#FFF3E0", borderRadius: 6, padding: "3px 6px", textAlign: "center" }}><div style={{ fontSize: 8, color: "#888" }}>🇬🇧 UK</div><div style={{ fontSize: 10, fontWeight: 700, color: "#E65100" }}>{item.priceUK}</div></div>}
                            </div>
                          )}
                          <div style={{ fontSize: 10, color: "#1565C0", fontWeight: 600, marginBottom: 2 }}>💡 {item.why}</div>
                          <div style={{ fontSize: 9, color: C.sub, lineHeight: 1.5 }}>{item.whyDetail}</div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ── PACKING ── */}
      {tab === "pack" && (
        <div id="print-pack">
          {/* Search + Print */}
          <div style={{ display: "flex", gap: 6, marginBottom: 8, alignItems: "center" }}>
            <input
              value={packSearch}
              onChange={function(e) { setPackSearch(e.target.value); }}
              placeholder="🔍 ค้นหาของที่ต้องเตรียม..."
              style={{ flex: 1, padding: "8px 10px", borderRadius: 8, border: "1px solid " + C.border, fontSize: 11, background: C.card, color: C.text, outline: "none" }}
            />
            <button onClick={function() { window.print(); }} style={{ padding: "8px 12px", background: "#1a237e", color: "#fff", border: "none", borderRadius: 8, fontSize: 10, cursor: "pointer", whiteSpace: "nowrap" }}>🖨️ Print</button>
          </div>

          {/* Packing progress bar */}
          {(function() {
            var packTotal = packing.reduce(function(a, c) { return a + c.i.length; }, 0);
            var packDone = packing.reduce(function(a, c) {
              return a + c.i.filter(function(item) { return checked['pack_' + c.c + '_' + item]; }).length;
            }, 0);
            return (
              <div style={{ background: C.card, borderRadius: 12, padding: 12, marginBottom: 8 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: "#1a237e" }}>📦 ของที่เตรียมแล้ว</span>
                  <span style={{ fontSize: 11, fontWeight: 800, color: "#1a237e" }}>{packDone}/{packTotal}</span>
                </div>
                <div style={{ background: C.border, borderRadius: 4, height: 10 }}>
                  <div style={{ background: packDone === packTotal && packTotal > 0 ? "#2E7D32" : "#1a237e", borderRadius: 4, height: 10, width: (packTotal ? (packDone / packTotal * 100) : 0) + "%", transition: "width 0.3s" }} />
                </div>
              </div>
            );
          })()}

          {packing.map(function (cat, ci) {
            var filteredItems = packSearch
              ? cat.i.filter(function(item) { return item.toLowerCase().includes(packSearch.toLowerCase()); })
              : cat.i;
            if (filteredItems.length === 0) return null;
            return (
              <div key={ci} style={{ background: C.card, borderRadius: 12, padding: 12, marginBottom: 6 }}>
                <div style={{ fontSize: 12, fontWeight: 800, color: "#1a237e", marginBottom: 4 }}>{cat.c}</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}>
                  {filteredItems.map(function (item, ii) {
                    var packKey = 'pack_' + cat.c + '_' + item;
                    var isCh = !!checked[packKey];
                    return (
                      <div
                        key={ii}
                        onClick={function() { toggle(packKey); }}
                        style={{ display: "flex", gap: 6, alignItems: "center", cursor: "pointer", opacity: isCh ? 0.5 : 1, padding: "3px 5px" }}
                      >
                        <div style={{ width: 14, height: 14, borderRadius: 3, border: "2px solid " + (isCh ? "#4CAF50" : "#ddd"), background: isCh ? "#E8F5E9" : C.card, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, flexShrink: 0 }}>
                          {isCh ? "✓" : ""}
                        </div>
                        <div style={{ fontSize: 10, color: C.text, textDecoration: isCh ? "line-through" : "none" }}>{item}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── INTROVERT GUIDE ── */}
      {tab === "intro" && (
        <div>
          <div style={{ background: "linear-gradient(135deg,#4A148C,#7B1FA2)", borderRadius: 12, padding: 14, color: "#fff", marginBottom: 8 }}>
            <div style={{ fontSize: 14, fontWeight: 800 }}>🧠 Introvert Survival Guide</div>
            <div style={{ fontSize: 11, opacity: 0.9, marginTop: 2 }}>สำหรับ Pannathorn — ไม่เคยอยู่คนเดียว ครั้งแรกที่ไปเรียนต่างประเทศ</div>
            <div style={{ fontSize: 10, opacity: 0.7, marginTop: 4, lineHeight: 1.5 }}>ทุกอย่างที่รู้สึกตอนนี้ — กลัว ตื่นเต้น กังวล — ปกติ 100% 💜</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 4, marginTop: 8 }}>
              {[{ n: introvert.length, l: "หมวด" }, { n: introvert.reduce(function (a, c) { return a + c.tips.length; }, 0) + "+", l: "เทคนิค" }, { n: "∞", l: "กำลังใจ" }].map(function (s, si) {
                return (
                  <div key={si} style={{ background: "rgba(255,255,255,0.15)", borderRadius: 8, padding: "5px 4px", textAlign: "center" }}>
                    <div style={{ fontSize: 16, fontWeight: 800 }}>{s.n}</div>
                    <div style={{ fontSize: 8, opacity: 0.7 }}>{s.l}</div>
                  </div>
                );
              })}
            </div>
          </div>

          {introvert.map(function (cat, ci) {
            var isOpen = openIntro === ci;
            return (
              <div key={ci} style={{ background: C.card, borderRadius: 12, marginBottom: 6, overflow: "hidden", borderLeft: "4px solid " + cat.color }}>
                <div onClick={function () { setOpenIntro(isOpen ? -1 : ci); }} style={{ padding: "10px 14px", cursor: "pointer", background: isOpen ? cat.bg : C.card }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontSize: 20 }}>{cat.icon}</span>
                      <div>
                        <div style={{ fontSize: 12, fontWeight: 800, color: cat.color }}>{cat.c}</div>
                        <div style={{ fontSize: 9, color: C.sub }}>{cat.tips.length} เทคนิค</div>
                      </div>
                    </div>
                    <span style={{ fontSize: 10, color: C.sub }}>{isOpen ? "▲" : "▼"}</span>
                  </div>
                </div>
                {isOpen && (
                  <div style={{ padding: "0 12px 12px" }}>
                    {cat.tips.map(function (tip, ti) {
                      return (
                        <div key={ti} style={{ background: cat.bg, borderRadius: 8, padding: 10, marginTop: 6 }}>
                          <div style={{ fontSize: 11, fontWeight: 700, color: cat.color, marginBottom: 3 }}>{tip.t}</div>
                          <div style={{ fontSize: 10, color: "#555", lineHeight: 1.6 }}>{tip.d}</div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}

          <div style={{ background: "linear-gradient(135deg,#C62828,#E53935)", borderRadius: 12, padding: 12, color: "#fff", marginTop: 4 }}>
            <div style={{ fontSize: 12, fontWeight: 800, marginBottom: 6 }}>🆘 เบอร์ฉุกเฉิน Mental Health</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4 }}>
              {[["Nightline (นศ.ฟัง)", "0191 334 0333", "ทุกคืน 21:00-08:00"], ["Samaritans", "116 123", "ฟรี 24 ชม."], ["Shout (text)", "85258", "ส่ง text 24 ชม."], ["Durham Counselling", "email", "counselling.service\n@durham.ac.uk"]].map(function (e, ei) {
                return (
                  <div key={ei} style={{ background: "rgba(255,255,255,0.15)", borderRadius: 8, padding: "6px 8px" }}>
                    <div style={{ fontSize: 9, opacity: 0.7 }}>{e[0]}</div>
                    <div style={{ fontSize: 11, fontWeight: 800 }}>{e[1]}</div>
                    <div style={{ fontSize: 8, opacity: 0.6, whiteSpace: "pre-line" }}>{e[2]}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── LIFE IN UK ── (data from Google Sheets tab "📱 Life UK") */}
      {tab === "life" && (
        <div>
          {/* Apps — section="apps", c2=name, c3=description */}
          {lifeuk.filter(function(l) { return l.section === 'apps'; }).length > 0 && (
            <div style={{ background: C.card, borderRadius: 12, padding: 14, marginBottom: 8 }}>
              <div style={{ fontSize: 12, fontWeight: 800, color: "#1a237e", marginBottom: 8 }}>📱 App ที่ต้องโหลดก่อนไป</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4 }}>
                {lifeuk.filter(function(l) { return l.section === 'apps'; }).map(function(a, i) {
                  return (
                    <div key={i} style={{ background: C.border, borderRadius: 6, padding: "5px 8px" }}>
                      <div style={{ fontSize: 10, fontWeight: 700, color: C.text }}>{a.c2}</div>
                      <div style={{ fontSize: 9, color: C.sub }}>{a.c3}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          {/* First Week — section="firstweek", c2=task */}
          {lifeuk.filter(function(l) { return l.section === 'firstweek'; }).length > 0 && (
            <div style={{ background: C.card, borderRadius: 12, padding: 14, marginBottom: 8 }}>
              <div style={{ fontSize: 12, fontWeight: 800, color: "#C62828", marginBottom: 8 }}>🏥 สิ่งที่ต้องทำสัปดาห์แรกที่ถึง Durham</div>
              {lifeuk.filter(function(l) { return l.section === 'firstweek'; }).map(function(t, i) {
                return <div key={i} style={{ fontSize: 10, color: C.text, marginBottom: 4, paddingLeft: 8, borderLeft: "2px solid #FFCDD2" }}>{t.c2}</div>;
              })}
            </div>
          )}
          {/* Emergency numbers — reuse contacts data */}
          {contacts.filter(function(c) { return c.cat && (c.cat.includes('Emergency') || c.cat.includes('ฉุกเฉิน')); }).length > 0 && (
            <div style={{ background: C.card, borderRadius: 12, padding: 14, marginBottom: 8 }}>
              <div style={{ fontSize: 12, fontWeight: 800, color: "#C62828", marginBottom: 8 }}>📞 เบอร์ฉุกเฉิน UK</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4 }}>
                {contacts.filter(function(c) { return c.cat && (c.cat.includes('Emergency') || c.cat.includes('ฉุกเฉิน')); }).map(function(e, i) {
                  var isTop = e.contact === '999';
                  return (
                    <div key={i} style={{ background: isTop ? "#FFEBEE" : C.border, borderRadius: 6, padding: "5px 8px" }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: isTop ? "#C62828" : C.text }}>{e.contact || e.name}</div>
                      <div style={{ fontSize: 9, color: C.sub }}>{e.name}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          {/* Weather — hardcoded (factual, rarely changes) */}
          <div style={{ background: C.card, borderRadius: 12, padding: 14, marginBottom: 8 }}>
            <div style={{ fontSize: 12, fontWeight: 800, color: "#0D47A1", marginBottom: 8 }}>🌡️ สภาพอากาศ Durham</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 3 }}>
              {[["ส.ค.", "☀️", "12-19°C", "Pre-sess\nเย็นสบาย"], ["ก.ย.-พ.ย.", "🍂", "5-15°C", "ใบไม้ร่วง\nเริ่มหนาว"], ["ธ.ค.-ก.พ.", "❄️", "0-7°C", "หนาวมาก!\nอาจมีหิมะ"], ["มี.ค.-มิ.ย.", "🌸", "6-18°C", "เริ่มอุ่น\nDissertation"]].map(function(w, i) {
                return <div key={i} style={{ background: C.border, borderRadius: 6, padding: "6px 4px", textAlign: "center" }}><div style={{ fontSize: 9, fontWeight: 700, color: C.text }}>{w[0]}</div><div style={{ fontSize: 16 }}>{w[1]}</div><div style={{ fontSize: 10, fontWeight: 700, color: C.text }}>{w[2]}</div><div style={{ fontSize: 8, color: C.sub, whiteSpace: "pre-line" }}>{w[3]}</div></div>;
              })}
            </div>
            <div style={{ fontSize: 9, color: C.sub, marginTop: 4 }}>Durham อยู่ภาคตะวันออกเฉียงเหนือ หนาวและฝนเยอะกว่า London! เตรียมเสื้อกันหนาว+กันน้ำ ให้พร้อม</div>
          </div>
          {/* Tips — section="tips", c2=tip */}
          {lifeuk.filter(function(l) { return l.section === 'tips'; }).length > 0 && (
            <div style={{ background: C.card, borderRadius: 12, padding: 14, marginBottom: 8 }}>
              <div style={{ fontSize: 12, fontWeight: 800, color: "#6A1B9A", marginBottom: 8 }}>💡 Tips จากรุ่นพี่</div>
              {lifeuk.filter(function(l) { return l.section === 'tips'; }).map(function(t, i) {
                return <div key={i} style={{ fontSize: 10, color: C.text, marginBottom: 4, paddingLeft: 8, borderLeft: "2px solid #CE93D8" }}>{t.c2}</div>;
              })}
            </div>
          )}
        </div>
      )}

      {/* ── EXPENSE TRACKER ── */}
      {tab === "expense" && (
        <div>
          {/* Sheet expenses from Google Sheets */}
          {sheetExpenses.length > 0 && (function() {
            var cats = [...new Set(sheetExpenses.map(function(e) { return e.cat; }).filter(Boolean))];
            var total = sheetExpenses.reduce(function(a, e) { return a + (e.amount || 0); }, 0);
            return (
              <div style={{ background: C.card, borderRadius: 12, padding: 14, marginBottom: 8 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                  <div style={{ fontSize: 12, fontWeight: 800, color: "#1B5E20" }}>📊 Google Sheets — รายจ่ายทั้งหมด</div>
                  <div style={{ fontSize: 13, fontWeight: 800, color: "#1B5E20" }}>£{total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                </div>
                {/* By category summary */}
                {cats.map(function(cat) {
                  var catTotal = sheetExpenses.filter(function(e) { return e.cat === cat; }).reduce(function(a, e) { return a + (e.amount || 0); }, 0);
                  return (
                    <div key={cat} style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", borderBottom: "1px solid " + C.border, fontSize: 10 }}>
                      <span style={{ color: C.text }}>{cat || "อื่นๆ"}</span>
                      <span style={{ fontWeight: 700, color: "#1a237e" }}>£{catTotal.toFixed(2)}</span>
                    </div>
                  );
                })}
                {/* Line items */}
                <div style={{ marginTop: 10 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: C.sub, marginBottom: 6 }}>รายการล่าสุด</div>
                  {sheetExpenses.slice(0, 10).map(function(e, ei) {
                    return (
                      <div key={ei} style={{ display: "flex", alignItems: "center", gap: 8, padding: "5px 0", borderBottom: "1px solid " + C.border }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 10, fontWeight: 700, color: C.text }}>{e.item}</div>
                          <div style={{ fontSize: 9, color: C.sub }}>{e.cat}{e.payment ? " · " + e.payment : ""}{e.date ? " · " + e.date : ""}</div>
                          {e.note && <div style={{ fontSize: 9, color: C.sub, fontStyle: "italic" }}>{e.note}</div>}
                        </div>
                        <div style={{ fontSize: 12, fontWeight: 800, color: "#1a237e" }}>£{(e.amount || 0).toFixed(2)}</div>
                      </div>
                    );
                  })}
                  {sheetExpenses.length > 10 && (
                    <div style={{ fontSize: 9, color: C.sub, textAlign: "center", paddingTop: 6 }}>+ {sheetExpenses.length - 10} รายการ — เพิ่มใน Google Sheets</div>
                  )}
                </div>
              </div>
            );
          })()}

          {/* Add form */}
          <div style={{ background: C.card, borderRadius: 12, padding: 14, marginBottom: 8 }}>
            <div style={{ fontSize: 12, fontWeight: 800, color: "#1a237e", marginBottom: 10 }}>➕ บันทึกค่าใช้จ่ายชั่วคราว (local)</div>
            <input
              value={expForm.desc}
              onChange={function(e) { setExpForm(function(f) { return { ...f, desc: e.target.value }; }); }}
              placeholder="รายการ เช่น ข้าวมันไก่"
              style={{ width: "100%", padding: "7px 10px", borderRadius: 8, border: "1px solid " + C.border, fontSize: 11, marginBottom: 6, background: C.bg, color: C.text, boxSizing: "border-box" }}
            />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, marginBottom: 6 }}>
              <input
                type="number"
                value={expForm.amount}
                onChange={function(e) { setExpForm(function(f) { return { ...f, amount: e.target.value }; }); }}
                placeholder="£ จำนวน"
                style={{ padding: "7px 10px", borderRadius: 8, border: "1px solid " + C.border, fontSize: 11, background: C.bg, color: C.text }}
              />
              <input
                type="date"
                value={expForm.date}
                onChange={function(e) { setExpForm(function(f) { return { ...f, date: e.target.value }; }); }}
                style={{ padding: "7px 10px", borderRadius: 8, border: "1px solid " + C.border, fontSize: 11, background: C.bg, color: C.text }}
              />
            </div>
            <select
              value={expForm.cat}
              onChange={function(e) { setExpForm(function(f) { return { ...f, cat: e.target.value }; }); }}
              style={{ width: "100%", padding: "7px 10px", borderRadius: 8, border: "1px solid " + C.border, fontSize: 11, marginBottom: 8, background: C.bg, color: C.text }}
            >
              {EXPENSE_CATS.map(function(c) { return <option key={c} value={c}>{c}</option>; })}
            </select>
            <button
              onClick={addExpense}
              style={{ width: "100%", padding: "9px", borderRadius: 8, border: "none", background: "#1a237e", color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer" }}
            >
              ➕ เพิ่มรายการ
            </button>
          </div>

          {/* Budget summary */}
          <div style={{ background: C.card, borderRadius: 12, padding: 14, marginBottom: 8 }}>
            <div style={{ fontSize: 12, fontWeight: 800, color: "#1a237e", marginBottom: 10 }}>📊 สรุปงบรายเดือน (เดือนนี้)</div>
            {EXPENSE_CATS.map(function(cat) {
              var now = new Date();
              var monthSpent = expenses.filter(function(e) {
                var d = new Date(e.date);
                return e.cat === cat && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
              }).reduce(function(a, e) { return a + e.amount; }, 0);
              var budget = BUDGETS[cat];
              var pct = Math.min(100, (monthSpent / budget) * 100);
              var over = monthSpent > budget;
              return (
                <div key={cat} style={{ marginBottom: 10 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 2 }}>
                    <span style={{ fontSize: 10, color: C.text }}>{cat}</span>
                    <span style={{ fontSize: 10, fontWeight: 700, color: over ? "#C62828" : "#1a237e" }}>
                      £{monthSpent.toFixed(2)} / £{budget}
                    </span>
                  </div>
                  <div style={{ background: C.border, borderRadius: 4, height: 7 }}>
                    <div style={{ background: over ? "#C62828" : pct > 80 ? "#E65100" : "#1a237e", borderRadius: 4, height: 7, width: pct + "%", transition: "width 0.3s" }} />
                  </div>
                </div>
              );
            })}
            <div style={{ borderTop: "1px solid " + C.border, paddingTop: 8, display: "flex", justifyContent: "space-between" }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: C.text }}>รวมเดือนนี้</span>
              <span style={{ fontSize: 12, fontWeight: 800, color: "#1a237e" }}>
                £{expenses.filter(function(e) { var d = new Date(e.date); var n = new Date(); return d.getMonth() === n.getMonth() && d.getFullYear() === n.getFullYear(); }).reduce(function(a, e) { return a + e.amount; }, 0).toFixed(2)}
                {" / £"}
                {Object.values(BUDGETS).reduce(function(a, b) { return a + b; }, 0)}
              </span>
            </div>
          </div>

          {/* Expense list */}
          <div style={{ background: C.card, borderRadius: 12, padding: 14, marginBottom: 8 }}>
            <div style={{ fontSize: 12, fontWeight: 800, color: "#1a237e", marginBottom: 8 }}>🧾 รายการทั้งหมด ({expenses.length})</div>
            {expenses.length === 0 && <div style={{ fontSize: 11, color: C.sub, textAlign: "center", padding: 20 }}>ยังไม่มีรายการ</div>}
            {expenses.map(function(e) {
              return (
                <div key={e.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 0", borderBottom: "1px solid " + C.border }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: C.text }}>{e.desc}</div>
                    <div style={{ fontSize: 9, color: C.sub }}>{e.cat} · {e.date}</div>
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 800, color: "#1a237e" }}>£{e.amount.toFixed(2)}</div>
                  <button
                    onClick={function() { delExpense(e.id); }}
                    style={{ background: "none", border: "none", cursor: "pointer", fontSize: 14, color: "#C62828", padding: "0 4px" }}
                  >×</button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── ACADEMIC PREP ── (data from Google Sheets tab "🎓 Academic") */}
      {tab === "academic" && (
        <div>
          {/* OSCOLA */}
          {academic.filter(function(a) { return a.section === 'oscola'; }).length > 0 && (
            <div style={{ background: C.card, borderRadius: 12, padding: 14, marginBottom: 8 }}>
              <div style={{ fontSize: 12, fontWeight: 800, color: "#1a237e", marginBottom: 8 }}>📚 OSCOLA Referencing (Law)</div>
              {academic.filter(function(a) { return a.section === 'oscola'; }).map(function(r, i) {
                return (
                  <div key={i} style={{ marginBottom: 10 }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: "#0D47A1" }}>{r.c2}</div>
                    <div style={{ fontSize: 9, fontFamily: "monospace", background: C.border, borderRadius: 6, padding: "5px 8px", margin: "3px 0", color: C.text }}>{r.c3}</div>
                    {r.c4 && <div style={{ fontSize: 9, color: C.sub }}>{r.c4}</div>}
                  </div>
                );
              })}
            </div>
          )}
          {/* LLM Timeline */}
          {academic.filter(function(a) { return a.section === 'timeline'; }).length > 0 && (
            <div style={{ background: C.card, borderRadius: 12, padding: 14, marginBottom: 8 }}>
              <div style={{ fontSize: 12, fontWeight: 800, color: "#1a237e", marginBottom: 8 }}>📅 LLM Timeline 2026-27</div>
              {academic.filter(function(a) { return a.section === 'timeline'; }).map(function(e, i, arr) {
                return (
                  <div key={i} style={{ display: "flex", gap: 10, marginBottom: 8, paddingBottom: 8, borderBottom: i < arr.length - 1 ? "1px solid " + C.border : "none" }}>
                    <div style={{ width: 90, fontSize: 9, fontWeight: 700, color: e.c5 || "#1a237e", flexShrink: 0 }}>{e.c2}</div>
                    <div style={{ fontSize: 10, color: C.text }}>{e.c3}</div>
                  </div>
                );
              })}
            </div>
          )}
          {/* University Systems */}
          {academic.filter(function(a) { return a.section === 'systems'; }).length > 0 && (
            <div style={{ background: C.card, borderRadius: 12, padding: 14, marginBottom: 8 }}>
              <div style={{ fontSize: 12, fontWeight: 800, color: "#1B5E20", marginBottom: 8 }}>💻 Durham University Systems</div>
              {academic.filter(function(a) { return a.section === 'systems'; }).map(function(s, i, arr) {
                return (
                  <div key={i} style={{ marginBottom: 8, paddingBottom: 8, borderBottom: i < arr.length - 1 ? "1px solid " + C.border : "none" }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: "#0D47A1" }}>{s.c2}</div>
                    <div style={{ fontSize: 9, color: C.sub, marginTop: 2, lineHeight: 1.5 }}>{s.c3}</div>
                  </div>
                );
              })}
            </div>
          )}
          {/* Dissertation */}
          {academic.filter(function(a) { return a.section === 'dissertation'; }).length > 0 && (
            <div style={{ background: C.card, borderRadius: 12, padding: 14, marginBottom: 8 }}>
              <div style={{ fontSize: 12, fontWeight: 800, color: "#6A1B9A", marginBottom: 8 }}>🎯 Dissertation Tips</div>
              {academic.filter(function(a) { return a.section === 'dissertation'; }).map(function(t, i) {
                return <div key={i} style={{ fontSize: 10, color: C.text, marginBottom: 5, paddingLeft: 8, borderLeft: "2px solid #CE93D8" }}>{t.c2}</div>;
              })}
            </div>
          )}
          {academic.length === 0 && (
            <div style={{ background: C.card, borderRadius: 12, padding: 24, textAlign: "center", color: C.sub }}>
              <div style={{ fontSize: 20, marginBottom: 8 }}>🎓</div>
              <div style={{ fontSize: 12, fontWeight: 700 }}>เพิ่มข้อมูลใน Google Sheets</div>
              <div style={{ fontSize: 10, marginTop: 4 }}>สร้าง tab ชื่อ "🎓 Academic" ใน Spreadsheet</div>
            </div>
          )}
        </div>
      )}

      {/* ── CAREER ── (data from Google Sheets tab "💼 Career") */}
      {tab === "career" && (
        <div>
          {/* Career Paths — section="paths", multiple rows per path (c2=name, c3=color, c4=bg, c5=step) */}
          {(function() {
            var pathRows = career.filter(function(c) { return c.section === 'paths'; });
            if (!pathRows.length) return null;
            var pathMap = new Map(); var order = [];
            pathRows.forEach(function(c) {
              if (!pathMap.has(c.c2)) { pathMap.set(c.c2, { path: c.c2, color: c.c3 || '#1a237e', bg: c.c4 || '#E8EAF6', steps: [] }); order.push(c.c2); }
              if (c.c5) pathMap.get(c.c2).steps.push(c.c5);
            });
            return (
              <div style={{ background: C.card, borderRadius: 12, padding: 14, marginBottom: 8 }}>
                <div style={{ fontSize: 12, fontWeight: 800, color: "#1a237e", marginBottom: 8 }}>⚖️ UK Legal Career Paths</div>
                {order.map(function(p) {
                  var path = pathMap.get(p);
                  return (
                    <div key={p} style={{ background: path.bg, borderRadius: 10, padding: 12, marginBottom: 8 }}>
                      <div style={{ fontSize: 11, fontWeight: 800, color: path.color, marginBottom: 6 }}>{path.path}</div>
                      {path.steps.map(function(s, si) { return <div key={si} style={{ fontSize: 10, color: "#444", marginBottom: 3 }}>→ {s}</div>; })}
                    </div>
                  );
                })}
              </div>
            );
          })()}
          {/* Societies — section="societies", c2=name, c3=icon, c4=description */}
          {career.filter(function(c) { return c.section === 'societies'; }).length > 0 && (
            <div style={{ background: C.card, borderRadius: 12, padding: 14, marginBottom: 8 }}>
              <div style={{ fontSize: 12, fontWeight: 800, color: "#1a237e", marginBottom: 8 }}>🏛️ Durham Law Societies</div>
              {career.filter(function(c) { return c.section === 'societies'; }).map(function(s, i, arr) {
                return (
                  <div key={i} style={{ marginBottom: 8, paddingBottom: 8, borderBottom: i < arr.length - 1 ? "1px solid " + C.border : "none" }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: C.text }}>{s.c3} {s.c2}</div>
                    <div style={{ fontSize: 9, color: C.sub, marginTop: 2, lineHeight: 1.5 }}>{s.c4}</div>
                  </div>
                );
              })}
            </div>
          )}
          {/* Schemes — section="schemes", c2=firm, c3=description, c5=deadline */}
          {career.filter(function(c) { return c.section === 'schemes'; }).length > 0 && (
            <div style={{ background: C.card, borderRadius: 12, padding: 14, marginBottom: 8 }}>
              <div style={{ fontSize: 12, fontWeight: 800, color: "#E65100", marginBottom: 8 }}>📋 Vacation Schemes & Internships</div>
              {career.filter(function(c) { return c.section === 'schemes'; }).map(function(f, i, arr) {
                return (
                  <div key={i} style={{ marginBottom: 10, paddingBottom: 10, borderBottom: i < arr.length - 1 ? "1px solid " + C.border : "none" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                      <span style={{ fontSize: 10, fontWeight: 700, color: "#0D47A1" }}>{f.c2}</span>
                      {f.c5 && <span style={{ fontSize: 9, background: "#FFF3E0", color: "#E65100", padding: "1px 6px", borderRadius: 6, fontWeight: 700 }}>{f.c5}</span>}
                    </div>
                    <div style={{ fontSize: 9, color: C.sub, lineHeight: 1.5 }}>{f.c3}</div>
                  </div>
                );
              })}
            </div>
          )}
          {/* Graduate Route Visa — section="visa", c2=tip */}
          {career.filter(function(c) { return c.section === 'visa'; }).length > 0 && (
            <div style={{ background: C.card, borderRadius: 12, padding: 14, marginBottom: 8 }}>
              <div style={{ fontSize: 12, fontWeight: 800, color: "#1B5E20", marginBottom: 8 }}>🌍 Graduate Route Visa</div>
              {career.filter(function(c) { return c.section === 'visa'; }).map(function(t, i) {
                return <div key={i} style={{ fontSize: 10, color: C.text, marginBottom: 5, paddingLeft: 8, borderLeft: "2px solid #C8E6C9" }}>{t.c2}</div>;
              })}
            </div>
          )}
          {/* LinkedIn Tips — section="linkedin", c2=tip */}
          {career.filter(function(c) { return c.section === 'linkedin'; }).length > 0 && (
            <div style={{ background: "linear-gradient(135deg,#1a237e,#283593)", borderRadius: 12, padding: 14, color: "#fff", marginBottom: 8 }}>
              <div style={{ fontSize: 12, fontWeight: 800, marginBottom: 8 }}>💡 LinkedIn Tips</div>
              {career.filter(function(c) { return c.section === 'linkedin'; }).map(function(t, i) {
                return <div key={i} style={{ fontSize: 10, marginBottom: 4, opacity: 0.9 }}>• {t.c2}</div>;
              })}
            </div>
          )}
          {career.length === 0 && (
            <div style={{ background: C.card, borderRadius: 12, padding: 24, textAlign: "center", color: C.sub }}>
              <div style={{ fontSize: 20, marginBottom: 8 }}>💼</div>
              <div style={{ fontSize: 12, fontWeight: 700 }}>เพิ่มข้อมูลใน Google Sheets</div>
              <div style={{ fontSize: 10, marginTop: 4 }}>สร้าง tab ชื่อ "💼 Career" ใน Spreadsheet</div>
            </div>
          )}
        </div>
      )}

      {/* ── DECIDE TAB ── */}
      {tab === "decide" && (
        <div>
          {/* ── Profile Inputs ── */}
          <div style={{ background: C.card, borderRadius: 12, padding: 14, marginBottom: 8 }}>
            <div style={{ fontSize: 12, fontWeight: 800, color: "#1a237e", marginBottom: 12 }}>👤 โปรไฟล์ของคุณ</div>

            {/* IELTS Scores */}
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: C.sub, marginBottom: 6 }}>IELTS Scores — Durham LLM: Overall 7.0 · W ≥7.0 · L/R/S ≥6.5</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 6 }}>
                {[['ieltsL','L','Listening',6.5],['ieltsR','R','Reading',6.5],['ieltsW','W','Writing ⚠️',7.0],['ieltsS','S','Speaking',6.5]].map(function(x) {
                  var val = parseFloat(profile[x[0]])||0;
                  var ok = val >= x[3];
                  var entered = !!profile[x[0]];
                  return (
                    <div key={x[0]}>
                      <div style={{ fontSize: 9, color: x[3]===7.0?"#E65100":C.sub, marginBottom: 3, textAlign: "center", fontWeight: x[3]===7.0?700:400 }}>{x[2]}</div>
                      <input type="number" min="0" max="9" step="0.5" value={profile[x[0]]} onChange={function(e){ updateProfile(x[0], e.target.value); }} placeholder="0.0"
                        style={{ width:"100%", boxSizing:"border-box", padding:"8px 4px", border:"2px solid "+(entered?(ok?"#4CAF50":"#C62828"):C.border), borderRadius:8, fontSize:16, fontWeight:800, textAlign:"center", background:C.bg, color:C.text, outline:"none" }} />
                      {entered && <div style={{ fontSize:8, textAlign:"center", color: ok?"#4CAF50":"#C62828", marginTop:2 }}>min {x[3]}</div>}
                    </div>
                  );
                })}
              </div>
              {decision.hasIELTS && (
                <div style={{ marginTop: 6, padding:"6px 10px", borderRadius:8, background:decision.ielts.bg, border:"1px solid "+decision.ielts.color }}>
                  <span style={{ fontSize:10, fontWeight:800, color:decision.ielts.color }}>{decision.ielts.label}</span>
                  <span style={{ fontSize:10, color:decision.ielts.color }}> · Overall {decision.overall.toFixed(1)}</span>
                  <div style={{ fontSize:9, color:decision.ielts.color, marginTop:2 }}>{decision.ielts.msg}</div>
                </div>
              )}
            </div>

            {/* Budget + Preference + Risk */}
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:12 }}>
              <div>
                <div style={{ fontSize:10, fontWeight:700, color:C.sub, marginBottom:5 }}>งบที่พัก (£/สัปดาห์)</div>
                <input type="number" value={profile.budget} onChange={function(e){updateProfile('budget',e.target.value);}} placeholder="เช่น 299"
                  style={{ width:"100%", boxSizing:"border-box", padding:"8px", border:"1px solid "+C.border, borderRadius:8, fontSize:13, background:C.bg, color:C.text }} />
              </div>
              <div>
                <div style={{ fontSize:10, fontWeight:700, color:C.sub, marginBottom:5 }}>เงินที่มีตอนนี้ (฿)</div>
                <input type="number" value={profile.fundsAmount} onChange={function(e){updateProfile('fundsAmount',e.target.value);}} placeholder="เช่น 1650000"
                  style={{ width:"100%", boxSizing:"border-box", padding:"8px", border:"1px solid "+C.border, borderRadius:8, fontSize:13, background:C.bg, color:C.text }} />
              </div>
            </div>

            <div style={{ marginBottom:12 }}>
              <div style={{ fontSize:10, fontWeight:700, color:C.sub, marginBottom:6 }}>ความชอบ</div>
              <div style={{ display:"flex", gap:6 }}>
                {[['privacy','🏠 ส่วนตัว'],['balanced','⚖️ สมดุล'],['social','👥 Social']].map(function(x){
                  var a = profile.preference===x[0];
                  return <button key={x[0]} onClick={function(){updateProfile('preference',x[0]);}}
                    style={{ flex:1, padding:"8px 4px", border:"2px solid "+(a?"#1a237e":C.border), borderRadius:8, background:a?"#1a237e":C.bg, color:a?"#fff":C.text, fontSize:10, fontWeight:700, cursor:"pointer" }}>{x[1]}</button>;
                })}
              </div>
            </div>

            <div>
              <div style={{ fontSize:10, fontWeight:700, color:C.sub, marginBottom:6 }}>วันเริ่มเรียน</div>
              <input type="date" value={profile.courseStart} onChange={function(e){updateProfile('courseStart',e.target.value);}}
                style={{ width:"100%", boxSizing:"border-box", padding:"8px", border:"1px solid "+C.border, borderRadius:8, fontSize:13, background:C.bg, color:C.text }} />
            </div>
          </div>

          {/* ── Accommodation Quiz ── */}
          <div style={{ background: C.card, borderRadius: 12, padding: 14, marginBottom: 8 }}>
            <div style={{ fontSize: 13, fontWeight: 800, color: "#1a237e", marginBottom: 4 }}>🏠 ช่วยเลือกที่พัก</div>
            <div style={{ fontSize: 10, color: C.sub, marginBottom: 14 }}>ตอบ 3 คำถาม → ได้ Top 3 แนะนำจากข้อมูลจริง</div>

            {/* Q1: Budget */}
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: C.text, marginBottom: 6 }}>1. งบต่อสัปดาห์?</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
                {[
                  ['low',   '≤ £270',    'ถูกที่สุด'],
                  ['mid',   '£271–300',  'กลางๆ คุ้มค่า'],
                  ['high',  '£301–360',  'สบายขึ้นหน่อย'],
                  ['any',   'ไม่จำกัด',  'Facilities ก่อน'],
                ].map(function(x) {
                  var sel = accomQuiz.budget === x[0];
                  return (
                    <button key={x[0]} onClick={function(){ setAccomQuiz(function(q){ return {...q, budget: x[0]}; }); }}
                      style={{ padding:"9px 8px", border:"2px solid "+(sel?"#1a237e":C.border), borderRadius:8,
                        background: sel?"#1a237e":C.bg, color: sel?"#fff":C.text, cursor:"pointer", textAlign:"left" }}>
                      <div style={{ fontSize:12, fontWeight:800 }}>{x[1]}</div>
                      <div style={{ fontSize:9, opacity:0.75 }}>{x[2]}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Q2: Top priority */}
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: C.text, marginBottom: 6 }}>2. สิ่งสำคัญที่สุด?</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
                {[
                  ['distance',   '📍 ใกล้ Law School', 'เดินถึงเร็ว'],
                  ['facilities', '🏋️ Facilities ครบ',  'Gym, Cinema'],
                  ['price',      '💰 ราคาถูกสุด',       'ประหยัดก่อน'],
                  ['safety',     '🔒 ความปลอดภัย',      '24h Security'],
                ].map(function(x) {
                  var sel = accomQuiz.priority === x[0];
                  return (
                    <button key={x[0]} onClick={function(){ setAccomQuiz(function(q){ return {...q, priority: x[0]}; }); }}
                      style={{ padding:"9px 8px", border:"2px solid "+(sel?"#1a237e":C.border), borderRadius:8,
                        background: sel?"#1a237e":C.bg, color: sel?"#fff":C.text, cursor:"pointer", textAlign:"left" }}>
                      <div style={{ fontSize:12, fontWeight:800 }}>{x[1]}</div>
                      <div style={{ fontSize:9, opacity:0.75 }}>{x[2]}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Q3: Deposit */}
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: C.text, marginBottom: 6 }}>3. Deposit?</div>
              <div style={{ display: "flex", gap: 6 }}>
                {[
                  ['no', '❌ ไม่อยากจ่าย', 'Student Castle = £0'],
                  ['ok', '✅ Deposit ได้',  'ยอมรับได้'],
                ].map(function(x) {
                  var sel = accomQuiz.deposit === x[0];
                  return (
                    <button key={x[0]} onClick={function(){ setAccomQuiz(function(q){ return {...q, deposit: x[0]}; }); }}
                      style={{ flex:1, padding:"9px 8px", border:"2px solid "+(sel?"#1a237e":C.border), borderRadius:8,
                        background: sel?"#1a237e":C.bg, color: sel?"#fff":C.text, cursor:"pointer", textAlign:"left" }}>
                      <div style={{ fontSize:12, fontWeight:800 }}>{x[1]}</div>
                      <div style={{ fontSize:9, opacity:0.75 }}>{x[2]}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Results */}
            {accomQuiz.budget && accomQuiz.priority && accomQuiz.deposit && (function() {
              var scored = accom.map(function(a) {
                var pw = a.room ? a.room.pw : 999;
                var score = 0;

                // Budget score (0–40)
                if (accomQuiz.budget === 'low')  score += Math.max(0, 40 - Math.max(0, pw - 270) * 2);
                else if (accomQuiz.budget === 'mid')  score += Math.max(0, 40 - Math.abs(pw - 285) * 2);
                else if (accomQuiz.budget === 'high') score += Math.max(0, 40 - Math.abs(pw - 330) * 1.5);
                else score += 30;

                // Priority score (0–40)
                var distStr = String(a.dist || '');
                var mins = parseInt((distStr.match(/(\d+)\s*min/) || [])[1] || '60');
                var fac = ((a.facilities || []).concat(a.roomHas || [])).join(' ').toLowerCase();
                if (accomQuiz.priority === 'distance')   score += Math.max(0, 40 - mins * 1.5);
                else if (accomQuiz.priority === 'facilities') {
                  if (fac.includes('gym'))   score += 15;
                  if (fac.includes('cinema') || fac.includes('film')) score += 15;
                  if (fac.includes('pool')   || fac.includes('lounge')) score += 10;
                }
                else if (accomQuiz.priority === 'price')  score += Math.max(0, 40 - (pw - 250) * 0.8);
                else if (accomQuiz.priority === 'safety')  score += Math.min(40, (a.security || []).length * 12);

                // Deposit score (0–20)
                var dep = a.room ? (a.room.dep || 0) : 999;
                if (accomQuiz.deposit === 'no' && dep === 0) score += 20;
                else if (accomQuiz.deposit === 'ok') score += 10;
                else score += Math.max(0, 10 - dep / 50);

                return Object.assign({}, a, { _score: Math.round(score) });
              }).sort(function(a, b) { return b._score - a._score; });

              var maxScore = scored[0] ? scored[0]._score : 1;

              return (
                <div>
                  <div style={{ fontSize: 11, fontWeight: 800, color: "#1a237e", marginBottom: 8 }}>🏆 ผลแนะนำ — เรียงตามความเหมาะสม</div>
                  {scored.slice(0, 3).map(function(a, i) {
                    var pct = Math.round((a._score / maxScore) * 100);
                    return (
                      <div key={i} style={{ background: i === 0 ? a.bg : C.bg, borderRadius: 10, padding: 10, marginBottom: 6,
                        border: "2px solid " + (i === 0 ? a.color : C.border) }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
                          <div style={{ flex: 1 }}>
                            {i === 0 && <span style={{ fontSize: 9, background: a.color, color: "#fff", padding: "1px 7px", borderRadius: 8, marginBottom: 4, display: "inline-block" }}>🏆 แนะนำที่สุด</span>}
                            <div style={{ fontSize: 13, fontWeight: 800, color: a.color, marginTop: i === 0 ? 3 : 0 }}>{a.name}</div>
                            <div style={{ fontSize: 9, color: C.sub }}>£{a.room ? a.room.pw : '?'}/wk · {a.dist || '–'}</div>
                          </div>
                          <div style={{ textAlign: "right", flexShrink: 0, marginLeft: 8 }}>
                            <div style={{ fontSize: 20, fontWeight: 800, color: a.color }}>{pct}%</div>
                            <div style={{ fontSize: 8, color: C.sub }}>match</div>
                          </div>
                        </div>
                        <div style={{ background: C.border, borderRadius: 4, height: 6 }}>
                          <div style={{ background: a.color, borderRadius: 4, height: 6, width: pct + "%", transition: "width 0.5s" }} />
                        </div>
                      </div>
                    );
                  })}
                  <button onClick={function(){ setTab('accom'); setShowMore(false); }}
                    style={{ width: "100%", padding: "9px", marginTop: 4, borderRadius: 8, border: "none", background: "#1a237e", color: "#fff", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>
                    ดูรายละเอียดที่พักทั้งหมด →
                  </button>
                </div>
              );
            })()}

            {(accomQuiz.budget || accomQuiz.priority || accomQuiz.deposit) && (
              <button onClick={function(){ setAccomQuiz({ budget: null, priority: null, deposit: null }); }}
                style={{ marginTop: 10, fontSize: 9, color: C.sub, background: "none", border: "none", cursor: "pointer", textDecoration: "underline" }}>
                เริ่มใหม่
              </button>
            )}
          </div>

          {/* ── Financial Status ── */}
          {(function(){
            var required = Math.round(37579 * r);
            var have = parseFloat(profile.fundsAmount)||0;
            var pct = have ? Math.min(100, have/required*100) : 0;
            var ok = have >= required;
            var deficit = required - have;
            var tl = dynTimeline.find(function(t){return t.key==='funds';});
            return (
              <div style={{ background:C.card, borderRadius:12, padding:14, marginBottom:8 }}>
                <div style={{ fontSize:12, fontWeight:800, color:"#1a237e", marginBottom:10 }}>💰 สถานะการเงิน — Visa Funds</div>
                <div style={{ display:"flex", justifyContent:"space-between", marginBottom:6 }}>
                  <div>
                    <div style={{ fontSize:9, color:C.sub }}>ต้องมีในบัญชี</div>
                    <div style={{ fontSize:18, fontWeight:800, color:C.text }}>฿{required.toLocaleString()}</div>
                    <div style={{ fontSize:9, color:C.sub }}>= £37,579</div>
                  </div>
                  {have > 0 && (
                    <div style={{ textAlign:"right" }}>
                      <div style={{ fontSize:9, color:C.sub }}>ที่มีอยู่ตอนนี้</div>
                      <div style={{ fontSize:18, fontWeight:800, color:ok?"#2E7D32":"#C62828" }}>฿{have.toLocaleString()}</div>
                      <div style={{ fontSize:9, color:ok?"#2E7D32":"#C62828", fontWeight:700 }}>{ok?"✅ พอแล้ว!":"⚠️ ขาด ฿"+deficit.toLocaleString()}</div>
                    </div>
                  )}
                </div>
                {have > 0 && (
                  <div>
                    <div style={{ background:C.border, borderRadius:6, height:10, marginBottom:6 }}>
                      <div style={{ background:ok?"#2E7D32":"#E65100", borderRadius:6, height:10, width:pct+"%", transition:"width 0.4s" }} />
                    </div>
                    <div style={{ fontSize:9, color:C.sub }}>{pct.toFixed(0)}% ของเงินที่ต้องการ</div>
                  </div>
                )}
                {tl && (
                  <div style={{ marginTop:8, padding:"6px 10px", borderRadius:8, background: tl.days<=30?"#FFEBEE":"#FFF3E0" }}>
                    <span style={{ fontSize:10, fontWeight:700, color:tl.days<=30?"#C62828":"#E65100" }}>
                      ⏰ ต้องฝากเงินก่อน {tl.fmt} (อีก {tl.days} วัน)
                    </span>
                    <div style={{ fontSize:9, color:C.sub, marginTop:2 }}>ต้องอยู่ในบัญชีครบ 28 วันก่อนวันยื่นวีซ่า</div>
                  </div>
                )}
              </div>
            );
          })()}

          {/* ── Dynamic Timeline ── */}
          <div style={{ background:C.card, borderRadius:12, padding:14, marginBottom:8 }}>
            <div style={{ fontSize:12, fontWeight:800, color:"#1a237e", marginBottom:4 }}>⏱️ Timeline ส่วนตัวของคุณ</div>
            <div style={{ fontSize:9, color:C.sub, marginBottom:10 }}>คำนวณจากวันเริ่มเรียน · {profile.preSess ? "Pre-sessional "+profile.preSessWeeks+" สัปดาห์" : "ไม่มี Pre-sessional"}</div>
            {dynTimeline.map(function(t) {
              var past = t.days < 0;
              var urgent = !past && t.days <= 30;
              var soon = !past && t.days <= 90;
              var dotColor = past?"#ccc":urgent?"#C62828":soon?"#E65100":"#1a237e";
              return (
                <div key={t.key} style={{ display:"flex", gap:10, marginBottom:10, alignItems:"flex-start" }}>
                  <div style={{ width:60, fontSize:9, fontWeight:800, color:past?"#aaa":urgent?"#C62828":C.sub, textAlign:"right", flexShrink:0, paddingTop:1 }}>
                    {past ? "ผ่านแล้ว" : t.days===0 ? "วันนี้!" : "อีก "+t.days+" วัน"}
                  </div>
                  <div style={{ width:8, height:8, borderRadius:"50%", background:dotColor, flexShrink:0, marginTop:3, boxShadow:urgent?"0 0 0 3px rgba(198,40,40,0.2)":"none" }} />
                  <div>
                    <div style={{ fontSize:11, fontWeight:urgent?800:600, color:past?C.sub:C.text }}>{t.label}</div>
                    <div style={{ fontSize:9, color:C.sub }}>{t.fmt}</div>
                    {urgent && <div style={{ fontSize:9, color:"#C62828", fontWeight:700, marginTop:2 }}>⚠️ เร่งด่วน!</div>}
                  </div>
                </div>
              );
            })}
            <div style={{ display:"flex", gap:8, marginTop:8, paddingTop:8, borderTop:"1px solid "+C.border }}>
              <label style={{ display:"flex", alignItems:"center", gap:6, fontSize:10, color:C.text, cursor:"pointer" }}>
                <input type="checkbox" checked={!!profile.preSess} onChange={function(e){updateProfile('preSess',e.target.checked);}} />
                Pre-sessional
              </label>
              {profile.preSess && (
                <select value={profile.preSessWeeks} onChange={function(e){updateProfile('preSessWeeks',e.target.value);}}
                  style={{ padding:"2px 6px", border:"1px solid "+C.border, borderRadius:6, fontSize:10, background:C.bg, color:C.text }}>
                  {[4,6,8,10].map(function(w){ return <option key={w} value={w}>{w} สัปดาห์</option>; })}
                </select>
              )}
            </div>
          </div>
        </div>
      )}

      <div style={{ textAlign: "center", marginTop: 12, fontSize: 9, color: C.sub }}>
        ข้อมูล ณ 20 มี.ค. 2026 · อัตราแลกเปลี่ยนอาจเปลี่ยนแปลง
        {sheetsStatus === "ok" && " · Live จาก Google Sheets"}
      </div>

      {/* ── MORE DRAWER ── */}
      {showMore && (
        <div
          onClick={function() { setShowMore(false); }}
          style={{
            position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)",
            zIndex: 200, display: "flex", alignItems: "flex-end", justifyContent: "center",
          }}
        >
          <div
            onClick={function(e) { e.stopPropagation(); }}
            style={{
              width: "100%", maxWidth: 700,
              background: C.card,
              borderRadius: "24px 24px 0 0",
              padding: "20px 16px 40px",
              maxHeight: "80vh",
              overflowY: "auto",
              boxShadow: "0 -8px 32px rgba(0,0,0,0.25)",
            }}
          >
            {/* Handle bar */}
            <div style={{ width: 40, height: 4, background: C.border, borderRadius: 2, margin: "0 auto 16px" }} />
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <div style={{ fontSize: 16, fontWeight: 800, color: C.text }}>ทุก Tab</div>
              <button
                onClick={function() { setShowMore(false); }}
                style={{ background: C.pill, border: "none", borderRadius: 20, width: 32, height: 32, cursor: "pointer", fontSize: 16, color: C.sub, display: "flex", alignItems: "center", justifyContent: "center" }}
              >✕</button>
            </div>
            {MORE_GROUPS.map(function(group) {
              return (
                <div key={group.g} style={{ marginBottom: 20 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: C.sub, marginBottom: 8, letterSpacing: 0.5 }}>{group.g}</div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
                    {group.ids.map(function(tabId) {
                      var t = tabs.find(function(t) { return t.id === tabId; });
                      if (!t) return null;
                      var isCur = tab === tabId;
                      return (
                        <button
                          key={tabId}
                          onClick={function() { setTab(tabId); setOpenA(-1); setShowMore(false); }}
                          style={{
                            padding: "12px 8px",
                            border: "none",
                            borderRadius: 12,
                            background: isCur ? "#1a237e" : C.pill,
                            color: isCur ? "#fff" : C.text,
                            fontSize: 11,
                            fontWeight: 700,
                            cursor: "pointer",
                            textAlign: "center",
                            boxShadow: isCur ? "0 4px 12px rgba(26,35,126,0.3)" : "none",
                          }}
                        >
                          {t.l}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
            {/* Sheets link inside drawer */}
            {SHEETS_URL && (
              <a
                href={SHEETS_URL}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                  padding: "14px", borderRadius: 12, marginTop: 4,
                  background: "#1a237e", color: "#fff", textDecoration: "none",
                  fontSize: 13, fontWeight: 700,
                  boxShadow: "0 4px 12px rgba(26,35,126,0.3)",
                }}
              >
                <span style={{ fontSize: 18 }}>📊</span>
                เปิด Google Sheets ↗
              </a>
            )}
          </div>
        </div>
      )}

      {/* ── BOTTOM NAV ── */}
      <div
        style={{
          position: "fixed", bottom: 0, left: 0, right: 0,
          background: dark ? "#12172a" : "#fff",
          borderTop: "1px solid " + C.border,
          display: "flex", zIndex: 100,
          boxShadow: "0 -4px 20px rgba(0,0,0,0.12)",
          paddingBottom: "env(safe-area-inset-bottom, 0px)",
        }}
      >
        <div style={{ display: "flex", width: "100%", maxWidth: 700, margin: "0 auto" }}>
          {BOTTOM_NAV.map(function(n) {
            var isActive = n.id === "_more" ? showMore : (tab === n.id && !showMore);
            return (
              <button
                key={n.id}
                onClick={function() {
                  if (n.id === "_more") { setShowMore(function(v) { return !v; }); }
                  else { setTab(n.id); setOpenA(-1); setShowMore(false); }
                }}
                style={{
                  flex: 1, padding: "10px 0 8px", border: "none", background: "none",
                  cursor: "pointer", display: "flex", flexDirection: "column",
                  alignItems: "center", gap: 3,
                  color: isActive ? "#1a237e" : C.sub,
                  position: "relative",
                  transition: "color 0.15s",
                }}
              >
                {isActive && (
                  <div style={{
                    position: "absolute", top: 0, left: "50%", transform: "translateX(-50%)",
                    width: 32, height: 3, borderRadius: "0 0 3px 3px",
                    background: "#1a237e",
                  }} />
                )}
                <div style={{ position: "relative", display: "inline-flex" }}>
                  <div style={{ fontSize: 22 }}>{n.icon}</div>
                  {n.id === "check" && checkUrgent > 0 && (
                    <div style={{
                      position: "absolute", top: -2, right: -6,
                      background: "#C62828", color: "#fff",
                      borderRadius: 10, minWidth: 16, height: 16,
                      fontSize: 9, fontWeight: 800,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      padding: "0 3px",
                    }}>{checkUrgent > 99 ? "99+" : checkUrgent}</div>
                  )}
                </div>
                <div style={{ fontSize: 10, fontWeight: isActive ? 800 : 500, letterSpacing: -0.2 }}>{n.l}</div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
