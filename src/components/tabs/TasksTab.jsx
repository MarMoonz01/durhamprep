import { useState } from "react";

var CARD = {
  background: "var(--card)",
  borderRadius: 16,
  padding: 20,
  boxShadow: "var(--shadow)",
  border: "1px solid var(--border)",
  marginBottom: 12,
};

var riskColor = {
  high: "#C62828",
  medium: "#E65100",
  low: "#2E7D32",
};

var riskBg = {
  high: "#FFEBEE",
  medium: "#FFF3E0",
  low: "#E8F5E9",
};

export default function TasksTab({
  checklistGroups,
  checkGroups,
  checkDone,
  checkTotal,
  checked,
  toggle,
  deadlineMap,
  daysUntil,
  dynTimeline,
  nextActions,
  dark,
}) {
  var [subtab, setSubtab] = useState("checklist");
  var [collapsed, setCollapsed] = useState({});

  function toggleGroup(idx) {
    setCollapsed(function (prev) {
      return Object.assign({}, prev, { [idx]: !prev[idx] });
    });
  }

  var pct = checkTotal > 0 ? Math.round((checkDone / checkTotal) * 100) : 0;
  var done100 = pct === 100;

  return (
    <div style={{ padding: "16px 14px 100px", maxWidth: 560, margin: "0 auto" }}>
      {/* Sub-toggle */}
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
        {[
          { id: "checklist", label: "📋 Checklist" },
          { id: "timeline", label: "📅 Timeline" },
        ].map(function (t) {
          return (
            <button
              key={t.id}
              onClick={function () {
                setSubtab(t.id);
              }}
              style={{
                flex: 1,
                padding: "10px 0",
                border: "none",
                borderRadius: "calc(var(--radius) - 4px)",
                background: subtab === t.id ? "var(--primary)" : "transparent",
                color: subtab === t.id ? "#fff" : "var(--text-sub)",
                fontWeight: subtab === t.id ? 700 : 500,
                fontSize: 14,
                cursor: "pointer",
                transition: "all 0.2s",
              }}
            >
              {t.label}
            </button>
          );
        })}
      </div>

      {subtab === "checklist" && (
        <ChecklistView
          checkGroups={checkGroups}
          checkDone={checkDone}
          checkTotal={checkTotal}
          pct={pct}
          done100={done100}
          checked={checked}
          toggle={toggle}
          deadlineMap={deadlineMap}
          daysUntil={daysUntil}
          nextActions={nextActions}
          collapsed={collapsed}
          toggleGroup={toggleGroup}
        />
      )}

      {subtab === "timeline" && <TimelineView dynTimeline={dynTimeline} />}
    </div>
  );
}

