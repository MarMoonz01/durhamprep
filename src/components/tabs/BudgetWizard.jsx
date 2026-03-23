import { useState } from 'react';

// ─── helpers ────────────────────────────────────────────────────────────────

function fmt(n) {
  return Math.round(n).toLocaleString();
}

function fmtGBP(n) {
  return '£' + fmt(n);
}

function fmtTHB(n, rate) {
  return '฿' + fmt(n * rate);
}

function itemEmoji(name) {
  var n = name.toLowerCase();
  if (n.includes('tuition') || n.includes('llm')) return '🎓';
  if (n.includes('pre-sess') || n.includes('presess')) return '📚';
  if (n.includes('visa')) return '🛂';
  if (n.includes('ihs') || n.includes('health surcharge')) return '🏥';
  if (n.includes('tb') || n.includes('test')) return '🔬';
  if (n.includes('วัคซีน') || n.includes('vaccine') || n.includes('mmr') || n.includes('men')) return '💉';
  if (n.includes('ตั๋ว') || n.includes('flight') || n.includes('bkk')) return '✈️';
  return '🧳';
}

function StarRow({ label, value }) {
  var full = Math.floor(value);
  var half = value % 1 >= 0.5;
  var stars = '';
  for (var i = 0; i < full; i++) stars += '★';
  if (half) stars += '½';
  var empty = 5 - full - (half ? 1 : 0);
  for (var j = 0; j < empty; j++) stars += '☆';
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
      <span style={{ color: 'var(--text-sub)' }}>{label}</span>
      <span style={{ color: '#F59E0B' }}>{stars} <span style={{ color: 'var(--text)', fontWeight: 600 }}>{value}</span></span>
    </div>
  );
}

// ─── SheetsStatusBadge ──────────────────────────────────────────────────────

function SheetsStatusBadge({ sheetsStatus, SHEETS_URL }) {
  if (sheetsStatus === 'not-configured') return null;
  var cfg = {
    ok:       { bg: '#E8F5E9', color: '#2E7D32', icon: '✅', text: 'Google Sheets เชื่อมต่อแล้ว' },
    loading:  { bg: '#E3F2FD', color: '#1565C0', icon: '⏳', text: 'กำลังโหลดข้อมูล…' },
    error:    { bg: '#FFF3E0', color: '#E65100', icon: '⚠️', text: 'โหลด Sheets ไม่สำเร็จ (ใช้ข้อมูลสำรอง)' },
  };
  var s = cfg[sheetsStatus] || cfg.error;
  return (
    <div style={{
      background: s.bg, color: s.color, borderRadius: 10, padding: '8px 14px',
      fontSize: 13, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8,
    }}>
      <span>{s.icon}</span>
      <span>{s.text}</span>
      {SHEETS_URL && sheetsStatus === 'ok' && (
        <a href={SHEETS_URL} target="_blank" rel="noreferrer" style={{ color: s.color, marginLeft: 'auto', fontSize: 12 }}>
          เปิด Sheets ↗
        </a>
      )}
    </div>
  );
}

// ─── StepIndicator ──────────────────────────────────────────────────────────

