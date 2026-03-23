import { useState } from "react";

var CARD = {
  background: "var(--card)",
  borderRadius: 16,
  padding: 20,
  boxShadow: "var(--shadow)",
  border: "1px solid var(--border)",
  marginBottom: 12,
};

var VISA_DOCS = [
  "Passport (valid 6+ months)",
  "CAS number from Durham",
  "Biometric photo",
  "Financial evidence (bank statement £37,579)",
  "IELTS certificate (Overall 7.0+)",
  "Acceptance letter from Durham",
  "TB test certificate",
  "IHS payment receipt (£1,164 / 18 months)",
];

var DEFAULT_VACCINES = [
  { n: "MenACWY", d: "Meningococcal ACWY — required for UK unis", due: "" },
  { n: "MenB", d: "Meningococcal B — 2 doses 1 month apart", due: "" },
  { n: "MMR", d: "Measles, Mumps, Rubella", due: "" },
  { n: "Varicella", d: "Chickenpox — if not immune", due: "" },
  { n: "Hepatitis B", d: "Recommended for students", due: "" },
];

var AIRLINES = [
  { airline: "Qatar Airways", route: "BKK→DOH→NCL", duration: "~12-14h", price: "£700-900" },
  { airline: "Emirates", route: "BKK→DXB→NCL", duration: "~13-15h", price: "£650-850" },
  { airline: "Thai Airways", route: "BKK→LHR/MAN", duration: "~11-12h", price: "£600-800" },
];

var DEFAULT_PLACES = [
  { category: "🛒 ซื้อของ", name: "Aldi", note: "ราคาถูก ของครบ" },
  { category: "🛒 ซื้อของ", name: "Tesco Extra", note: "ใหญ่ที่สุด ครบทุกอย่าง" },
  { category: "🛒 ซื้อของ", name: "Marks & Spencer", note: "อาหารพรีเมียม" },
  { category: "🍜 อาหาร", name: "Flat White Coffee", note: "Coffee shop ยอดนิยม" },
  { category: "🍜 อาหาร", name: "Thai restaurants Newcastle", note: "30 นาทีจาก Durham" },
  { category: "💊 ร้านยา", name: "Boots Pharmacy", note: "ร้านยา ครีม vitamins" },
  { category: "💊 ร้านยา", name: "Superdrug", note: "Health & beauty" },
  { category: "🏃 ออกกำลัง", name: "Durham Athletics", note: "Durham Uni gym" },
  { category: "🏃 ออกกำลัว", name: "PureGym", note: "24/7 ราคาถูก" },
];

var DEFAULT_CONTACTS = [
  { name: "Durham International Office", phone: "", email: "international.office@durham.ac.uk", note: "Visa & international student support" },
  { name: "Durham Student Housing", phone: "", email: "accommodation.office@durham.ac.uk", note: "College & accommodation enquiries" },
  { name: "NHS 111", phone: "111", email: "", note: "Non-emergency medical advice UK" },
];

var SEASONS = [
  { period: "ก.ย.–ต.ค.", temp: "10–15°C", desc: "เมฆมาก ฝนประปราย", gear: "🧥 Jacket + เสื้อกันหนาว" },
  { period: "พ.ย.–ม.ค.", temp: "2–8°C", desc: "หนาวมาก ลมแรง", gear: "🧤 Heavy coat + Thermal" },
  { period: "ก.พ.–เม.ย.", temp: "4–12°C", desc: "ยังหนาวอยู่", gear: "🧣 Spring coat + Scarf" },
  { period: "พ.ค.–ส.ค.", temp: "12–20°C", desc: "อากาศดีที่สุด", gear: "👕 Light jacket" },
];

var DEFAULT_APPS = [
  { group: "💳 การเงิน", items: ["Monzo — UK bank, no fees", "Wise — โอนเงินบาท→ปอนด์", "Barclays — บัญชีนักเรียน"] },
  { group: "🗺️ เดินทาง", items: ["Google Maps", "Citymapper", "Uber", "Arriva Bus (Durham local)"] },
  { group: "📱 ไทย", items: ["LINE", "Grab"] },
  { group: "📚 เรียน", items: ["Canvas (Durham LMS)", "Westlaw UK", "LexisNexis", "BAILII"] },
];

