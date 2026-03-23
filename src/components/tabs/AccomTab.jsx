import { useState } from "react";

var CARD = {
  background: "var(--card)",
  borderRadius: 16,
  padding: 20,
  boxShadow: "var(--shadow)",
  border: "1px solid var(--border)",
  marginBottom: 12,
};

function avg5(stars) {
  if (!stars) return 0;
  var vals = [stars.location, stars.clean, stars.facilities, stars.value, stars.safety].filter(
    function (v) {
      return typeof v === "number";
    }
  );
  if (!vals.length) return 0;
  return Math.round((vals.reduce(function (a, b) { return a + b; }, 0) / vals.length) * 10) / 10;
}

function StarRow({ val, size }) {
  size = size || 13;
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
    <span style={{ display: "inline-flex", alignItems: "center", gap: 1 }}>
      {out}
      <span style={{ fontSize: size - 2, color: "var(--text-sub)", marginLeft: 3 }}>{val}</span>
    </span>
  );
}

function SubToggle({ options, value, onChange }) {
  return (
    <div
      style={{
        display: "flex",
        background: "var(--primary-surface)",
        borderRadius: "var(--radius)",
        padding: 4,
        marginBottom: 16,
        gap: 4,
      }}
    >
      {options.map(function (opt) {
        return (
          <button
            key={opt.id}
            onClick={function () { onChange(opt.id); }}
            style={{
              flex: 1,
              padding: "9px 4px",
              border: "none",
              borderRadius: "calc(var(--radius) - 4px)",
              background: value === opt.id ? "var(--primary)" : "transparent",
              color: value === opt.id ? "#fff" : "var(--text-sub)",
              fontWeight: value === opt.id ? 700 : 500,
              fontSize: 13,
              cursor: "pointer",
              transition: "all 0.2s",
              whiteSpace: "nowrap",
            }}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

export default function AccomTab({
  accom,
  accomFull,
  colAccom,
  accomRating,
  priceComparison,
  rate,
  dark,
  profile,
  updateProfile,
  decision,
}) {
  var [subtab, setSubtab] = useState("private");

  var subtabOptions = [
    { id: "private", label: "🏠 Private" },
    { id: "college", label: "🏛️ College" },
    { id: "compare", label: "💰 Compare" },
  ];

  return (
    <div style={{ padding: "16px 14px 100px", maxWidth: 560, margin: "0 auto" }}>
      <SubToggle options={subtabOptions} value={subtab} onChange={setSubtab} />

      {subtab === "private" && (
        <PrivateView accom={accom} decision={decision} rate={rate} />
      )}
      {subtab === "college" && (
        <CollegeView colAccom={colAccom} />
      )}
      {subtab === "compare" && (
        <CompareView
          accomRating={accomRating}
          priceComparison={priceComparison}
          rate={rate}
        />
      )}
    </div>
  );
}

function PrivateView({ accom, decision, rate }) {
  var [openIdx, setOpenIdx] = useState(null);
  var [selectedRooms, setSelectedRooms] = useState({});

  function toggleCard(idx) {
    setOpenIdx(function (prev) { return prev === idx ? null : idx; });
  }

  function selectRoom(propName, roomId) {
    setSelectedRooms(function (prev) {
      return Object.assign({}, prev, { [propName]: roomId });
    });
  }

  var rec = decision && decision.accomRec;

  return (
    <div>
      {/* Recommendation */}
      {rec && (
        <div
          style={Object.assign({}, CARD, {
            background: rec.bg || "var(--primary-surface)",
            border: "1px solid " + (rec.color || "var(--primary)"),
            padding: "14px 16px",
          })}
        >
          <div style={{ fontSize: 12, fontWeight: 800, color: rec.color || "var(--primary)", marginBottom: 6 }}>
            🎯 แนะนำสำหรับคุณ
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 6 }}>
            <span
              style={{
                fontSize: 11,
                fontWeight: 700,
                background: rec.color || "var(--primary)",
                color: "#fff",
                padding: "2px 8px",
                borderRadius: 99,
              }}
            >
              {rec.badge}
            </span>
            <span style={{ fontSize: 15, fontWeight: 800, color: "var(--text)" }}>
              {rec.name}
            </span>
          </div>
          {rec.sub && (
            <div style={{ fontSize: 13, color: "var(--text-sub)", marginBottom: 4 }}>{rec.sub}</div>
          )}
          {rec.reason && (
            <div style={{ fontSize: 13, color: rec.color || "var(--primary)", fontWeight: 600 }}>
              {rec.reason}
            </div>
          )}
        </div>
      )}

      {/* Property cards */}
      {(accom || []).map(function (prop, idx) {
        var isOpen = openIdx === idx;
        var avgStars = avg5(prop.stars);
        var rooms = prop.rooms || [];
        var selRoomId = selectedRooms[prop.name] || (rooms[0] && rooms[0].id) || null;
        var selRoom = rooms.find(function (r) { return r.id === selRoomId; });
        var displayRoom = selRoom ? selRoom.room : prop.room;

        return (
          <div
            key={idx}
            style={Object.assign({}, CARD, { padding: 0, overflow: "hidden" })}
          >
            {/* Collapsed header */}
            <div
              onClick={function () { toggleCard(idx); }}
              style={{
                padding: "14px 16px",
                cursor: "pointer",
                userSelect: "none",
              }}
            >
              <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 4 }}>
                    {prop.badge && (
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 700,
                          background: prop.color || "var(--primary)",
                          color: "#fff",
                          padding: "2px 8px",
                          borderRadius: 99,
                        }}
                      >
                        {prop.badge}
                      </span>
                    )}
                    <span style={{ fontSize: 15, fontWeight: 800, color: "var(--text)" }}>
                      {prop.name}
                    </span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                    <span style={{ fontSize: 13, color: "var(--text-sub)" }}>
                      {prop.dist}
                    </span>
                    {displayRoom && (
                      <span style={{ fontSize: 13, color: "var(--text-sub)" }}>
                        · dep: £{displayRoom.dep || prop.room && prop.room.dep || "—"}
                      </span>
                    )}
                    <StarRow val={avgStars} size={12} />
                  </div>
                </div>
                <div style={{ textAlign: "right", flexShrink: 0 }}>
                  {displayRoom && (
                    <>
                      <div style={{ fontSize: 17, fontWeight: 900, color: "var(--primary)" }}>
                        £{displayRoom.pw || (prop.room && prop.room.pw)}
                      </div>
                      <div style={{ fontSize: 12, color: "var(--text-sub)" }}>/wk</div>
                    </>
                  )}
                  <div style={{ fontSize: 13, color: "var(--text-sub)", marginTop: 2 }}>
                    {isOpen ? "▾" : "▸"}
                  </div>
                </div>
              </div>
            </div>

            {/* Expanded content */}
            {isOpen && (
              <div style={{ borderTop: "1px solid var(--border)", padding: "16px 16px" }}>
                {/* Room chips */}
                {rooms.length > 0 && (
                  <div style={{ marginBottom: 14 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-sub)", marginBottom: 8 }}>
                      ประเภทห้อง
                    </div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                      {rooms.map(function (r) {
                        var isSelected = selRoomId === r.id;
                        return (
                          <button
                            key={r.id}
                            onClick={function () { selectRoom(prop.name, r.id); }}
                            style={{
                              padding: "6px 12px",
                              borderRadius: 99,
                              border: isSelected
                                ? "2px solid " + (prop.color || "var(--primary)")
                                : "2px solid var(--border)",
                              background: isSelected
                                ? (prop.bg || "var(--primary-surface)")
                                : "var(--card)",
                              color: isSelected
                                ? (prop.color || "var(--primary)")
                                : "var(--text-sub)",
                              fontSize: 13,
                              fontWeight: isSelected ? 700 : 500,
                              cursor: "pointer",
                              transition: "all 0.15s",
                            }}
                          >
                            {r.room.name} £{r.room.pw}/wk
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Specs grid */}
                {displayRoom && (
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr 1fr",
                      gap: 8,
                      marginBottom: 14,
                    }}
                  >
                    {[
                      { label: "Size", val: displayRoom.size || "—" },
                      { label: "Bed", val: displayRoom.bed || "—" },
                      { label: "Distance", val: prop.dist ? prop.dist.split(" ")[0] + " " + prop.dist.split(" ")[1] : "—" },
                    ].map(function (s) {
                      return (
                        <div
                          key={s.label}
                          style={{
                            background: "var(--primary-surface)",
                            borderRadius: "var(--radius-sm)",
                            padding: "10px 8px",
                            textAlign: "center",
                          }}
                        >
                          <div style={{ fontSize: 13, fontWeight: 800, color: "var(--primary)" }}>
                            {s.val}
                          </div>
                          <div style={{ fontSize: 11, color: "var(--text-sub)", marginTop: 2 }}>
                            {s.label}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Star ratings */}
                {prop.stars && (
                  <div style={{ marginBottom: 14 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-sub)", marginBottom: 8 }}>
                      คะแนนรีวิว
                    </div>
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr",
                        gap: 6,
                      }}
                    >
                      {[
                        { key: "location", label: "📍 ทำเล" },
                        { key: "clean", label: "🧹 ความสะอาด" },
                        { key: "facilities", label: "🏢 สิ่งอำนวยฯ" },
                        { key: "value", label: "💰 ความคุ้มค่า" },
                        { key: "safety", label: "🔒 ความปลอดภัย" },
                      ].map(function (cat) {
                        return (
                          <div
                            key={cat.key}
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                              padding: "6px 0",
                              borderBottom: "1px solid var(--border)",
                            }}
                          >
                            <span style={{ fontSize: 12, color: "var(--text)" }}>{cat.label}</span>
                            <StarRow val={prop.stars[cat.key] || 0} size={11} />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Room has */}
                {prop.roomHas && prop.roomHas.length > 0 && (
                  <div style={{ marginBottom: 14 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-sub)", marginBottom: 6 }}>
                      ในห้อง
                    </div>
                    {prop.roomHas.map(function (item, i) {
                      return (
                        <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 6, padding: "4px 0", fontSize: 13, color: "var(--text)" }}>
                          <span>💡</span>
                          <span>{item}</span>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Facilities */}
                {prop.facilities && prop.facilities.length > 0 && (
                  <div style={{ marginBottom: 14 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-sub)", marginBottom: 6 }}>
                      สิ่งอำนวยความสะดวก
                    </div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                      {prop.facilities.map(function (f, i) {
                        return (
                          <span
                            key={i}
                            style={{
                              fontSize: 12,
                              background: "var(--primary-surface)",
                              color: "var(--primary)",
                              padding: "4px 10px",
                              borderRadius: 99,
                            }}
                          >
                            🏢 {f}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Pros & Cons */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
                  {prop.pros && prop.pros.length > 0 && (
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: "var(--success)", marginBottom: 6 }}>
                        ข้อดี
                      </div>
                      {prop.pros.map(function (p, i) {
                        return (
                          <div key={i} style={{ fontSize: 12, color: "var(--text)", padding: "3px 0", display: "flex", gap: 5 }}>
                            <span>✅</span>
                            <span>{p}</span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                  {prop.cons && prop.cons.length > 0 && (
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: "var(--warning)", marginBottom: 6 }}>
                        ข้อเสีย
                      </div>
                      {prop.cons.map(function (c, i) {
                        return (
                          <div key={i} style={{ fontSize: 12, color: "var(--text)", padding: "3px 0", display: "flex", gap: 5 }}>
                            <span>⚠️</span>
                            <span>{c}</span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Booking links */}
                <div style={{ display: "flex", gap: 8 }}>
                  <a
                    href="#"
                    style={{
                      flex: 1,
                      display: "block",
                      padding: "10px 0",
                      textAlign: "center",
                      background: "var(--primary)",
                      color: "#fff",
                      borderRadius: "var(--radius-sm)",
                      fontSize: 13,
                      fontWeight: 700,
                      textDecoration: "none",
                    }}
                  >
                    Uhomes ↗
                  </a>
                  <a
                    href="#"
                    style={{
                      flex: 1,
                      display: "block",
                      padding: "10px 0",
                      textAlign: "center",
                      background: "var(--primary-surface)",
                      color: "var(--primary)",
                      border: "1px solid var(--primary)",
                      borderRadius: "var(--radius-sm)",
                      fontSize: 13,
                      fontWeight: 700,
                      textDecoration: "none",
                    }}
                  >
                    Casita ↗
                  </a>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function CollegeView({ colAccom }) {
  var [openIdx, setOpenIdx] = useState(null);

  function toggleCard(idx) {
    setOpenIdx(function (prev) { return prev === idx ? null : idx; });
  }

  return (
    <div>
      {(colAccom || []).map(function (col, idx) {
        var isOpen = openIdx === idx;
        var minPw = col.rooms && col.rooms.length
          ? Math.min.apply(null, col.rooms.map(function (r) { return r.pw; }))
          : null;

        return (
          <div
            key={idx}
            style={Object.assign({}, CARD, { padding: 0, overflow: "hidden" })}
          >
            <div
              onClick={function () { toggleCard(idx); }}
              style={{ padding: "14px 16px", cursor: "pointer", userSelect: "none" }}
            >
              <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", marginBottom: 4 }}>
                    {col.badge && (
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 700,
                          background: col.color || "var(--primary)",
                          color: "#fff",
                          padding: "2px 8px",
                          borderRadius: 99,
                        }}
                      >
                        {col.badge}
                      </span>
                    )}
                    <span style={{ fontSize: 15, fontWeight: 800, color: "var(--text)" }}>
                      {col.name}
                    </span>
                  </div>
                  <div style={{ fontSize: 13, color: "var(--text-sub)", marginBottom: 3 }}>
                    {col.forWho} · {col.dist}
                  </div>
                  {col.why && (
                    <div
                      style={{
                        fontSize: 13,
                        color: "var(--text)",
                        overflow: "hidden",
                        display: "-webkit-box",
                        WebkitLineClamp: isOpen ? "unset" : 1,
                        WebkitBoxOrient: "vertical",
                      }}
                    >
                      {col.why}
                    </div>
                  )}
                </div>
                <div style={{ textAlign: "right", flexShrink: 0 }}>
                  {minPw && (
                    <>
                      <div style={{ fontSize: 16, fontWeight: 900, color: "var(--primary)" }}>
                        £{minPw}+
                      </div>
                      <div style={{ fontSize: 11, color: "var(--text-sub)" }}>/wk</div>
                    </>
                  )}
                  <div style={{ fontSize: 13, color: "var(--text-sub)", marginTop: 4 }}>
                    {isOpen ? "▾" : "▸"}
                  </div>
                </div>
              </div>
            </div>

            {isOpen && (
              <div style={{ borderTop: "1px solid var(--border)", padding: "16px 16px" }}>
                {/* Room table */}
                {col.rooms && col.rooms.length > 0 && (
                  <div style={{ marginBottom: 14, overflowX: "auto" }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-sub)", marginBottom: 8 }}>
                      ประเภทห้อง
                    </div>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                      <thead>
                        <tr style={{ background: "var(--primary-surface)" }}>
                          {["ห้อง", "£/wk", "สัปดาห์", "Bills", "เตียง", "ห้องน้ำ"].map(function (h) {
                            return (
                              <th
                                key={h}
                                style={{
                                  padding: "7px 8px",
                                  textAlign: "left",
                                  color: "var(--primary)",
                                  fontWeight: 700,
                                  whiteSpace: "nowrap",
                                }}
                              >
                                {h}
                              </th>
                            );
                          })}
                        </tr>
                      </thead>
                      <tbody>
                        {col.rooms.map(function (r, ri) {
                          return (
                            <tr
                              key={ri}
                              style={{
                                borderTop: "1px solid var(--border)",
                                background: ri % 2 === 0 ? "transparent" : "var(--bg)",
                              }}
                            >
                              <td style={{ padding: "8px 8px", color: "var(--text)", fontWeight: 600 }}>{r.type}</td>
                              <td style={{ padding: "8px 8px", color: "var(--primary)", fontWeight: 800 }}>£{r.pw}</td>
                              <td style={{ padding: "8px 8px", color: "var(--text-sub)" }}>{r.wk}</td>
                              <td style={{ padding: "8px 8px", color: "var(--success)", fontWeight: 600 }}>{r.bills}</td>
                              <td style={{ padding: "8px 8px", color: "var(--text-sub)" }}>{r.bed}</td>
                              <td style={{ padding: "8px 8px", color: "var(--text-sub)" }}>{r.bath}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Features */}
                {col.features && col.features.length > 0 && (
                  <div style={{ marginBottom: 12 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-sub)", marginBottom: 6 }}>
                      สิ่งอำนวยความสะดวก
                    </div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                      {col.features.map(function (f, fi) {
                        return (
                          <span
                            key={fi}
                            style={{
                              fontSize: 12,
                              background: col.bg || "var(--primary-surface)",
                              color: col.color || "var(--primary)",
                              padding: "4px 10px",
                              borderRadius: 99,
                            }}
                          >
                            {f}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Note */}
                {col.note && (
                  <div
                    style={{
                      fontSize: 13,
                      color: col.color || "var(--primary)",
                      background: col.bg || "var(--primary-surface)",
                      padding: "10px 12px",
                      borderRadius: "var(--radius-sm)",
                      fontWeight: 600,
                    }}
                  >
                    {col.note}
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function CompareView({ accomRating, priceComparison, rate }) {
  var hasRating = accomRating && accomRating.headers && accomRating.headers.length > 0;
  var hasPrices = priceComparison && priceComparison.length > 0;

  return (
    <div>
      {/* Quick booking links */}
      <div
        style={Object.assign({}, CARD, {
          display: "flex",
          gap: 8,
          flexWrap: "wrap",
          padding: "14px 16px",
        })}
      >
        {[
          { label: "Casita ↗", href: "#" },
          { label: "Uhomes ↗", href: "#" },
          { label: "Durhomes ↗", href: "#" },
        ].map(function (link) {
          return (
            <a
              key={link.label}
              href={link.href}
              style={{
                flex: 1,
                minWidth: 80,
                display: "block",
                padding: "10px 0",
                textAlign: "center",
                background: "var(--primary-surface)",
                color: "var(--primary)",
                border: "1px solid var(--primary)",
                borderRadius: "var(--radius-sm)",
                fontSize: 13,
                fontWeight: 700,
                textDecoration: "none",
              }}
            >
              {link.label}
            </a>
          );
        })}
      </div>

      {/* Exchange rate note */}
      <div
        style={Object.assign({}, CARD, {
          padding: "12px 16px",
          display: "flex",
          alignItems: "center",
          gap: 8,
        })}
      >
        <span style={{ fontSize: 13, color: "var(--text-sub)" }}>
          💱 £1 ={" "}
          <strong style={{ color: "var(--text)" }}>฿{typeof rate === "number" ? rate.toFixed(2) : rate}</strong>{" "}
          · อัปเดตอัตโนมัติ
        </span>
      </div>

      {/* Rating table */}
      {hasRating && (
        <div style={Object.assign({}, CARD, { padding: 0, overflow: "hidden" })}>
          <div style={{ padding: "14px 16px", borderBottom: "1px solid var(--border)" }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text)" }}>
              ตารางเปรียบเทียบคะแนน
            </div>
          </div>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
              <thead>
                <tr style={{ background: "var(--primary-surface)" }}>
                  {accomRating.headers.map(function (h, i) {
                    return (
                      <th
                        key={i}
                        style={{
                          padding: "8px 10px",
                          textAlign: "left",
                          color: "var(--primary)",
                          fontWeight: 700,
                          whiteSpace: "nowrap",
                        }}
                      >
                        {h}
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {accomRating.rows.map(function (row, ri) {
                  return (
                    <tr
                      key={ri}
                      style={{
                        borderTop: "1px solid var(--border)",
                        background: ri % 2 === 0 ? "transparent" : "var(--bg)",
                      }}
                    >
                      {row.map(function (cell, ci) {
                        return (
                          <td
                            key={ci}
                            style={{
                              padding: "8px 10px",
                              color: ci === 0 ? "var(--text)" : "var(--text-sub)",
                              fontWeight: ci === 0 ? 600 : 400,
                              whiteSpace: "nowrap",
                            }}
                          >
                            {cell}
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

      {/* Price comparison table */}
      {hasPrices && (
        <div style={Object.assign({}, CARD, { padding: 0, overflow: "hidden" })}>
          <div style={{ padding: "14px 16px", borderBottom: "1px solid var(--border)" }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text)" }}>
              เปรียบเทียบราคา (£/wk)
            </div>
          </div>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
              <thead>
                <tr style={{ background: "var(--primary-surface)" }}>
                  {["ที่พัก", "Direct", "Uhomes", "Casita", "หมายเหตุ"].map(function (h) {
                    return (
                      <th
                        key={h}
                        style={{
                          padding: "8px 10px",
                          textAlign: "left",
                          color: "var(--primary)",
                          fontWeight: 700,
                          whiteSpace: "nowrap",
                        }}
                      >
                        {h}
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {priceComparison.map(function (item, ri) {
                  var vals = [item.direct, item.uhomes, item.casita].filter(function (v) {
                    return v != null;
                  });
                  var minVal = vals.length ? Math.min.apply(null, vals) : null;

                  function cellStyle(val) {
                    var isMin = val != null && val === minVal;
                    return {
                      padding: "8px 10px",
                      color: isMin ? "var(--success)" : "var(--text-sub)",
                      fontWeight: isMin ? 800 : 400,
                      background: isMin ? "var(--success-surface)" : "transparent",
                      whiteSpace: "nowrap",
                    };
                  }

                  return (
                    <tr
                      key={ri}
                      style={{ borderTop: "1px solid var(--border)", background: ri % 2 === 0 ? "transparent" : "var(--bg)" }}
                    >
                      <td style={{ padding: "8px 10px", color: "var(--text)", fontWeight: 600 }}>
                        {item.name}
                      </td>
                      <td style={cellStyle(item.direct)}>
                        {item.direct != null ? "£" + item.direct : "—"}
                      </td>
                      <td style={cellStyle(item.uhomes)}>
                        {item.uhomes != null ? "£" + item.uhomes : "—"}
                      </td>
                      <td style={cellStyle(item.casita)}>
                        {item.casita != null ? "£" + item.casita : "—"}
                      </td>
                      <td style={{ padding: "8px 10px", color: "var(--text-sub)" }}>
                        {item.note || "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* No data fallback */}
      {!hasRating && !hasPrices && (
        <div style={Object.assign({}, CARD, { textAlign: "center", padding: 32 })}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>📊</div>
          <div style={{ fontSize: 14, color: "var(--text-sub)" }}>
            กำลังโหลดข้อมูล — เชื่อม Google Sheets เพื่อดูตาราง
          </div>
        </div>
      )}
    </div>
  );
}