function StepIndicator({ step, setStep }) {
  var labels = ['Fixed', 'Accom', 'Living', 'Extra', 'Income', '📊'];
  var last = labels.length - 1;
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 24, flexWrap: 'nowrap', gap: 0 }}>
      {labels.map(function (label, i) {
        var isDone = i < step;
        var isCurrent = i === step;
        var circleColor = isDone ? 'var(--success)' : isCurrent ? 'var(--primary)' : 'var(--border)';
        var textColor = isDone || isCurrent ? '#fff' : 'var(--text-sub)';
        var cursor = isDone ? 'pointer' : 'default';
        return (
          <div key={i} style={{ display: 'flex', alignItems: 'center' }}>
            <div
              onClick={function () { if (isDone) setStep(i); }}
              style={{
                width: 34, height: 34, borderRadius: '50%',
                background: circleColor,
                color: textColor,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 700, fontSize: i === last ? 15 : 13,
                cursor: cursor,
                flexShrink: 0,
                transition: 'background 0.2s',
              }}
            >
              {i === last ? '📊' : i + 1}
            </div>
            {i < last && (
              <div style={{ width: 20, height: 2, background: i < step ? 'var(--success)' : 'var(--border)', flexShrink: 0 }} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Step 1: Fixed Costs ─────────────────────────────────────────────────────

function ItemList({ items, rate }) {
  var cardStyle = { background: 'var(--card)', borderRadius: 16, padding: 20, boxShadow: 'var(--shadow)', marginBottom: 12 };
  return (
    <div style={cardStyle}>
      {items.map(function (item, idx) {
        return (
          <div key={idx} style={{
            display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
            padding: '10px 0',
            borderBottom: idx < items.length - 1 ? '1px solid var(--border)' : 'none',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 0 }}>
              <span style={{ fontSize: 20, flexShrink: 0 }}>{itemEmoji(item.name)}</span>
              <div>
                <div style={{ fontSize: 14, color: 'var(--text)', wordBreak: 'break-word' }}>{item.name}</div>
                {item.note && <div style={{ fontSize: 11, color: 'var(--text-sub)', marginTop: 2 }}>{item.note}</div>}
              </div>
            </div>
            <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: 12 }}>
              <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--text)' }}>{fmtGBP(item.amount)}</div>
              <div style={{ fontSize: 12, color: 'var(--text-sub)' }}>{fmtTHB(item.amount, rate)}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function StepFixed({ budgetData, rate, onNext }) {
  var fc = budgetData.fixedCosts;
  var tuitionTotal = fc.tuition.reduce(function (s, i) { return s + i.amount; }, 0);
  var visaTotal = fc.visa.reduce(function (s, i) { return s + i.amount; }, 0);
  var fixedTotal = tuitionTotal + visaTotal;
  var vf = fc.visaFunds;
  var sectionHead = { fontWeight: 700, fontSize: 13, color: 'var(--text-sub)', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8, marginTop: 4 };
  var subtotalRow = {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    marginTop: 8, paddingTop: 8, borderTop: '1px solid var(--border)',
  };

  return (
    <div>
      <div style={{ marginBottom: 4, fontSize: 20, fontWeight: 700, color: 'var(--text)' }}>
        🔒 Fixed Costs — ก่อนออกเดินทาง
      </div>
      <div style={{ fontSize: 14, color: 'var(--text-sub)', marginBottom: 20 }}>
        ค่าใช้จ่ายที่เลี่ยงไม่ได้ ปรับเปลี่ยนไม่ได้
      </div>

      {/* Tuition group */}
      <div style={sectionHead}>🎓 ค่าเรียน (Tuition)</div>
      <ItemList items={fc.tuition} rate={rate} />

      {/* Visa group */}
      <div style={sectionHead}>🛂 วีซ่า & สุขภาพ</div>
      <ItemList items={fc.visa} rate={rate} />

      {/* Grand total */}
      <div style={{ background: 'var(--card)', borderRadius: 16, padding: 20, boxShadow: 'var(--shadow)', marginBottom: 12 }}>
        <div style={subtotalRow}>
          <span style={{ fontSize: 13, color: 'var(--text-sub)' }}>ค่าเรียนรวม</span>
          <span style={{ fontWeight: 600 }}>{fmtGBP(tuitionTotal)}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 6 }}>
          <span style={{ fontSize: 13, color: 'var(--text-sub)' }}>วีซ่า & สุขภาพรวม</span>
          <span style={{ fontWeight: 600 }}>{fmtGBP(visaTotal)}</span>
        </div>
        <div style={{ marginTop: 12, borderTop: '2px solid var(--border)', paddingTop: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontWeight: 700, fontSize: 16, color: 'var(--text)' }}>รวม Fixed Costs</span>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontWeight: 700, fontSize: 18, color: 'var(--primary)' }}>{fmtGBP(fixedTotal)}</div>
            <div style={{ fontSize: 13, color: 'var(--text-sub)' }}>{fmtTHB(fixedTotal, rate)}</div>
          </div>
        </div>
      </div>

      {/* Visa Funds info box — informational only, NOT in grand total */}
      <div style={{
        background: '#E3F2FD', borderRadius: 14, padding: 16, marginBottom: 16,
        border: '1px solid #90CAF9',
      }}>
        <div style={{ fontWeight: 700, fontSize: 14, color: '#1565C0', marginBottom: 8 }}>
          🏦 Visa Funds — ต้องมีในบัญชี (ไม่นับใน Grand Total)
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
          <span style={{ color: '#1565C0' }}>Tuition (LLM)</span>
          <span style={{ fontWeight: 600, color: '#1565C0' }}>{fmtGBP(vf.tuition)}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
          <span style={{ color: '#1565C0' }}>Pre-sessional Tuition</span>
          <span style={{ fontWeight: 600, color: '#1565C0' }}>{fmtGBP(vf.preSess)}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 8 }}>
          <span style={{ color: '#1565C0' }}>UKVI Maintenance (9 เดือน)</span>
          <span style={{ fontWeight: 600, color: '#1565C0' }}>{fmtGBP(vf.maintenance)}</span>
        </div>
        <div style={{ borderTop: '1px solid #90CAF9', paddingTop: 8, display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ fontWeight: 700, fontSize: 15, color: '#0D47A1' }}>ยอดรวมที่ต้องแสดง</span>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontWeight: 700, fontSize: 17, color: '#0D47A1' }}>{fmtGBP(vf.total)}</div>
            <div style={{ fontSize: 11, color: '#1565C0', marginTop: 2 }}>{vf.note}</div>
          </div>
        </div>
      </div>

      <button onClick={onNext} style={{
        marginTop: 8, width: '100%', padding: '14px 0', borderRadius: 12,
        background: 'var(--primary)', color: '#fff', border: 'none',
        fontWeight: 700, fontSize: 16, cursor: 'pointer',
      }}>
        ถัดไป: เลือกที่พัก →
      </button>
    </div>
  );
}

// ─── Step 2: Accommodation ───────────────────────────────────────────────────

function StepAccom({ budgetData, accom, accomFull, rate, selectedPropName, setSelectedPropName, selectedRoomId, setSelectedRoomId, onNext }) {
  var [expandedProp, setExpandedProp] = useState(null);
  var preSess = budgetData.fixedCosts.accommodation[0];

  // Group accomFull by propName preserving order of first appearance
  var propOrder = [];
  var grouped = {};
  accomFull.forEach(function (unit) {
    if (!grouped[unit.propName]) {
      grouped[unit.propName] = [];
      propOrder.push(unit.propName);
    }
    grouped[unit.propName].push(unit);
  });

  function toggleExpand(propName) {
    setExpandedProp(expandedProp === propName ? null : propName);
  }

  function getPropMeta(propName) {
    return accom.find(function (a) { return a.name === propName; }) || null;
  }

  var cardStyle = { background: 'var(--card)', borderRadius: 16, boxShadow: 'var(--shadow)', marginBottom: 12, overflow: 'hidden' };

  return (
    <div>
      <div style={{ marginBottom: 4, fontSize: 20, fontWeight: 700, color: 'var(--text)' }}>
        🏠 เลือกที่พัก
      </div>
      <div style={{ fontSize: 14, color: 'var(--text-sub)', marginBottom: 20 }}>
        เลือกห้องที่ใช่สำหรับปีการศึกษา 2026/27
      </div>

      {propOrder.map(function (propName) {
        var units = grouped[propName];
        var meta = getPropMeta(propName);
        var isExpanded = expandedProp === propName;
        var propSelected = selectedPropName === propName;
        var repUnit = units[0];
        var badge = repUnit.badge || '';
        var badgeColor = repUnit.color || 'var(--primary)';
        var badgeBg = repUnit.bg || '#E3F2FD';

        return (
          <div key={propName} style={cardStyle}>
            {/* Header row */}
            <div
              onClick={function () { toggleExpand(propName); }}
              style={{ padding: 16, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12 }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                {badge && (
                  <span style={{
                    fontSize: 11, fontWeight: 700, background: badgeBg, color: badgeColor,
                    borderRadius: 6, padding: '2px 8px', marginRight: 8,
                  }}>
                    {badge}
                  </span>
                )}
                <span style={{ fontWeight: 700, fontSize: 15, color: 'var(--text)' }}>{propName}</span>
                <div style={{ fontSize: 12, color: 'var(--text-sub)', marginTop: 2 }}>
                  {repUnit.dist || ''} · จาก {fmtGBP(repUnit.room.pw)}/wk
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6, flexShrink: 0 }}>
                {propSelected ? (
                  <span style={{
                    fontSize: 12, background: '#E8F5E9', color: '#2E7D32',
                    borderRadius: 20, padding: '4px 12px', fontWeight: 600,
                  }}>
                    ✅ เลือกแล้ว
                  </span>
                ) : (
                  <span style={{ fontSize: 12, color: 'var(--text-sub)' }}>
                    {isExpanded ? '▲' : '▼'}
                  </span>
                )}
              </div>
            </div>

            {/* Expanded content */}
            {isExpanded && (
              <div style={{ padding: '0 16px 16px' }}>
                {/* Room chips */}
                <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 8, marginBottom: 12 }}>
                  {units.map(function (unit) {
                    var isSelected = selectedRoomId === unit.id;
                    return (
                      <button
                        key={unit.id}
                        onClick={function () {
                          setSelectedRoomId(unit.id);
                          setSelectedPropName(propName);
                        }}
                        style={{
                          flexShrink: 0, padding: '8px 14px', borderRadius: 20,
                          border: '2px solid ' + (isSelected ? 'var(--primary)' : 'var(--border)'),
                          background: isSelected ? 'var(--primary)' : 'var(--card)',
                          color: isSelected ? '#fff' : 'var(--text)',
                          cursor: 'pointer', fontSize: 13, fontWeight: isSelected ? 700 : 400,
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {unit.room.name} · {fmtGBP(unit.room.pw)}/wk
                      </button>
                    );
                  })}
                </div>

                {/* Stars */}
                {meta && meta.stars && (
                  <div style={{
                    background: 'var(--bg)', borderRadius: 10, padding: 12, marginBottom: 12,
                  }}>
                    <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 8, color: 'var(--text)' }}>⭐ คะแนน</div>
                    <StarRow label="📍 ทำเล" value={meta.stars.location} />
                    <StarRow label="🧹 ความสะอาด" value={meta.stars.clean} />
                    <StarRow label="🏋️ สิ่งอำนวยความสะดวก" value={meta.stars.facilities} />
                    <StarRow label="💰 ความคุ้มค่า" value={meta.stars.value} />
                    <StarRow label="🔒 ความปลอดภัย" value={meta.stars.safety} />
                  </div>
                )}

                {/* Pros and cons */}
                {meta && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
                    {meta.pros && meta.pros.length > 0 && (
                      <div style={{ background: '#E8F5E9', borderRadius: 10, padding: 10 }}>
                        <div style={{ fontWeight: 600, fontSize: 12, color: '#2E7D32', marginBottom: 6 }}>✅ ข้อดี</div>
                        {meta.pros.map(function (p, i) {
                          return <div key={i} style={{ fontSize: 12, color: '#2E7D32', marginBottom: 2 }}>• {p}</div>;
                        })}
                      </div>
                    )}
                    {meta.cons && meta.cons.length > 0 && (
                      <div style={{ background: '#FFF3E0', borderRadius: 10, padding: 10 }}>
                        <div style={{ fontWeight: 600, fontSize: 12, color: '#E65100', marginBottom: 6 }}>⚠️ ข้อด้อย</div>
                        {meta.cons.map(function (c, i) {
                          return <div key={i} style={{ fontSize: 12, color: '#E65100', marginBottom: 2 }}>• {c}</div>;
                        })}
                      </div>
                    )}
                  </div>
                )}

                {/* Cost summary for selected room in this prop */}
                {selectedPropName === propName && selectedRoomId && (function () {
                  var unit = accomFull.find(function (u) { return u.id === selectedRoomId; });
                  if (!unit) return null;
                  var roomCost = unit.room.pw * unit.room.wk;
                  var dep = unit.room.dep || 0;
                  var total = preSess.amount + roomCost + dep;
                  return (
                    <div style={{
                      background: 'var(--bg)', borderRadius: 10, padding: 14, marginTop: 4,
                    }}>
                      <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 10, color: 'var(--text)' }}>💰 สรุปค่าที่พัก</div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 6 }}>
                        <span style={{ color: 'var(--text-sub)' }}>{preSess.name}</span>
                        <span style={{ fontWeight: 600 }}>{fmtGBP(preSess.amount)}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 6 }}>
                        <span style={{ color: 'var(--text-sub)' }}>{unit.room.name} ({unit.room.wk} wk × {fmtGBP(unit.room.pw)}/wk)</span>
                        <span style={{ fontWeight: 600 }}>{fmtGBP(roomCost)}</span>
                      </div>
                      {dep > 0 && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 6 }}>
                          <span style={{ color: 'var(--text-sub)' }}>Deposit</span>
                          <span style={{ fontWeight: 600 }}>{fmtGBP(dep)}</span>
                        </div>
                      )}
                      <div style={{ borderTop: '1px solid var(--border)', marginTop: 8, paddingTop: 8, display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ fontWeight: 700, fontSize: 15 }}>รวมที่พัก</span>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontWeight: 700, fontSize: 16, color: 'var(--primary)' }}>{fmtGBP(total)}</div>
                          <div style={{ fontSize: 12, color: 'var(--text-sub)' }}>{fmtTHB(total, rate)}</div>
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}
          </div>
        );
      })}

      <button
        onClick={onNext}
        disabled={!selectedRoomId}
        style={{
          marginTop: 8, width: '100%', padding: '14px 0', borderRadius: 12,
          background: selectedRoomId ? 'var(--primary)' : 'var(--border)',
          color: selectedRoomId ? '#fff' : 'var(--text-sub)',
          border: 'none', fontWeight: 700, fontSize: 16,
          cursor: selectedRoomId ? 'pointer' : 'not-allowed',
        }}
      >
        {selectedRoomId ? 'ถัดไป: ปรับค่าใช้จ่ายรายเดือน →' : 'เลือกห้องก่อนนะ 🏠'}
      </button>
    </div>
  );
}