var WEEK1 = [
  "เปิดบัญชี Monzo หรือ Barclays",
  "ลงทะเบียน GP (NHS) ใกล้บ้าน",
  "ซื้อ SIM card — giffgaff หรือ Three",
  "ลงทะเบียน BRP (Biometric Residence Permit)",
  "ไป Freshers Fair หา Societies",
  "ทำความรู้จักเพื่อนบ้านในหอ",
];

var DEFAULT_INTROVERT = [
  { heading: "🏠 อยู่หอ", items: ["ตั้ง 'social hours' ให้ชัด — เช่น 6-8pm เปิดประตู", "ใช้ห้องส่วนตัวเป็น recharge station ได้เต็มที่", "Kitchen = โอกาสเจอคน 5 นาที แบบไม่บังคับ"] },
  { heading: "📚 เรียน", items: ["Library ชั้น 3 — silent zone เหมาะ solo study", "Coffee shop (Flat White) — atmosphere ดี ไม่ต้องคุย", "Office hours อาจารย์ — 1:1 ไม่ต้องแข่งพูดในกลุ่ม"] },
  { heading: "👥 เข้าสังคม", items: ["Law Society เล็กๆ ดีกว่า party ใหญ่", "Moot competitions — คุยเรื่องกฎหมาย structured", "Durham Thai Society — คนไทย ไม่ต้อง small talk ฝรั่ง"] },
];

var DEFAULT_ACADEMIC = [
  { heading: "📝 OSCOLA Citation", items: ["Author, 'Article Title' (Year) Volume Journal Page", "e.g. Smith, 'Brexit & Trade' (2020) 10 EJIL 100", "Books: Author, Title (Publisher Year)", "Cases: R v Smith [2020] UKSC 1"] },
  { heading: "🎓 LLM Structure", items: ["Term 1 (Oct–Jan): 3-4 modules + essays", "Term 2 (Jan–Apr): 2-3 modules + seminars", "Term 3 (Apr–Jun): Revision + exams", "Dissertation (Jun–Sep): 15,000 words"] },
  { heading: "📅 Key Dates 2026/27", items: ["Pre-sessional: ~3 Aug – 11 Sep 2026", "Induction Week: w/c 28 Sep 2026", "Term 1 ends: ~16 Jan 2027", "Dissertation deadline: ~Sep 2027"] },
  { heading: "📚 Library Resources (Free)", items: ["Westlaw UK — cases, legislation, journals", "LexisNexis — secondary sources", "BAILII — free UK case law", "HeinOnline — international law journals"] },
];

var DEFAULT_CAREER = [
  { heading: "⚖️ UK Law Routes", items: ["Solicitor: SQE1 + SQE2 (£3,000-5,000)", "Barrister: Bar Course (BPTC) £15,000-25,000", "Graduate Route Visa: stay 2 years after graduation", "LLM ช่วยได้มากถ้า specialise ตรงสาย"] },
  { heading: "🏛️ Durham Law Opportunities", items: ["DULS (Durham University Law Society)", "Mooting Competition — CV สำคัญมาก", "Pro Bono — ช่วยชุมชน + ประสบการณ์", "Careers Fair — Oct/Nov each year"] },
  { heading: "🗓️ Timeline การสมัครงาน", items: ["Oct–Nov: Vacation scheme applications open", "Oct–Jan: Apply summer vacation schemes 2027", "Nov: Law Fair — meet law firms", "Jan–Mar: Interview season", "Jun–Aug: Summer vacation schemes"] },
  { heading: "🌏 Back to Thailand", items: ["Big 4 Thai law firms: Baker McKenzie, Linklaters (Bangkok)", "International Trade Law — ตลาดงานดีมาก", "LLM Durham + Thai Bar → strong profile", "Network กับ Thai alumni ก่อน graduate"] },
];

var EXPENSE_BUDGETS = {
  "🍽️ อาหาร": 250,
  "🚌 เดินทาง": 60,
  "📚 หนังสือ/เรียน": 80,
  "🎉 สังสรรค์": 80,
  "🛒 ของใช้": 100,
  "💊 สุขภาพ": 40,
  "✈️ ท่องเที่ยว": 150,
  "📦 อื่นๆ": 50,
};

