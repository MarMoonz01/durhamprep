import { useState } from "react";

var CARD = {
  background: "var(--card)",
  borderRadius: 16,
  padding: 20,
  boxShadow: "var(--shadow)",
  border: "1px solid var(--border)",
  marginBottom: 12,
};

function ToggleSwitch({ on, onToggle }) {
  return (
    <button
      onClick={onToggle}
      style={{
        width: 52,
        height: 30,
        borderRadius: 99,
        border: "none",
        background: on ? "var(--primary)" : "var(--border)",
        cursor: "pointer",
        position: "relative",
        transition: "background 0.2s",
        flexShrink: 0,
      }}
    >
      <div
        style={{
          position: "absolute",
          top: 3,
          left: on ? 24 : 3,
          width: 24,
          height: 24,
          borderRadius: "50%",
          background: "#fff",
          boxShadow: "0 1px 4px rgba(0,0,0,0.25)",
          transition: "left 0.2s",
        }}
      />
    </button>
  );
}

function SectionCard({ title, children }) {
  return (
    <div style={CARD}>
      {title && (
        <div style={{ fontSize: 16, fontWeight: 700, color: "var(--text)", marginBottom: 14 }}>
          {title}
        </div>
      )}
      {children}
    </div>
  );
}

function getRateStatus(r) {
  if (r <= 42) return { icon: "🟢", label: "ดีมาก", color: "var(--success)" };
  if (r <= 43.5) return { icon: "🟡", label: "โอเค", color: "#F9A825" };
  if (r <= 45) return { icon: "🟠", label: "ปกติ", color: "var(--warning)" };
  return { icon: "🔴", label: "แพง", color: "var(--danger)" };
}

function getSheetsStatusInfo(status) {
  if (status === "ok") return { dot: "●", label: "Live", color: "var(--success)", bg: "var(--success-surface)" };
  if (status === "loading") return { dot: "○", label: "กำลังโหลด", color: "var(--text-sub)", bg: "var(--primary-surface)" };
  if (status === "error") return { dot: "⚠", label: "Error", color: "var(--danger)", bg: "var(--danger-surface)" };
  return { dot: "⚙", label: "ยังไม่ได้ตั้งค่า", color: "var(--text-sub)", bg: "var(--primary-surface)" };
}

