import { useState, useEffect } from "react";
import { fetchAllData, isSheetsConfigured } from "./services/googleSheets";
import {
  defaultAccom,
  defaultAccomFull,
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
import BudgetWizard from "./components/tabs/BudgetWizard";
import TasksTab from "./components/tabs/TasksTab";
import AccomTab from "./components/tabs/AccomTab";
import InfoTab from "./components/tabs/InfoTab";
import SettingsTab from "./components/tabs/SettingsTab";

// ─── Shared Helpers ──────────────────────────────────────────────────────────

export function Stars({ val, size }) {
  size = size || 12;
  var full = Math.floor(val);
  var half = val % 1 >= 0.5 ? 1 : 0;
  var empty = 5 - full - half;
  var out = [];
  for (var i = 0; i < full; i++)
    out.push(<span key={"f" + i} style={{ color: "#FFB300", fontSize: size }}>★</span>);
  if (half)
    out.push(<span key="h" style={{ color: "#FFB300", fontSize: size }}>⯪</span>);
  for (var j = 0; j < empty; j++)
    out.push(<span key={"e" + j} style={{ color: "#ccc", fontSize: size }}>★</span>);
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 0 }}>
      {out}
      <span style={{ fontSize: size - 2, color: "#888", marginLeft: 2 }}>{val}</span>
    </span>
  );
}

// ─── App ─────────────────────────────────────────────────────────────────────