function SectionHeader({ id, icon, title, open, onToggle }) {
  return (
    <div
      onClick={function () { onToggle(id); }}
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "14px 20px",
        cursor: "pointer",
        userSelect: "none",
        background: "var(--card)",
        borderRadius: open ? "16px 16px 0 0" : 16,
        border: "1px solid var(--border)",
        marginBottom: open ? 0 : 8,
        boxShadow: "var(--shadow)",
      }}
    >
      <span style={{ fontSize: 15, fontWeight: 700, color: "var(--text)" }}>
        {icon} {title}
      </span>
      <span style={{ fontSize: 16, color: "var(--text-sub)", fontWeight: 700 }}>
        {open ? "▾" : "▸"}
      </span>
    </div>
  );
}

function SectionBody({ open, children }) {
  if (!open) return null;
  return (
    <div
      style={{
        background: "var(--card)",
        borderRadius: "0 0 16px 16px",
        border: "1px solid var(--border)",
        borderTop: "none",
        padding: "16px 20px",
        marginBottom: 8,
        boxShadow: "var(--shadow)",
      }}
    >
      {children}
    </div>
  );
}

export default function InfoTab({
  vaccines,
  checked,
  toggle,
  places,
  contacts,
  lifeuk,
  academic,
  career,
  introvert,
  packing,
  shopping,
  expenses,
  sheetExpenses,
  expForm,
  setExpForm,
  addExpense,
  delExpense,
  EXPENSE_CATS,
  dark,
}) {
  var [open, setOpen] = useState({});

  function toggleSection(id) {
    setOpen(function (o) {
      return Object.assign({}, o, { [id]: !o[id] });
    });
  }

  var vaxList = vaccines && vaccines.length > 0 ? vaccines : DEFAULT_VACCINES;
  var placeList = places && places.length > 0 ? places : DEFAULT_PLACES;
  var contactList = contacts && contacts.length > 0 ? contacts : DEFAULT_CONTACTS;
  var introvertData = introvert && introvert.length > 0 ? introvert : DEFAULT_INTROVERT;
  var academicData = academic && academic.length > 0 ? academic : DEFAULT_ACADEMIC;
  var careerData = career && career.length > 0 ? career : DEFAULT_CAREER;
  var cats = EXPENSE_CATS || Object.keys(EXPENSE_BUDGETS);

  var vaxDone = vaxList.filter(function (v) { return !!checked["vax_" + v.n]; }).length;
  var visaDone = VISA_DOCS.filter(function (d) { return !!checked["visa_" + d]; }).length;

  // Group places by category
  var placeGroups = {};
  placeList.forEach(function (p) {
    var cat = p.category || "อื่นๆ";
    if (!placeGroups[cat]) placeGroups[cat] = [];
    placeGroups[cat].push(p);
  });

  // Expense helpers
  var allExpenses = (sheetExpenses || []).concat(expenses || []);
  var recentExpenses = allExpenses.slice(0, 20);

  var monthlySummary = {};
  allExpenses.forEach(function (e) {
    var cat = e.cat || "📦 อื่นๆ";
    if (!monthlySummary[cat]) monthlySummary[cat] = 0;
    monthlySummary[cat] += parseFloat(e.amount) || 0;
  });

  return (
    <div style={{ padding: "16px 14px 100px", maxWidth: 560, margin: "0 auto" }}>

      {/* 1. Visa & Documents */}
      <SectionHeader id="visa" icon="📋" title="วีซ่า & เอกสาร" open={open["visa"]} onToggle={toggleSection} />
      <SectionBody open={open["visa"]}>
        <div style={{ fontSize: 13, color: "var(--text-sub)", marginBottom: 12, background: "var(--warning-surface)", padding: "8px 12px", borderRadius: "var(--radius-sm)", border: "1px solid var(--warning)" }}>
          ยื่นวีซ่า VFS Bangkok · ค่าวีซ่า £524 + IHS £1,164 (18 เดือน)
        </div>
        <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-sub)", marginBottom: 8 }}>
          {visaDone}/{VISA_DOCS.length} เอกสารพร้อม
        </div>
        {VISA_DOCS.map(function (doc, i) {
          var key = "visa_" + doc;
          var isChecked = !!checked[key];
          return (
            <div
              key={i}
              onClick={function () { toggle(key); }}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "9px 0",
                borderBottom: i < VISA_DOCS.length - 1 ? "1px solid var(--border)" : "none",
                cursor: "pointer",
              }}
            >
              <div style={{
                width: 20, height: 20, borderRadius: 6,
                border: isChecked ? "2px solid var(--success)" : "2px solid var(--border)",
                background: isChecked ? "var(--success)" : "transparent",
                display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
              }}>
                {isChecked && <span style={{ color: "#fff", fontSize: 12, fontWeight: 900 }}>✓</span>}
              </div>
              <span style={{
                fontSize: 14, color: isChecked ? "var(--text-sub)" : "var(--text)",
                textDecoration: isChecked ? "line-through" : "none",
              }}>
                {doc}
              </span>
            </div>
          );
        })}
      </SectionBody>

      {/* 2. Vaccines */}
      <SectionHeader id="vax" icon="💉" title="วัคซีน" open={open["vax"]} onToggle={toggleSection} />
      <SectionBody open={open["vax"]}>
        <div style={{ fontSize: 13, fontWeight: 700, color: "var(--success)", marginBottom: 12 }}>
          {vaxDone}/{vaxList.length} ฉีดแล้ว
        </div>
        {vaxList.map(function (v, i) {
          var key = "vax_" + v.n;
          var isChecked = !!checked[key];
          return (
            <div
              key={i}
              onClick={function () { toggle(key); }}
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: 10,
                padding: "9px 0",
                borderBottom: i < vaxList.length - 1 ? "1px solid var(--border)" : "none",
                cursor: "pointer",
              }}
            >
              <div style={{
                width: 20, height: 20, borderRadius: 6, marginTop: 1,
                border: isChecked ? "2px solid var(--success)" : "2px solid var(--border)",
                background: isChecked ? "var(--success)" : "transparent",
                display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
              }}>
                {isChecked && <span style={{ color: "#fff", fontSize: 12, fontWeight: 900 }}>✓</span>}
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: isChecked ? "var(--text-sub)" : "var(--text)", textDecoration: isChecked ? "line-through" : "none" }}>
                  {v.n}
                </div>
                {v.d && (
                  <div style={{ fontSize: 12, color: "var(--text-sub)" }}>{v.d}</div>
                )}
                {v.due && (
                  <div style={{ fontSize: 12, color: "var(--warning)", fontWeight: 600 }}>ครบกำหนด: {v.due}</div>
                )}
              </div>
            </div>
          );
        })}
      </SectionBody>

      {/* 3. Flights */}
      <SectionHeader id="flights" icon="✈️" title="เดินทาง / เที่ยวบิน" open={open["flights"]} onToggle={toggleSection} />
      <SectionBody open={open["flights"]}>
        <div style={{ fontSize: 13, background: "var(--primary-surface)", padding: "8px 12px", borderRadius: "var(--radius-sm)", color: "var(--primary)", fontWeight: 600, marginBottom: 12 }}>
          ✈️ Newcastle (NCL) ใกล้ที่สุด · รถไฟจาก NCL → Durham 20 นาที
        </div>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, marginBottom: 12 }}>
          <thead>
            <tr style={{ background: "var(--primary-surface)" }}>
              {["สายการบิน", "เส้นทาง", "เวลา", "ราคาประมาณ"].map(function (h) {
                return (
                  <th key={h} style={{ padding: "7px 8px", textAlign: "left", color: "var(--primary)", fontWeight: 700, whiteSpace: "nowrap" }}>
                    {h}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {AIRLINES.map(function (a, i) {
              return (
                <tr key={i} style={{ borderTop: "1px solid var(--border)" }}>
                  <td style={{ padding: "8px 8px", fontWeight: 700, color: "var(--text)" }}>{a.airline}</td>
                  <td style={{ padding: "8px 8px", color: "var(--text-sub)", fontSize: 12 }}>{a.route}</td>
                  <td style={{ padding: "8px 8px", color: "var(--text-sub)" }}>{a.duration}</td>
                  <td style={{ padding: "8px 8px", color: "var(--success)", fontWeight: 700 }}>{a.price}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <div style={{ fontSize: 13, color: "var(--text-sub)" }}>
          💡 เคล็ดลับ: จองล่วงหน้า 3-4 เดือน · หลีกเลี่ยงช่วง School holidays ราคาพุ่ง
        </div>
      </SectionBody>

      {/* 4. Durham Places */}
      <SectionHeader id="places" icon="📍" title="สถานที่ใน Durham" open={open["places"]} onToggle={toggleSection} />
      <SectionBody open={open["places"]}>
        {Object.keys(placeGroups).map(function (cat) {
          return (
            <div key={cat} style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: "var(--primary)", marginBottom: 6 }}>{cat}</div>
              {placeGroups[cat].map(function (p, i) {
                return (
                  <div key={i} style={{ padding: "6px 0", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <div style={{ fontSize: 14, color: "var(--text)", fontWeight: 600 }}>{p.name}</div>
                      {p.note && <div style={{ fontSize: 12, color: "var(--text-sub)" }}>{p.note}</div>}
                    </div>
                    {p.addr && <div style={{ fontSize: 12, color: "var(--text-sub)", textAlign: "right", maxWidth: 120 }}>{p.addr}</div>}
                  </div>
                );
              })}
            </div>
          );
        })}
      </SectionBody>

      {/* 5. Contacts */}
      <SectionHeader id="contacts" icon="📞" title="ติดต่อ" open={open["contacts"]} onToggle={toggleSection} />
      <SectionBody open={open["contacts"]}>
        {contactList.map(function (c, i) {
          return (
            <div key={i} style={{ padding: "10px 0", borderBottom: i < contactList.length - 1 ? "1px solid var(--border)" : "none" }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text)", marginBottom: 3 }}>{c.name}</div>
              {c.note && <div style={{ fontSize: 13, color: "var(--text-sub)", marginBottom: 4 }}>{c.note}</div>}
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {c.phone && (
                  <a
                    href={"tel:" + c.phone}
                    style={{ fontSize: 13, color: "var(--primary)", fontWeight: 600, textDecoration: "none" }}
                  >
                    📞 {c.phone}
                  </a>
                )}
                {c.email && (
                  <a
                    href={"mailto:" + c.email}
                    style={{ fontSize: 13, color: "var(--primary)", fontWeight: 600, textDecoration: "none" }}
                  >
                    ✉️ {c.email}
                  </a>
                )}
              </div>
            </div>
          );
        })}
      </SectionBody>

      {/* 6. Weather */}
      <SectionHeader id="weather" icon="🌡️" title="สภาพอากาศ Durham" open={open["weather"]} onToggle={toggleSection} />
      <SectionBody open={open["weather"]}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 14 }}>
          {SEASONS.map(function (s, i) {
            return (
              <div key={i} style={{ background: "var(--primary-surface)", borderRadius: "var(--radius-sm)", padding: "12px 12px" }}>
                <div style={{ fontSize: 13, fontWeight: 800, color: "var(--primary)", marginBottom: 4 }}>{s.period}</div>
                <div style={{ fontSize: 18, fontWeight: 900, color: "var(--text)", marginBottom: 2 }}>{s.temp}</div>
                <div style={{ fontSize: 12, color: "var(--text-sub)", marginBottom: 6 }}>{s.desc}</div>
                <div style={{ fontSize: 12, color: "var(--text)", fontWeight: 600 }}>{s.gear}</div>
              </div>
            );
          })}
        </div>
        <div style={{ fontSize: 13, background: "var(--warning-surface)", border: "1px solid var(--warning)", borderRadius: "var(--radius-sm)", padding: "10px 12px", color: "var(--text)", fontWeight: 600 }}>
          ☂️ ฝนตก 150+ วัน/ปี — ต้องมี umbrella หรือ waterproof jacket ติดตัวเสมอ!
        </div>
      </SectionBody>

      {/* 7. Apps & Week 1 */}
      <SectionHeader id="apps" icon="📱" title="Apps & Week 1" open={open["apps"]} onToggle={toggleSection} />
      <SectionBody open={open["apps"]}>
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text)", marginBottom: 10 }}>Apps ต้องโหลด</div>
          {(lifeuk && lifeuk.length > 0 ? lifeuk : DEFAULT_APPS).map(function (group, gi) {
            return (
              <div key={gi} style={{ marginBottom: 10 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "var(--primary)", marginBottom: 4 }}>
                  {group.heading || group.group}
                </div>
                {(group.items || []).map(function (item, ii) {
                  return (
                    <div key={ii} style={{ fontSize: 13, color: "var(--text)", padding: "4px 0", paddingLeft: 12 }}>
                      · {item}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
        <div style={{ borderTop: "1px solid var(--border)", paddingTop: 14 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text)", marginBottom: 10 }}>
            ✅ Week 1 Checklist
          </div>
          {WEEK1.map(function (item, i) {
            var key = "week1_" + i;
            var isChecked = !!checked[key];
            return (
              <div
                key={i}
                onClick={function () { if (typeof toggle === "function") toggle(key); }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "8px 0",
                  borderBottom: i < WEEK1.length - 1 ? "1px solid var(--border)" : "none",
                  cursor: "pointer",
                }}
              >
                <div style={{
                  width: 20, height: 20, borderRadius: 6, flexShrink: 0,
                  border: isChecked ? "2px solid var(--success)" : "2px solid var(--border)",
                  background: isChecked ? "var(--success)" : "transparent",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  {isChecked && <span style={{ color: "#fff", fontSize: 12, fontWeight: 900 }}>✓</span>}
                </div>
                <span style={{ fontSize: 13, color: isChecked ? "var(--text-sub)" : "var(--text)", textDecoration: isChecked ? "line-through" : "none" }}>
                  {item}
                </span>
              </div>
            );
          })}
        </div>
      </SectionBody>

      {/* 8. Introvert Guide */}
      <SectionHeader id="introvert" icon="🧠" title="Introvert Guide" open={open["introvert"]} onToggle={toggleSection} />
      <SectionBody open={open["introvert"]}>
        {introvertData.map(function (section, si) {
          return (
            <div key={si} style={{ marginBottom: si < introvertData.length - 1 ? 16 : 0 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: "var(--primary)", marginBottom: 8 }}>
                {section.heading}
              </div>
              {(section.items || []).map(function (item, ii) {
                return (
                  <div key={ii} style={{ display: "flex", gap: 8, padding: "5px 0", fontSize: 13, color: "var(--text)", borderBottom: ii < section.items.length - 1 ? "1px solid var(--border)" : "none" }}>
                    <span style={{ color: "var(--primary)", flexShrink: 0 }}>·</span>
                    <span>{item}</span>
                  </div>
                );
              })}
            </div>
          );
        })}
      </SectionBody>

      {/* 9. Academic */}
      <SectionHeader id="academic" icon="🎓" title="Academic" open={open["academic"]} onToggle={toggleSection} />
      <SectionBody open={open["academic"]}>
        {academicData.map(function (section, si) {
          return (
            <div key={si} style={{ marginBottom: si < academicData.length - 1 ? 16 : 0 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: "var(--primary)", marginBottom: 8 }}>
                {section.heading}
              </div>
              {(section.items || []).map(function (item, ii) {
                return (
                  <div key={ii} style={{ fontSize: 13, color: "var(--text)", padding: "5px 0", borderBottom: ii < section.items.length - 1 ? "1px solid var(--border)" : "none", paddingLeft: 8 }}>
                    {item}
                  </div>
                );
              })}
            </div>
          );
        })}
      </SectionBody>

      {/* 10. Career */}
      <SectionHeader id="career" icon="💼" title="Career" open={open["career"]} onToggle={toggleSection} />
      <SectionBody open={open["career"]}>
        {careerData.map(function (section, si) {
          return (
            <div key={si} style={{ marginBottom: si < careerData.length - 1 ? 16 : 0 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: "var(--primary)", marginBottom: 8 }}>
                {section.heading}
              </div>
              {(section.items || []).map(function (item, ii) {
                return (
                  <div key={ii} style={{ fontSize: 13, color: "var(--text)", padding: "5px 0", borderBottom: ii < section.items.length - 1 ? "1px solid var(--border)" : "none", paddingLeft: 8 }}>
                    {item}
                  </div>
                );
              })}
            </div>
          );
        })}
      </SectionBody>

      {/* 11. Expense Tracker */}
      <SectionHeader id="expenses" icon="💷" title="Expense Tracker" open={open["expenses"]} onToggle={toggleSection} />
      <SectionBody open={open["expenses"]}>
        {/* Add expense form */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text)", marginBottom: 10 }}>เพิ่มรายจ่าย</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 8 }}>
            <input
              type="text"
              placeholder="รายการ..."
              value={expForm ? expForm.desc : ""}
              onChange={function (e) {
                if (setExpForm) setExpForm(function (f) { return Object.assign({}, f, { desc: e.target.value }); });
              }}
              style={{
                padding: "10px 12px",
                borderRadius: "var(--radius-sm)",
                border: "1px solid var(--border)",
                background: "var(--bg)",
                color: "var(--text)",
                fontSize: 14,
                gridColumn: "1 / -1",
              }}
            />
            <input
              type="number"
              placeholder="£ จำนวน"
              value={expForm ? expForm.amount : ""}
              onChange={function (e) {
                if (setExpForm) setExpForm(function (f) { return Object.assign({}, f, { amount: e.target.value }); });
              }}
              style={{
                padding: "10px 12px",
                borderRadius: "var(--radius-sm)",
                border: "1px solid var(--border)",
                background: "var(--bg)",
                color: "var(--text)",
                fontSize: 14,
              }}
            />
            <select
              value={expForm ? expForm.cat : (cats[0] || "")}
              onChange={function (e) {
                if (setExpForm) setExpForm(function (f) { return Object.assign({}, f, { cat: e.target.value }); });
              }}
              style={{
                padding: "10px 12px",
                borderRadius: "var(--radius-sm)",
                border: "1px solid var(--border)",
                background: "var(--bg)",
                color: "var(--text)",
                fontSize: 14,
              }}
            >
              {cats.map(function (c) {
                return <option key={c} value={c}>{c}</option>;
              })}
            </select>
            <input
              type="date"
              value={expForm ? expForm.date : ""}
              onChange={function (e) {
                if (setExpForm) setExpForm(function (f) { return Object.assign({}, f, { date: e.target.value }); });
              }}
              style={{
                padding: "10px 12px",
                borderRadius: "var(--radius-sm)",
                border: "1px solid var(--border)",
                background: "var(--bg)",
                color: "var(--text)",
                fontSize: 14,
                gridColumn: "1 / -1",
              }}
            />
          </div>
          <button
            onClick={addExpense}
            style={{
              width: "100%",
              padding: "11px 0",
              background: "var(--primary)",
              color: "#fff",
              border: "none",
              borderRadius: "var(--radius-sm)",
              fontSize: 14,
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            + เพิ่ม
          </button>
        </div>

        {/* Monthly summary */}
        {Object.keys(monthlySummary).length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text)", marginBottom: 10 }}>
              สรุปรายจ่าย
            </div>
            {Object.keys(monthlySummary).map(function (cat) {
              var spent = monthlySummary[cat];
              var budget = EXPENSE_BUDGETS[cat] || 100;
              var pct = Math.min(100, Math.round((spent / budget) * 100));
              var overBudget = spent > budget;
              return (
                <div key={cat} style={{ marginBottom: 10 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 4 }}>
                    <span style={{ color: "var(--text)", fontWeight: 600 }}>{cat}</span>
                    <span style={{ color: overBudget ? "var(--danger)" : "var(--text-sub)", fontWeight: overBudget ? 700 : 400 }}>
                      £{spent.toFixed(0)} / £{budget}
                    </span>
                  </div>
                  <div style={{ height: 6, background: "var(--border)", borderRadius: 99, overflow: "hidden" }}>
                    <div style={{
                      height: "100%",
                      width: pct + "%",
                      background: overBudget ? "var(--danger)" : "var(--success)",
                      borderRadius: 99,
                      transition: "width 0.4s",
                    }} />
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Recent expenses list */}
        {recentExpenses.length > 0 && (
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text)", marginBottom: 8 }}>
              รายการล่าสุด
            </div>
            {recentExpenses.map(function (e, i) {
              return (
                <div
                  key={e.id || i}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "9px 0",
                    borderBottom: i < recentExpenses.length - 1 ? "1px solid var(--border)" : "none",
                  }}
                >
                  <span style={{ fontSize: 18, flexShrink: 0 }}>
                    {(e.cat || "📦").split(" ")[0]}
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, color: "var(--text)", fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {e.desc}
                    </div>
                    <div style={{ fontSize: 12, color: "var(--text-sub)" }}>{e.date}</div>
                  </div>
                  <div style={{ fontWeight: 800, color: "var(--text)", fontSize: 14, flexShrink: 0 }}>
                    £{parseFloat(e.amount).toFixed(2)}
                  </div>
                  {delExpense && e.id && (
                    <button
                      onClick={function () { delExpense(e.id); }}
                      style={{
                        background: "var(--danger-surface)",
                        color: "var(--danger)",
                        border: "none",
                        borderRadius: 6,
                        width: 28,
                        height: 28,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        cursor: "pointer",
                        flexShrink: 0,
                        fontSize: 14,
                      }}
                    >
                      🗑
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {recentExpenses.length === 0 && (
          <div style={{ textAlign: "center", color: "var(--text-sub)", fontSize: 14, padding: "20px 0" }}>
            ยังไม่มีรายการ — เพิ่มรายจ่ายแรกเลย!
          </div>
        )}
      </SectionBody>
    </div>
  );
}