// ─── Step 3: Living Costs ────────────────────────────────────────────────────

function StepLiving({ budgetData, rate, livingChoices, setLivingChoices, onNext }) {
  var levels = ['minimal', 'balanced', 'comfortable'];
  var levelColors = ['#2E7D32', '#1565C0', '#C62828'];
  var levelLabels = ['🟢 ประหยัด', '🟡 สมดุล', '🔴 สะดวก'];

  var levelTotals = levels.map(function (lvl) {
    return budgetData.lifestyle[lvl].total;
  });

  // Detect current preset
  function detectPreset() {
    for (var p = 0; p < 3; p++) {
      if (livingChoices.every(function (c) { return c === p; })) return p;
    }
    return -1; // custom
  }
  var currentPreset = detectPreset();

  function setPreset(p) {
    setLivingChoices([p, p, p, p, p, p, p, p]);
  }

  var livingMonthly = livingChoices.reduce(function (sum, choice, i) {
    var cat = budgetData.lifestyle[levels[choice]].categories[i];
    return sum + (cat ? cat.amount : 0);
  }, 0);
  var livingTotal = Math.round(livingMonthly * 13.5);

  var cardStyle = { background: 'var(--card)', borderRadius: 16, padding: 16, boxShadow: 'var(--shadow)', marginBottom: 10 };

  return (
    <div>
      <div style={{ marginBottom: 4, fontSize: 20, fontWeight: 700, color: 'var(--text)' }}>
        🍽️ ค่าใช้จ่ายรายเดือน
      </div>
      <div style={{ fontSize: 14, color: 'var(--text-sub)', marginBottom: 16 }}>
        เลือกระดับสำหรับแต่ละหมวดได้อิสระ
      </div>

      {/* Quick presets */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        {levels.map(function (lvl, p) {
          var isActive = currentPreset === p;
          return (
            <button
              key={lvl}
              onClick={function () { setPreset(p); }}
              style={{
                padding: '8px 14px', borderRadius: 20, border: '2px solid ' + (isActive ? levelColors[p] : 'var(--border)'),
                background: isActive ? levelColors[p] : 'var(--card)',
                color: isActive ? '#fff' : 'var(--text)',
                cursor: 'pointer', fontSize: 13, fontWeight: isActive ? 700 : 400,
              }}
            >
              {levelLabels[p]} {fmtGBP(levelTotals[p])}
            </button>
          );
        })}
        {currentPreset === -1 && (
          <div style={{
            padding: '8px 14px', borderRadius: 20, border: '2px solid var(--primary)',
            background: 'var(--primary)', color: '#fff',
            fontSize: 13, fontWeight: 700,
          }}>
            🎨 Custom
          </div>
        )}
      </div>

      {/* Category cards */}
      {budgetData.lifestyle.balanced.categories.map(function (baseCat, i) {
        var chosenLevel = livingChoices[i];
        var chosenCat = budgetData.lifestyle[levels[chosenLevel]].categories[i];
        var tip = '';
        var allLevels = levels.map(function (lvl) { return budgetData.lifestyle[lvl].categories[i]; });
        // Try to get tip from chosen level's first item
        if (chosenCat && chosenCat.items && chosenCat.items[0]) {
          tip = chosenCat.items[0].tip || '';
        }
        return (
          <div key={i} style={cardStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <span style={{ fontWeight: 700, fontSize: 15, color: 'var(--text)' }}>
                {baseCat.emoji} {baseCat.name}
              </span>
              <span style={{ fontWeight: 700, fontSize: 15, color: levelColors[chosenLevel] }}>
                {fmtGBP(chosenCat ? chosenCat.amount : 0)}/mo
              </span>
            </div>
            <div style={{ display: 'flex', gap: 6, marginBottom: 8, flexWrap: 'wrap' }}>
              {allLevels.map(function (cat, p) {
                var isChosen = chosenLevel === p;
                return (
                  <button
                    key={p}
                    onClick={function () {
                      var next = livingChoices.slice();
                      next[i] = p;
                      setLivingChoices(next);
                    }}
                    style={{
                      padding: '6px 12px', borderRadius: 16,
                      border: '2px solid ' + (isChosen ? levelColors[p] : 'var(--border)'),
                      background: isChosen ? levelColors[p] : 'var(--card)',
                      color: isChosen ? '#fff' : 'var(--text)',
                      cursor: 'pointer', fontSize: 12, fontWeight: isChosen ? 700 : 400,
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {['🟢', '🟡', '🔴'][p]} {['ประหยัด', 'สมดุล', 'หรูหรา'][p]} {fmtGBP(cat ? cat.amount : 0)}
                    {isChosen ? ' ✓' : ''}
                  </button>
                );
              })}
            </div>
            {tip && (
              <div style={{ fontSize: 12, color: 'var(--text-sub)', marginTop: 4 }}>
                💡 {tip}
              </div>
            )}
          </div>
        );
      })}

      {/* Summary */}
      <div style={{
        background: 'var(--card)', borderRadius: 14, padding: 16,
        boxShadow: 'var(--shadow)', marginTop: 8, marginBottom: 16,
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
          <span style={{ fontSize: 14, color: 'var(--text-sub)' }}>ค่าครองชีพ/เดือน</span>
          <div style={{ textAlign: 'right' }}>
            <span style={{ fontWeight: 700, fontSize: 16, color: 'var(--primary)' }}>{fmtGBP(livingMonthly)}</span>
            <span style={{ fontSize: 12, color: 'var(--text-sub)', marginLeft: 8 }}>{fmtTHB(livingMonthly, rate)}</span>
          </div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 14, color: 'var(--text-sub)' }}>× 13.5 เดือน</span>
          <div style={{ textAlign: 'right' }}>
            <span style={{ fontWeight: 700, fontSize: 16, color: 'var(--primary)' }}>{fmtGBP(livingTotal)}</span>
            <span style={{ fontSize: 12, color: 'var(--text-sub)', marginLeft: 8 }}>{fmtTHB(livingTotal, rate)}</span>
          </div>
        </div>
        <div style={{ fontSize: 11, color: 'var(--text-sub)', marginTop: 6 }}>
          (1.5 เดือน pre-sess + 9 เดือน term + 3 เดือน × 0.8 dissertation)
        </div>
      </div>

      <button onClick={onNext} style={{
        width: '100%', padding: '14px 0', borderRadius: 12,
        background: 'var(--primary)', color: '#fff', border: 'none',
        fontWeight: 700, fontSize: 16, cursor: 'pointer',
      }}>
        ถัดไป: ค่าใช้จ่ายเพิ่มเติม →
      </button>
    </div>
  );
}

// ─── Step 4: Additional Costs ────────────────────────────────────────────────

function StepAdditional({ budgetData, rate, additionalAmounts, setAdditionalAmounts, onNext }) {
  var defaults = budgetData.additionalCosts.defaults;
  var total = additionalAmounts.reduce(function (s, v) { return s + v; }, 0);

  function setAmount(i, val) {
    var next = additionalAmounts.slice();
    next[i] = val;
    setAdditionalAmounts(next);
  }

  var cardStyle = { background: 'var(--card)', borderRadius: 16, padding: 20, boxShadow: 'var(--shadow)', marginBottom: 12 };

  return (
    <div>
      <div style={{ marginBottom: 4, fontSize: 20, fontWeight: 700, color: 'var(--text)' }}>
        🧳 ค่าใช้จ่ายเพิ่มเติม
      </div>
      <div style={{ fontSize: 14, color: 'var(--text-sub)', marginBottom: 20 }}>
        ปรับตามแผนของคุณได้
      </div>

      {defaults.map(function (item, i) {
        var val = additionalAmounts[i];
        var pct = item.max > item.min ? ((val - item.min) / (item.max - item.min)) * 100 : 0;
        return (
          <div key={i} style={cardStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <div>
                <span style={{ fontSize: 18, marginRight: 8 }}>{item.emoji}</span>
                <span style={{ fontWeight: 700, fontSize: 15, color: 'var(--text)' }}>{item.name}</span>
                <div style={{ fontSize: 12, color: 'var(--text-sub)', marginTop: 3 }}>{item.note}</div>
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: 12 }}>
                <div style={{ fontWeight: 700, fontSize: 17, color: 'var(--primary)' }}>{fmtGBP(val)}</div>
                <div style={{ fontSize: 12, color: 'var(--text-sub)' }}>{fmtTHB(val, rate)}</div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 12, color: 'var(--text-sub)', flexShrink: 0 }}>{fmtGBP(item.min)}</span>
              <input
                type="range"
                min={item.min} max={item.max} step={10}
                value={val}
                onChange={function (e) { setAmount(i, Number(e.target.value)); }}
                style={{ flex: 1, accentColor: 'var(--primary)', height: 6, cursor: 'pointer' }}
              />
              <span style={{ fontSize: 12, color: 'var(--text-sub)', flexShrink: 0 }}>{fmtGBP(item.max)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
              <div style={{ height: 4, borderRadius: 2, background: 'var(--bg)', flex: 1, marginTop: 4, marginRight: 8, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: pct + '%', background: 'var(--primary)', borderRadius: 2 }} />
              </div>
            </div>
          </div>
        );
      })}

      {/* Total */}
      <div style={{ background: 'var(--card)', borderRadius: 16, padding: 16, boxShadow: 'var(--shadow)', marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontWeight: 700, fontSize: 16, color: 'var(--text)' }}>รวมค่าใช้จ่ายเพิ่มเติม</span>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontWeight: 700, fontSize: 18, color: 'var(--primary)' }}>{fmtGBP(total)}</div>
          <div style={{ fontSize: 13, color: 'var(--text-sub)' }}>{fmtTHB(total, rate)}</div>
        </div>
      </div>

      <button onClick={onNext} style={{
        width: '100%', padding: '14px 0', borderRadius: 12,
        background: 'var(--primary)', color: '#fff', border: 'none',
        fontWeight: 700, fontSize: 16, cursor: 'pointer',
      }}>
        ถัดไป: รายได้พาร์ทไทม์ →
      </button>
    </div>
  );
}