export default function App() {
  // ── Tab routing ────────────────────────────────────────────────────────────
  var VALID_TABS = ["budget", "tasks", "accom", "info", "settings"];
  const [tab, setTab] = useState(function () {
    var h = window.location.hash.replace("#", "");
    return VALID_TABS.includes(h) ? h : "budget";
  });

  // ── Dark mode ─────────────────────────────────────────────────────────────
  const [dark, setDark] = useState(function () {
    return localStorage.getItem("durham_dark") === "1";
  });
  useEffect(function () {
    document.body.className = dark ? "dark" : "";
  }, [dark]);
  function toggleDark() {
    setDark(function (d) {
      localStorage.setItem("durham_dark", !d ? "1" : "0");
      return !d;
    });
  }

  // ── Checkbox state ────────────────────────────────────────────────────────
  const [checked, setChecked] = useState(function () {
    try { return JSON.parse(localStorage.getItem("durham_checked") || "{}"); } catch { return {}; }
  });
  useEffect(function () { localStorage.setItem("durham_checked", JSON.stringify(checked)); }, [checked]);
  function toggle(key) {
    setChecked(function (prev) { return Object.assign({}, prev, { [key]: !prev[key] }); });
  }

  // ── User profile ──────────────────────────────────────────────────────────
  var DEFAULT_PROFILE = {
    ieltsL: "", ieltsR: "", ieltsW: "", ieltsS: "",
    budget: "", preference: "balanced", risk: "medium",
    courseStart: "2026-09-28", preSess: true, preSessWeeks: 6,
    fundsAmount: "",
  };
  const [profile, setProfile] = useState(function () {
    try { return Object.assign({}, DEFAULT_PROFILE, JSON.parse(localStorage.getItem("durham_profile") || "{}")); }
    catch { return DEFAULT_PROFILE; }
  });
  useEffect(function () { localStorage.setItem("durham_profile", JSON.stringify(profile)); }, [profile]);
  function updateProfile(key, val) {
    setProfile(function (p) { return Object.assign({}, p, { [key]: val }); });
  }

  // ── Memo ──────────────────────────────────────────────────────────────────
  const [memo, setMemo] = useState(function () { return localStorage.getItem("durham_memo") || ""; });
  useEffect(function () { localStorage.setItem("durham_memo", memo); }, [memo]);

  // ── Expense tracker ───────────────────────────────────────────────────────
  var EXPENSE_CATS = ["🍽️ อาหาร", "🚌 เดินทาง", "📚 หนังสือ/เรียน", "🎉 สังสรรค์", "🛒 ของใช้", "💊 สุขภาพ", "✈️ ท่องเที่ยว", "📦 อื่นๆ"];
  const [expenses, setExpenses] = useState(function () {
    try { return JSON.parse(localStorage.getItem("durham_expenses") || "[]"); } catch { return []; }
  });
  useEffect(function () { localStorage.setItem("durham_expenses", JSON.stringify(expenses)); }, [expenses]);
  const [expForm, setExpForm] = useState({ desc: "", amount: "", cat: EXPENSE_CATS[0], date: new Date().toISOString().slice(0, 10) });
  function addExpense() {
    if (!expForm.desc || !expForm.amount) return;
    setExpenses(function (prev) { return [{ id: Date.now(), ...expForm, amount: parseFloat(expForm.amount) }, ...prev]; });
    setExpForm(function (f) { return { ...f, desc: "", amount: "" }; });
  }
  function delExpense(id) { setExpenses(function (prev) { return prev.filter(function (e) { return e.id !== id; }); }); }

  // ── Exchange rate ─────────────────────────────────────────────────────────
  const [rate, setRate] = useState(44);
  useEffect(function () {
    fetch("https://api.exchangerate-api.com/v4/latest/GBP")
      .then(function (r) { return r.json(); })
      .then(function (d) { if (d && d.rates && d.rates.THB) setRate(d.rates.THB); })
      .catch(function () {});
  }, []);

  // ── Google Sheets data ────────────────────────────────────────────────────
  const [accom, setAccom] = useState(defaultAccom);
  const [accomFull, setAccomFull] = useState(defaultAccomFull);
  const [colAccom, setColAccom] = useState(defaultCollegeAccom);
  const [vaccines, setVaccines] = useState(defaultVaccines);
  const [packing, setPacking] = useState(defaultPacking);
  const [shopping, setShopping] = useState(defaultShopping);
  const [introvert, setIntrovert] = useState(defaultIntrovert);
  const [timeline, setTimeline] = useState(defaultTimeline);
  const [places, setPlaces] = useState(defaultPlaces);
  const [contacts, setContacts] = useState(defaultContacts);
  const [checklist, setChecklist] = useState(defaultChecklist);
  const [checklistGroups, setChecklistGroups] = useState(defaultChecklistGroups);
  const [homeStatus, setHomeStatus] = useState(defaultHomeStatus);
  const [academic, setAcademic] = useState(defaultAcademic);
  const [career, setCareer] = useState(defaultCareer);
  const [lifeuk, setLifeUK] = useState(defaultLifeUK);
  const [priceComparison, setPriceComparison] = useState([]);
  const [accomRating, setAccomRating] = useState({ headers: [], rows: [] });
  const [sheetExpenses, setSheetExpenses] = useState([]);
  const [budgetData, setBudgetData] = useState(defaultBudgetData);
  const [sheetsStatus, setSheetsStatus] = useState(isSheetsConfigured() ? "loading" : "not-configured");

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

  // ── URL hash sync ─────────────────────────────────────────────────────────
  useEffect(function () { window.history.pushState(null, "", "#" + tab); }, [tab]);
  useEffect(function () {
    function onHash() {
      var h = window.location.hash.replace("#", "");
      if (VALID_TABS.includes(h)) setTab(h);
    }
    window.addEventListener("hashchange", onHash);
    return function () { window.removeEventListener("hashchange", onHash); };
  }, []);

  // ── PWA install ───────────────────────────────────────────────────────────
  const [installPrompt, setInstallPrompt] = useState(null);
  const [showInstall, setShowInstall] = useState(false);
  useEffect(function () {
    function onPrompt(e) {
      e.preventDefault();
      setInstallPrompt(e);
      if (!localStorage.getItem("durham_install_dismissed")) setShowInstall(true);
    }
    window.addEventListener("beforeinstallprompt", onPrompt);
    return function () { window.removeEventListener("beforeinstallprompt", onPrompt); };
  }, []);

  // ── Decision engine ───────────────────────────────────────────────────────
  function computeDecision(p) {
    var L = parseFloat(p.ieltsL) || 0, R = parseFloat(p.ieltsR) || 0,
        W = parseFloat(p.ieltsW) || 0, S = parseFloat(p.ieltsS) || 0;
    var hasIELTS = L > 0 && R > 0 && W > 0 && S > 0;
    var overall = hasIELTS ? Math.round((L + R + W + S) / 4 * 10) / 10 : 0;
    var minComp = hasIELTS ? Math.min(L, R, W, S) : 9;
    var weak = hasIELTS ? [["L", L, 6.5], ["R", R, 6.5], ["W", W, 7.0], ["S", S, 6.5]]
      .filter(function (c) { return c[1] < c[2]; })
      .map(function (c) { return c[0] + " (ต้อง " + c[2] + ", ได้ " + c[1] + ")"; }) : [];
    var meetsDurham = hasIELTS && overall >= 7.0 && W >= 7.0 && L >= 6.5 && R >= 6.5 && S >= 6.5;

    var ielts = null;
    if (hasIELTS) {
      if (meetsDurham)
        ielts = { status: "pass", label: "✅ ผ่านเกณฑ์ Durham LLM", msg: "IELTS ผ่านครบ — Overall 7.0, W 7.0+, ทุก band ≥6.5", color: "#2E7D32", bg: "#E8F5E9" };
      else if (overall >= 6.5 || (overall >= 6.0 && minComp >= 5.5))
        ielts = { status: "presess", label: "📚 ต้องผ่าน Pre-sessional", msg: "ยังไม่ผ่านเกณฑ์ Durham" + (weak.length ? " · ต้องปรับ: " + weak.join(", ") : ""), color: "#E65100", bg: "#FFF3E0" };
      else
        ielts = { status: "retake", label: "🔄 Retake IELTS", msg: "Overall ต่ำกว่า 6.5 — ควร retake ก่อนยื่นสมัคร", color: "#C62828", bg: "#FFEBEE" };
    }

    var budget = parseFloat(p.budget) || 0, pref = p.preference;
    var accomRec = null;
    if (pref === "social")
      accomRec = { name: "College Accommodation", sub: "Josephine Butler / Ustinov College", reason: "Community events, social life, ถูกกว่า private — เหมาะคนชอบเจอผู้คน", badge: "👥 SOCIAL PICK", color: "#1565C0", bg: "#E3F2FD" };
    else if (pref === "privacy" && budget >= 350)
      accomRec = { name: "Student Castle — Bellamy Studio", sub: "£360/wk via uhomes · 20 Claypath", reason: "Facilities ดีสุด 24/7 Gym + Cinema ใกล้กลางเมือง ห้องส่วนตัวสมบูรณ์แบบ No Deposit!", badge: "🎬 BEST FACILITIES", color: "#6A1B9A", bg: "#F3E5F5" };
    else if (budget > 0 && budget < 270)
      accomRec = { name: "St Giles Studios — Standard Studio", sub: "£265/wk via uhomes · 110 Gilesgate", reason: "ราคาถูกที่สุด King-size bed ประหยัดได้ ~£1,734/ปีเมื่อเทียบ Duresme", badge: "💰 BEST VALUE", color: "#0D47A1", bg: "#E8EAF6" };
    else
      accomRec = { name: "Duresme Court — Classic Studio", sub: "£289/wk via uhomes · Newcastle Road", reason: "ใกล้ Law School มากที่สุด ส่วนตัว คุ้มค่า รีวิว 4.8 — สมดุลที่สุด", badge: "🏆 BEST PICK", color: "#1B5E20", bg: "#E8F5E9" };

    return { ielts, accomRec, overall, hasIELTS, minComp, weak, meetsDurham, L, R, W, S };
  }

  function computeTimeline(p) {
    var start = new Date(p.courseStart || "2026-09-28");
    var preSessWks = p.preSess ? (parseInt(p.preSessWeeks) || 6) : 0;
    var today = new Date(); today.setHours(0, 0, 0, 0);
    function addDays(d, n) { var x = new Date(d); x.setDate(x.getDate() + n); return x; }
    function fmt(d) { return d.toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "2-digit" }); }
    function days(d) { return Math.ceil((d - today) / 864e5); }

    var preSessStart = addDays(start, -preSessWks * 7);
    var arrival = addDays(preSessStart, -1);
    var visaApply = addDays(arrival, -70);
    var fundsDeposit = addDays(visaApply, -28);
    var casExpected = addDays(start, -90);
    var vaccineDue = addDays(arrival, -42);

    return [
      { key: "funds", label: "💰 ฝากเงินค้ำวีซ่า £37,579", date: fundsDeposit, fmt: fmt(fundsDeposit), days: days(fundsDeposit), risk: "high" },
      { key: "vaccine", label: "💉 ฉีดวัคซีน MenACWY + MenB", date: vaccineDue, fmt: fmt(vaccineDue), days: days(vaccineDue), risk: "high" },
      { key: "cas", label: "📋 รับ CAS จาก Durham", date: casExpected, fmt: fmt(casExpected), days: days(casExpected), risk: "medium" },
      { key: "visa", label: "📋 ยื่นวีซ่า Student UK ที่ VFS", date: visaApply, fmt: fmt(visaApply), days: days(visaApply), risk: "high" },
      { key: "arrival", label: "✈️ บินถึง UK", date: arrival, fmt: fmt(arrival), days: days(arrival), risk: "high" },
      { key: "presess", label: "🎓 Pre-sessional เริ่ม", date: preSessStart, fmt: fmt(preSessStart), days: days(preSessStart), risk: "high" },
      { key: "course", label: "🎓 เริ่มเรียน LLM", date: start, fmt: fmt(start), days: days(start), risk: "low" },
    ].sort(function (a, b) { return a.date - b.date; });
  }

  function computeNextActions(p, chk, tl, dec) {
    var actions = [];
    var checkKey = function (txt) { return !!chk["check_" + txt]; };
    if (!p.ieltsL) actions.push({ id: "setup", task: "👤 กรอก IELTS scores ของคุณ", sub: "ให้ระบบแนะนำได้แม่นยำขึ้น", days: null, risk: "medium" });
    if (dec.ielts && dec.ielts.status === "retake") actions.push({ id: "ielts_retake", task: "🔄 จอง IELTS Retake ด่วน!", sub: "Overall ยังต่ำกว่าเกณฑ์ Durham 7.0", days: null, risk: "high" });
    if (!checkKey("จอง Private PBSA ผ่าน uhomes.com")) actions.push({ id: "accom", task: "🏠 จองที่พัก (No Visa No Pay!)", sub: "จองก่อน ยกเลิกได้ถ้าวีซ่าไม่ผ่าน ไม่เสียเงิน", days: null, risk: "high" });
    var deadlineActions = {
      funds: { task: "💰 ฝากเงิน £37,579 เข้าบัญชี", sub: "ต้องอยู่ครบ 28 วันติดต่อกันก่อนยื่นวีซ่า" },
      vaccine: { task: "💉 ฉีดวัคซีน MenACWY + MenB", sub: "ต้องฉีด 2 เข็มห่าง 1 เดือน ทำก่อนได้เลย" },
      cas: { task: "📋 ติดตาม CAS จาก Durham", sub: "ต้องได้ CAS ก่อนยื่นวีซ่า — email Durham ถ้าช้า" },
      visa: { task: "📋 ยื่น Student Visa ที่ VFS", sub: "ค่าวีซ่า £524 + IHS £1,164 (18 เดือน) — เตรียมเอกสารให้ครบ" },
    };
    var doneMap = {
      funds: checkKey("เริ่มเตรียมเงิน £37,579 ในบัญชี 28 วัน"),
      cas: checkKey("รอ CAS จาก Durham"),
      visa: checkKey("ยื่น Visa ที่ VFS (ค่าวีซ่า £524 / IHS £1,164)"),
    };
    tl.forEach(function (t) {
      if (deadlineActions[t.key] && !doneMap[t.key] && t.days > 0 && t.days <= 120) {
        actions.push({ id: t.key, task: deadlineActions[t.key].task, sub: deadlineActions[t.key].sub, days: t.days, risk: t.risk });
      }
    });
    return actions.slice(0, 3);
  }

  function daysUntil(dateStr) {
    if (!dateStr) return null;
    var s = String(dateStr).trim();
    var gviz = s.match(/^Date\((\d+),(\d+),(\d+)\)$/);
    if (gviz) s = gviz[1] + "-" + String(+gviz[2] + 1).padStart(2, "0") + "-" + String(+gviz[3]).padStart(2, "0");
    var deadline = new Date(s + "T00:00:00");
    if (isNaN(deadline.getTime())) return null;
    var today = new Date(); today.setHours(0, 0, 0, 0);
    return Math.ceil((deadline - today) / 864e5);
  }

  // ── Derived state ─────────────────────────────────────────────────────────
  var checkGroups = checklistGroups.map(function (g) { return [g.preDone ? 1 : 0, g.phase, g.color, g.items]; });
  var checkDone = checkGroups.reduce(function (a, g) {
    return a + (g[0] ? g[3].length : g[3].filter(function (it) { return checked["check_" + it]; }).length);
  }, 0);
  var checkTotal = checkGroups.reduce(function (a, g) { return a + g[3].length; }, 0);
  var checkUrgent = checkGroups.reduce(function (a, g) {
    if (g[0]) return a;
    return a + g[3].filter(function (it) { return !checked["check_" + it]; }).length;
  }, 0);

  var decision = computeDecision(profile);
  var dynTimeline = computeTimeline(profile);
  var nextActions = computeNextActions(profile, checked, dynTimeline, decision);

  var deadlineMap = {};
  checklist.forEach(function (it) { if (it.item && it.deadline) deadlineMap[it.item] = it.deadline; });

  var VISA_FUNDS_GBP = 37579;
  var SHEETS_URL = import.meta.env.VITE_GOOGLE_SHEETS_ID
    ? "https://docs.google.com/spreadsheets/d/" + import.meta.env.VITE_GOOGLE_SHEETS_ID + "/edit"
    : null;

  // ── Bottom nav ────────────────────────────────────────────────────────────
  var NAV = [
    { id: "budget", icon: "💰", l: "Budget" },
    { id: "tasks",  icon: "✅", l: "Tasks"  },
    { id: "accom",  icon: "🏠", l: "Accom"  },
    { id: "info",   icon: "📋", l: "Info"   },
    { id: "settings", icon: "⚙️", l: "More" },
  ];

  return (
    <div className="app-shell">
      {/* PWA Install Banner */}
      {showInstall && (
        <div style={{
          background: "linear-gradient(135deg,#0F1B3D,#1A3A8A)",
          padding: "10px 16px", margin: "0 0 4px",
          display: "flex", alignItems: "center", gap: 10, color: "#fff",
        }}>
          <span style={{ fontSize: 20 }}>📲</span>
          <div style={{ flex: 1, fontSize: 14, fontWeight: 700 }}>
            ติดตั้งเป็น App บนมือถือ
            <div style={{ fontSize: 12, fontWeight: 400, opacity: 0.8 }}>เปิดได้แบบออฟไลน์ ไม่ต้องเปิดเบราว์เซอร์</div>
          </div>
          <button onClick={function () { if (installPrompt) installPrompt.prompt(); setShowInstall(false); localStorage.setItem("durham_install_dismissed", "1"); }}
            style={{ background: "#fff", color: "#0F1B3D", border: "none", borderRadius: 20, padding: "6px 14px", fontSize: 13, fontWeight: 800, cursor: "pointer" }}>
            ติดตั้ง
          </button>
          <button onClick={function () { setShowInstall(false); localStorage.setItem("durham_install_dismissed", "1"); }}
            style={{ background: "rgba(255,255,255,0.2)", color: "#fff", border: "none", borderRadius: "50%", width: 28, height: 28, fontSize: 16, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
            ✕
          </button>
        </div>
      )}

      {/* Tab content */}
      <div className="page-content">
        {tab === "budget" && (
          <BudgetWizard
            budgetData={budgetData}
            accom={accom}
            accomFull={accomFull}
            rate={rate}
            dark={dark}
            profile={profile}
            updateProfile={updateProfile}
            sheetsStatus={sheetsStatus}
            SHEETS_URL={SHEETS_URL}
          />
        )}
        {tab === "tasks" && (
          <TasksTab
            checklistGroups={checklistGroups}
            checkGroups={checkGroups}
            checkDone={checkDone}
            checkTotal={checkTotal}
            checked={checked}
            toggle={toggle}
            deadlineMap={deadlineMap}
            daysUntil={daysUntil}
            dynTimeline={dynTimeline}
            nextActions={nextActions}
            dark={dark}
          />
        )}
        {tab === "accom" && (
          <AccomTab
            accom={accom}
            accomFull={accomFull}
            colAccom={colAccom}
            accomRating={accomRating}
            priceComparison={priceComparison}
            rate={rate}
            dark={dark}
            profile={profile}
            updateProfile={updateProfile}
            decision={decision}
          />
        )}
        {tab === "info" && (
          <InfoTab
            vaccines={vaccines}
            checked={checked}
            toggle={toggle}
            places={places}
            contacts={contacts}
            lifeuk={lifeuk}
            academic={academic}
            career={career}
            introvert={introvert}
            packing={packing}
            shopping={shopping}
            expenses={expenses}
            sheetExpenses={sheetExpenses}
            expForm={expForm}
            setExpForm={setExpForm}
            addExpense={addExpense}
            delExpense={delExpense}
            EXPENSE_CATS={EXPENSE_CATS}
            dark={dark}
          />
        )}
        {tab === "settings" && (
          <SettingsTab
            profile={profile}
            updateProfile={updateProfile}
            dark={dark}
            toggleDark={toggleDark}
            memo={memo}
            setMemo={setMemo}
            rate={rate}
            sheetsStatus={sheetsStatus}
            SHEETS_URL={SHEETS_URL}
            VISA_FUNDS_GBP={VISA_FUNDS_GBP}
            decision={decision}
          />
        )}
      </div>

      {/* Bottom navigation */}
      <nav className="bottom-nav">
        {NAV.map(function (n) {
          var active = tab === n.id;
          return (
            <button key={n.id} className="nav-item" onClick={function () { setTab(n.id); }}
              style={{ color: active ? "var(--primary)" : "var(--text-sub)", position: "relative" }}>
              {n.id === "tasks" && checkUrgent > 0 && (
                <span style={{
                  position: "absolute", top: 6, right: "50%", transform: "translateX(8px)",
                  background: "#C62828", color: "#fff", borderRadius: 10,
                  fontSize: 10, fontWeight: 800, padding: "1px 5px", minWidth: 16, textAlign: "center",
                }}>{checkUrgent}</span>
              )}
              <span style={{ fontSize: 20 }}>{n.icon}</span>
              <span style={{ fontSize: 11, fontWeight: active ? 700 : 500 }}>{n.l}</span>
              {active && (
                <span style={{ position: "absolute", top: 0, left: "50%", transform: "translateX(-50%)", width: 32, height: 3, background: "var(--primary)", borderRadius: "0 0 3px 3px" }} />
              )}
            </button>
          );
        })}
      </nav>
    </div>
  );
}