function ChecklistView({
  checkGroups,
  checkDone,
  checkTotal,
  pct,
  done100,
  checked,
  toggle,
  deadlineMap,
  daysUntil,
  nextActions,
  collapsed,
  toggleGroup,
}) {
  return (
    <div>
      {/* Progress bar */}
      <div style={Object.assign({}, CARD, { marginBottom: 16 })}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 10,
          }}
        >
          <span style={{ fontSize: 15, fontWeight: 700, color: "var(--text)" }}>
            ✅ ความคืบหน้า
          </span>
          <span
            style={{
              fontSize: 15,
              fontWeight: 800,
              color: done100 ? "var(--success)" : "var(--primary)",
            }}
          >
            {checkDone}/{checkTotal}
          </span>
        </div>
        <div
          style={{
            height: 12,
            background: "var(--border)",
            borderRadius: 99,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              height: "100%",
              width: pct + "%",
              background: done100 ? "var(--success)" : "var(--primary)",
              borderRadius: 99,
              transition: "width 0.5s ease",
            }}
          />
        </div>
        <div
          style={{
            textAlign: "right",
            fontSize: 13,
            color: "var(--text-sub)",
            marginTop: 4,
          }}
        >
          {pct}%{done100 && " — เสร็จแล้ว! 🎉"}
        </div>
      </div>

      {/* Next Actions */}
      {nextActions && nextActions.length > 0 && (
        <div style={Object.assign({}, CARD, { marginBottom: 16 })}>
          <div
            style={{
              fontSize: 15,
              fontWeight: 700,
              color: "var(--text)",
              marginBottom: 12,
            }}
          >
            🎯 ทำก่อนเลย
          </div>
          {nextActions.slice(0, 3).map(function (a, i) {
            var col = riskColor[a.risk] || riskColor.medium;
            var bg = riskBg[a.risk] || riskBg.medium;
            return (
              <div
                key={a.id || i}
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 12,
                  padding: "10px 0",
                  borderBottom:
                    i < nextActions.length - 1
                      ? "1px solid var(--border)"
                      : "none",
                }}
              >
                <div
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: "50%",
                    background: bg,
                    color: col,
                    fontWeight: 900,
                    fontSize: 13,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                    border: "2px solid " + col,
                  }}
                >
                  {i + 1}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: 14,
                      fontWeight: 700,
                      color: "var(--text)",
                    }}
                  >
                    {a.task}
                  </div>
                  {a.sub && (
                    <div
                      style={{
                        fontSize: 12,
                        color: "var(--text-sub)",
                        marginTop: 2,
                      }}
                    >
                      {a.sub}
                    </div>
                  )}
                </div>
                {a.days != null && (
                  <div
                    style={{
                      fontSize: 12,
                      fontWeight: 700,
                      color: col,
                      background: bg,
                      padding: "3px 8px",
                      borderRadius: 99,
                      flexShrink: 0,
                      whiteSpace: "nowrap",
                    }}
                  >
                    {a.days} วัน
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Phase groups */}
      {checkGroups.map(function (g, idx) {
        var preDone = !!g[0];
        var phase = g[1];
        var color = g[2] || "var(--primary)";
        var items = g[3] || [];
        var doneCount = preDone
          ? items.length
          : items.filter(function (it) {
              return checked["check_" + it];
            }).length;
        var isCollapsed =
          collapsed[idx] !== undefined ? collapsed[idx] : preDone;

        return (
          <div key={idx} style={Object.assign({}, CARD, { padding: 0, overflow: "hidden" })}>
            {/* Group header */}
            <div
              onClick={function () {
                toggleGroup(idx);
              }}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "14px 16px",
                cursor: "pointer",
                userSelect: "none",
              }}
            >
              <span
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: "50%",
                  background: color,
                  flexShrink: 0,
                  display: "inline-block",
                }}
              />
              <span
                style={{
                  flex: 1,
                  fontSize: 15,
                  fontWeight: 700,
                  color: preDone ? "var(--text-sub)" : "var(--text)",
                  textDecoration: preDone ? "line-through" : "none",
                }}
              >
                {phase}
              </span>
              <span
                style={{
                  fontSize: 13,
                  color: doneCount === items.length ? "var(--success)" : "var(--text-sub)",
                  fontWeight: 600,
                }}
              >
                {doneCount}/{items.length}
              </span>
              <span
                style={{
                  fontSize: 13,
                  color: "var(--text-sub)",
                  marginLeft: 4,
                }}
              >
                {isCollapsed ? "▸" : "▾"}
              </span>
            </div>

            {/* Items */}
            {!isCollapsed && (
              <div style={{ borderTop: "1px solid var(--border)" }}>
                {items.map(function (item, ii) {
                  var key = "check_" + item;
                  var isChecked = preDone || !!checked[key];
                  var deadlineStr = deadlineMap && deadlineMap[item];
                  var days = deadlineStr ? daysUntil(deadlineStr) : null;
                  var showBadge = days != null && days <= 30;
                  var badgeColor =
                    days != null && days <= 14 ? "#C62828" : "#E65100";
                  var badgeBg =
                    days != null && days <= 14 ? "#FFEBEE" : "#FFF3E0";

                  return (
                    <div
                      key={ii}
                      onClick={
                        preDone
                          ? undefined
                          : function () {
                              toggle(key);
                            }
                      }
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 12,
                        padding: "11px 16px",
                        borderBottom:
                          ii < items.length - 1
                            ? "1px solid var(--border)"
                            : "none",
                        cursor: preDone ? "default" : "pointer",
                        background: isChecked
                          ? "var(--success-surface)"
                          : "transparent",
                        transition: "background 0.15s",
                      }}
                    >
                      <div
                        style={{
                          width: 20,
                          height: 20,
                          borderRadius: 6,
                          border: isChecked
                            ? "2px solid var(--success)"
                            : "2px solid var(--border)",
                          background: isChecked ? "var(--success)" : "transparent",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                          transition: "all 0.15s",
                        }}
                      >
                        {isChecked && (
                          <span style={{ color: "#fff", fontSize: 12, fontWeight: 900 }}>
                            ✓
                          </span>
                        )}
                      </div>
                      <span
                        style={{
                          flex: 1,
                          fontSize: 14,
                          color: isChecked ? "var(--text-sub)" : "var(--text)",
                          textDecoration: isChecked ? "line-through" : "none",
                          lineHeight: 1.4,
                        }}
                      >
                        {item}
                      </span>
                      {showBadge && !isChecked && (
                        <span
                          style={{
                            fontSize: 12,
                            fontWeight: 700,
                            color: badgeColor,
                            background: badgeBg,
                            padding: "2px 7px",
                            borderRadius: 99,
                            flexShrink: 0,
                            whiteSpace: "nowrap",
                          }}
                        >
                          {days} วัน
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function TimelineView({ dynTimeline }) {
  if (!dynTimeline || dynTimeline.length === 0) {
    return (
      <div style={CARD}>
        <p style={{ color: "var(--text-sub)", fontSize: 14, textAlign: "center" }}>
          ยังไม่มีข้อมูล Timeline — กรอกวันเริ่มเรียนใน Settings
        </p>
      </div>
    );
  }

  var nextUpcomingIdx = dynTimeline.findIndex(function (t) {
    return t.days > 0;
  });

  return (
    <div style={Object.assign({}, CARD, { padding: "20px 16px" })}>
      <div style={{ fontSize: 16, fontWeight: 700, color: "var(--text)", marginBottom: 20 }}>
        📅 Timeline สำคัญ
      </div>
      {dynTimeline.map(function (t, i) {
        var isPast = t.days <= 0;
        var isNext = i === nextUpcomingIdx;
        var col = isPast
          ? "var(--text-sub)"
          : riskColor[t.risk] || riskColor.medium;
        var dotBg = isPast ? "var(--border)" : riskBg[t.risk] || riskBg.medium;
        var isLast = i === dynTimeline.length - 1;

        return (
          <div
            key={t.key || i}
            style={{
              display: "flex",
              gap: 14,
              paddingBottom: isLast ? 0 : 4,
            }}
          >
            {/* Left: dot + line */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                width: 28,
                flexShrink: 0,
              }}
            >
              <div
                style={{
                  width: isNext ? 20 : 14,
                  height: isNext ? 20 : 14,
                  borderRadius: "50%",
                  background: isPast ? "var(--border)" : col,
                  border: isNext ? "3px solid " + col : "none",
                  boxShadow: isNext ? "0 0 0 4px " + dotBg : "none",
                  transition: "all 0.2s",
                  flexShrink: 0,
                  marginTop: isNext ? 2 : 5,
                }}
              />
              {!isLast && (
                <div
                  style={{
                    width: 2,
                    flex: 1,
                    minHeight: 32,
                    background: isPast ? "var(--border)" : "var(--primary-surface)",
                    marginTop: 4,
                    marginBottom: 4,
                    borderRadius: 1,
                  }}
                />
              )}
            </div>

            {/* Right: content */}
            <div
              style={{
                flex: 1,
                paddingBottom: isLast ? 0 : 20,
                background: isNext ? dotBg : "transparent",
                borderRadius: isNext ? "var(--radius-sm)" : 0,
                padding: isNext ? "10px 12px" : "3px 0 20px",
                marginBottom: isNext ? 8 : 0,
                border: isNext ? "1px solid " + col : "none",
              }}
            >
              <div
                style={{
                  fontSize: 12,
                  color: "var(--text-sub)",
                  marginBottom: 3,
                }}
              >
                {t.fmt}
              </div>
              <div
                style={{
                  fontSize: isNext ? 15 : 14,
                  fontWeight: isNext ? 800 : 600,
                  color: isPast ? "var(--text-sub)" : "var(--text)",
                }}
              >
                {t.label}
              </div>
              <div
                style={{
                  fontSize: 13,
                  color: isPast ? "var(--text-sub)" : col,
                  marginTop: 3,
                  fontWeight: 600,
                }}
              >
                {isPast
                  ? "ผ่านไปแล้ว"
                  : isNext
                  ? "⏰ อีก " + t.days + " วัน — ถัดไป"
                  : "อีก " + t.days + " วัน"}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