// ─── Step 5: Income ───────────────────────────────────────────────────────────

function StepIncome({ partTimeHours, setPartTimeHours, onNext }) {
  var hourlyRate = 12;
  var workingWeeks = 40;
  var partTimeAnnual = partTimeHours * hourlyRate * workingWeeks;
  var pw = partTimeHours * hourlyRate;
  var pm = Math.round(pw * 52 / 12);

  var cardStyle = { background: 'var(--card)', borderRadius: 16, padding: 20, boxShadow: 'var(--shadow)', marginBottom: 12 };

  return (
    <div>
      <div style={{ marginBottom: 4, fontSize: 20, fontWeight: 700, color: 'var(--text)' }}>
        💼 รายได้พาร์ทไทม์ (ไม่บังคับ)
      </div>
      <div style={{ fontSize: 14, color: 'var(--text-sub)', marginBottom: 20 }}>
        นักศึกษาวีซ่า UK เรียนได้สูงสุด 20 ชม/สัปดาห์ระหว่าง term
      </div>

      <div style={cardStyle}>
        <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 16, color: 'var(--text)' }}>
          ชั่วโมง/สัปดาห์: {partTimeHours} ชม/สัปดาห์
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
          <span style={{ fontSize: 13, color: 'var(--text-sub)', flexShrink: 0 }}>0</span>
          <input
            type="range" min="0" max="20" value={partTimeHours}
            onChange={function (e) { setPartTimeHours(Number(e.target.value)); }}
            style={{ flex: 1, accentColor: 'var(--primary)', height: 6, cursor: 'pointer' }}
          />
          <span style={{ fontSize: 13, color: 'var(--text-sub)', flexShrink: 0 }}>20</span>
        </div>

        {partTimeHours > 0 && (
          <div style={{
            background: 'var(--bg)', borderRadius: 10, padding: 14, marginTop: 14,
          }}>
            <div style={{ fontSize: 13, color: 'var(--text-sub)', marginBottom: 10 }}>
              £{hourlyRate}/ชั่วโมง × {partTimeHours} ชม × {workingWeeks} สัปดาห์/ปี
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
              <span style={{ fontSize: 13, color: 'var(--text-sub)' }}>รายสัปดาห์</span>
              <span style={{ fontWeight: 600 }}>{fmtGBP(pw)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
              <span style={{ fontSize: 13, color: 'var(--text-sub)' }}>รายเดือน</span>
              <span style={{ fontWeight: 600 }}>{fmtGBP(pm)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>รายปี</span>
              <span style={{ fontWeight: 700, fontSize: 16, color: '#2E7D32' }}>{fmtGBP(partTimeAnnual)}</span>
            </div>
          </div>
        )}
      </div>

      {/* Job ideas */}
      <div style={cardStyle}>
        <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 12, color: 'var(--text)' }}>
          💡 ไอเดียงาน Part-time
        </div>
        {[
          { job: 'Library assistant', rate: '~£12/hr' },
          { job: 'Café/Bar staff', rate: '~£12/hr' },
          { job: 'Tutor (Thai/English)', rate: '~£15-20/hr' },
          { job: 'Legal research intern', rate: '~£12-15/hr' },
        ].map(function (item, i) {
          return (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, marginBottom: 6, color: 'var(--text)' }}>
              <span>• {item.job}</span>
              <span style={{ color: 'var(--text-sub)' }}>{item.rate}</span>
            </div>
          );
        })}
      </div>

      {/* Warning */}
      <div style={{
        background: '#FFF8E1', borderRadius: 12, padding: 14, marginBottom: 16,
        border: '1px solid #FFE082',
      }}>
        <div style={{ fontSize: 13, color: '#E65100', marginBottom: 4 }}>
          ⚠️ Max 20 ชม/สัปดาห์ระหว่าง term
        </div>
        <div style={{ fontSize: 13, color: '#2E7D32' }}>
          ✅ ช่วง break เรียนได้ full-time
        </div>
      </div>

      <button onClick={onNext} style={{
        width: '100%', padding: '14px 0', borderRadius: 12,
        background: 'var(--primary)', color: '#fff', border: 'none',
        fontWeight: 700, fontSize: 16, cursor: 'pointer',
      }}>
        ดู Dashboard 📊 →
      </button>
    </div>
  );
}

