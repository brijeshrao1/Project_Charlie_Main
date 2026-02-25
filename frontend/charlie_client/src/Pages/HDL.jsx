import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { gsap } from "gsap";
import api from "../services/api";

/* ─────────────────────────────────────────
   BASE URL for non-api routes (/excel, /static)
───────────────────────────────────────── */
const BASE_URL =
  (api.defaults.baseURL || "http://localhost:8000/api").replace(/\/api\/?$/, "") ||
  "http://localhost:8000";

/* ─────────────────────────────────────────
   GLOBAL CSS
───────────────────────────────────────── */
if (!document.getElementById("hdl-pvs-css")) {
  const s = document.createElement("style");
  s.id = "hdl-pvs-css";
  s.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Mono:wght@400;500&family=Instrument+Sans:wght@400;500;600;700&display=swap');

    @keyframes hdl-spin    { to { transform: rotate(360deg); } }
    @keyframes hdl-slide-in {
      from { opacity: 0; transform: translateY(16px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    @keyframes hdl-toast-in {
      from { opacity: 0; transform: translateX(100%); }
      to   { opacity: 1; transform: translateX(0); }
    }
    @keyframes hdl-toast-out {
      from { opacity: 1; transform: translateX(0); }
      to   { opacity: 0; transform: translateX(100%); }
    }

    .hdl-root {
      flex: 1; display: flex; flex-direction: column; min-height: 0; overflow: hidden;
      background: linear-gradient(160deg, #ede8dc 0%, #d8d0c0 100%);
      font-family: 'Instrument Sans', sans-serif;
    }
    .hdl-body {
      flex: 1; min-height: 0; overflow-y: auto; overscroll-behavior: contain;
      padding: 24px 28px;
    }
    .hdl-body::-webkit-scrollbar { width: 6px; }
    .hdl-body::-webkit-scrollbar-track { background: transparent; }
    .hdl-body::-webkit-scrollbar-thumb { background: rgba(184,115,51,.3); border-radius: 3px; }

    .hdl-table-wrap {
      overflow-x: auto; overflow-y: auto; overscroll-behavior: contain; position: relative;
    }
    .hdl-table-wrap::-webkit-scrollbar { height: 6px; width: 6px; }
    .hdl-table-wrap::-webkit-scrollbar-track { background: rgba(0,0,0,.04); border-radius: 3px; }
    .hdl-table-wrap::-webkit-scrollbar-thumb { background: rgba(184,115,51,.35); border-radius: 3px; }

    .hdl-check { width: 16px; height: 16px; cursor: pointer; accent-color: #b87333; border-radius: 3px; }
    .hdl-row:hover { background: rgba(184,115,51,.06) !important; }

    .hdl-btn {
      display: inline-flex; align-items: center; gap: 7px;
      border: none; outline: none; cursor: pointer; user-select: none;
      font-family: 'Instrument Sans', sans-serif; font-weight: 700;
      letter-spacing: .05em; text-transform: uppercase;
      transition: opacity .15s ease; white-space: nowrap;
    }
    .hdl-btn:disabled { opacity: .45; cursor: not-allowed; }

    .hdl-step-connector {
      flex: 1; height: 2px;
      background: linear-gradient(to right, rgba(184,115,51,.3), rgba(184,115,51,.1));
      margin: 0 4px; align-self: center; margin-bottom: 20px;
    }
    .hdl-step-connector.done { background: linear-gradient(to right, #b87333, rgba(184,115,51,.5)); }

    .hdl-lookup-pill {
      display: inline-block; padding: 2px 8px; border-radius: 4px;
      font-family: 'DM Mono', monospace; font-size: 10px; font-weight: 500;
      letter-spacing: .06em; color: #b87333;
      background: rgba(184,115,51,.12); border: 1px solid rgba(184,115,51,.25);
    }

    .hdl-modal-overlay {
      position: fixed; inset: 0; background: rgba(44,36,32,.55); z-index: 10000;
      display: flex; align-items: center; justify-content: center;
      padding: 24px;
    }
    .hdl-modal {
      width: 100%; max-width: 900px; border-radius: 16px;
      background: linear-gradient(160deg, #ede8dc 0%, #d8d0c0 100%);
      box-shadow: 16px 16px 40px rgba(0,0,0,.55), -8px -8px 28px rgba(255,255,255,.9);
      position: relative; overflow: hidden;
      display: flex; flex-direction: column; max-height: 85vh;
    }

    .hdl-file-pill {
      display: inline-flex; align-items: center; gap: 8px;
      padding: 8px 16px; border-radius: 8px;
      background: linear-gradient(145deg, #ddd6c6, #c8bfad);
      box-shadow: inset 3px 3px 8px rgba(0,0,0,.28), inset -2px -2px 6px rgba(255,255,255,.6);
      font-family: 'DM Mono', monospace; font-size: 11px; letter-spacing: .04em; color: #5c4e44;
    }

    .hdl-pg-btn {
      width: 28px; height: 28px; border-radius: 7px; border: none; cursor: pointer;
      display: flex; align-items: center; justify-content: center;
      font-family: 'DM Mono', monospace; font-size: 11px; transition: all .15s ease;
    }
    .hdl-pg-btn:disabled { opacity: .35; cursor: default; }

    .hdl-toast {
      position: fixed; bottom: 24px; right: 24px; z-index: 99999;
      padding: 14px 22px; border-radius: 10px; max-width: 420px;
      font-family: 'DM Mono', monospace; font-size: 12px; letter-spacing: .03em;
      box-shadow: 8px 8px 22px rgba(0,0,0,.42), -5px -5px 16px rgba(255,255,255,.88);
      animation: hdl-toast-in .3s ease;
      display: flex; align-items: center; gap: 10px;
    }
  `;
  document.head.appendChild(s);
}

/* ─────────────────────────────────────────
   TOKENS
───────────────────────────────────────── */
const P = {
  warmDrk: "#a09283", copper: "#b87333", copperLt: "#d4935f",
  ink: "#2c2420", inkLt: "#5c4e44", green: "#27ae60", danger: "#c0392b",
};
const BS = {
  raised:   "8px 8px 22px rgba(0,0,0,.42), -5px -5px 16px rgba(255,255,255,.88)",
  raisedSm: "5px 5px 14px rgba(0,0,0,.38), -3px -3px 10px rgba(255,255,255,.82)",
  pressed:  "inset 4px 4px 12px rgba(0,0,0,.42), inset -3px -3px 8px rgba(255,255,255,.55)",
  insetDeep:"inset 6px 6px 18px rgba(0,0,0,.38), inset -4px -4px 14px rgba(255,255,255,.55)",
  insetSm:  "inset 3px 3px 8px rgba(0,0,0,.3),   inset -2px -2px 6px rgba(255,255,255,.55)",
  copper:   "5px 5px 14px rgba(0,0,0,.5), -2px -2px 8px rgba(255,255,255,.4), 0 0 18px rgba(184,115,51,.32)",
};

/* ─── Screw ─── */
const Screw = ({ style, angle = 45 }) => (
  <div aria-hidden="true" style={{
    position: "absolute", ...style, zIndex: 6, width: 12, height: 12, borderRadius: "50%",
    background: "linear-gradient(135deg, #c0b8a8, #a09080)",
    boxShadow: "2px 2px 5px rgba(0,0,0,.45), -1px -1px 3px rgba(255,255,255,.55)",
    pointerEvents: "none",
  }}>
    <div style={{
      position: "absolute", top: "50%", left: "50%",
      width: "58%", height: 1.5, background: "rgba(0,0,0,.4)",
      transform: `translate(-50%,-50%) rotate(${angle}deg)`,
    }} />
  </div>
);

/* ─── NeuBtn ─── */
const NeuBtn = ({ children, onClick, accent = false, danger = false, success = false, disabled = false, small = false, icon, style: extStyle }) => {
  const ref = useRef(null);
  const dn = () => { if (!disabled && ref.current) gsap.to(ref.current, { scale: .97, boxShadow: BS.pressed, duration: .1 }); };
  const up = () => { if (ref.current) gsap.to(ref.current, { scale: 1, boxShadow: accent ? BS.copper : BS.raisedSm, duration: .2, ease: "back.out(2)" }); };
  const bg = success ? "linear-gradient(135deg, #27ae60, #1a7a42)"
    : danger ? "linear-gradient(135deg, #c0392b, #8a2318)"
    : accent ? "linear-gradient(135deg, #c8843a, #7a4e28)"
    : "linear-gradient(145deg, #ede6d6, #cec5b5)";
  const fg = (accent || danger || success) ? "#f8f0e0" : P.inkLt;
  return (
    <button ref={ref} className="hdl-btn" onClick={disabled ? undefined : onClick}
      onMouseDown={dn} onMouseUp={up} onMouseLeave={up} disabled={disabled}
      style={{ fontSize: small ? 11 : 12, padding: small ? "9px 18px" : "11px 22px",
        borderRadius: 9, color: fg, background: bg,
        boxShadow: disabled ? "none" : accent ? BS.copper : BS.raisedSm, ...extStyle }}>
      {icon && <span>{icon}</span>}{children}
    </button>
  );
};

/* ─── SectionCard ─── */
const SectionCard = ({ children, style }) => (
  <div style={{
    borderRadius: 14, background: "linear-gradient(160deg, #ede8dc 0%, #d8d0c0 100%)",
    boxShadow: BS.raised, border: "1px solid rgba(255,255,255,.42)",
    position: "relative", overflow: "hidden", ...style,
  }}>{children}</div>
);

/* ─────────────────────────────────────────
   STEPPER
───────────────────────────────────────── */
const STEPS = [
  { id: 1, label: "Select Source\nKeys" },
  { id: 2, label: "Transform Customer\nExcel" },
  { id: 3, label: "Define NLP\nRules" },
  { id: 4, label: "Fetch Oracle Data for\nValidations" },
  { id: 5, label: "Validate\nData" },
];

const Stepper = ({ currentStep, completedSteps, onStepClick }) => (
  <div style={{ display: "flex", alignItems: "flex-start", padding: "0 4px" }}>
    {STEPS.map((step, idx) => {
      const done = completedSteps.has(step.id);
      const active = currentStep === step.id;
      return (
        <React.Fragment key={step.id}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, cursor: "pointer", flexShrink: 0 }}
            onClick={() => onStepClick(step.id)}>
            <div style={{
              width: 32, height: 32, borderRadius: "50%",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontFamily: "'DM Mono', monospace", fontSize: 12, fontWeight: 500,
              transition: "all .22s ease",
              background: done ? "linear-gradient(135deg, #c8843a, #7a4e28)"
                : active ? "linear-gradient(135deg, #7a9cc8, #3a5c8a)"
                : "linear-gradient(145deg, #ccc4b4, #bdb4a4)",
              boxShadow: done ? BS.copper : active ? BS.raisedSm : BS.insetSm,
              color: (done || active) ? "#f8f0e0" : P.warmDrk,
            }}>
              {done ? "✔" : step.id}
            </div>
            <div style={{
              fontFamily: "'Instrument Sans', sans-serif", fontSize: 11,
              color: active ? P.copper : done ? P.inkLt : P.warmDrk,
              fontWeight: active ? 600 : 400, textAlign: "center", maxWidth: 90,
              whiteSpace: "pre-line", lineHeight: 1.35,
            }}>{step.label}</div>
          </div>
          {idx < STEPS.length - 1 && (
            <div className={`hdl-step-connector${done ? " done" : ""}`} style={{ marginTop: 15 }} />
          )}
        </React.Fragment>
      );
    })}
  </div>
);

/* ─────────────────────────────────────────
   TOAST NOTIFICATION
───────────────────────────────────────── */
const Toast = ({ message, severity, onClose }) => {
  useEffect(() => {
    const t = setTimeout(onClose, 5000);
    return () => clearTimeout(t);
  }, [onClose]);
  const colors = { success: { bg: "rgba(39,174,96,.14)", border: "rgba(39,174,96,.3)", color: "#1a7a42" },
    error: { bg: "rgba(192,57,43,.12)", border: "rgba(192,57,43,.3)", color: "#c0392b" },
    warning: { bg: "rgba(241,196,15,.14)", border: "rgba(241,196,15,.4)", color: "#856404" },
    info: { bg: "rgba(52,152,219,.12)", border: "rgba(52,152,219,.3)", color: "#2471a3" } };
  const c = colors[severity] || colors.info;
  return (
    <div className="hdl-toast" style={{ background: `linear-gradient(160deg, #ede8dc, #d8d0c0)`, border: `1px solid ${c.border}`, color: c.color }}>
      <span style={{ fontSize: 16 }}>{severity === "success" ? "✔" : severity === "error" ? "✕" : severity === "warning" ? "⚠" : "ℹ"}</span>
      <span style={{ flex: 1 }}>{message}</span>
      <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: c.color, fontSize: 14 }}>✕</button>
    </div>
  );
};

/* ─────────────────────────────────────────
   VALIDATION RESULTS DIALOG
───────────────────────────────────────── */
const ValidationResultsDialog = ({ result, onClose }) => {
  const [tab, setTab] = useState(0);
  if (!result) return null;
  const main = result.mainValidation;
  const le = result.legalEmployerValidation;
  const isSuccess = result.status !== "failed";

  return (
    <div className="hdl-modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="hdl-modal" style={{ maxWidth: 960 }}>
        {/* Header */}
        <div style={{
          padding: "18px 22px",
          background: isSuccess ? "rgba(39,174,96,.1)" : "rgba(192,57,43,.1)",
          boxShadow: BS.insetSm, borderBottom: "1px solid rgba(0,0,0,.08)",
          display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0,
        }}>
          <span style={{ fontFamily: "'DM Serif Display', serif", fontSize: 18, color: isSuccess ? "#1a7a42" : "#c0392b" }}>
            Validation Results
          </span>
          <button onClick={onClose} style={{
            width: 30, height: 30, borderRadius: 7,
            background: "linear-gradient(145deg, #ddd6c6, #c8bfad)", boxShadow: BS.raisedSm,
            border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
            fontFamily: "'DM Mono', monospace", fontSize: 14, color: P.inkLt,
          }}>✕</button>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", borderBottom: "1px solid rgba(0,0,0,.08)", flexShrink: 0 }}>
          <button onClick={() => setTab(0)} style={{
            flex: 1, padding: "12px 16px", border: "none", cursor: "pointer",
            fontFamily: "'Instrument Sans', sans-serif", fontSize: 12, fontWeight: 600,
            background: tab === 0 ? "rgba(184,115,51,.1)" : "transparent",
            color: tab === 0 ? P.copper : P.inkLt,
            borderBottom: tab === 0 ? `2px solid ${P.copper}` : "2px solid transparent",
          }}>Overall Validation</button>
          {le && (
            <button onClick={() => setTab(1)} style={{
              flex: 1, padding: "12px 16px", border: "none", cursor: "pointer",
              fontFamily: "'Instrument Sans', sans-serif", fontSize: 12, fontWeight: 600,
              background: tab === 1 ? "rgba(184,115,51,.1)" : "transparent",
              color: tab === 1 ? (le.status === "failed" ? P.danger : P.green) : P.inkLt,
              borderBottom: tab === 1 ? `2px solid ${le.status === "failed" ? P.danger : P.green}` : "2px solid transparent",
            }}>Legal Employer Validation</button>
          )}
        </div>

        {/* Tab Content */}
        <div style={{ flex: 1, overflowY: "auto", padding: "20px 22px" }}>
          {tab === 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div style={{ fontFamily: "'Instrument Sans', sans-serif", fontSize: 14, color: P.ink }}>
                {result.message || "Validation process completed."}
              </div>
              {main && (
                <>
                  <div style={{
                    padding: "14px 18px", borderRadius: 10,
                    background: main.status === "failed" ? "rgba(192,57,43,.08)" : "rgba(39,174,96,.08)",
                    border: `1px solid ${main.status === "failed" ? "rgba(192,57,43,.2)" : "rgba(39,174,96,.2)"}`,
                    display: "flex", flexDirection: "column", gap: 6,
                    fontFamily: "'DM Mono', monospace", fontSize: 12,
                  }}>
                    <div>Passed Records: <strong>{main.passed_records_count ?? 0}</strong></div>
                    <div>Failed Records: <strong>{main.failed_records_count ?? 0}</strong></div>
                    <div>Delta Validation: <strong>{main.delta_logic_executed ? "Yes" : "No"}</strong></div>
                  </div>
                  <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                    {result.passed_file_url && (
                      <NeuBtn small success icon="✔" onClick={() => window.open(result.passed_file_url, "_blank")}>
                        View Passed Records (.dat)
                      </NeuBtn>
                    )}
                    {result.failed_file_url && (
                      <NeuBtn small danger icon="✕" onClick={() => window.open(result.failed_file_url, "_blank")}>
                        View Failed Records (.xlsx)
                      </NeuBtn>
                    )}
                  </div>
                </>
              )}
            </div>
          )}

          {tab === 1 && le && (
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div style={{ fontFamily: "'Instrument Sans', sans-serif", fontSize: 14, color: P.ink }}>
                {le.message}
              </div>
              {le.inconsistent_records?.length > 0 ? (
                <div style={{ borderRadius: 8, overflow: "hidden", border: "1px solid rgba(192,57,43,.18)" }}>
                  <div style={{ overflowX: "auto" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: "'DM Mono', monospace", fontSize: 11 }}>
                      <thead>
                        <tr style={{ background: "rgba(192,57,43,.06)" }}>
                          {["PersonNumber", "EffectiveStartDate", "ActionCode", "LegalEmployer", "Scenario", "Details"].map(h => (
                            <th key={h} style={{ padding: "8px 10px", textAlign: "left", fontSize: 9, letterSpacing: ".1em",
                              textTransform: "uppercase", color: P.warmDrk, borderBottom: "1px solid rgba(0,0,0,.1)", whiteSpace: "nowrap" }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {le.inconsistent_records.map((r, i) => (
                          <tr key={i} style={{ background: i % 2 === 0 ? "transparent" : "rgba(0,0,0,.02)" }}>
                            <td style={{ padding: "6px 10px", borderBottom: "1px solid rgba(0,0,0,.05)" }}>{r.PersonNumber}</td>
                            <td style={{ padding: "6px 10px", borderBottom: "1px solid rgba(0,0,0,.05)" }}>{r.EffectiveStartDate || "N/A"}</td>
                            <td style={{ padding: "6px 10px", borderBottom: "1px solid rgba(0,0,0,.05)" }}>{r.ActionCode || "N/A"}</td>
                            <td style={{ padding: "6px 10px", borderBottom: "1px solid rgba(0,0,0,.05)" }}>{r.LegalEmployerName}</td>
                            <td style={{ padding: "6px 10px", borderBottom: "1px solid rgba(0,0,0,.05)" }}>{r.Scenario}</td>
                            <td style={{ padding: "6px 10px", borderBottom: "1px solid rgba(0,0,0,.05)" }}>{r.Status}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 12, color: P.green }}>No inconsistencies found.</div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: "14px 22px", background: "linear-gradient(160deg, #d0c8b8, #c0b8a8)",
          boxShadow: `${BS.insetSm}, 0 -2px 8px rgba(0,0,0,.1)`, borderTop: "1px solid rgba(0,0,0,.08)",
          display: "flex", justifyContent: "flex-end", flexShrink: 0,
        }}>
          <NeuBtn small onClick={onClose}>Close</NeuBtn>
        </div>
      </div>
    </div>
  );
};

/* ─────────────────────────────────────────
   SOURCE KEYS DIALOG
───────────────────────────────────────── */
const SourceKeysDialog = ({ skippedColumns, allAttributes, mapping, onMappingChange, onClose }) => {
  const [localMapping, setLocalMapping] = useState(mapping || {});

  const updateKey = (col, val) => {
    setLocalMapping(prev => ({ ...prev, [col]: val }));
  };

  const handleSave = () => {
    onMappingChange(localMapping);
    onClose();
  };

  return (
    <div className="hdl-modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="hdl-modal" style={{ maxWidth: 780 }}>
        <div style={{
          padding: "18px 22px", background: "linear-gradient(160deg, #d0c8b8, #c0b8a8)",
          boxShadow: BS.insetSm, borderBottom: "1px solid rgba(0,0,0,.08)",
          display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0,
        }}>
          <span style={{ fontFamily: "'DM Serif Display', serif", fontSize: 18, color: P.ink }}>Source Keys Editor</span>
          <button onClick={onClose} style={{
            width: 30, height: 30, borderRadius: 7,
            background: "linear-gradient(145deg, #ddd6c6, #c8bfad)", boxShadow: BS.raisedSm,
            border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
            fontFamily: "'DM Mono', monospace", fontSize: 14, color: P.inkLt,
          }}>✕</button>
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: "20px 22px" }}>
          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: ".12em", textTransform: "uppercase", color: P.warmDrk, marginBottom: 14 }}>
            Map Source Key Columns ({skippedColumns.length} columns)
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {skippedColumns.map((col) => (
              <div key={col} style={{
                display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", borderRadius: 9,
                background: "linear-gradient(145deg, #ccc4b4, #c4bcac)", boxShadow: BS.insetSm,
              }}>
                <div style={{ flex: 1, fontFamily: "'DM Mono', monospace", fontSize: 12, color: P.ink, minWidth: 120 }}>{col}</div>
                <span style={{ fontSize: 14, color: P.warmDrk }}>→</span>
                <input type="text" value={localMapping[col] || ""} onChange={(e) => updateKey(col, e.target.value)}
                  placeholder="Enter source key value…"
                  style={{
                    flex: 2, padding: "8px 12px", borderRadius: 7, border: "none", outline: "none",
                    background: "linear-gradient(145deg, #ddd6c6, #ccc4b4)", boxShadow: BS.insetSm,
                    fontFamily: "'DM Mono', monospace", fontSize: 12, color: P.ink,
                  }} />
              </div>
            ))}
            {skippedColumns.length === 0 && (
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 12, color: P.warmDrk, fontStyle: "italic", padding: 20, textAlign: "center" }}>
                No source key columns detected. Upload a DAT file first.
              </div>
            )}
          </div>
        </div>

        <div style={{
          padding: "14px 22px", background: "linear-gradient(160deg, #d0c8b8, #c0b8a8)",
          boxShadow: `${BS.insetSm}, 0 -2px 8px rgba(0,0,0,.1)`, borderTop: "1px solid rgba(0,0,0,.08)",
          display: "flex", justifyContent: "flex-end", gap: 10, flexShrink: 0,
        }}>
          <NeuBtn small onClick={onClose}>Cancel</NeuBtn>
          <NeuBtn small accent onClick={handleSave}>Save Keys</NeuBtn>
        </div>
      </div>
    </div>
  );
};

/* ─────────────────────────────────────────
   ROWS PER PAGE
───────────────────────────────────────── */
const ROWS_PER_PAGE_OPTIONS = [10, 25, 50];

/* ═══════════════════════════════════════════
   MAIN: HDL COMPONENT
═══════════════════════════════════════════ */
export default function HDL() {
  const location = useLocation();
  const navigate = useNavigate();

  /* ── Core state ── */
  const [selectedNode, setSelectedNode] = useState(null);
  const [attributes, setAttributes] = useState([]);
  const [attributeData, setAttributeData] = useState({});
  const [allLookups, setAllLookups] = useState({});
  const [allMapping, setAllMapping] = useState({});
  const [loadingAttrs, setLoadingAttrs] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [instanceName, setInstanceName] = useState("");

  /* ── Table pagination ── */
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  /* ── Stepper ── */
  const [currentStep, setCurrentStep] = useState(1);
  const [completedSteps, setCompletedSteps] = useState(new Set());

  /* ── Setup data (from backend) ── */
  const [hireActions, setHireActions] = useState([]);
  const [rehireActions, setRehireActions] = useState([]);
  const [termActions, setTermActions] = useState([]);
  const [globalTransferActions, setGlobalTransferActions] = useState([]);
  const [assignmentStatusRules, setAssignmentStatusRules] = useState([]); // eslint-disable-line no-unused-vars

  /* ── Excel ── */
  const [excelFile, setExcelFile] = useState(null);
  const [isTransformed, setIsTransformed] = useState(false);
  const [transformationLoading, setTransformationLoading] = useState(false);

  /* ── DAT ── */
  const [datFile, setDatFile] = useState(null);
  const [skippedColumns, setSkippedColumns] = useState([]);
  const [datProcessingLoading, setDatProcessingLoading] = useState(false);

  /* ── Source keys ── */
  const [sourceKeysOpen, setSourceKeysOpen] = useState(false);
  const [sourceKeysMapping, setSourceKeysMapping] = useState({});

  /* ── Validation ── */
  const [validateLoading, setValidateLoading] = useState(false);
  const [isValidated, setIsValidated] = useState(false);
  const [validationResult, setValidationResult] = useState(null);
  const [validationDialogOpen, setValidationDialogOpen] = useState(false);

  /* ── Delta report ── */
  const [deltaReportFetched, setDeltaReportFetched] = useState(false);
  const [deltaLoading, setDeltaLoading] = useState(false);

  /* ── NLP ── */
  const [pythonFileName, setPythonFileName] = useState("");

  /* ── Transaction flag ── */
  const [isTransaction, setIsTransaction] = useState(false);

  /* ── Toast ── */
  const [toast, setToast] = useState(null);
  const showToast = useCallback((message, severity = "info") => {
    setToast({ message, severity, key: Date.now() });
  }, []);

  /* ── Refs ── */
  const headerRef = useRef(null);
  const tableRef = useRef(null);
  const excelFileRef = useRef(null);

  /* ═══════════════════════════════════════
     DERIVED VALUES
  ═══════════════════════════════════════ */
  const componentName = useMemo(() => {
    if (!selectedNode) return "";
    return selectedNode.name || selectedNode.dat_template || "";
  }, [selectedNode]);

  const globalBoName = useMemo(() => {
    return selectedNode?.level_6 || "";
  }, [selectedNode]);

  const hierarchy = useMemo(() => {
    if (!selectedNode) return [];
    const h = [];
    for (let i = 1; i <= 10; i++) {
      const v = selectedNode[`level_${i}`];
      if (v) h.push(v);
    }
    if (selectedNode.name && !h.includes(selectedNode.name)) h.push(selectedNode.name);
    return h;
  }, [selectedNode]);

  const breadcrumbs = hierarchy;

  const datFileName = useMemo(() => {
    if (!selectedNode) return null;
    const t = selectedNode.dat_template;
    if (!t) return null;
    return t.endsWith(".dat") ? t : `${t}.dat`;
  }, [selectedNode]);

  /* ═══════════════════════════════════════
     LOAD FROM NAVIGATION
  ═══════════════════════════════════════ */
  useEffect(() => {
    if (location.state?.nodeData) {
      setSelectedNode(location.state.nodeData);
    }
  }, [location.state]);

  /* Reset on node change */
  useEffect(() => {
    setAttributes([]);
    setAttributeData({});
    setAllLookups({});
    setAllMapping({});
    setLoadingAttrs(false);
    setPage(0);
    setCurrentStep(1);
    setCompletedSteps(new Set());
    setExcelFile(null);
    setIsTransformed(false);
    setDatFile(null);
    setSkippedColumns([]);
    setSourceKeysMapping({});
    setValidateLoading(false);
    setIsValidated(false);
    setValidationResult(null);
    setValidationDialogOpen(false);
    setDeltaReportFetched(false);
    setPythonFileName("");
    setIsTransaction(false);
    setHireActions([]);
    setRehireActions([]);
    setTermActions([]);
    setGlobalTransferActions([]);
    setAssignmentStatusRules([]);
  }, [selectedNode]);

  /* ── Detect transaction type ── */
  useEffect(() => {
    if (!selectedNode) return;
    const levels = [selectedNode.level_3, selectedNode.level_4, selectedNode.level_5];
    setIsTransaction(levels.some(l => l && l.includes("Transactional Data")));
  }, [selectedNode]);

  /* ── Header animation ── */
  useEffect(() => {
    if (!selectedNode) return;
    const raf = requestAnimationFrame(() => {
      if (headerRef.current) {
        gsap.set(headerRef.current, { opacity: 0, y: -20 });
        gsap.to(headerRef.current, { y: 0, opacity: 1, duration: .5, ease: "power3.out" });
      }
      if (tableRef.current) {
        gsap.set(tableRef.current, { opacity: 0, y: 20 });
        gsap.to(tableRef.current, { y: 0, opacity: 1, duration: .55, delay: .1, ease: "power3.out" });
      }
    });
    return () => cancelAnimationFrame(raf);
  }, [selectedNode]);

  /* ═══════════════════════════════════════
     FETCH SETUP DATA
     GET /api/hdl/get-setup/{customerName}/{instanceName}
  ═══════════════════════════════════════ */
  useEffect(() => {
    if (!selectedNode || !customerName || !instanceName) return;
    (async () => {
      try {
        const res = await api.get(`hdl/get-setup/${encodeURIComponent(customerName)}/${encodeURIComponent(instanceName)}`);
        const data = res.data;
        setHireActions(data.hireActions || []);
        setRehireActions(data.rehireActions || []);
        setTermActions(data.termActions || []);
        setGlobalTransferActions(data.globalTransferActions || []);
        setAssignmentStatusRules(data.assignmentStatusRules || []);
      } catch {
        setHireActions([]);
        setRehireActions([]);
        setTermActions([]);
        setGlobalTransferActions([]);
        setAssignmentStatusRules([]);
      }
    })();
  }, [selectedNode, customerName, instanceName]);

  /* ═══════════════════════════════════════
     AUTO-UPLOAD DAT FILE
     POST /api/hdl/upload-dat  (FormData: datFile)
     then POST /api/hdl/mandatory/batch
     then POST /api/hdl/lookup/batch
     then POST /api/hdl/data-transformation
  ═══════════════════════════════════════ */
  const processDatFile = useCallback(async (file) => {
    if (!file || !componentName) return;
    setDatProcessingLoading(true);
    setDatFile(file);
    setAttributes([]);
    setAttributeData({});
    setAllLookups({});
    setAllMapping({});
    setIsValidated(false);

    try {
      /* 1) Upload DAT */
      const datForm = new FormData();
      datForm.append("datFile", file);
      const datRes = await api.post("hdl/upload-dat", datForm);
      const cleanAttrs = (datRes.data.non_skipped_columns || []).map(a => a.trim());
      setSkippedColumns(datRes.data.skipped_columns || []);

      if (!cleanAttrs.length) {
        showToast("No attributes found in the DAT file.", "warning");
        setDatProcessingLoading(false);
        return;
      }

      /* 2) Fetch mandatory, lookups, data-transformation in parallel */
      const [mandRes, lookupRes, transRes] = await Promise.all([
        api.post("hdl/mandatory/batch", {
          componentName, attributes: cleanAttrs, customerName, instanceName,
        }),
        api.post("hdl/lookup/batch", {
          Attributes: cleanAttrs, componentName,
          globalComponentName: globalBoName,
          transaction: isTransaction,
          customerName, instanceName,
        }),
        api.post("hdl/data-transformation", {
          Attributes: cleanAttrs,
          componentName,
        }),
      ]);

      const mandatory = mandRes.data.mandatory || {};
      const lookups = lookupRes.data.lookups || {};
      const defaultCodeNames = lookupRes.data.default_code_names || {};
      const mapping = transRes.data.mapping || {};

      setAllLookups(lookups);
      setAllMapping(mapping);

      /* 3) Build combined attribute data */
      const combined = {};
      cleanAttrs.forEach(attr => {
        const m = mandatory[attr] || {};
        const lv = Array.isArray(lookups[attr]) ? lookups[attr] : [];
        const lookupName = defaultCodeNames[attr] || lv[0]?.CODE_Name || "";
        const transformation = mapping[attr] !== undefined ? mapping[attr] : "";

        combined[attr] = {
          required: m.mandatory || false,
          dataType: m.data_type || "VARCHAR",
          helperText: m.helper_text || "",
          keyValues: m.key_values === true || (Array.isArray(m.key_values) && m.key_values.length > 0),
          lookupValues: lv,
          lookupName,
          codeName: defaultCodeNames[attr] || "",
          transformation,
          includeInDat: true,
        };
      });

      setAttributes(cleanAttrs);
      setAttributeData(combined);
      setPage(0);
      showToast("DAT file processed and data loaded successfully!", "success");
    } catch (err) {
      console.error("DAT processing failed:", err);
      const msg = err.response?.data?.detail || err.response?.data?.error || err.message || "DAT processing failed";
      showToast(msg, "error");
      setAttributes([]);
      setAttributeData({});
    } finally {
      setDatProcessingLoading(false);
    }
  }, [componentName, customerName, instanceName, globalBoName, isTransaction, showToast]);

  /* Auto-upload DAT from static files */
  useEffect(() => {
    if (!selectedNode?.dat_template || datFile) return;
    let fn = selectedNode.dat_template;
    if (!fn.endsWith(".dat")) fn += ".dat";
    (async () => {
      try {
        const res = await fetch(`${BASE_URL}/static/${fn}`);
        if (!res.ok) return;
        const blob = await res.blob();
        const f = new File([blob], fn, { type: "text/plain" });
        processDatFile(f);
      } catch { /* silent */ }
    })();
  }, [selectedNode, datFile, processDatFile]);

  /* ═══════════════════════════════════════
     AUTO-POPULATE EXCEL
     POST /excel { customerName, InstanceName, parent, filename }
  ═══════════════════════════════════════ */
  useEffect(() => {
    if (!selectedNode || excelFile) return;
    const parent = selectedNode.level_6;
    const filename = `${selectedNode.name}.xlsx`;
    if (!parent || !customerName || !instanceName) return;

    (async () => {
      try {
        const res = await fetch(`${BASE_URL}/excel`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            customerName,
            InstanceName: instanceName,
            parent,
            filename: filename.split(/[/\\]/).pop(),
          }),
        });
        if (!res.ok) return;
        const blob = await res.blob();
        const f = new File([blob], filename, { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
        setExcelFile(f);
        showToast(`Auto-selected Excel: ${filename}`, "info");
      } catch { /* silent */ }
    })();
  }, [selectedNode, excelFile, customerName, instanceName, showToast]);

  /* ── Set names from node ── */
  useEffect(() => {
    if (!selectedNode) return;
    setCustomerName(selectedNode.level_1 || location.state?.customerName || "");
    setInstanceName(selectedNode.level_2 || location.state?.instanceName || "");
  }, [selectedNode, location.state]);

  /* ── Load source keys from sessionStorage ── */
  useEffect(() => {
    if (!componentName) return;
    try {
      const stored = sessionStorage.getItem(`sourceKeys_${componentName}`);
      if (stored) setSourceKeysMapping(JSON.parse(stored));
      else setSourceKeysMapping({});
    } catch { setSourceKeysMapping({}); }
  }, [componentName]);

  /* ── Persist source keys ── */
  useEffect(() => {
    if (!componentName || !Object.keys(sourceKeysMapping).length) return;
    sessionStorage.setItem(`sourceKeys_${componentName}`, JSON.stringify(sourceKeysMapping));
  }, [sourceKeysMapping, componentName]);

  /* ═══════════════════════════════════════
     PAGINATION
  ═══════════════════════════════════════ */
  const totalRows = attributes.length;
  const totalPages = Math.max(1, Math.ceil(totalRows / rowsPerPage));
  const safePage = Math.min(page, totalPages - 1);
  const pageStart = safePage * rowsPerPage;
  const pageEnd = Math.min(pageStart + rowsPerPage, totalRows);
  const visibleRows = attributes.slice(pageStart, pageEnd);

  /* ═══════════════════════════════════════
     HELPERS
  ═══════════════════════════════════════ */
  const updateAttr = useCallback((attr, field, val) => {
    setAttributeData(prev => ({ ...prev, [attr]: { ...prev[attr], [field]: val } }));
  }, []);

  /* ═══════════════════════════════════════
     TRANSFORM CUSTOMER EXCEL
     POST /api/hdl/transform-customer-excel (FormData: raw_excel_file)
  ═══════════════════════════════════════ */
  const handleTransformExcel = useCallback(async () => {
    if (!excelFile) { showToast("Please select an Excel file first.", "warning"); return; }
    setTransformationLoading(true);
    showToast("Applying customer value transformations…", "info");
    try {
      const formData = new FormData();
      formData.append("raw_excel_file", excelFile);
      const res = await api.post("hdl/transform-customer-excel", formData, { responseType: "blob", timeout: 60000 });

      const cd = res.headers["content-disposition"];
      let filename = "transformed_customer_data.xlsx";
      if (cd) {
        const match = cd.match(/filename="([^"]+)"/);
        if (match?.[1]) filename = match[1];
      }
      const blob = new Blob([res.data], { type: res.headers["content-type"] });
      const tf = new File([blob], filename, { type: res.headers["content-type"] });
      setExcelFile(tf);
      setIsTransformed(true);
      showToast("Excel file transformed successfully!", "success");
    } catch (err) {
      console.error("Transform error:", err);
      showToast(err.response?.data?.detail || err.message || "Transformation failed", "error");
      setIsTransformed(false);
    } finally {
      setTransformationLoading(false);
    }
  }, [excelFile, showToast]);

  /* ═══════════════════════════════════════
     LEGAL EMPLOYER CROSS-FILE VALIDATION
     POST /api/hdl/bulk/cross-file/legalEmployer/validate
  ═══════════════════════════════════════ */
  const validateLegalEmployer = useCallback(async () => {
    if (!excelFile) return null;
    const cols = attributes.map(a => a.toLowerCase());
    const needed = ["personnumber", "actioncode", "legalemployername"];
    if (!needed.every(c => cols.includes(c))) return null;

    try {
      const formData = new FormData();
      formData.append("file", excelFile);
      formData.append("hire_action_codes", JSON.stringify(hireActions));
      formData.append("termination_action_codes", JSON.stringify(termActions));
      formData.append("allowed_le_change_action_codes", JSON.stringify(globalTransferActions));

      const res = await api.post("hdl/bulk/cross-file/legalEmployer/validate", formData);
      const recs = res.data.inconsistent_records || [];
      return {
        message: res.data.message || "Legal Employer validation completed.",
        inconsistent_records: recs,
        status: recs.length > 0 ? "failed" : "success",
      };
    } catch (err) {
      return {
        message: `Error: ${err.response?.data?.detail || err.message}`,
        inconsistent_records: [],
        status: "failed",
        error: err.message,
      };
    }
  }, [excelFile, attributes, hireActions, termActions, globalTransferActions]);

  /* ═══════════════════════════════════════
     VALIDATE DATA
     POST /api/hdl/validate-data (JSON payload)
  ═══════════════════════════════════════ */
  const handleValidateData = useCallback(async () => {
    if (!attributes.length) { showToast("No data to validate. Upload a DAT file first.", "warning"); return; }
    if (!excelFile) { showToast("Please upload an Excel file to validate.", "warning"); return; }

    setValidateLoading(true);
    setIsValidated(false);
    setValidationResult(null);

    /* 1) Legal employer cross-file validation */
    const leResult = await validateLegalEmployer();

    /* 2) Read Excel as base64 */
    try {
      const base64 = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result.split(",")[1]);
        reader.onerror = reject;
        reader.readAsDataURL(excelFile);
      });

      /* 3) Build payload — EXACT match to old HDL */
      const payload = {
        pyFileName: pythonFileName,
        componentName,
        attributes: attributes.map(attr => {
          const d = attributeData[attr] || {};
          return {
            Attributes: attr,
            required: d.required || false,
            data_type: d.dataType || "VARCHAR",
            keyValues: d.keyValues || false,
            LookUp_data: d.lookupName || "",
            CodeName: d.codeName || "",
            Data_Transformation: d.transformation || "",
            includeInDatFileGeneration: d.includeInDat !== false,
          };
        }),
        allLookups: JSON.parse(JSON.stringify(allLookups, (key, value) => {
          if (key === "Value" && typeof value !== "string") return String(value);
          return value;
        })),
        allMapping,
        excelFile: base64,
        globalBoName,
        sourceKeys: sourceKeysMapping,
        datColumnOrder: attributes.filter(a => attributeData[a]?.includeInDat !== false),
        hireActions,
        rehireActions,
        terminationActions: termActions,
        globalTransferActions,
        customerName,
        InstanceName: instanceName,
        DeltaLoad: deltaReportFetched,
      };

      const res = await api.post("hdl/validate-data", payload, { timeout: 200000 });

      const combined = {
        mainValidation: res.data,
        legalEmployerValidation: leResult,
        status: "success",
        message: "Validation successful!",
        passed_file_url: res.data.passed_file_url || null,
        failed_file_url: res.data.failed_file_url || null,
      };

      if (res.data.status === "failed" || (leResult && leResult.status === "failed")) {
        combined.status = "failed";
        combined.message = "Validation completed with errors.";
        showToast("Validation completed with errors.", "error");
        setIsValidated(false);
      } else {
        showToast("Validation successful!", "success");
        setIsValidated(true);
      }

      /* Update session storage */
      try {
        const sess = JSON.parse(sessionStorage.getItem("validationSession") || "{}");
        sess[componentName] = { validated: true, fileName: (combined.passed_file_url || "").split("/").pop() };
        sessionStorage.setItem("validationSession", JSON.stringify(sess));
      } catch { /* ignore */ }

      setValidationResult(combined);
      setValidationDialogOpen(true);
    } catch (err) {
      console.error("Validation error:", err);
      const msg = err.response?.data?.detail || err.message || "Validation failed";
      showToast(`Validation failed: ${msg}`, "error");
      setIsValidated(false);
      setValidationResult({
        status: "failed", message: `Validation failed: ${msg}`,
        mainValidation: null, legalEmployerValidation: leResult,
      });
      setValidationDialogOpen(true);
    } finally {
      setValidateLoading(false);
    }
  }, [attributes, attributeData, allLookups, allMapping, excelFile, componentName, globalBoName,
    sourceKeysMapping, pythonFileName, hireActions, rehireActions, termActions, globalTransferActions,
    customerName, instanceName, deltaReportFetched, validateLegalEmployer, showToast]);

  /* ═══════════════════════════════════════
     FETCH DELTA REPORT
     GET /api/load/delta_report?customerName=&instanceName=&componentName=
  ═══════════════════════════════════════ */
  const handleFetchDeltaReport = useCallback(async () => {
    setDeltaLoading(true);
    try {
      const res = await api.get(`load/delta_report`, {
        params: { customerName, instanceName, componentName },
      });
      if (res.data && res.data.status !== "error") {
        setDeltaReportFetched(true);
        showToast("Delta report fetched successfully.", "success");
      } else {
        setDeltaReportFetched(false);
        showToast(res.data?.message || "No delta report found.", "info");
      }
    } catch {
      setDeltaReportFetched(false);
      showToast("Error fetching delta report.", "error");
    } finally {
      setDeltaLoading(false);
    }
  }, [customerName, instanceName, componentName, showToast]);

  /* ═══════════════════════════════════════
     DOWNLOAD TRANSFORMED EXCEL
  ═══════════════════════════════════════ */
  const handleDownloadExcel = useCallback(() => {
    if (!excelFile) return;
    const url = URL.createObjectURL(excelFile);
    const a = document.createElement("a");
    a.href = url;
    a.download = excelFile.name || "transformed_data.xlsx";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast("Download initiated.", "success");
  }, [excelFile, showToast]);

  /* ── Stepper navigation ── */
  const stepNext = () => {
    setCompletedSteps(prev => new Set([...prev, currentStep]));
    if (currentStep < STEPS.length) setCurrentStep(s => s + 1);
  };
  const stepBack = () => { if (currentStep > 1) setCurrentStep(s => s - 1); };

  /* ═══════════════════════════════════════
     STEP CONTENT RENDERER
  ═══════════════════════════════════════ */
  const renderStepContent = () => {
    switch (currentStep) {
      /* ── Step 1: Source Keys ── */
      case 1:
        return (
          <div style={{ padding: "20px 24px" }}>
            <div style={{ fontFamily: "'Instrument Sans', sans-serif", fontSize: 13, color: P.inkLt, marginBottom: 20, lineHeight: 1.55 }}>
              Define source keys for mapping attributes. These keys map the identifier columns from your DAT file to their values.
            </div>
            <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
              <NeuBtn accent icon="🗝" onClick={() => setSourceKeysOpen(true)}
                disabled={!attributes.length}>
                Open Source Keys Editor
              </NeuBtn>
              {Object.keys(sourceKeysMapping).length > 0 && (
                <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: P.green }}>
                  ✔ {Object.keys(sourceKeysMapping).length} key(s) mapped
                </span>
              )}
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 24, paddingTop: 16, borderTop: "1px solid rgba(0,0,0,.07)" }}>
              <NeuBtn small accent onClick={stepNext}>Next →</NeuBtn>
            </div>
          </div>
        );

      /* ── Step 2: Transform Excel ── */
      case 2:
        return (
          <div style={{ padding: "20px 24px" }}>
            <div style={{ fontFamily: "'Instrument Sans', sans-serif", fontSize: 13, color: P.inkLt, marginBottom: 20, lineHeight: 1.55 }}>
              Upload and transform your customer Excel file. This step is <strong>mandatory</strong>.
            </div>
            <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
              {!excelFile && (
                <>
                  <input ref={excelFileRef} type="file" accept=".xlsx,.xls" style={{ display: "none" }}
                    onChange={e => {
                      const f = e.target.files?.[0];
                      if (f && (f.name.endsWith(".xlsx") || f.name.endsWith(".xls"))) {
                        setExcelFile(f); setIsTransformed(false);
                        showToast(`Selected Excel: ${f.name}`, "info");
                      }
                    }} />
                  <NeuBtn icon="📂" onClick={() => excelFileRef.current?.click()}>Upload Excel</NeuBtn>
                </>
              )}
              <NeuBtn accent icon="⚡" onClick={handleTransformExcel}
                disabled={!excelFile || transformationLoading || isTransformed}>
                {transformationLoading ? "Transforming…" : "Transform Customer Excel"}
              </NeuBtn>
              {excelFile && (
                <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: isTransformed ? P.green : P.copper }}>
                  {isTransformed ? "✔ " : "📎 "}{excelFile.name}
                </span>
              )}
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 24, paddingTop: 16, borderTop: "1px solid rgba(0,0,0,.07)" }}>
              <NeuBtn small onClick={stepBack}>← Back</NeuBtn>
              <NeuBtn small accent={isTransformed} onClick={stepNext} disabled={!isTransformed}>Next →</NeuBtn>
            </div>
          </div>
        );

      /* ── Step 3: NLP Rules ── */
      case 3:
        return (
          <div style={{ padding: "20px 24px" }}>
            <div style={{ fontFamily: "'Instrument Sans', sans-serif", fontSize: 13, color: P.inkLt, marginBottom: 20, lineHeight: 1.55 }}>
              Configure NLP rules for intelligent data transformation and field mapping. This step is <em>optional</em>.
            </div>
            <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
              <NeuBtn accent icon="⚙" onClick={() => showToast("NLP Chat interface coming soon.", "info")}>
                Open NLP Chat
              </NeuBtn>
              {pythonFileName && (
                <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: P.green }}>
                  ✔ Python File: {pythonFileName}
                </span>
              )}
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 24, paddingTop: 16, borderTop: "1px solid rgba(0,0,0,.07)" }}>
              <NeuBtn small onClick={stepBack}>← Back</NeuBtn>
              <NeuBtn small accent onClick={stepNext}>Next →</NeuBtn>
            </div>
          </div>
        );

      /* ── Step 4: Fetch Oracle / Delta Data ── */
      case 4:
        return (
          <div style={{ padding: "20px 24px" }}>
            <div style={{ fontFamily: "'Instrument Sans', sans-serif", fontSize: 13, color: P.inkLt, marginBottom: 20, lineHeight: 1.55 }}>
              Fetch Delta Report from Oracle for data integrity checks.
              {componentName?.toLowerCase() !== "assignment" && (
                <span style={{ display: "block", marginTop: 6, fontSize: 11, color: P.warmDrk }}>
                  Delta report only available for Assignment component. You may skip this step.
                </span>
              )}
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <NeuBtn accent={!deltaReportFetched} success={deltaReportFetched} icon={deltaReportFetched ? "✔" : "🔗"}
                onClick={handleFetchDeltaReport}
                disabled={deltaLoading || componentName?.toLowerCase() !== "assignment"}>
                {deltaLoading ? "Fetching…" : deltaReportFetched ? "Report Fetched" : "Fetch Delta Report"}
              </NeuBtn>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 24, paddingTop: 16, borderTop: "1px solid rgba(0,0,0,.07)" }}>
              <NeuBtn small onClick={stepBack}>← Back</NeuBtn>
              <NeuBtn small accent onClick={stepNext}
                disabled={componentName?.toLowerCase() === "assignment" && !deltaReportFetched}>
                Next →
              </NeuBtn>
            </div>
          </div>
        );

      /* ── Step 5: Validate ── */
      case 5:
        return (
          <div style={{ padding: "20px 24px" }}>
            <div style={{ fontFamily: "'Instrument Sans', sans-serif", fontSize: 13, color: P.inkLt, marginBottom: 20, lineHeight: 1.55 }}>
              Run comprehensive validation checks on all loaded data against HDL requirements.
            </div>
            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <NeuBtn accent={!isValidated} success={isValidated} icon={isValidated ? "✔" : "✓"}
                onClick={handleValidateData}
                disabled={!attributes.length || validateLoading || !excelFile}>
                {validateLoading ? "Validating…" : isValidated ? "Validated" : "Validate Data"}
              </NeuBtn>
              {validateLoading && (
                <div style={{
                  width: 18, height: 18, borderRadius: "50%",
                  border: `2px solid ${P.copper}`, borderTopColor: "transparent",
                  animation: "hdl-spin .7s linear infinite",
                }} />
              )}
            </div>
            <div style={{ display: "flex", justifyContent: "flex-start", marginTop: 24, paddingTop: 16, borderTop: "1px solid rgba(0,0,0,.07)" }}>
              <NeuBtn small onClick={stepBack}>← Back</NeuBtn>
            </div>
          </div>
        );

      default: return null;
    }
  };

  /* ═══════════════════════════════════════
     EMPTY STATE
  ═══════════════════════════════════════ */
  if (!selectedNode) {
    return (
      <div className="hdl-root" style={{ alignItems: "center", justifyContent: "center", gap: 20 }}>
        <div style={{
          width: 80, height: 80, borderRadius: "50%",
          background: "linear-gradient(145deg, #ddd6c6, #c0b8a8)", boxShadow: BS.raised,
          display: "flex", alignItems: "center", justifyContent: "center", fontSize: 34,
        }}>◈</div>
        <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 24, color: P.ink }}>No HDL Selected</div>
        <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 12, color: P.warmDrk, letterSpacing: ".04em", textAlign: "center", maxWidth: 300 }}>
          Click a leaf node in the sidebar to view HDL component details
        </div>
        <NeuBtn onClick={() => navigate("/")} small>← Back to Dashboard</NeuBtn>
      </div>
    );
  }

  /* ═══════════════════════════════════════
     FULL RENDER
  ═══════════════════════════════════════ */
  return (
    <div className="hdl-root">
      <div className="hdl-body">

        {/* ════════════════════════════════
            SECTION 1 — HEADER CARD
        ════════════════════════════════ */}
        <div style={{ padding: "20px 24px 0" }}>
          <div ref={headerRef}>
            <SectionCard>
              <Screw style={{ top: 10, left: 10 }} angle={45} />
              <Screw style={{ top: 10, right: 10 }} angle={135} />
              <div style={{
                display: "flex", alignItems: "flex-start", justifyContent: "space-between",
                gap: 20, padding: "20px 24px", flexWrap: "wrap",
              }}>
                {/* LEFT */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 24, color: P.copper, marginBottom: 12 }}>
                    {selectedNode.name} Component
                  </div>
                  {/* Breadcrumb */}
                  <div style={{
                    display: "flex", alignItems: "center", flexWrap: "wrap", gap: 4,
                    padding: "10px 14px", borderRadius: 9,
                    background: "linear-gradient(145deg, #ccc4b4, #c4bcac)", boxShadow: BS.insetSm,
                    width: "fit-content",
                  }}>
                    {breadcrumbs.map((crumb, i) => (
                      <React.Fragment key={i}>
                        {i === breadcrumbs.length - 1 ? (
                          <span style={{
                            padding: "3px 10px", borderRadius: 5,
                            background: "linear-gradient(135deg, #7a9cc8, #3a5c8a)", boxShadow: BS.raisedSm,
                            fontFamily: "'Instrument Sans', sans-serif", fontSize: 11, fontWeight: 700,
                            color: "#f0f4ff", letterSpacing: ".04em",
                          }}>{crumb}</span>
                        ) : (
                          <>
                            <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: P.warmDrk }}>{crumb}</span>
                            <span style={{ color: P.warmDrk, opacity: .5, fontSize: 12 }}>›</span>
                          </>
                        )}
                      </React.Fragment>
                    ))}
                  </div>
                </div>
                {/* RIGHT */}
                <div style={{ display: "flex", flexDirection: "column", gap: 12, alignItems: "flex-end", flexShrink: 0 }}>
                  <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                    <NeuBtn accent icon="👁" onClick={() => {
                      if (selectedNode?.dat_template) {
                        let fn = selectedNode.dat_template;
                        if (!fn.endsWith(".dat")) fn += ".dat";
                        window.open(`${BASE_URL}/static/${fn}`, "_blank", "noopener,noreferrer");
                      } else {
                        showToast("No DAT template available.", "info");
                      }
                    }} disabled={!selectedNode?.dat_template}>
                      View Existing HDL Template
                    </NeuBtn>
                    <NeuBtn icon="☁" onClick={() => {
                      const inp = document.createElement("input");
                      inp.type = "file"; inp.accept = ".dat";
                      inp.onchange = (e) => {
                        const f = e.target.files?.[0];
                        if (f?.name.endsWith(".dat")) processDatFile(f);
                        else showToast("Please upload a valid .dat file.", "warning");
                      };
                      inp.click();
                    }}>Upload Modified HDL Template</NeuBtn>
                  </div>
                  {datFileName && <div className="hdl-file-pill"><span style={{ fontSize: 14 }}>📄</span><span>{datFileName}</span></div>}
                </div>
              </div>
            </SectionCard>
          </div>
        </div>

        {/* ════════════════════════════════
            SECTION 2 — ATTRIBUTES TABLE
        ════════════════════════════════ */}
        <div style={{ padding: "16px 24px 0" }}>
          <div ref={tableRef}>
            <SectionCard style={{ display: "flex", flexDirection: "column" }}>
              {/* Table header */}
              <div style={{
                padding: "16px 20px", display: "flex", alignItems: "center", justifyContent: "space-between",
                background: "linear-gradient(160deg, #d0c8b8, #c0b8a8)", borderBottom: "1px solid rgba(0,0,0,.08)", flexShrink: 0,
              }}>
                <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 18, color: P.ink }}>
                  {selectedNode.name} Attributes
                </div>
                <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: P.warmDrk, letterSpacing: ".04em" }}>
                  {totalRows} attribute{totalRows !== 1 ? "s" : ""}
                </div>
              </div>

              {/* Loading */}
              {(loadingAttrs || datProcessingLoading) && (
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, padding: "40px 20px" }}>
                  <div style={{
                    width: 20, height: 20, border: `2px solid ${P.copper}`, borderTopColor: "transparent",
                    borderRadius: "50%", animation: "hdl-spin .7s linear infinite",
                  }} />
                  <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 12, color: P.warmDrk }}>Loading attributes…</span>
                </div>
              )}

              {/* Table */}
              {!loadingAttrs && !datProcessingLoading && totalRows > 0 && (
                <div className="hdl-table-wrap" style={{ maxHeight: 480, background: "#f8f6f1" }}>
                  <table style={{ width: "100%", minWidth: 1060, borderCollapse: "collapse", background: "#ffffff", fontFamily: "'Instrument Sans', sans-serif", fontSize: 13 }}>
                    <thead style={{ position: "sticky", top: 0, zIndex: 2, background: "linear-gradient(180deg, #cfc8b8 0%, #c4bcab 100%)" }}>
                      <tr>
                        {[
                          { label: "Attributes", width: "auto" },
                          { label: "Required", width: 90 },
                          { label: "Key Values", width: 90 },
                          { label: "Data Type", width: 120 },
                          { label: "LookUp Value", width: 180 },
                          { label: "Data Transformation", width: 200 },
                          { label: "Include in Dat File Gen", width: 130 },
                        ].map(col => (
                          <th key={col.label} style={{
                            width: col.width === "auto" ? undefined : col.width,
                            padding: "12px 16px",
                            textAlign: ["Required", "Key Values", "Include in Dat File Gen"].includes(col.label) ? "center" : "left",
                            fontFamily: "'DM Mono', monospace", fontSize: 10, fontWeight: 600,
                            letterSpacing: ".08em", textTransform: "uppercase", color: "#4a4032",
                            borderBottom: "1px solid rgba(0,0,0,.12)", whiteSpace: "nowrap",
                          }}>{col.label}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {visibleRows.map((attr, idx) => {
                        const d = attributeData[attr] || {};
                        return (
                          <tr key={attr} className="hdl-row" style={{
                            background: idx % 2 === 0 ? "#ffffff" : "#f4f1eb",
                            borderBottom: "1px solid rgba(0,0,0,.05)",
                          }}>
                            <td style={{ padding: "10px 16px", fontFamily: "'DM Mono', monospace", fontSize: 12, color: P.ink }} title={d.helperText || ""}>{attr}</td>
                            <td style={{ padding: "10px 16px", textAlign: "center" }}>
                              <input className="hdl-check" type="checkbox" checked={Boolean(d.required)} onChange={e => updateAttr(attr, "required", e.target.checked)} />
                            </td>
                            <td style={{ padding: "10px 16px", textAlign: "center" }}>
                              <input className="hdl-check" type="checkbox" checked={Boolean(d.keyValues)} onChange={e => updateAttr(attr, "keyValues", e.target.checked)} />
                            </td>
                            <td style={{ padding: "10px 16px", fontFamily: "'DM Mono', monospace", fontSize: 11, color: P.inkLt }}>{d.dataType || "—"}</td>
                            <td style={{ padding: "10px 16px" }}>
                              {d.lookupName ? <span className="hdl-lookup-pill">{d.lookupName}</span>
                                : <span style={{ color: P.warmDrk, fontSize: 12 }}>—</span>}
                            </td>
                            <td style={{ padding: "10px 16px", fontFamily: "'DM Mono', monospace", fontSize: 11, color: d.transformation ? "#3a6aaa" : P.warmDrk }}>
                              {d.transformation || "—"}
                            </td>
                            <td style={{ padding: "10px 16px", textAlign: "center" }}>
                              <input className="hdl-check" type="checkbox" checked={d.includeInDat !== false} onChange={e => updateAttr(attr, "includeInDat", e.target.checked)} />
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Empty */}
              {!loadingAttrs && !datProcessingLoading && totalRows === 0 && (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, padding: "40px 20px" }}>
                  <span style={{ fontSize: 28, opacity: .5 }}>◇</span>
                  <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 12, color: P.warmDrk }}>No attributes loaded</span>
                </div>
              )}

              {/* Pagination */}
              {!loadingAttrs && !datProcessingLoading && totalRows > 0 && (
                <div style={{
                  padding: "12px 20px", display: "flex", alignItems: "center", justifyContent: "space-between",
                  borderTop: "1px solid rgba(0,0,0,.08)", background: "linear-gradient(160deg, #d8d0c0, #cec6b6)", flexShrink: 0,
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: P.inkLt, letterSpacing: ".04em" }}>Rows per page:</span>
                    <div style={{ display: "flex", gap: 4 }}>
                      {ROWS_PER_PAGE_OPTIONS.map(opt => (
                        <button key={opt} className="hdl-pg-btn" onClick={() => { setRowsPerPage(opt); setPage(0); }}
                          style={{
                            background: rowsPerPage === opt ? "linear-gradient(135deg, #c8843a, #7a4e28)" : "linear-gradient(145deg, #ddd6c6, #c8bfad)",
                            color: rowsPerPage === opt ? "#f8f0e0" : P.inkLt,
                            boxShadow: rowsPerPage === opt ? BS.copper : BS.raisedSm,
                            fontWeight: rowsPerPage === opt ? 700 : 400,
                          }}>{opt}</button>
                      ))}
                    </div>
                  </div>
                  <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: P.warmDrk, letterSpacing: ".04em" }}>
                    {pageStart + 1}–{pageEnd} of {totalRows}
                  </span>
                  <div style={{ display: "flex", gap: 6 }}>
                    <button className="hdl-pg-btn" disabled={safePage === 0} onClick={() => setPage(p => Math.max(0, p - 1))}
                      style={{ background: "linear-gradient(145deg, #ddd6c6, #c8bfad)", color: P.inkLt, boxShadow: BS.raisedSm }}>‹</button>
                    <button className="hdl-pg-btn" disabled={safePage >= totalPages - 1} onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                      style={{ background: "linear-gradient(145deg, #ddd6c6, #c8bfad)", color: P.inkLt, boxShadow: BS.raisedSm }}>›</button>
                  </div>
                </div>
              )}
            </SectionCard>
          </div>
        </div>

        {/* ════════════════════════════════
            SECTION 3 — EXCEL FILES INFO
        ════════════════════════════════ */}
        <div style={{ padding: "16px 24px 0" }}>
          <SectionCard style={{ background: "linear-gradient(135deg, #dfe8f4 0%, #e8e0f4 100%)" }}>
            <div style={{ padding: "16px 24px", display: "flex", alignItems: "center", justifyContent: "center", gap: 12, flexWrap: "wrap" }}>
              <span style={{ fontSize: 22 }}>📁</span>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 16, color: "#3a4a6a" }}>Excel Files</div>
                <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: "#6a7a9a", letterSpacing: ".04em", marginTop: 2, display: "flex", alignItems: "center", gap: 6, justifyContent: "center" }}>
                  Selected Excel: <strong style={{ color: excelFile ? "#3a6a5a" : "#9a8070" }}>{excelFile?.name || "None"}</strong>
                  {excelFile && isTransformed && (
                    <span style={{ color: P.green, fontWeight: 700, fontSize: 10 }}>✔ Transformed</span>
                  )}
                </div>
              </div>
              {isTransformed && (
                <NeuBtn small icon="⬇" onClick={handleDownloadExcel}>Download Transformed Excel</NeuBtn>
              )}
            </div>
          </SectionCard>
        </div>

        {/* ════════════════════════════════
            SECTION 4 — STEPPER WORKFLOW
        ════════════════════════════════ */}
        <div style={{ padding: "16px 24px 24px" }}>
          <SectionCard>
            <div style={{ padding: "20px 24px 0" }}>
              <Stepper currentStep={currentStep} completedSteps={completedSteps} onStepClick={s => setCurrentStep(s)} />
            </div>
            <div style={{ borderTop: "1px solid rgba(0,0,0,.07)", marginTop: 4 }}>
              {renderStepContent()}
            </div>
          </SectionCard>
        </div>

      </div>{/* end hdl-body */}

      {/* ════════════════════════════════
          DIALOGS
      ════════════════════════════════ */}

      {/* Source Keys */}
      {sourceKeysOpen && (
        <SourceKeysDialog
          skippedColumns={skippedColumns}
          allAttributes={attributes}
          mapping={sourceKeysMapping}
          onMappingChange={setSourceKeysMapping}
          onClose={() => {
            setSourceKeysOpen(false);
            if (currentStep === 1 && Object.keys(sourceKeysMapping).length > 0) stepNext();
          }}
        />
      )}

      {/* Validation Results */}
      {validationDialogOpen && (
        <ValidationResultsDialog
          result={validationResult}
          onClose={() => setValidationDialogOpen(false)}
        />
      )}

      {/* Toast */}
      {toast && (
        <Toast key={toast.key} message={toast.message} severity={toast.severity} onClose={() => setToast(null)} />
      )}
    </div>
  );
}
