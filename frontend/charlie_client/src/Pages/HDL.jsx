import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { gsap } from "gsap";
import api from "../services/api";
import './hdl.css';
/* ─────────────────────────────────────────
   BASE URL for non-api routes (/excel, /static)
───────────────────────────────────────── */
const BASE_URL =
  (api.defaults.baseURL || "http://localhost:8000/api").replace(/\/api\/?$/, "") ||
  "http://localhost:8000";



/* GLOBAL CSS moved to hdl.css */

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

/* ─── NeuToggle ─── */
const NeuToggle = ({ checked, onChange }) => (
  <div className={`hdl-toggle${checked ? " on" : ""}`}
    role="switch" aria-checked={checked} tabIndex={0}
    onClick={() => onChange(!checked)}
    onKeyDown={e => { if (e.key === " " || e.key === "Enter") { e.preventDefault(); onChange(!checked); } }}>
    <div className="hdl-toggle-knob" />
  </div>
);

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
     LOOKUP VALUES DIALOG
  ───────────────────────────────────────── */
  const LookupDialog = ({ attr, values, onClose }) => {
    if (!values) return null;
    const cols = values.length > 0 ? Object.keys(values[0]) : [];
    return (
      <div className="hdl-modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
        <div className="hdl-modal" style={{ maxWidth: 860 }}>
          <div style={{
            padding: "16px 20px", display: "flex", alignItems: "center", justifyContent: "space-between",
            background: "linear-gradient(160deg, #d0c8b8, #c0b8a8)", boxShadow: BS.insetSm, borderBottom: "1px solid rgba(0,0,0,.08)",
          }}>
            <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 16, color: P.ink }}>Lookup Values for {attr}</div>
            <button onClick={onClose} style={{ width: 30, height: 30, borderRadius: 7, background: "linear-gradient(145deg, #ddd6c6, #c8bfad)", boxShadow: BS.raisedSm, border: "none", cursor: "pointer" }}>✕</button>
          </div>

          <div style={{ padding: 18, overflowY: "auto", maxHeight: "60vh" }}>
            {values.length === 0 ? (
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 13, color: P.warmDrk }}>No lookup values available.</div>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: "'DM Mono', monospace", fontSize: 12 }}>
                  <thead>
                    <tr style={{ background: "rgba(184,115,51,.06)" }}>
                      {cols.map(c => (
                        <th key={c} style={{ textAlign: "left", padding: "8px 10px", fontSize: 11, color: P.warmDrk, textTransform: "uppercase", borderBottom: "1px solid rgba(0,0,0,.08)" }}>{c}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {values.map((r, i) => (
                      <tr key={i} style={{ background: i % 2 === 0 ? "transparent" : "rgba(0,0,0,.02)" }}>
                        {cols.map(c => (
                          <td key={c} style={{ padding: "8px 10px", borderBottom: "1px solid rgba(0,0,0,.05)", wordBreak: "break-word" }}>{String(r[c] ?? "")}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div style={{ padding: "12px 18px", background: "linear-gradient(160deg, #d0c8b8, #c0b8a8)", boxShadow: `${BS.insetSm}, 0 -2px 8px rgba(0,0,0,.1)`, borderTop: "1px solid rgba(0,0,0,.08)", display: "flex", justifyContent: "flex-end" }}>
            <NeuBtn small onClick={onClose}>Close</NeuBtn>
          </div>
        </div>
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
  const validationTabLabel = le?.label || "Cross-File Validation";
  const isSuccess = result.status !== "failed";

  return (
    <div className="hdl-modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="hdl-modal" style={{ maxWidth: 960 }}>
        {/* Header */}
        <div style={{
          padding: "18px 22px",
          background: isSuccess ? "rgba(195, 165, 30, 0.1)" : "rgba(192,57,43,.1)",
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
            }}>{validationTabLabel}</button>
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
   SOURCE KEYS DIALOG  (Neumorphic / Skeuomorphic)
───────────────────────────────────────── */
const CHIP_INCREMENT = 10;

const SourceKeysDialog = ({
  skippedColumns,
  allAttributes,
  mapping,
  onMappingChange,
  onClose,
  selectedComponentName = "",
  customerName = "DefaultCustomer",
  instanceName = "DefaultInstance",
}) => {
  const [selectedAttr, setSelectedAttr] = useState("");
  const [inputValue, setInputValue] = useState("");
  const [showInput, setShowInput] = useState(false);
  const [formData, setFormData] = useState(mapping || {});
  const [visibleChipCount, setVisibleChipCount] = useState(CHIP_INCREMENT);
  const [chipFilter, setChipFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const inputRef = useRef(null);
  const modalRef = useRef(null);
  const chipsRef = useRef(null);

  const apiEndPoint = (api.defaults.baseURL || "http://localhost:8000/api").replace(/\/api\/?$/, "") || "http://localhost:8000";

  /* ── Entrance animation ── */
  useEffect(() => {
    if (modalRef.current) {
      gsap.fromTo(modalRef.current,
        { opacity: 0, y: 30, scale: 0.96 },
        { opacity: 1, y: 0, scale: 1, duration: 0.35, ease: "back.out(1.4)" }
      );
    }
  }, [loading, error]);

  /* ── Staggered chip entrance ── */
  useEffect(() => {
    if (chipsRef.current && showInput) {
      const chips = chipsRef.current.querySelectorAll(".hdl-neu-chip");
      if (chips.length) {
        gsap.fromTo(chips,
          { opacity: 0, y: 6, scale: 0.92 },
          { opacity: 1, y: 0, scale: 1, duration: 0.2, stagger: 0.015, ease: "back.out(2)" }
        );
      }
    }
  }, [showInput, visibleChipCount, chipFilter]);

  /* ── Save mapping to backend ── */
  const saveMappingToBackend = async (data) => {
    if (!selectedComponentName || !customerName || !instanceName) {
      console.warn("Missing required info to save mapping.");
      return;
    }
    setSaving(true);
    try {
      const payload = { customerName, instanceName, componentName: selectedComponentName, mappedAttributes: data };
      const response = await fetch(`${apiEndPoint}/api/hdl/save-attribute-mapping`, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || `Failed to save. Status: ${response.status}`);
      }
    } catch (e) {
      console.error("Error saving attribute mapping:", e);
    } finally {
      setSaving(false);
    }
  };

  /* ── Load mapping from backend ── */
  useEffect(() => {
    const loadMappingFromBackend = async () => {
      if (!selectedComponentName || !customerName || !instanceName) { setLoading(false); return; }
      setLoading(true); setError(null);
      try {
        const response = await fetch(
          `${apiEndPoint}/api/hdl/get-attribute-mapping/${customerName}/${instanceName}/${selectedComponentName}`
        );
        if (!response.ok) {
          if (response.status === 404) { setFormData({}); onMappingChange({}); }
          else { const d = await response.json(); throw new Error(d.detail || `Status ${response.status}`); }
        } else {
          const result = await response.json();
          if (result?.mappedAttributes) { setFormData(result.mappedAttributes); onMappingChange(result.mappedAttributes); }
          else { setFormData({}); onMappingChange({}); }
        }
      } catch (e) { console.error(e); setError("Failed to load data: " + e.message); }
      finally { setLoading(false); }
    };
    loadMappingFromBackend();
  }, [selectedComponentName, customerName, instanceName]); // eslint-disable-line react-hooks/exhaustive-deps

  /* ── Handlers ── */
  const handleSelectAttr = (e) => {
    const attr = e.target.value;
    if (!attr) return;
    setSelectedAttr(attr);
    setShowInput(true);
    setInputValue(formData[attr] || "");
    setChipFilter("");
    setVisibleChipCount(CHIP_INCREMENT);
    setTimeout(() => inputRef.current?.focus(), 80);
  };

  const insertAtCursor = (value) => {
    const input = inputRef.current;
    if (!input) return;
    const s = input.selectionStart, e = input.selectionEnd;
    const nv = input.value.slice(0, s) + value + input.value.slice(e);
    setInputValue(nv);
    setTimeout(() => { input.setSelectionRange(s + value.length, s + value.length); input.focus(); }, 0);
  };

  const handleInputSave = async (e) => {
    e.preventDefault();
    if (selectedAttr && inputValue.trim()) {
      const nf = { ...formData, [selectedAttr]: inputValue };
      setFormData(nf);
      await saveMappingToBackend(nf);
      onMappingChange(nf);
      setShowInput(false); setSelectedAttr(""); setInputValue(""); setChipFilter("");
    } else if (inputRef.current) {
      gsap.to(inputRef.current, { x: 5, yoyo: true, repeat: 3, duration: 0.1, ease: "power1.inOut" });
    }
  };

  const handleDeleteAttr = async (attr) => {
    const nf = { ...formData }; delete nf[attr];
    setFormData(nf); saveMappingToBackend(nf); onMappingChange(nf);
    if (selectedAttr === attr) { setSelectedAttr(""); setInputValue(""); setShowInput(false); }
  };

  const handleEditAttr = (attr, val) => {
    setSelectedAttr(attr); setInputValue(val); setShowInput(true); setChipFilter("");
    setTimeout(() => inputRef.current?.focus(), 80);
  };

  const quickChipClick = (label) => {
    insertAtCursor(label);
    if (inputRef.current) {
      gsap.fromTo(inputRef.current,
        { boxShadow: `${BS.insetSm}, 0 0 0 2px rgba(184,115,51,.45)` },
        { boxShadow: BS.insetSm, duration: 0.4, ease: "power2.out" }
      );
    }
  };

  const availableForDropdown = skippedColumns.filter(a => !Object.keys(formData).includes(a) || a === selectedAttr);
  const chipSource = allAttributes.length > 0 ? allAttributes : skippedColumns;
  const filteredChips = chipFilter
    ? chipSource.filter(c => c.toLowerCase().includes(chipFilter.toLowerCase()))
    : chipSource;
  const handleLoadMore = () => setVisibleChipCount(p => Math.min(p + CHIP_INCREMENT, filteredChips.length));
  const handleShowLess = () => setVisibleChipCount(CHIP_INCREMENT);
  const mappedCount = Object.keys(formData).length;

  /* ── Loading state ── */
  if (loading) {
    return (
      <div className="hdl-modal-overlay">
        <div ref={modalRef} className="hdl-modal" style={{ maxWidth: 420, alignItems: "center", justifyContent: "center", padding: 48 }}>
          <Screw style={{ top: 10, left: 10 }} angle={30} />
          <Screw style={{ top: 10, right: 10 }} angle={120} />
          <div style={{
            width: 36, height: 36, borderRadius: "50%",
            border: `3px solid ${P.copper}`, borderTopColor: "transparent",
            animation: "hdl-spin .7s linear infinite", marginBottom: 14,
          }} />
          <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 13, color: P.inkLt, letterSpacing: ".04em" }}>
            Loading source keys…
          </span>
        </div>
      </div>
    );
  }

  /* ── Error state ── */
  if (error) {
    return (
      <div className="hdl-modal-overlay">
        <div ref={modalRef} className="hdl-modal" style={{ maxWidth: 480, padding: 36, alignItems: "center", textAlign: "center" }}>
          <Screw style={{ top: 10, left: 10 }} angle={30} />
          <Screw style={{ top: 10, right: 10 }} angle={120} />
          <div style={{ fontSize: 28, marginBottom: 10 }}>⚠</div>
          <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 12, color: P.danger, marginBottom: 18, display: "block" }}>
            {error}
          </span>
          <NeuBtn small onClick={onClose}>Close</NeuBtn>
        </div>
      </div>
    );
  }

  return (
    <div className="hdl-modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div ref={modalRef} className="hdl-modal" style={{ maxWidth: 960 }}>
        <Screw style={{ top: 10, left: 10 }} angle={30} />
        <Screw style={{ top: 10, right: 10 }} angle={120} />
        <Screw style={{ bottom: 10, left: 10 }} angle={-30} />
        <Screw style={{ bottom: 10, right: 10 }} angle={-120} />

        {/* ─── Header ─── */}
        <div style={{
          padding: "16px 24px", display: "flex", alignItems: "center", justifyContent: "space-between",
          background: "linear-gradient(160deg, #d0c8b8, #c0b8a8)",
          boxShadow: BS.insetSm, borderBottom: "1px solid rgba(0,0,0,.08)", flexShrink: 0,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{
              width: 34, height: 34, borderRadius: 8,
              background: "linear-gradient(135deg, #c8843a, #7a4e28)", boxShadow: BS.raisedSm,
              display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, color: "#f8f0e0",
            }}>🗝</div>
            <div>
              <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 20, color: P.ink, lineHeight: 1.2 }}>
                Source Keys Editor
              </div>
              {selectedComponentName && (
                <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: P.copper, letterSpacing: ".04em", marginTop: 2 }}>
                  {selectedComponentName}
                </div>
              )}
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {saving && (
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <div style={{
                  width: 14, height: 14, borderRadius: "50%",
                  border: `2px solid ${P.copper}`, borderTopColor: "transparent",
                  animation: "hdl-spin .7s linear infinite",
                }} />
                <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: P.copper, letterSpacing: ".04em" }}>Saving</span>
              </div>
            )}
            <button onClick={onClose} style={{
              width: 32, height: 32, borderRadius: 7,
              background: "linear-gradient(145deg, #ddd6c6, #c8bfad)", boxShadow: BS.raisedSm,
              border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
              fontFamily: "'DM Mono', monospace", fontSize: 15, color: P.inkLt, transition: "all .15s ease",
            }}
              onMouseDown={e => { e.currentTarget.style.boxShadow = BS.pressed; }}
              onMouseUp={e => { e.currentTarget.style.boxShadow = BS.raisedSm; }}
            >✕</button>
          </div>
        </div>

        {/* ─── Body ─── */}
        <div style={{ flex: 1, overflowY: "auto", display: "flex", gap: 0, minHeight: 0 }}>

          {/* ═══ LEFT PANEL — Filled Attribute Values ═══ */}
          <div style={{
            width: "40%", flexShrink: 0, overflowY: "auto", padding: "22px 18px",
            borderRight: "1px solid rgba(0,0,0,.08)",
            background: "linear-gradient(180deg, rgba(237,232,220,.4), rgba(216,208,192,.4))",
          }}>
            <div style={{
              fontFamily: "'Instrument Sans', sans-serif", fontSize: 16, fontWeight: 700,
              color: P.ink, marginBottom: 18, textAlign: "center", letterSpacing: ".02em",
            }}>
              Filled Attribute Values
            </div>

            {mappedCount === 0 ? (
              <div style={{
                padding: "36px 16px", textAlign: "center",
                fontFamily: "'DM Mono', monospace", fontSize: 13, color: P.warmDrk, fontStyle: "italic",
              }}>
                <span style={{ fontSize: 28, display: "block", marginBottom: 10, opacity: .4 }}>◇</span>
                No values filled yet.
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {Object.entries(formData).map(([attr, value]) => (
                  <div key={attr} style={{
                    padding: "14px 16px", borderRadius: 10,
                    background: "linear-gradient(145deg, #e2dace, #d0c8b8)",
                    boxShadow: BS.raisedSm,
                    transition: "transform .15s ease, box-shadow .15s ease",
                  }}
                    onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-1px)"; e.currentTarget.style.boxShadow = BS.raised; }}
                    onMouseLeave={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = BS.raisedSm; }}
                  >
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                      <span style={{
                        fontFamily: "'DM Mono', monospace", fontSize: 12, fontWeight: 700,
                        color: P.copper, letterSpacing: ".03em",
                      }}>{attr}</span>
                      <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                        <button onClick={() => handleEditAttr(attr, value)} title="Edit"
                          style={{
                            width: 26, height: 26, borderRadius: 6, border: "none", cursor: "pointer",
                            background: "linear-gradient(145deg, #ddd6c6, #c8bfad)", boxShadow: BS.raisedSm,
                            display: "flex", alignItems: "center", justifyContent: "center",
                            fontSize: 12, color: "#3a7cc8", transition: "all .12s ease",
                          }}
                          onMouseDown={e => { e.currentTarget.style.boxShadow = BS.pressed; }}
                          onMouseUp={e => { e.currentTarget.style.boxShadow = BS.raisedSm; }}
                        >✎</button>
                        <button onClick={() => handleDeleteAttr(attr)} title="Delete"
                          style={{
                            width: 26, height: 26, borderRadius: 6, border: "none", cursor: "pointer",
                            background: "linear-gradient(145deg, #ddd6c6, #c8bfad)", boxShadow: BS.raisedSm,
                            display: "flex", alignItems: "center", justifyContent: "center",
                            fontSize: 12, color: P.danger, transition: "all .12s ease",
                          }}
                          onMouseDown={e => { e.currentTarget.style.boxShadow = BS.pressed; }}
                          onMouseUp={e => { e.currentTarget.style.boxShadow = BS.raisedSm; }}
                        >✕</button>
                      </div>
                    </div>
                    <div style={{
                      fontFamily: "'DM Mono', monospace", fontSize: 13, color: P.ink,
                      wordBreak: "break-word", lineHeight: 1.5,
                    }}>{value}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ═══ RIGHT PANEL — Attribute Selection & Input ═══ */}
          <div style={{ flex: 1, overflowY: "auto", padding: "22px 24px", display: "flex", flexDirection: "column", gap: 20 }}>

            {/* ── Dropdown ── */}
            <div>
              <div style={{
                fontFamily: "'DM Mono', monospace", fontSize: 11, letterSpacing: ".08em",
                textTransform: "uppercase", color: P.inkLt, marginBottom: 10, fontWeight: 600,
              }}>Select Source Key Attribute</div>
              <select
                className="hdl-sk-select"
                value={selectedAttr}
                onChange={handleSelectAttr}
                style={{ width: "100%", fontSize: 13, padding: "11px 32px 11px 14px" }}
              >
                <option value="">— Choose attribute —</option>
                {availableForDropdown.map(attr => (
                  <option key={attr} value={attr}>{attr}</option>
                ))}
              </select>
            </div>

            {/* ── Input area (visible after dropdown selection) ── */}
            {showInput && (
              <div style={{
                padding: "20px 22px", borderRadius: 12,
                background: "linear-gradient(145deg, #d4ccbc, #cac2b2)",
                boxShadow: BS.insetSm,
                display: "flex", flexDirection: "column", gap: 20,
              }}>

                {/* Input row */}
                <form onSubmit={handleInputSave} style={{ display: "flex", gap: 10, alignItems: "stretch" }}>
                  <input
                    ref={inputRef}
                    type="text"
                    value={inputValue}
                    onChange={e => setInputValue(e.target.value)}
                    placeholder={`Enter value for {${selectedAttr}}…`}
                    style={{
                      flex: 1, padding: "11px 14px", borderRadius: 8, border: "none", outline: "none",
                      background: "linear-gradient(145deg, #e2dace, #d4ccbc)", boxShadow: BS.insetSm,
                      fontFamily: "'DM Mono', monospace", fontSize: 13, color: P.ink,
                      transition: "box-shadow .2s ease",
                    }}
                    onFocus={e => { e.target.style.boxShadow = `${BS.insetSm}, 0 0 0 2px rgba(184,115,51,.3)`; }}
                    onBlur={e => { e.target.style.boxShadow = BS.insetSm; }}
                  />
                  <NeuBtn small accent onClick={handleInputSave} icon="✓">Save</NeuBtn>
                </form>

                {/* ── Quick Insert chips ── */}
                <div style={{
                  fontFamily: "'Instrument Sans', sans-serif", fontSize: 13, color: P.inkLt,
                  letterSpacing: ".01em",
                }}>Click chips below to insert into the input field:</div>

                <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
                  {/* Component name chip */}
                  {selectedComponentName && (
                    <span className="hdl-neu-chip" onClick={() => quickChipClick(selectedComponentName)}
                      style={{
                        background: "linear-gradient(135deg, #7a9cc8, #3a5c8a)", color: "#f0f4ff",
                        boxShadow: BS.raisedSm, fontSize: 12,
                      }}>
                      ◈ {selectedComponentName}
                    </span>
                  )}
                  {/* MERGE chip */}
                  <span className="hdl-neu-chip" onClick={() => quickChipClick("MERGE")}
                    style={{
                      background: "linear-gradient(135deg, #c8843a, #7a4e28)", color: "#f8f0e0",
                      boxShadow: BS.raisedSm, fontSize: 12,
                    }}>
                    ⇌ MERGE
                  </span>
                  {/* Iterator chip */}
                  <span className="hdl-neu-chip" onClick={() => quickChipClick("{Iterator}")}
                    style={{
                      background: "linear-gradient(135deg, #27ae60, #1a7a42)", color: "#e8f8ee",
                      boxShadow: BS.raisedSm, fontSize: 12,
                    }}>
                    ↻ Iterator
                  </span>
                </div>

                {/* ── Attribute chips section ── */}
                <div style={{
                  fontFamily: "'Instrument Sans', sans-serif", fontSize: 13, color: P.inkLt,
                  letterSpacing: ".01em",
                }}>Attributes ({filteredChips.length})</div>

                {/* Filter input */}
                <div style={{ position: "relative" }}>
                  <span style={{
                    position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)",
                    fontSize: 12, opacity: 0.5, pointerEvents: "none",
                  }}>🔍</span>
                  <input
                    className="hdl-filter-input"
                    type="text"
                    value={chipFilter}
                    onChange={e => { setChipFilter(e.target.value); setVisibleChipCount(CHIP_INCREMENT); }}
                    placeholder="Filter attributes…"
                  />
                  {chipFilter && (
                    <button type="button" onClick={() => { setChipFilter(""); setVisibleChipCount(CHIP_INCREMENT); }}
                      style={{
                        position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)",
                        width: 20, height: 20, borderRadius: 5, border: "none", cursor: "pointer",
                        background: "transparent", fontSize: 12, color: P.warmDrk,
                        display: "flex", alignItems: "center", justifyContent: "center",
                      }}>✕</button>
                  )}
                </div>

                {/* Attribute chips grid */}
                <div ref={chipsRef} className="hdl-sk-chips-wrap" style={{ maxHeight: 220 }}>
                  {filteredChips.length === 0 ? (
                    <span style={{
                      fontFamily: "'DM Mono', monospace", fontSize: 12, color: P.warmDrk,
                      fontStyle: "italic", padding: 10,
                    }}>
                      No attributes match "{chipFilter}"
                    </span>
                  ) : (
                    filteredChips.slice(0, visibleChipCount).map((attr, idx) => (
                      <span key={idx}
                        className="hdl-neu-chip"
                        onClick={() => quickChipClick(`{${attr}}`)}
                        title={`Insert {${attr}} at cursor`}
                        style={attr === selectedAttr ? {
                          background: "linear-gradient(135deg, #c8843a, #7a4e28)", color: "#f8f0e0",
                          boxShadow: `${BS.raisedSm}, 0 0 8px rgba(184,115,51,.25)`,
                        } : {}}
                      >
                        {`{${attr}}`}
                      </span>
                    ))
                  )}
                </div>

                {/* Load More / Show Less */}
                {filteredChips.length > CHIP_INCREMENT && (
                  <div style={{ display: "flex", gap: 10, justifyContent: "center", marginTop: 4 }}>
                    {visibleChipCount < filteredChips.length && (
                      <NeuBtn small onClick={handleLoadMore} icon="▾">
                        View More ({filteredChips.length - visibleChipCount} remaining)
                      </NeuBtn>
                    )}
                    {visibleChipCount >= filteredChips.length && (
                      <NeuBtn small danger onClick={handleShowLess} icon="▴">
                        Show Less
                      </NeuBtn>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Hint when no attr selected */}
            {!showInput && (
              <div style={{
                padding: "48px 20px", textAlign: "center",
                fontFamily: "'DM Mono', monospace", fontSize: 13, color: P.warmDrk,
                fontStyle: "italic", lineHeight: 1.7,
              }}>
                <div style={{
                  width: 56, height: 56, borderRadius: 14, margin: "0 auto 16px",
                  background: "linear-gradient(145deg, #e2dace, #d0c8b8)", boxShadow: BS.insetDeep,
                  display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, opacity: 0.5,
                }}>🗝</div>
                Select a source key attribute from the<br/>dropdown above to define its value using chips.
              </div>
            )}
          </div>
        </div>

        {/* ─── Footer ─── */}
        <div style={{
          padding: "14px 24px",
          background: "linear-gradient(160deg, #d0c8b8, #c0b8a8)",
          boxShadow: `${BS.insetSm}, 0 -2px 8px rgba(0,0,0,.1)`,
          borderTop: "1px solid rgba(0,0,0,.08)",
          display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{
              width: 8, height: 8, borderRadius: "50%",
              background: mappedCount > 0 ? P.green : P.warmDrk,
              boxShadow: mappedCount > 0 ? `0 0 6px ${P.green}` : "none",
              transition: "all .3s ease",
            }} />
            <span style={{
              fontFamily: "'DM Mono', monospace", fontSize: 11, color: P.warmDrk, letterSpacing: ".04em",
            }}>
              {mappedCount} attribute{mappedCount !== 1 ? "s" : ""} mapped
              {saving ? " · saving…" : ""}
            </span>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <NeuBtn small onClick={onClose}>Cancel</NeuBtn>
            <NeuBtn small accent onClick={onClose} icon="✓">Done</NeuBtn>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ─────────────────────────────────────────
   ROWS PER PAGE
───────────────────────────────────────── */
const ROWS_PER_PAGE_OPTIONS = [10, 25, 50];
const buildCrossFileContextKey = (parentName, customerName, instanceName) =>
  `crossFileContext_${customerName || ""}__${instanceName || ""}__${parentName || ""}`;

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

  /* ── Lookup Dialog state ── */
  const [lookupDialogOpen, setLookupDialogOpen] = useState(false);
  const [lookupValues, setLookupValues] = useState([]);
  const [lookupAttr, setLookupAttr] = useState("");

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

  const getCrossFileValidationContext = useCallback(() => {
    const parentName = selectedNode?.level_6 || selectedNode?.name || "";
    if (!parentName || !customerName || !instanceName) return null;

    const primaryKey = buildCrossFileContextKey(parentName, customerName, instanceName);
    const latestKey = sessionStorage.getItem("latestCrossFileContextKey");
    const keysToTry = [primaryKey, latestKey].filter(Boolean);

    for (const key of keysToTry) {
      try {
        const raw = sessionStorage.getItem(key);
        if (!raw) continue;
        const parsed = JSON.parse(raw);
        if (
          parsed?.parent_name &&
          parsed?.component_files &&
          Object.keys(parsed.component_files).length > 0
        ) {
          return parsed;
        }
      } catch {
        // ignore malformed cache entries
      }
    }

    return null;
  }, [selectedNode, customerName, instanceName]);

  /* ═══════════════════════════════════════
     HELPERS
  ═══════════════════════════════════════ */
  const updateAttr = useCallback((attr, field, val) => {
    setAttributeData(prev => ({ ...prev, [attr]: { ...prev[attr], [field]: val } }));
  }, []);

  const validatePersonNumberCrossFile = useCallback(async () => {
    const context = getCrossFileValidationContext();
    if (!context) return null;

    try {
      const res = await api.post("hdl/bulk/cross-file/personNumber/validate?export_as_excel=true", {
        parent_name: context.parent_name,
        component_files: context.component_files,
        all_mandatory_objects: context.all_mandatory_objects || [],
        all_non_mandatory_objects: context.all_non_mandatory_objects || [],
        customerName: customerName || context.customerName || "",
        InstanceName: instanceName || context.InstanceName || "",
      });

      const failed = Array.isArray(res.data?.failed_person_numbers) ? res.data.failed_person_numbers : [];
      const inconsistent = failed.map((row) => ({
        PersonNumber: row.person_number || "",
        EffectiveStartDate: "",
        ActionCode: "",
        LegalEmployerName: Array.isArray(row.missing_components) ? row.missing_components.join(", ") : "",
        Scenario: "Missing Mandatory Components",
        Status: row.description || "",
      }));

      return {
        label: "Cross-File Validation",
        source: "personNumber",
        message: failed.length
          ? `Person number validation found ${failed.length} inconsistent record(s).`
          : "Person number validation passed.",
        inconsistent_records: inconsistent,
        status: failed.length > 0 ? "failed" : "success",
        raw: res.data || null,
      };
    } catch (err) {
      console.error("Cross-file person number validation failed:", err);
      return null;
    }
  }, [getCrossFileValidationContext, customerName, instanceName]);

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
        label: "Legal Employer Validation",
        source: "legalEmployer",
        message: res.data.message || "Legal Employer validation completed.",
        inconsistent_records: recs,
        status: recs.length > 0 ? "failed" : "success",
      };
    } catch (err) {
      return {
        label: "Legal Employer Validation",
        source: "legalEmployer",
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

    /* 1) Cross-file validation (legacy personNumber API first, legalEmployer fallback) */
    const pnResult = await validatePersonNumberCrossFile();
    const leResult = pnResult || await validateLegalEmployer();

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

      let didPass = true;
      if (res.data.status === "failed" || (leResult && leResult.status === "failed")) {
        combined.status = "failed";
        combined.message = "Validation completed with errors.";
        showToast("Validation completed with errors.", "error");
        setIsValidated(false);
        didPass = false;
      } else {
        showToast("Validation successful!", "success");
        setIsValidated(true);
      }

      /* Update session storage & notify sidebar */
      try {
        const sess = JSON.parse(sessionStorage.getItem("validationSession") || "{}");
        sess[componentName] = { validated: didPass, fileName: (combined.passed_file_url || "").split("/").pop() };
        sessionStorage.setItem("validationSession", JSON.stringify(sess));
        window.dispatchEvent(new Event("validationSessionUpdated"));
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
    customerName, instanceName, deltaReportFetched, validateLegalEmployer, validatePersonNumberCrossFile, showToast]);

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
          <div style={{ padding: "20px 24px", textAlign: "center" }}>
            <div style={{ fontFamily: "'Instrument Sans', sans-serif", fontSize: 13, color: P.inkLt, marginBottom: 20, lineHeight: 1.55 }}>
              Define source keys for mapping attributes. These keys map the identifier columns from your DAT file to their values.
            </div>
            <div style={{ display: "flex", gap: 10, alignItems: "center", justifyContent: "center", flexWrap: "wrap" }}>
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
          <div style={{ padding: "20px 24px", textAlign: "center" }}>
            <div style={{ fontFamily: "'Instrument Sans', sans-serif", fontSize: 13, color: P.inkLt, marginBottom: 20, lineHeight: 1.55 }}>
              Upload and transform your customer Excel file. This step is <strong>mandatory</strong>.
            </div>
            <div style={{ display: "flex", gap: 10, alignItems: "center", justifyContent: "center", flexWrap: "wrap" }}>
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
          <div style={{ padding: "20px 24px", textAlign: "center" }}>
            <div style={{ fontFamily: "'Instrument Sans', sans-serif", fontSize: 13, color: P.inkLt, marginBottom: 20, lineHeight: 1.55 }}>
              Configure NLP rules for intelligent data transformation and field mapping. This step is <em>optional</em>.
            </div>
            <div style={{ display: "flex", gap: 10, alignItems: "center", justifyContent: "center", flexWrap: "wrap" }}>
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
          <div style={{ padding: "20px 24px", textAlign: "center" }}>
            <div style={{ fontFamily: "'Instrument Sans', sans-serif", fontSize: 13, color: P.inkLt, marginBottom: 20, lineHeight: 1.55 }}>
              Fetch Delta Report from Oracle for data integrity checks.
              {componentName?.toLowerCase() !== "assignment" && (
                <span style={{ display: "block", marginTop: 6, fontSize: 11, color: P.warmDrk }}>
                  Delta report only available for Assignment component. You may skip this step.
                </span>
              )}
            </div>
            <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
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
          <div style={{ padding: "20px 24px", textAlign: "center" }}>
            <div style={{ fontFamily: "'Instrument Sans', sans-serif", fontSize: 13, color: P.inkLt, marginBottom: 20, lineHeight: 1.55 }}>
              Run comprehensive validation checks on all loaded data against HDL requirements.
            </div>
            <div style={{ display: "flex", gap: 10, alignItems: "center", justifyContent: "center" }}>
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
        <div style={{ flexShrink: 0 }}>
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
        <div style={{ flexShrink: 0, display: "flex", flexDirection: "column" }}>
          <div ref={tableRef} style={{ display: "flex", flexDirection: "column" }}>
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
                <div className="hdl-table-wrap" style={{ overflowX: "auto", background: "#f8f6f1" }}>
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
                              <NeuToggle checked={Boolean(d.required)} onChange={v => updateAttr(attr, "required", v)} />
                            </td>
                            <td style={{ padding: "10px 16px", textAlign: "center" }}>
                              <NeuToggle checked={Boolean(d.keyValues)} onChange={v => updateAttr(attr, "keyValues", v)} />
                            </td>
                            <td style={{ padding: "10px 16px", fontFamily: "'DM Mono', monospace", fontSize: 11, color: P.inkLt }}>{d.dataType || "—"}</td>
                            <td style={{ padding: "10px 16px" }}>
                              {d.lookupName ? (
                                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                  <span className="hdl-lookup-pill">{d.lookupName}</span>
                                  <NeuBtn small onClick={() => { setLookupAttr(attr); setLookupValues(d.lookupValues || allLookups[attr] || []); setLookupDialogOpen(true); }} icon="🔎" />
                                </div>
                              ) : (
                                <span style={{ color: P.warmDrk, fontSize: 12 }}>—</span>
                              )}
                            </td>
                            <td style={{ padding: "10px 16px", fontFamily: "'DM Mono', monospace", fontSize: 11, color: d.transformation ? "#3a6aaa" : P.warmDrk }}>
                              {d.transformation || "—"}
                            </td>
                            <td style={{ padding: "10px 16px", textAlign: "center" }}>
                              <NeuToggle checked={d.includeInDat !== false} onChange={v => updateAttr(attr, "includeInDat", v)} />
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
        <div style={{ flexShrink: 0 }}>
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
        <div style={{ flexShrink: 0 }}>
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
          selectedComponentName={componentName}
          customerName={customerName}
          instanceName={instanceName}
        />
      )}

      {/* Validation Results */}
      {validationDialogOpen && (
        <ValidationResultsDialog
          result={validationResult}
          onClose={() => setValidationDialogOpen(false)}
        />
      )}

      {/* Lookup Values */}
      {lookupDialogOpen && (
        <LookupDialog attr={lookupAttr} values={lookupValues} onClose={() => setLookupDialogOpen(false)} />
      )}

      {/* Toast */}
      {toast && (
        <Toast key={toast.key} message={toast.message} severity={toast.severity} onClose={() => setToast(null)} />
      )}
    </div>
  );
}
