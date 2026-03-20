/**
 * Google Sheets integration service.
 *
 * Required env vars:
 *   VITE_GOOGLE_SHEETS_ID — Spreadsheet ID from the sheet URL
 *
 * No API key needed — uses the public GViz (Visualization Query) API.
 * The spreadsheet must be shared: Share → Anyone with the link → Viewer
 *
 * Sheet tabs used:
 *   GID 985982238  →  🏠 Studio ทั้งหมด  (accommodation)
 *   🛒 Shopping    →  shopping list
 *   🧳 Packing     →  packing checklist
 *   💉 วัคซีน      →  vaccines
 *   🧠 Introvert   →  introvert guide
 */

const SPREADSHEET_ID = import.meta.env.VITE_GOOGLE_SHEETS_ID;

// ─── GViz fetcher ────────────────────────────────────────────────────────────

/**
 * Fetch a sheet via the Google Visualization Query API (no API key required).
 * Pass a number for GID-based lookup, or a string for tab-name lookup.
 * Retries up to 3 times with exponential back-off on HTTP 429.
 *
 * Returns an array of rows, each row being an array of typed values
 * (numbers stay numbers, empty cells become "").
 */
async function fetchGViz(tabRef, attempt = 1) {
  const param =
    typeof tabRef === "number"
      ? `gid=${tabRef}`
      : `sheet=${encodeURIComponent(tabRef)}`;

  const url = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/gviz/tq?tqx=out:json&${param}`;

  const res = await fetch(url);

  if (res.status === 429 && attempt <= 3) {
    await new Promise((r) => setTimeout(r, attempt * 1500));
    return fetchGViz(tabRef, attempt + 1);
  }

  if (!res.ok) {
    throw new Error(`GViz error for "${tabRef}": ${res.status}`);
  }

  const text = await res.text();
  // Strip the JSONP wrapper:  /*O_o*/\ngoogle.visualization.Query.setResponse({...});
  const json = JSON.parse(text.replace(/^[^(]+\(/, "").replace(/\);\s*$/, ""));

  if (json.status !== "ok") {
    throw new Error(`GViz status error for "${tabRef}": ${json.status}`);
  }

  // Convert to 2-D array of values; null/undefined → ""
  return json.table.rows.map((row) =>
    (row.c || []).map((cell) =>
      cell && cell.v !== null && cell.v !== undefined ? cell.v : ""
    )
  );
}

// ─── Parsers ─────────────────────────────────────────────────────────────────

/**
 * Accommodation — GID 985982238 (🏠 Studio ทั้งหมด)
 *
 * Col 0  ชื่อที่พัก (ผู้ให้บริการ)  — "Property\n(Provider)"
 * Col 1  ชื่อห้อง (จริง)
 * Col 2  ขนาด (m²)                   — number
 * Col 3  เตียง
 * Col 4  ราคา/สัปดาห์ (£)            — number
 * Col 5  สัญญา (wk)                  — number
 * Col 6  ค่าเช่ารวมทั้งปี (£)        — number
 * Col 7  ค่าเช่า/เดือน (£)           — number
 * Col 8  ค่าเช่า/เดือน (฿)           — number
 * Col 9  Bills รวม?
 * Col 10 Deposit (£)                  — number
 * Col 11 ระยะทางถึง Law School
 * Col 12 ความปลอดภัย
 * Col 13 สิ่งอำนวยความสะดวกในห้อง
 *
 * Rows are grouped by property — the FIRST (cheapest/top-listed) room
 * per property becomes the representative card.
 */
const ACCOM_META = {
  "Student Castle": {
    badge: "🎬 BEST FACILITIES",
    color: "#6A1B9A",
    bg: "#F3E5F5",
    addr: "20 Claypath, DH1 1RH",
  },
  "Duresme Court": {
    badge: "🏆 BEST PICK",
    color: "#1B5E20",
    bg: "#E8F5E9",
    addr: "Newcastle Road, DH1 4FA",
  },
  "Elvet Studios": {
    badge: "🏢 UNITE STUDENTS",
    color: "#0D47A1",
    bg: "#E3F2FD",
    addr: "Elvet Waterside, DH1",
  },
  "Chapel Heights": {
    badge: "💎 LOW DEPOSIT",
    color: "#E65100",
    bg: "#FFF3E0",
    addr: "Gilesgate, Durham",
  },
  "St Giles Studios": {
    badge: "💰 BEST VALUE",
    color: "#1565C0",
    bg: "#E8EAF6",
    addr: "110 Gilesgate, DH1 1JA",
  },
  "Dun Holm House": {
    badge: "⭐ CITY CENTRE",
    color: "#BF360C",
    bg: "#FBE9E7",
    addr: "Riverwalk, Durham",
  },
  "Houghall Court": {
    badge: "💰 CHEAPEST",
    color: "#4A148C",
    bg: "#EDE7F6",
    addr: "Houghall Campus",
  },
  "Regatta Place": {
    badge: "🆕 NEWEST 2025",
    color: "#00695C",
    bg: "#E0F2F1",
    addr: "Front Street, Durham",
  },
};

function parseAccom(rows) {
  const propMap = new Map();

  rows.forEach((r) => {
    const propStr = String(r[0] || "").trim();
    if (!propStr) return;

    const lines = propStr.split("\n");
    const propName = lines[0].trim();
    const provider = (lines[1] || "").replace(/[()]/g, "").trim();

    const pw = parseFloat(r[4]) || 0;
    if (!pw) return; // skip rows with no price (sold out etc.)

    if (propMap.has(propName)) return; // keep first room per property

    const meta =
      Object.entries(ACCOM_META).find(([k]) => propName.includes(k))?.[1] ||
      { badge: "", color: "#333", bg: "#f8f8f8", addr: "" };

    const dist = String(r[11] || "").replace(/\n/g, " ").trim();
    const security = String(r[12] || "")
      .split(/[,\n]/)
      .map((s) => s.trim())
      .filter(Boolean);
    const roomHas = String(r[13] || "")
      .split(/[,\n]/)
      .map((s) => s.trim())
      .filter(Boolean);

    propMap.set(propName, {
      name: propName,
      badge: meta.badge,
      color: meta.color,
      bg: meta.bg,
      provider: provider || propName,
      addr: meta.addr,
      dist,
      rating: "",
      stars: { location: 0, clean: 0, facilities: 0, value: 0, safety: 0 },
      room: {
        name: String(r[1] || ""),
        size: r[2] ? `${r[2]}m²` : "",
        bed: String(r[3] || ""),
        pw,
        wk: parseInt(r[5]) || 51,
        dep: parseInt(r[10]) || 0,
      },
      roomHas,
      facilities: [],
      security,
      pros: [],
      cons: [],
    });
  });

  return [...propMap.values()];
}

/**
 * Vaccines — 💉 วัคซีน
 *
 * Col 0  #
 * Col 1  วัคซีน          — name
 * Col 2  เร่งด่วน?        — "🔴 เร่งด่วน!" | "ตรวจสอบ" | "แนะนำ" | "ฉีดที่ UK"
 * Col 3  จำนวนเข็ม        — doses
 * Col 4  ราคา (ไทย)       — price
 * Col 5  ฉีดที่ไหน         — where
 * Col 6  สถานะ            — status
 * Col 7  รายละเอียด        — detail
 */
function parseVaccines(rows) {
  return rows
    .filter((r) => r[0] && r[1]) // r[0] is the row number — skip note/footer rows
    .map((r) => ({
      n: String(r[1] || ""),
      u: String(r[2] || "").includes("เร่งด่วน"),
      d: String(r[7] || ""),
      w: String(r[5] || ""),
      p: String(r[4] || ""),
      dos: String(r[3] || ""),
    }));
}

/**
 * Packing — 🧳 Packing
 *
 * Col 0  #
 * Col 1  สิ่งของ   — item name
 * Col 2  หมวด      — category
 * Col 3  เตรียมแล้ว
 * Col 4  หมายเหตุ
 *
 * Groups by category (col 2), collects item names (col 1).
 */
function parsePacking(rows) {
  const map = new Map();
  rows.forEach((r) => {
    const item = String(r[1] || "").trim();
    const cat = String(r[2] || "").trim();
    if (!item || !cat) return;
    if (!map.has(cat)) map.set(cat, { c: cat, i: [] });
    map.get(cat).i.push(item);
  });
  return [...map.values()];
}

/**
 * Shopping — 🛒 Shopping
 *
 * Col 0  #
 * Col 1  สินค้า            — product name
 * Col 2  หมวด              — category
 * Col 3  ความสำคัญ          — tag (🏆 MUST / ⭐ แนะนำ / 💡 Optional / ⭐ ซื้อ UK)
 * Col 4  ซื้อที่            — where ("🇹🇭 ไทย" / "🇬🇧 UK" / "🌍 ...")
 * Col 5  ราคาไทย (฿)        — number
 * Col 6  ราคา UK (£)         — number
 * Col 7  ราคา UK (฿)         — number
 * Col 8  ส่วนต่าง (฿)        — number
 * Col 9  ซื้อแล้ว
 * Col 10 เหตุผลซื้อที่นี่     — why
 * Col 11 รายละเอียดสินค้า    — detail
 */
function parseShopping(rows) {
  const map = new Map();
  rows.forEach((r) => {
    const name = String(r[1] || "").trim();
    const cat = String(r[2] || "").trim();
    if (!name || !cat) return;
    if (!map.has(cat)) map.set(cat, { c: cat, items: [] });

    const whereRaw = String(r[4] || "");
    const buyWhere = whereRaw.includes("ไทย")
      ? "TH"
      : whereRaw.includes("UK")
      ? "UK"
      : "EITHER";

    const priceTH = r[5] ? `฿${Number(r[5]).toLocaleString()}` : "";
    const priceUK = r[6] ? `£${Number(r[6]).toLocaleString()}` : "";
    const price = buyWhere === "TH" ? priceTH : buyWhere === "UK" ? priceUK : priceTH || priceUK;

    map.get(cat).items.push({
      name,
      price,
      priceTH,
      priceUK,
      buyWhere,
      why: String(r[10] || ""),
      whyDetail: String(r[11] || ""),
      tag: String(r[3] || ""),
    });
  });
  return [...map.values()];
}

/**
 * Introvert — 🧠 Introvert
 *
 * Col 0  #
 * Col 1  หมวด                   — category (e.g. "🧠 เตรียมใจ")
 * Col 2  เทคนิค                  — tip title
 * Col 3  รายละเอียด / วิธีปฏิบัติ — tip detail
 * Col 4  ระดับสำคัญ
 * Col 5  เริ่มเมื่อ
 * Col 6  ทำแล้ว
 *
 * Groups by category (col 1); icon extracted from leading emoji.
 */
const INTRO_META = [
  { key: "เตรียมใจ", color: "#E65100", bg: "#FFF3E0" },
  { key: "Studio",   color: "#1B5E20", bg: "#E8F5E9" },
  { key: "ทำอาหาร",  color: "#BF360C", bg: "#FBE9E7" },
  { key: "เจอเพื่อน",color: "#1565C0", bg: "#E3F2FD" },
  { key: "Mental",   color: "#2E7D32", bg: "#E8F5E9" },
  { key: "Homesick", color: "#6A1B9A", bg: "#F3E5F5" },
  { key: "คนไทย",   color: "#C62828", bg: "#FFEBEE" },
];

function getIntroMeta(cat) {
  const m = INTRO_META.find((x) => cat.includes(x.key));
  return m ? { color: m.color, bg: m.bg } : { color: "#555", bg: "#f8f8f8" };
}

function parseIntrovert(rows) {
  const map = new Map();
  rows.forEach((r) => {
    if (!r[0]) return; // skip footer/summary rows (no row number)
    const cat = String(r[1] || "").trim();
    const tipTitle = String(r[2] || "").trim();
    const tipDetail = String(r[3] || "").trim();
    if (!cat) return;

    if (!map.has(cat)) {
      const meta = getIntroMeta(cat);
      // Extract the leading emoji as the icon (Unicode-aware)
      const emojiMatch = cat.match(/^\p{Emoji}/u);
      const icon = emojiMatch ? emojiMatch[0] : "💡";
      map.set(cat, { c: cat, icon, color: meta.color, bg: meta.bg, tips: [] });
    }

    if (tipTitle && tipDetail) {
      map.get(cat).tips.push({ t: tipTitle, d: tipDetail });
    }
  });
  return [...map.values()];
}

/**
 * Timeline — 📅 Timeline
 *
 * Col 0  # (empty for section headers)
 * Col 1  เดือน (month label for headers, contains "📅 มี.ค. 2026" etc)
 * Col 2  ทำอะไร (task description)
 * Col 3  หมวด (category)
 * Col 4  ความสำคัญ (importance)
 * Col 5  สถานะ (status)
 * Col 6  หมายเหตุ (notes)
 *
 * Returns array of { month, tasks: [{ item, cat, imp, status, note }] }
 */
function parseTimeline(rows) {
  const months = [];
  let current = null;
  rows.forEach((r) => {
    const col0 = String(r[0] || "").trim();
    const col1 = String(r[1] || "").trim();
    // Section header: col0 empty and col1 contains "📅"
    if (!col0 && col1.includes("📅")) {
      current = { month: col1.trim(), tasks: [] };
      months.push(current);
    } else if (col0 && !isNaN(parseFloat(col0)) && current) {
      // Task row: col0 is a number
      current.tasks.push({
        item:   String(r[2] || "").trim(),
        cat:    String(r[3] || "").trim(),
        imp:    String(r[4] || "").trim(),
        status: String(r[5] || "").trim(),
        note:   String(r[6] || "").trim(),
      });
    }
  });
  return months;
}

/**
 * Places — 🗺️ สถานที่ Durham
 *
 * Col 0  #, Col 1  สถานที่, Col 2  หมวด, Col 3  ที่อยู่,
 * Col 4  ทำไมสำคัญ, Col 5  ระยะทาง, Col 6  หมายเหตุ
 */
function parsePlaces(rows) {
  return rows
    .filter((r) => r[0])
    .map((r) => ({
      name: String(r[1] || "").trim(),
      cat:  String(r[2] || "").trim(),
      addr: String(r[3] || "").trim(),
      why:  String(r[4] || "").trim(),
      dist: String(r[5] || "").trim(),
      note: String(r[6] || "").trim(),
    }));
}

/**
 * Contacts — 📞 Contact Directory
 *
 * Col 0  #, Col 1  ชื่อ, Col 2  หมวด, Col 3  เบอร์/Email,
 * Col 4  เว็บ, Col 5  เวลาทำการ, Col 6  หมายเหตุ
 */
function parseContacts(rows) {
  return rows
    .filter((r) => r[0])
    .map((r) => ({
      name:    String(r[1] || "").trim(),
      cat:     String(r[2] || "").trim(),
      contact: String(r[3] || "").trim(),
      web:     String(r[4] || "").trim(),
      hours:   String(r[5] || "").trim(),
      note:    String(r[6] || "").trim(),
    }));
}

/**
 * Checklist — 📋 Checklist
 *
 * Col 0  #, Col 1  รายการ, Col 2  หมวด, Col 3  สถานะ,
 * Col 4  กำหนดเสร็จ, Col 5  ความสำคัญ, Col 6  ค่าใช้จ่าย,
 * Col 7  สกุลเงิน, Col 8  หมายเหตุ
 */
function normalizeDate(val) {
  if (!val) return "";
  var s = String(val).trim();
  var g = s.match(/^Date\((\d+),(\d+),(\d+)\)$/);
  if (g) return g[1] + '-' + String(+g[2]+1).padStart(2,'0') + '-' + String(+g[3]).padStart(2,'0');
  return s;
}

function parseChecklist(rows) {
  return rows
    .filter((r) => r[0])
    .map((r) => ({
      item:     String(r[1] || "").trim(),
      cat:      String(r[2] || "").trim(),
      status:   String(r[3] || "").trim(),
      deadline: normalizeDate(r[4]),
      imp:      String(r[5] || "").trim(),
      cost:     r[6] ? Number(r[6]) : 0,
      currency: String(r[7] || "").trim(),
      note:     String(r[8] || "").trim(),
    }));
}

// ─── Checklist Groups parser ──────────────────────────────────────────────────

function phaseColor(name, idx) {
  if (name.startsWith("✅")) return "#2E7D32";
  if (name.includes("🔴")) return "#C62828";
  if (name.includes("✈️")) return "#4A148C";
  if (name.includes("🎓")) return "#1a237e";
  const fallbacks = ["#E65100", "#1565C0", "#BF360C", "#00695C"];
  return fallbacks[idx % fallbacks.length];
}

/**
 * Parses the same Checklist rows into phase groups:
 * [{ phase, color, preDone, items: [string] }]
 * Groups by Col 2 (phase/cat).
 */
function parseChecklistGroups(rows) {
  const phaseMap = new Map();
  const phaseOrder = [];
  rows.filter((r) => r[0]).forEach((r) => {
    const item = String(r[1] || "").trim();
    const phase = String(r[2] || "").trim();
    if (!item || !phase) return;
    if (!phaseMap.has(phase)) {
      phaseMap.set(phase, []);
      phaseOrder.push(phase);
    }
    phaseMap.get(phase).push(item);
  });
  return phaseOrder.map((p, i) => ({
    phase: p,
    color: phaseColor(p, i),
    preDone: p.startsWith("✅") || p.includes("เสร็จแล้ว"),
    items: phaseMap.get(p),
  }));
}

// ─── Generic flat-row parser ──────────────────────────────────────────────────
/**
 * Used for: academic, career, lifeuk, homeStatus tabs.
 * Sheet layout: [#, section, c2, c3, c4, c5]
 * Returns: [{ section, c2, c3, c4, c5 }]
 *
 * Tab structures:
 *
 * 📊 Status   — section: status | urgent | timeline
 *   status:   c2=label, c3=status_text, c4=color
 *   urgent:   c2=action_text
 *   timeline: c2=event, c3=date, c5=highlight(1/0)
 *
 * 🎓 Academic — section: oscola | timeline | systems | dissertation
 *   oscola:       c2=type, c3=example, c4=note
 *   timeline:     c2=date, c3=description, c5=color
 *   systems:      c2=name, c3=description
 *   dissertation: c2=tip_text
 *
 * 💼 Career — section: paths | societies | schemes | visa | linkedin
 *   paths:     c2=path_name (with emoji), c3=color, c4=bg; one row per STEP in c5
 *   societies: c2=name, c3=icon, c4=description
 *   schemes:   c2=firm, c3=description, c5=deadline
 *   visa/linkedin: c2=tip_text
 *
 * 📱 Life UK — section: apps | firstweek | tips | study
 *   apps:      c2=name, c3=description
 *   firstweek: c2=task_text
 *   tips:      c2=tip_text
 *   study:     c2=tip_text
 */
function parseFlat(rows) {
  return rows.filter((r) => r[0]).map((r) => ({
    section: String(r[1] || "").trim(),
    c2:      String(r[2] || "").trim(),
    c3:      String(r[3] || "").trim(),
    c4:      String(r[4] || "").trim(),
    c5:      String(r[5] || "").trim(),
  }));
}

/**
 * College Accommodation — 🏛️ College
 *
 * Col 0  #
 * Col 1  College name
 * Col 2  For who (PG/UG/All)
 * Col 3  Room type
 * Col 4  Price/week (£)    — number
 * Col 5  Contract (wk)     — number
 * Col 6  Bills included (Yes/No)
 * Col 7  Bed type
 * Col 8  Bathroom (En-suite/Shared)
 * Col 9  Distance to Law School
 * Col 10 Key features (comma-separated)
 * Col 11 Notes
 */
const COLLEGE_META = {
  "Ustinov":      { badge: "🎓 POSTGRAD ONLY", color: "#1a237e", bg: "#E8EAF6" },
  "Josephine":    { badge: "🌟 PRE-SESS VENUE", color: "#E65100", bg: "#FFF3E0" },
  "South":        { badge: "🆕 NEWEST COLLEGE", color: "#00695C", bg: "#E0F2F1" },
  "St Cuthbert":  { badge: "🏛️ CITY CENTRE", color: "#6A1B9A", bg: "#F3E5F5" },
  "Grey":         { badge: "🏆 POPULAR PG", color: "#BF360C", bg: "#FBE9E7" },
  "Trevelyan":    { badge: "⭐ SOUTH ROAD", color: "#1565C0", bg: "#E3F2FD" },
  "Collingwood":  { badge: "🏫 LARGE COLLEGE", color: "#4A148C", bg: "#EDE7F6" },
};

function parseCollegeAccom(rows) {
  const colMap = new Map();
  rows.filter((r) => r[0]).forEach((r) => {
    const name = String(r[1] || "").trim();
    if (!name) return;
    const pw = parseFloat(r[4]) || 0;
    if (!pw) return;

    const meta = Object.entries(COLLEGE_META).find(([k]) => name.includes(k))?.[1]
      || { badge: "🏛️ COLLEGE", color: "#555", bg: "#f8f8f8" };

    if (!colMap.has(name)) {
      colMap.set(name, {
        name,
        badge: meta.badge,
        color: meta.color,
        bg: meta.bg,
        forWho: String(r[2] || "").trim(),
        dist: String(r[9] || "").trim(),
        addr: "",
        why: String(r[11] || "").trim(),
        rooms: [],
        features: String(r[10] || "").split(",").map((s) => s.trim()).filter(Boolean),
        note: "",
      });
    }
    colMap.get(name).rooms.push({
      type: String(r[3] || "").trim(),
      pw,
      wk: parseInt(r[5]) || 40,
      bills: String(r[6] || "").trim(),
      bed: String(r[7] || "").trim(),
      bath: String(r[8] || "").trim(),
    });
  });
  return [...colMap.values()];
}

/**
 * Price Comparison — 💰 เปรียบเทียบราคา
 *
 * Col 0  ที่พัก (property name)
 * Col 1  ชื่อห้อง (room name)
 * Col 2  ราคา Direct £/wk    — number
 * Col 3  ราคา uhomes £/wk    — string (may be range or "ask")
 * Col 4  ราคา Casita £/wk    — string
 * Col 5  ส่วนต่าง uhomes vs Direct
 * Col 6  ถูกสุดที่ไหน?
 * Col 7  Cashback/Promotion
 * Col 8  หมายเหตุ
 */
function parsePriceComparison(rows) {
  return rows
    .filter((r) => r[0] || r[1])
    .map((r) => ({
      provider: String(r[0] || "").trim(),
      room:     String(r[1] || "").trim(),
      direct:   r[2] ? parseFloat(r[2]) : null,
      uhomes:   String(r[3] || "").trim(),
      casita:   String(r[4] || "").trim(),
      diff:     String(r[5] || "").trim(),
      cheapest: String(r[6] || "").trim(),
      cashback: String(r[7] || "").trim(),
      note:     String(r[8] || "").trim(),
    }))
    .filter((r) => r.provider || r.room);
}

/**
 * Accommodation Rating — 🏠 ที่พัก Rating
 *
 * First data row: column headers (property names in cols 1–3)
 * Subsequent rows: Col 0=criteria, Col 1-3=values per property, Col 4=note
 */
function parseAccomRating(rows) {
  const filtered = rows.filter((r) => r[0]);
  if (!filtered.length) return { headers: [], rows: [] };
  const [headerRow, ...dataRows] = filtered;
  return {
    headers: [
      String(headerRow[1] || "").trim(),
      String(headerRow[2] || "").trim(),
      String(headerRow[3] || "").trim(),
    ].filter(Boolean),
    rows: dataRows.map((r) => ({
      label: String(r[0] || "").trim(),
      vals: [
        String(r[1] || "").trim(),
        String(r[2] || "").trim(),
        String(r[3] || "").trim(),
      ],
      note: String(r[4] || "").trim(),
    })),
  };
}

/**
 * Expense Tracker — 💷 Expense Tracker
 *
 * Col 0  วันที่ (date)
 * Col 1  รายการ (description)
 * Col 2  หมวด (category)
 * Col 3  จำนวนเงิน £   — number
 * Col 4  จ่ายด้วย (payment method)
 * Col 5  หมายเหตุ
 */
function parseExpenseTracker(rows) {
  return rows
    .filter((r) => r[1])
    .map((r) => ({
      date:    normalizeDate(r[0]),
      item:    String(r[1] || "").trim(),
      cat:     String(r[2] || "").trim(),
      amount:  r[3] ? parseFloat(r[3]) : 0,
      payment: String(r[4] || "").trim(),
      note:    String(r[5] || "").trim(),
    }));
}

// ─── Safe fetcher (returns [] if tab missing / on error) ─────────────────────
async function fetchGVizSafe(tabRef) {
  try { return await fetchGViz(tabRef); } catch { return []; }
}

// ─── Public API ──────────────────────────────────────────────────────────────

export function isSheetsConfigured() {
  return Boolean(SPREADSHEET_ID);
}

/**
 * Fetch all data from the Google Sheet.
 * Returns { accom, vaccines, packing, shopping, introvert, timeline, places, contacts, checklist }.
 *
 * Sheets are fetched sequentially (not Promise.all) to avoid rate limits.
 */
export async function fetchAllData() {
  if (!isSheetsConfigured()) {
    throw new Error("VITE_GOOGLE_SHEETS_ID not set — using default data.");
  }

  const accomRows       = await fetchGViz("🏠 Studio ทั้งหมด");
  const vaccineRows     = await fetchGViz("💉 วัคซีน");
  const packingRows     = await fetchGViz("🧳 Packing");
  const shoppingRows    = await fetchGViz("🛒 Shopping");
  const introvertRows   = await fetchGViz("🧠 Introvert");
  const timelineRows    = await fetchGViz("📅 Timeline");
  const placesRows      = await fetchGViz("🗺️ สถานที่ Durham");
  const contactsRows    = await fetchGViz("📞 Contact Directory");
  const checklistRows   = await fetchGViz("📋 Checklist");
  // Optional new tabs — return [] silently if tab doesn't exist yet
  const collegeAccomRows = await fetchGVizSafe("🏛️ College");
  const academicRows    = await fetchGVizSafe("🎓 Academic");
  const careerRows      = await fetchGVizSafe("💼 Career");
  const lifeukRows      = await fetchGVizSafe("📱 Life UK");
  const homeStatusRows  = await fetchGVizSafe("📊 Status");
  const priceCompRows   = await fetchGVizSafe("💰 เปรียบเทียบราคา");
  const accomRatingRows = await fetchGVizSafe("🏠 ที่พัก Rating");
  const expenseRows     = await fetchGVizSafe("💷 Expense Tracker");

  return {
    accom:           parseAccom(accomRows),
    colAccom:        parseCollegeAccom(collegeAccomRows),
    vaccines:        parseVaccines(vaccineRows),
    packing:         parsePacking(packingRows),
    shopping:        parseShopping(shoppingRows),
    introvert:       parseIntrovert(introvertRows),
    timeline:        parseTimeline(timelineRows),
    places:          parsePlaces(placesRows),
    contacts:        parseContacts(contactsRows),
    checklist:       parseChecklist(checklistRows),
    checklistGroups: parseChecklistGroups(checklistRows),
    academic:        parseFlat(academicRows),
    career:          parseFlat(careerRows),
    lifeuk:          parseFlat(lifeukRows),
    homeStatus:      parseFlat(homeStatusRows),
    priceComparison: parsePriceComparison(priceCompRows),
    accomRating:     parseAccomRating(accomRatingRows),
    sheetExpenses:   parseExpenseTracker(expenseRows),
  };
}