// ─── Dashboard ───────────────────────────────────────────────────────────────

function Dashboard({
  budgetData, accomFull, rate, profile, updateProfile,
  fixedTotal, accomCost, livingTotal, additionalTotal, partTimeHours, grandTotal, netTotal,
  selectedPropName, selectedRoomId, livingChoices, additionalAmounts,
  savedPlans, setSavedPlans,
  planName, setPlanName,
  onEdit,
}) {
  var partTimeAnnual = partTimeHours * 12 * 40;
  var vf = budgetData.fixedCosts.visaFunds;

  var fundsAmount = profile.fundsAmount || '';
  var fundsGBP = fundsAmount ? parseFloat(fundsAmount) / rate : 0;
  var surplus = fundsGBP - netTotal;
  var maxPartTime = 20 * 12 * 40;

  var breakdown = [
    { label: '🔒 Fixed Costs', amount: fixedTotal, color: 'var(--primary)' },
    { label: '🏠 ที่พัก', amount: accomCost, color: '#7B1FA2' },
    { label: '🍽️ ค่าครองชีพ', amount: livingTotal, color: '#E65100' },
    { label: '🧳 ค่าใช้จ่ายเพิ่มเติม', amount: additionalTotal, color: '#757575' },
  ];

  var peakMax = Math.max.apply(null, budgetData.peakMonths.map(function (p) { return p.amount; }));

  function savePlan() {
    if (!planName.trim()) return;
    var plan = {
      name: planName.trim(),
      date: new Date().toLocaleDateString('th-TH'),
      selectedPropName: selectedPropName,
      selectedRoomId: selectedRoomId,
      livingChoices: livingChoices,
      additionalAmounts: additionalAmounts,
      partTimeHours: partTimeHours,
      fundsAmount: fundsAmount,
    };
    var next = [plan].concat(savedPlans.filter(function (p) { return p.name !== plan.name; })).slice(0, 10);
    setSavedPlans(next);
    localStorage.setItem('durham_plans', JSON.stringify(next));
    setPlanName('');
  }

  function deletePlan(name) {
    var next = savedPlans.filter(function (p) { return p.name !== name; });
    setSavedPlans(next);
    localStorage.setItem('durham_plans', JSON.stringify(next));
  }

  var rateRows = [41, 44, 46].map(function (r) {
    var val = Math.round(netTotal * r);
    var diff = val - Math.round(netTotal * rate);
    return { r: r, val: val, diff: diff };
  });

  var cardStyle = { background: 'var(--card)', borderRadius: 16, padding: 20, boxShadow: 'var(--shadow)', marginBottom: 14 };

  return (
    <div>
      <div style={{ marginBottom: 4, fontSize: 20, fontWeight: 700, color: 'var(--text)' }}>
        📊 Durham Budget 2026/27
      </div>
      <div style={{ fontSize: 14, color: 'var(--text-sub)', marginBottom: 20 }}>
        แผนการเงินของ Pannathorn
      </div>

      {/* Grand total card */}
      <div style={{
        background: 'linear-gradient(135deg, var(--primary) 0%, #1565C0 100%)',
        borderRadius: 18, padding: 20, marginBottom: 14, color: '#fff',
      }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, textAlign: 'center' }}>
          {[
            { label: 'รวมค่าใช้จ่าย', gbp: grandTotal, icon: '💰' },
            { label: 'รายได้พาร์ทไทม์', gbp: partTimeAnnual, icon: '💼' },
            { label: 'สุทธิ', gbp: netTotal, icon: '🎯' },
          ].map(function (item, i) {
            return (
              <div key={i}>
                <div style={{ fontSize: 12, opacity: 0.85, marginBottom: 4 }}>{item.icon} {item.label}</div>
                <div style={{ fontWeight: 700, fontSize: 18 }}>
                  {i === 1 ? '-' : ''}{fmtGBP(item.gbp)}
                </div>
                <div style={{ fontSize: 11, opacity: 0.8, marginTop: 2 }}>
                  {i === 1 ? '-' : ''}฿{fmt(item.gbp * rate)}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Cost breakdown */}
      <div style={cardStyle}>
        <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 14, color: 'var(--text)' }}>
          📊 สัดส่วนค่าใช้จ่าย
        </div>

        {/* Stacked bar */}
        <div style={{ display: 'flex', height: 20, borderRadius: 10, overflow: 'hidden', marginBottom: 14 }}>
          {breakdown.map(function (item) {
            var pct = grandTotal > 0 ? (item.amount / grandTotal) * 100 : 0;
            return (
              <div key={item.label} style={{ width: pct + '%', background: item.color, minWidth: pct > 0 ? 2 : 0 }} />
            );
          })}
        </div>

        {breakdown.map(function (item) {
          var pct = grandTotal > 0 ? Math.round((item.amount / grandTotal) * 100) : 0;
          return (
            <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: item.color, flexShrink: 0 }} />
                <span style={{ fontSize: 14, color: 'var(--text)' }}>{item.label}</span>
              </div>
              <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                <span style={{ fontSize: 13, color: 'var(--text-sub)' }}>{pct}%</span>
                <span style={{ fontWeight: 700, fontSize: 15 }}>{fmtGBP(item.amount)}</span>
              </div>
            </div>
          );
        })}

        {partTimeAnnual > 0 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <span style={{ fontSize: 14, color: '#2E7D32' }}>💼 รายได้ (−)</span>
            <span style={{ fontWeight: 700, fontSize: 15, color: '#2E7D32' }}>−{fmtGBP(partTimeAnnual)}</span>
          </div>
        )}

        <div style={{ borderTop: '2px solid var(--border)', marginTop: 10, paddingTop: 10, display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ fontWeight: 700, fontSize: 16 }}>สุทธิ</span>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontWeight: 700, fontSize: 18, color: 'var(--primary)' }}>{fmtGBP(netTotal)}</div>
            <div style={{ fontSize: 13, color: 'var(--text-sub)' }}>{fmtTHB(netTotal, rate)}</div>
          </div>
        </div>
      </div>

      {/* Visa Funds reminder */}
      <div style={{
        background: '#E3F2FD', borderRadius: 14, padding: 16, marginBottom: 14,
        border: '1px solid #90CAF9',
      }}>
        <div style={{ fontWeight: 700, fontSize: 14, color: '#1565C0', marginBottom: 6 }}>
          🏦 Visa Funds ที่ต้องแสดง (ข้อมูลเท่านั้น ไม่รวมใน Grand Total)
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 14, color: '#1565C0' }}>ยอดรวม (Tuition + Pre-sess + Maintenance)</span>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontWeight: 700, fontSize: 17, color: '#0D47A1' }}>{fmtGBP(vf.total)}</div>
            <div style={{ fontSize: 11, color: '#1565C0' }}>{vf.note}</div>
          </div>
        </div>
      </div>

      {/* Money runway */}
      <div style={cardStyle}>
        <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 12, color: 'var(--text)' }}>
          💵 เงินที่มี
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
          <span style={{ fontSize: 14, color: 'var(--text-sub)', flexShrink: 0 }}>เงินที่มี:</span>
          <div style={{ position: 'relative', flex: 1 }}>
            <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 15, color: 'var(--text-sub)' }}>฿</span>
            <input
              type="number"
              placeholder="เช่น 2000000"
              value={fundsAmount}
              onChange={function (e) { updateProfile('fundsAmount', e.target.value); }}
              style={{
                width: '100%', padding: '10px 12px 10px 28px',
                borderRadius: 10, border: '1px solid var(--border)',
                background: 'var(--bg)', color: 'var(--text)', fontSize: 15,
                boxSizing: 'border-box',
              }}
            />
          </div>
        </div>

        {fundsAmount && parseFloat(fundsAmount) > 0 && (
          surplus >= 0 ? (
            <div style={{ background: '#E8F5E9', borderRadius: 12, padding: 14, border: '1px solid #A5D6A7' }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#2E7D32', marginBottom: 4 }}>
                ✅ เงินพอ!
              </div>
              <div style={{ fontSize: 14, color: '#2E7D32' }}>
                เหลือ {fmtGBP(surplus)} หลังจบ LLM ({fmtTHB(surplus, rate)})
              </div>
            </div>
          ) : (
            <div style={{ background: '#FFF3E0', borderRadius: 12, padding: 14, border: '1px solid #FFCC80' }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#E65100', marginBottom: 6 }}>
                ⚠️ ขาดอีก {fmtGBP(Math.abs(surplus))} ({fmtTHB(Math.abs(surplus), rate)})
              </div>
              {partTimeAnnual >= Math.abs(surplus) ? (
                <div style={{ fontSize: 13, color: '#2E7D32' }}>
                  💼 งาน part-time ช่วยปิดส่วนต่างได้! ✅
                </div>
              ) : (
                <div style={{ fontSize: 13, color: '#E65100' }}>
                  💼 Part-time 20 ชม/สัปดาห์ = {fmtGBP(maxPartTime)} — ยังขาดอีก {fmtGBP(Math.abs(surplus) - maxPartTime)}
                </div>
              )}
            </div>
          )
        )}
      </div>

      {/* Peak months */}
      <div style={cardStyle}>
        <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 14, color: 'var(--text)' }}>
          📅 เดือนที่ค่าใช้จ่ายสูง
        </div>
        {budgetData.peakMonths.map(function (pm, i) {
          var barPct = peakMax > 0 ? (pm.amount / peakMax) * 100 : 0;
          return (
            <div key={i} style={{ marginBottom: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', minWidth: 100 }}>{pm.month}</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: pm.color }}>{fmtGBP(pm.amount)}</span>
              </div>
              <div style={{ height: 10, borderRadius: 5, background: 'var(--bg)', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: barPct + '%', background: pm.color, borderRadius: 5 }} />
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-sub)', marginTop: 3 }}>{pm.note}</div>
            </div>
          );
        })}
      </div>

      {/* Exchange rate impact */}
      <div style={cardStyle}>
        <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 12, color: 'var(--text)' }}>
          💱 ผลกระทบจากอัตราแลกเปลี่ยน
        </div>
        {rateRows.map(function (row) {
          var isCurrent = row.r === rate;
          return (
            <div key={row.r} style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '8px 12px', borderRadius: 10, marginBottom: 6,
              background: isCurrent ? 'var(--bg)' : 'transparent',
              border: isCurrent ? '1px solid var(--border)' : '1px solid transparent',
            }}>
              <span style={{ fontSize: 14, fontWeight: isCurrent ? 700 : 400, color: 'var(--text)' }}>
                ฿{row.r}/£
              </span>
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontWeight: 700, fontSize: 15 }}>฿{fmt(row.val)}</span>
                {isCurrent ? (
                  <span style={{ fontSize: 11, color: 'var(--primary)', marginLeft: 8 }}>← ปัจจุบัน</span>
                ) : (
                  <span style={{ fontSize: 11, color: row.diff > 0 ? '#2E7D32' : '#C62828', marginLeft: 8 }}>
                    {row.diff > 0 ? '+' : ''}฿{fmt(Math.abs(row.diff))}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Save/Load plans */}
      <div style={cardStyle}>
        <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 14, color: 'var(--text)' }}>
          💾 บันทึก/โหลดแผน
        </div>
        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          <input
            type="text"
            placeholder="ชื่อแผน เช่น Duresme + สมดุล"
            value={planName}
            onChange={function (e) { setPlanName(e.target.value); }}
            onKeyDown={function (e) { if (e.key === 'Enter') savePlan(); }}
            style={{
              flex: 1, padding: '10px 12px', borderRadius: 10,
              border: '1px solid var(--border)', background: 'var(--bg)',
              color: 'var(--text)', fontSize: 14,
            }}
          />
          <button
            onClick={savePlan}
            disabled={!planName.trim()}
            style={{
              padding: '10px 16px', borderRadius: 10, border: 'none',
              background: planName.trim() ? 'var(--primary)' : 'var(--border)',
              color: planName.trim() ? '#fff' : 'var(--text-sub)',
              cursor: planName.trim() ? 'pointer' : 'not-allowed',
              fontWeight: 700, fontSize: 14, flexShrink: 0,
            }}
          >
            💾 บันทึก
          </button>
        </div>

        {savedPlans.length > 0 && (
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-sub)', marginBottom: 8 }}>
              แผนที่บันทึกไว้:
            </div>
            {savedPlans.map(function (plan) {
              return (
                <div key={plan.name} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '8px 0', borderBottom: '1px solid var(--border)',
                }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>• {plan.name}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-sub)' }}>{plan.date}</div>
                  </div>
                  <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                    <button
                      onClick={function () {
                        if (typeof plan._load === 'function') plan._load();
                      }}
                      style={{
                        padding: '6px 10px', borderRadius: 8,
                        border: '1px solid var(--border)', background: 'var(--bg)',
                        color: 'var(--text)', cursor: 'pointer', fontSize: 12,
                      }}
                    >
                      📂 โหลด
                    </button>
                    <button
                      onClick={function () { deletePlan(plan.name); }}
                      style={{
                        padding: '6px 10px', borderRadius: 8,
                        border: '1px solid #FFCDD2', background: '#FFF5F5',
                        color: '#C62828', cursor: 'pointer', fontSize: 12,
                      }}
                    >
                      🗑
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Edit plan */}
      <button onClick={onEdit} style={{
        width: '100%', padding: '14px 0', borderRadius: 12,
        background: 'var(--card)', color: 'var(--text)', border: '2px solid var(--border)',
        fontWeight: 700, fontSize: 16, cursor: 'pointer', marginBottom: 8,
      }}>
        ← แก้ไขแผน
      </button>
    </div>
  );
}