export default function SettingsTab({ profile, updateProfile, dark, toggleDark, memo, setMemo, rate, sheetsStatus, SHEETS_URL, VISA_FUNDS_GBP, decision }) {
  var [ieltsHint, setIeltsHint] = useState(false);

  var visaFunds = VISA_FUNDS_GBP || 37579;
  var currentRate = typeof rate === "number" ? rate : 44;
  var rs = getRateStatus(currentRate);
  var ss = getSheetsStatusInfo(sheetsStatus);
  var ielts = decision && decision.ielts;

  return (
    <div style={{ padding: "16px 14px 100px", maxWidth: 560, margin: "0 auto" }}>

      {/* Header */}
      <div style={Object.assign({}, CARD, {
        background: "linear-gradient(135deg, var(--primary), var(--primary-mid))",
        border: "none",
        padding: "20px 20px",
      })}>
        <div style={{ fontSize: 22, fontWeight: 900, color: "#fff", marginBottom: 4 }}>
          ⚙️ Settings
        </div>
        <div style={{ fontSize: 13, color: "rgba(255,255,255,0.75)" }}>
          Durham Go v4 · 2026/27
        </div>
      </div>

      {/* Dark Mode */}
      <SectionCard title="">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
          <div>
            <div style={{ fontSize: 15, color: "var(--text)", fontWeight: 600 }}>🌙 Dark Mode</div>
            <div style={{ fontSize: 12, color: "var(--text-sub)", marginTop: 2 }}>
              {dark ? "โหมดกลางคืน" : "โหมดกลางวัน"}
            </div>
          </div>
          <ToggleSwitch on={dark} onToggle={toggleDark} />
        </div>
      </SectionCard>

      {/* Profile */}
      <SectionCard title="👤 Profile">
        {/* IELTS scores */}
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-sub)", marginBottom: 10, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span>IELTS Scores</span>
            <button
              onClick={function () { setIeltsHint(function (h) { return !h; }); }}
              style={{
                fontSize: 11, color: "var(--primary)", background: "var(--primary-surface)",
                border: "none", borderRadius: 99, padding: "2px 8px", cursor: "pointer",
              }}
            >
              เกณฑ์ Durham?
            </button>
          </div>

          {ieltsHint && (
            <div style={{ fontSize: 12, color: "var(--text-sub)", background: "var(--primary-surface)", borderRadius: "var(--radius-sm)", padding: "8px 12px", marginBottom: 10, lineHeight: 1.6 }}>
              Overall ≥ 7.0 · Writing ≥ 7.0 · Listening/Reading/Speaking ≥ 6.5
            </div>
          )}

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 8 }}>
            {[
              { key: "ieltsL", label: "Listening" },
              { key: "ieltsR", label: "Reading" },
              { key: "ieltsW", label: "Writing" },
              { key: "ieltsS", label: "Speaking" },
            ].map(function (field) {
              return (
                <div key={field.key}>
                  <div style={{ fontSize: 11, color: "var(--text-sub)", marginBottom: 4, textAlign: "center" }}>
                    {field.label}
                  </div>
                  <input
                    type="number"
                    min="0"
                    max="9"
                    step="0.5"
                    placeholder="0.0"
                    value={profile ? (profile[field.key] || "") : ""}
                    onChange={function (e) {
                      if (updateProfile) updateProfile(field.key, e.target.value);
                    }}
                    style={{
                      width: "100%",
                      padding: "10px 6px",
                      textAlign: "center",
                      borderRadius: "var(--radius-sm)",
                      border: "1px solid var(--border)",
                      background: "var(--bg)",
                      color: "var(--text)",
                      fontSize: 15,
                      fontWeight: 700,
                      boxSizing: "border-box",
                    }}
                  />
                </div>
              );
            })}
          </div>
        </div>

        {/* IELTS result badge */}
        {ielts && (
          <div
            style={{
              padding: "10px 14px",
              borderRadius: "var(--radius-sm)",
              background: ielts.bg || "var(--primary-surface)",
              border: "1px solid " + (ielts.color || "var(--primary)"),
              marginBottom: 14,
            }}
          >
            <div style={{ fontSize: 14, fontWeight: 800, color: ielts.color || "var(--primary)", marginBottom: 3 }}>
              {ielts.label}
            </div>
            <div style={{ fontSize: 13, color: "var(--text)" }}>{ielts.msg}</div>
          </div>
        )}

        {/* Accommodation preference */}
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-sub)", marginBottom: 10 }}>
            Accommodation Preference
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            {[
              { val: "balanced", label: "⚖️ Balanced" },
              { val: "privacy", label: "🔒 Privacy" },
              { val: "social", label: "👥 Social" },
            ].map(function (opt) {
              var isSelected = (profile && profile.preference) === opt.val;
              return (
                <button
                  key={opt.val}
                  onClick={function () {
                    if (updateProfile) updateProfile("preference", opt.val);
                  }}
                  style={{
                    flex: 1,
                    padding: "9px 6px",
                    borderRadius: "var(--radius-sm)",
                    border: isSelected ? "2px solid var(--primary)" : "2px solid var(--border)",
                    background: isSelected ? "var(--primary-surface)" : "var(--bg)",
                    color: isSelected ? "var(--primary)" : "var(--text-sub)",
                    fontSize: 12,
                    fontWeight: isSelected ? 700 : 500,
                    cursor: "pointer",
                    transition: "all 0.15s",
                  }}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Course start date */}
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-sub)", marginBottom: 6 }}>
            วันเริ่มเรียน (Course Start Date)
          </div>
          <input
            type="date"
            value={profile ? (profile.courseStart || "") : ""}
            onChange={function (e) {
              if (updateProfile) updateProfile("courseStart", e.target.value);
            }}
            style={{
              width: "100%",
              padding: "10px 12px",
              borderRadius: "var(--radius-sm)",
              border: "1px solid var(--border)",
              background: "var(--bg)",
              color: "var(--text)",
              fontSize: 14,
              boxSizing: "border-box",
            }}
          />
          <div style={{ fontSize: 12, color: "var(--text-sub)", marginTop: 4 }}>
            ค่า default: 28 Sep 2026 (LLM เริ่มต้นปกติ)
          </div>
        </div>
      </SectionCard>

      {/* Visa Funds */}
      <SectionCard title="💰 เงินค้ำวีซ่า">
        <div
          style={{
            background: "var(--primary-surface)",
            borderRadius: "var(--radius-sm)",
            padding: "16px 16px",
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: 13, color: "var(--text-sub)", marginBottom: 6 }}>
            ต้องมีในบัญชีครบ 28 วัน
          </div>
          <div style={{ fontSize: 26, fontWeight: 900, color: "var(--primary)", marginBottom: 4 }}>
            £{visaFunds.toLocaleString()}
          </div>
          <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text)" }}>
            ≈ ฿{Math.round(visaFunds * currentRate).toLocaleString()}
          </div>
          <div style={{ fontSize: 12, color: "var(--text-sub)", marginTop: 4 }}>
            ที่อัตรา £1 = ฿{currentRate.toFixed(2)}
          </div>
        </div>
      </SectionCard>

      {/* Exchange Rate */}
      <SectionCard title="💱 อัตราแลกเปลี่ยน">
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 22, fontWeight: 900, color: "var(--text)", marginBottom: 4 }}>
              £1 = ฿{currentRate.toFixed(2)}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ fontSize: 16 }}>{rs.icon}</span>
              <span style={{ fontSize: 14, fontWeight: 700, color: rs.color }}>
                {rs.label}
              </span>
            </div>
            <div style={{ fontSize: 12, color: "var(--text-sub)", marginTop: 4 }}>
              อัปเดตอัตโนมัติจาก exchangerate-api.com
            </div>
          </div>
          <div
            style={{
              width: 60,
              height: 60,
              borderRadius: "50%",
              background: "var(--primary-surface)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 28,
            }}
          >
            {rs.icon}
          </div>
        </div>
        <div style={{ marginTop: 12, borderTop: "1px solid var(--border)", paddingTop: 12 }}>
          <div style={{ fontSize: 12, color: "var(--text-sub)", lineHeight: 1.8 }}>
            🟢 ≤ ฿42 ดีมาก · 🟡 ≤ ฿43.5 โอเค · 🟠 ≤ ฿45 ปกติ · 🔴 &gt; ฿45 แพง
          </div>
        </div>
      </SectionCard>

      {/* Quick Memo */}
      <SectionCard title="📝 Quick Memo">
        <textarea
          value={memo || ""}
          onChange={function (e) {
            if (setMemo) setMemo(e.target.value);
          }}
          placeholder="บันทึกส่วนตัว... เช่น ลิงก์สำคัญ, ตัวเลข, to-do"
          style={{
            width: "100%",
            minHeight: 120,
            padding: "12px 12px",
            borderRadius: "var(--radius-sm)",
            border: "1px solid var(--border)",
            background: "var(--bg)",
            color: "var(--text)",
            fontSize: 14,
            resize: "vertical",
            boxSizing: "border-box",
            lineHeight: 1.6,
            fontFamily: "inherit",
          }}
        />
        <div style={{ fontSize: 12, color: "var(--text-sub)", marginTop: 4 }}>
          บันทึกอัตโนมัติใน localStorage
        </div>
      </SectionCard>

      {/* Google Sheets */}
      <SectionCard title="📊 Google Sheets">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text)" }}>สถานะ</div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "5px 12px",
              borderRadius: 99,
              background: ss.bg,
              color: ss.color,
              fontWeight: 700,
              fontSize: 13,
            }}
          >
            <span>{ss.dot}</span>
            <span>{ss.label}</span>
          </div>
        </div>

        {SHEETS_URL && (
          <a
            href={SHEETS_URL}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: "block",
              width: "100%",
              padding: "11px 0",
              textAlign: "center",
              background: "var(--primary-surface)",
              color: "var(--primary)",
              border: "1px solid var(--primary)",
              borderRadius: "var(--radius-sm)",
              fontWeight: 700,
              fontSize: 14,
              textDecoration: "none",
              marginBottom: 12,
              boxSizing: "border-box",
            }}
          >
            เปิด Google Sheets ↗
          </a>
        )}

        <div
          style={{
            fontSize: 12,
            color: "var(--text-sub)",
            background: "var(--bg)",
            borderRadius: "var(--radius-sm)",
            padding: "10px 12px",
            lineHeight: 1.7,
          }}
        >
          ตั้งค่า:{" "}
          <code style={{ fontSize: 11, background: "var(--border)", padding: "1px 5px", borderRadius: 4, color: "var(--text)" }}>
            VITE_GOOGLE_SHEETS_ID
          </code>{" "}
          ใน{" "}
          <code style={{ fontSize: 11, background: "var(--border)", padding: "1px 5px", borderRadius: 4, color: "var(--text)" }}>
            .env
          </code>
        </div>
      </SectionCard>

      {/* App Info */}
      <SectionCard title="ℹ️ App Info">
        <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
          {[
            { label: "เวอร์ชัน", val: "Durham Go v4" },
            { label: "อัปเดต", val: "มี.ค. 2026" },
            { label: "สร้างสำหรับ", val: "Pannathorn Sritongsuk" },
            { label: "สาขา", val: "LLM International Trade & Commercial Law" },
            { label: "มหาวิทยาลัย", val: "Durham University 2026/27" },
          ].map(function (row) {
            return (
              <div
                key={row.label}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  padding: "8px 0",
                  borderBottom: "1px solid var(--border)",
                  gap: 12,
                }}
              >
                <span style={{ fontSize: 13, color: "var(--text-sub)", flexShrink: 0 }}>{row.label}</span>
                <span style={{ fontSize: 13, color: "var(--text)", fontWeight: 600, textAlign: "right" }}>{row.val}</span>
              </div>
            );
          })}
        </div>
        <div
          style={{
            marginTop: 14,
            padding: "10px 12px",
            background: "var(--primary-surface)",
            borderRadius: "var(--radius-sm)",
            textAlign: "center",
            fontSize: 13,
            color: "var(--primary)",
            fontWeight: 700,
          }}
        >
          🎓 Durham University School of Law · LLM 2026/27
        </div>
      </SectionCard>
    </div>
  );
}