// ─── Main component ──────────────────────────────────────────────────────────

export default function BudgetWizard({ budgetData, accom, accomFull, rate, dark, profile, updateProfile, sheetsStatus, SHEETS_URL }) {
  var [step, setStep] = useState(0);
  var [selectedPropName, setSelectedPropName] = useState(null);
  var [selectedRoomId, setSelectedRoomId] = useState(null);
  var [livingChoices, setLivingChoices] = useState([1, 1, 1, 1, 1, 1, 1, 1]);
  var [additionalAmounts, setAdditionalAmounts] = useState(function () {
    return budgetData.additionalCosts.defaults.map(function (d) { return d.amount; });
  });
  var [partTimeHours, setPartTimeHours] = useState(0);
  var [planName, setPlanName] = useState('');
  var [savedPlans, setSavedPlans] = useState(function () {
    try { return JSON.parse(localStorage.getItem('durham_plans') || '[]'); } catch { return []; }
  });

  // Computed values
  var fc = budgetData.fixedCosts;
  var fixedTotal = fc.tuition.reduce(function (s, i) { return s + i.amount; }, 0)
                 + fc.visa.reduce(function (s, i) { return s + i.amount; }, 0);
  var selectedUnit = accomFull.find(function (u) { return u.id === selectedRoomId; });
  var preSessAccom = fc.accommodation[0];
  var accomCost = selectedUnit
    ? preSessAccom.amount + selectedUnit.room.pw * selectedUnit.room.wk + (selectedUnit.room.dep || 0)
    : 0;

  var levels = ['minimal', 'balanced', 'comfortable'];
  var livingMonthly = livingChoices.reduce(function (sum, choice, i) {
    var cat = budgetData.lifestyle[levels[choice]].categories[i];
    return sum + (cat ? cat.amount : 0);
  }, 0);
  var livingTotal = Math.round(livingMonthly * 13.5);

  var additionalTotal = additionalAmounts.reduce(function (s, v) { return s + v; }, 0);
  var partTimeAnnual = partTimeHours * 12 * 40;
  var grandTotal = fixedTotal + accomCost + livingTotal + additionalTotal;
  var netTotal = grandTotal - partTimeAnnual;

  // Load plan handler
  var plansWithLoad = savedPlans.map(function (plan) {
    return Object.assign({}, plan, {
      _load: function () {
        if (plan.selectedPropName) setSelectedPropName(plan.selectedPropName);
        if (plan.selectedRoomId) setSelectedRoomId(plan.selectedRoomId);
        if (plan.livingChoices) setLivingChoices(plan.livingChoices);
        if (plan.additionalAmounts) setAdditionalAmounts(plan.additionalAmounts);
        if (typeof plan.partTimeHours === 'number') setPartTimeHours(plan.partTimeHours);
        if (plan.fundsAmount !== undefined) updateProfile('fundsAmount', plan.fundsAmount);
        setStep(5);
      },
    });
  });

  return (
    <div style={{ paddingTop: 16 }}>
      {sheetsStatus !== 'not-configured' && (
        <SheetsStatusBadge sheetsStatus={sheetsStatus} SHEETS_URL={SHEETS_URL} />
      )}

      <StepIndicator step={step} setStep={setStep} />

      <div key={step}>
        {step === 0 && (
          <StepFixed
            budgetData={budgetData}
            rate={rate}
            onNext={function () { setStep(1); }}
          />
        )}
        {step === 1 && (
          <StepAccom
            budgetData={budgetData}
            accom={accom}
            accomFull={accomFull}
            rate={rate}
            selectedPropName={selectedPropName}
            setSelectedPropName={setSelectedPropName}
            selectedRoomId={selectedRoomId}
            setSelectedRoomId={setSelectedRoomId}
            onNext={function () { setStep(2); }}
          />
        )}
        {step === 2 && (
          <StepLiving
            budgetData={budgetData}
            rate={rate}
            livingChoices={livingChoices}
            setLivingChoices={setLivingChoices}
            onNext={function () { setStep(3); }}
          />
        )}
        {step === 3 && (
          <StepAdditional
            budgetData={budgetData}
            rate={rate}
            additionalAmounts={additionalAmounts}
            setAdditionalAmounts={setAdditionalAmounts}
            onNext={function () { setStep(4); }}
          />
        )}
        {step === 4 && (
          <StepIncome
            partTimeHours={partTimeHours}
            setPartTimeHours={setPartTimeHours}
            onNext={function () { setStep(5); }}
          />
        )}
        {step === 5 && (
          <Dashboard
            budgetData={budgetData}
            accomFull={accomFull}
            rate={rate}
            profile={profile}
            updateProfile={updateProfile}
            fixedTotal={fixedTotal}
            accomCost={accomCost}
            livingTotal={livingTotal}
            additionalTotal={additionalTotal}
            partTimeHours={partTimeHours}
            grandTotal={grandTotal}
            netTotal={netTotal}
            selectedPropName={selectedPropName}
            selectedRoomId={selectedRoomId}
            livingChoices={livingChoices}
            additionalAmounts={additionalAmounts}
            savedPlans={plansWithLoad}
            setSavedPlans={setSavedPlans}
            planName={planName}
            setPlanName={setPlanName}
            onEdit={function () { setStep(0); }}
          />
        )}
      </div>
    </div>
  );
}
