import React, { useState, useEffect, useRef, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { gsap } from "gsap";
import api from "../services/api";

/* ─────────────────────────────────────────
   GLOBAL CSS
───────────────────────────────────────── */
if (!document.getElementById("hdl-pvs-css")) {
  const s = document.createElement("style");
  s.id = "hdl-pvs-css";
  s.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Mono:wght@400;500&family=Instrument+Sans:wght@400;600;700&display=swap');
    @keyframes hdl-spin { to { transform: rotate(360deg); } }
    @keyframes hdl-fade-in {
      from { opacity: 0; transform: translateY(12px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    @keyframes hdl-row-in {
      from { opacity: 0; transform: translateX(12px); }
      to   { opacity: 1; transform: translateX(0); }
    }

    .hdl-scroll {
      overflow-y: auto;
      overscroll-behavior: contain;
    }
    .hdl-scroll::-webkit-scrollbar { width: 6px; }
    .hdl-scroll::-webkit-scrollbar-track { background: transparent; }
    .hdl-scroll::-webkit-scrollbar-thumb {
      background: rgba(184,115,51,.3);
      border-radius: 3px;
    }
    .hdl-scroll::-webkit-scrollbar-thumb:hover {
      background: rgba(184,115,51,.55);
    }

    /* Custom checkbox */
    .hdl-checkbox {
      width: 18px; height: 18px;
      border-radius: 5px;
      border: none; outline: none;
      cursor: pointer;
      display: flex; align-items: center; justify-content: center;
      flex-shrink: 0;
      transition: background .15s ease, box-shadow .15s ease;
    }
    .hdl-checkbox.checked {
      background: linear-gradient(135deg, #c8843a, #7a4e28);
    }
    .hdl-checkbox.unchecked {
      background: linear-gradient(145deg, #ccc4b4, #bdb4a4);
    }
  `;
  document.head.appendChild(s);
}

/* ─────────────────────────────────────────
   TOKENS
───────────────────────────────────────── */
const P = {
  warmDrk: "#a09283",
  copper:  "#b87333",
  ink:     "#2c2420",
  inkLt:   "#5c4e44",
  active:  "#c0392b",
  green:   "#27ae60",
};

const BS = {
  raised:    "8px 8px 22px rgba(0,0,0,.42), -5px -5px 16px rgba(255,255,255,.88)",
  raisedSm:  "5px 5px 14px rgba(0,0,0,.38), -3px -3px 10px rgba(255,255,255,.82)",
  pressed:   "inset 4px 4px 12px rgba(0,0,0,.42), inset -3px -3px 8px rgba(255,255,255,.55)",
  insetDeep: "inset 6px 6px 18px rgba(0,0,0,.38), inset -4px -4px 14px rgba(255,255,255,.55)",
  insetSm:   "inset 3px 3px 8px rgba(0,0,0,.3), inset -2px -2px 6px rgba(255,255,255,.55)",
  copper:    "5px 5px 14px rgba(0,0,0,.5), -2px -2px 8px rgba(255,255,255,.4), 0 0 18px rgba(184,115,51,.32)",
};

/* ─────────────────────────────────────────
   SCREW
───────────────────────────────────────── */
const Screw = ({ style, angle = 45 }) => (
  <div aria-hidden="true" style={{
    position: "absolute", ...style, zIndex: 6,
    width: 13, height: 13, borderRadius: "50%",
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

/* ─────────────────────────────────────────
   NEU BUTTON — matches PostValidationStepper
───────────────────────────────────────── */
const NeuBtn = ({ children, onClick, accent = false, disabled = false, small = false }) => {
  const ref = useRef(null);
  const down = () => { if (!disabled && ref.current) gsap.to(ref.current, { scale: .97, boxShadow: BS.pressed, duration: .1 }); };
  const up   = () => { if (ref.current) gsap.to(ref.current, { scale: 1, boxShadow: accent ? BS.copper : BS.raisedSm, duration: .2, ease: "back.out(2)" }); };

  return (
    <button
      ref={ref}
      onClick={disabled ? undefined : onClick}
      onMouseDown={down}
      onMouseUp={up}
      onMouseLeave={up}
      disabled={disabled}
      style={{
        fontFamily: "'Instrument Sans', sans-serif",
        fontWeight: 700, fontSize: small ? 11 : 13,
        letterSpacing: ".07em", textTransform: "uppercase",
        padding: small ? "10px 20px" : "13px 32px",
        borderRadius: 9, border: "none", cursor: disabled ? "not-allowed" : "pointer",
        color: accent ? "#f8f0e0" : P.inkLt,
        background: accent
          ? "linear-gradient(135deg, #c8843a, #7a4e28)"
          : "linear-gradient(145deg, #ede6d6, #cec5b5)",
        boxShadow: disabled ? "none" : accent ? BS.copper : BS.raisedSm,
        opacity: disabled ? .5 : 1,
        transition: "opacity .2s",
        userSelect: "none",
      }}
    >
      {children}
    </button>
  );
};

/* ─────────────────────────────────────────
   CHECKBOX
───────────────────────────────────────── */
const NeuCheck = ({ checked, onChange }) => {
  const ref = useRef(null);
  const toggle = () => {
    if (ref.current)
      gsap.fromTo(ref.current, { scale: .85 }, { scale: 1, duration: .2, ease: "back.out(3)" });
    onChange(!checked);
  };

  return (
    <div
      ref={ref}
      role="checkbox"
      aria-checked={checked}
      tabIndex={0}
      onClick={toggle}
      onKeyDown={(e) => e.key === " " && toggle()}
      className={`hdl-checkbox ${checked ? "checked" : "unchecked"}`}
      style={{
        boxShadow: checked ? BS.copper : BS.insetSm,
      }}
    >
      {checked && (
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
          <path d="M1.5 5L3.8 7.5L8.5 2.5" stroke="#f8f0e0" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      )}
    </div>
  );
};

/* ─────────────────────────────────────────
   SECTION HEADER (collapsible)
───────────────────────────────────────── */
const SectionHeader = ({ title, expanded, onToggle }) => {
  const arrowRef = useRef(null);
  useEffect(() => {
    if (arrowRef.current)
      gsap.to(arrowRef.current, { rotation: expanded ? 90 : 0, duration: .22, ease: "power2.out" });
  }, [expanded]);

  return (
    <div
      role="button" tabIndex={0}
      onClick={onToggle}
      onKeyDown={(e) => e.key === "Enter" && onToggle()}
      style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "14px 18px",
        background: "linear-gradient(160deg, #d0c8b8, #c0b8a8)",
        boxShadow: BS.insetSm,
        borderRadius: expanded ? "10px 10px 0 0" : 10,
        cursor: "pointer", userSelect: "none",
        border: "1px solid rgba(0,0,0,.08)",
        transition: "border-radius .22s ease",
      }}
    >
      <span style={{
        fontFamily: "'DM Serif Display', serif",
        fontSize: 16, color: P.ink,
      }}>
        {title}
      </span>
      <div ref={arrowRef} style={{ display: "flex", color: P.copper, fontSize: 12 }}>▶</div>
    </div>
  );
};

/* ─────────────────────────────────────────
   HDL COMPONENT
───────────────────────────────────────── */
export default function HDL() {
  const location = useLocation();
  const navigate = useNavigate();

  const [selectedNode,       setSelectedNode]       = useState(null);
  const [expandedSections,   setExpandedSections]   = useState({ metadata: true, attributes: true });
  const [attributes,         setAttributes]         = useState([]);
  const [attributeData,      setAttributeData]      = useState({});
  const [loadingAttributes,  setLoadingAttributes]  = useState(false);
  const [customerName,       setCustomerName]       = useState("");
  const [instanceName,       setInstanceName]       = useState("");

  const cardRef    = useRef(null);
  const rowRefs    = useRef([]);

  /* ── init from navigation state ── */
  useEffect(() => {
    if (location.state?.nodeData) setSelectedNode(location.state.nodeData);
  }, [location.state]);

  /* ── card entrance ── */
  useEffect(() => {
    if (cardRef.current)
      gsap.fromTo(cardRef.current, { y: 40, opacity: 0 }, { y: 0, opacity: 1, duration: .7, ease: "expo.out" });
  }, [selectedNode]);

  /* ── fetch attributes ── */
  useEffect(() => {
    if (!selectedNode) return;
    fetchAttributeData();
  }, [selectedNode]);

  const fetchAttributeData = async () => {
    try {
      setLoadingAttributes(true);
      const levels = [];
      for (let i = 1; i <= 7; i++) {
        const v = selectedNode[`level_${i}`];
        if (v) levels.push(v);
      }
      const customer = levels[0] || "";
      const instance = levels[1] || "";
      setCustomerName(customer);
      setInstanceName(instance);

      const componentName = selectedNode.dat_template;
      if (!componentName) throw new Error("No dat_template");

      const attrRes  = await api.post("hdl/get-attributes", { componentName });
      const attrList = attrRes.data.attributes || [];
      if (!attrList.length) throw new Error("No attributes");
      setAttributes(attrList);

      const mandRes  = await api.post("hdl/mandatory/batch", { componentName, attributes: attrList, customerName: customer, instanceName: instance });
      const mandData = mandRes.data.mandatory || {};

      let lookupData = {};
      try {
        const lookRes = await api.post("hdl/lookup/batch", { componentName, Attributes: attrList, customerName: customer, instanceName: instance });
        lookupData = lookRes.data;
      } catch { /* continue without lookup */ }

      const combined = {};
      attrList.forEach((attr) => {
        const m = mandData[attr] || {};
        combined[attr] = {
          required:     m.mandatory || false,
          dataType:     m.data_type || "VARCHAR",
          helperText:   m.helper_text || "",
          keyValues:    !!(m.key_values?.length),
          lookupValues: lookupData[attr] || [],
        };
      });
      setAttributeData(combined);

      /* animate rows in */
      setTimeout(() => {
        rowRefs.current.filter(Boolean).forEach((el, i) =>
          gsap.fromTo(el, { opacity: 0, x: 16 }, { opacity: 1, x: 0, duration: .35, delay: i * .025, ease: "power2.out" })
        );
      }, 50);
    } catch (err) {
      console.error(err);
      setAttributes([]);
      setAttributeData({});
    } finally {
      setLoadingAttributes(false);
    }
  };

  const updateAttr = useCallback((attr, field, val) => {
    setAttributeData(prev => ({ ...prev, [attr]: { ...prev[attr], [field]: val } }));
  }, []);

  const toggleSection = useCallback((sec) => {
    setExpandedSections(prev => ({ ...prev, [sec]: !prev[sec] }));
  }, []);

  const buildPayload = () => {
    const attributesPayload = Object.entries(attributeData).map(([name, d]) => ({
      Attributes: name, required: d.required, keyValues: d.keyValues, data_type: d.dataType,
    }));
    const lookupPayload = {};
    Object.entries(attributeData).forEach(([name, d]) => { lookupPayload[name] = d.lookupValues || []; });
    return {
      componentName:  selectedNode.dat_template,
      globalBoName:   selectedNode.name,
      attributes:     attributesPayload,
      allLookups:     lookupPayload,
      customerName, InstanceName: instanceName,
      DeltaLoad: false, excelFile: "",
      datColumnOrder: attributes, allMapping: {},
    };
  };

  const handleValidate = async () => {
    try {
      const res = await api.post("/hdl/validate-data", buildPayload());
      console.log("Validation response:", res.data);
      alert("Validation complete");
    } catch (err) {
      console.error(err);
      alert("Validation failed");
    }
  };

  /* ── Empty state ── */
  if (!selectedNode) {
    return (
      <div style={{
        flex: 1, display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        background: "linear-gradient(160deg, #ede8dc 0%, #d8d0c0 100%)",
        height: "100%", gap: 20,
        fontFamily: "'Instrument Sans', sans-serif",
      }}>
        <div style={{
          width: 90, height: 90, borderRadius: "50%",
          background: "linear-gradient(145deg, #ddd6c6, #c0b8a8)",
          boxShadow: BS.raised,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 38,
        }}>◈</div>
        <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 24, color: P.ink }}>
          No HDL Selected
        </div>
        <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 12, color: P.warmDrk, letterSpacing: ".04em", textAlign: "center", maxWidth: 320 }}>
          Click a leaf node in the sidebar to view HDL component details
        </div>
        <NeuBtn onClick={() => navigate("/")} small>← Back to Dashboard</NeuBtn>
      </div>
    );
  }

  /* hierarchy levels */
  const hierarchyLevels = [];
  for (let i = 1; i <= 7; i++) {
    const v = selectedNode[`level_${i}`];
    if (v) hierarchyLevels.push({ level: i, name: v });
  }

  const metadata = {
    File:                           selectedNode.file,
    "DAT Template":                 selectedNode.dat_template,
    "Required Helper Text":         selectedNode["Required - Helper Text"],
    "Supported Action Helper Text": selectedNode["Supported Action - Helper Text"],
  };

  /* table column config */
  const TABLE_COLS = [
    { key: "attr",     label: "Attribute",  width: "auto"  },
    { key: "required", label: "Required",   width: 80, center: true },
    { key: "keyValues",label: "Key",        width: 70, center: true },
    { key: "dataType", label: "Type",       width: 110 },
    { key: "lookup",   label: "Lookup",     width: 160 },
  ];

  return (
    <div style={{
      flex: 1,
      display: "flex",
      flexDirection: "column",
      background: "linear-gradient(160deg, #ede8dc 0%, #d8d0c0 100%)",
      height: "100%",
      overflow: "hidden",
      fontFamily: "'Instrument Sans', sans-serif",
    }}>

      {/* ══════ INNER HEADER ══════ */}
      <div style={{
        flexShrink: 0,
        display: "flex", alignItems: "center", gap: 14,
        padding: "0 26px",
        height: 60,
        background: "linear-gradient(160deg, #d0c8b8, #c0b8a8)",
        boxShadow: "0 3px 14px rgba(0,0,0,.22), inset 0 -1px 0 rgba(255,255,255,.35)",
        borderBottom: "1px solid rgba(0,0,0,.08)",
        position: "relative",
      }}>
        {/* Back */}
        <NeuBtn onClick={() => navigate("/")} small>← Back</NeuBtn>

        {/* Breadcrumb */}
        <div style={{ display: "flex", alignItems: "center", gap: 6, flex: 1, overflow: "hidden" }}>
          {hierarchyLevels.map((item, i) => (
            <React.Fragment key={i}>
              <span style={{
                fontFamily: "'DM Mono', monospace",
                fontSize: 11, color: i === hierarchyLevels.length - 1 ? P.copper : P.warmDrk,
                fontWeight: i === hierarchyLevels.length - 1 ? 600 : 400,
                letterSpacing: ".03em",
                whiteSpace: "nowrap",
              }}>
                {item.name}
              </span>
              {i < hierarchyLevels.length - 1 && (
                <span style={{ color: P.warmDrk, opacity: .5, fontSize: 12 }}>›</span>
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* ══════ SCROLLABLE CONTENT ══════ */}
      <div
        className="hdl-scroll"
        style={{ flex: 1, minHeight: 0, padding: "28px 28px 0" }}
      >
        <div
          ref={cardRef}
          style={{
            maxWidth: 1100, margin: "0 auto",
            display: "flex", flexDirection: "column", gap: 20,
            paddingBottom: 28,
          }}
        >

          {/* ── Component title ── */}
          <div style={{
            padding: "24px 28px",
            borderRadius: 16, position: "relative",
            background: "linear-gradient(160deg, #ede8dc 0%, #d8d0c0 100%)",
            boxShadow: BS.raised,
            border: "1px solid rgba(255,255,255,.4)",
          }}>
            <Screw style={{ top: 12, left: 12  }} angle={45}  />
            <Screw style={{ top: 12, right: 12 }} angle={135} />

            <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 28, color: P.ink, marginBottom: 6 }}>
              {selectedNode.name}
            </div>
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: P.warmDrk, letterSpacing: ".05em" }}>
              HDL Component Configuration
            </div>
          </div>

          {/* ── METADATA SECTION ── */}
          <div style={{ borderRadius: 12, overflow: "hidden", boxShadow: BS.raisedSm }}>
            <SectionHeader
              title="Metadata"
              expanded={expandedSections.metadata}
              onToggle={() => toggleSection("metadata")}
            />
            {expandedSections.metadata && (
              <div style={{
                background: "linear-gradient(160deg, #d8d0c0, #cac0b0)",
                boxShadow: BS.insetDeep,
                padding: "20px 20px",
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
                gap: 16,
                borderRadius: "0 0 10px 10px",
                border: "1px solid rgba(0,0,0,.06)",
                borderTop: "none",
              }}>
                {Object.entries(metadata).map(([k, v]) =>
                  v ? (
                    <div key={k}>
                      <div style={{
                        fontFamily: "'DM Mono', monospace",
                        fontSize: 9, letterSpacing: ".14em", textTransform: "uppercase",
                        color: P.warmDrk, marginBottom: 6,
                      }}>
                        {k}
                      </div>
                      <div style={{
                        padding: "10px 14px",
                        borderRadius: 8,
                        background: "linear-gradient(145deg, #ccc4b4, #c4bcac)",
                        boxShadow: BS.insetSm,
                        fontFamily: "'DM Mono', monospace",
                        fontSize: 12, color: P.ink, letterSpacing: ".02em",
                        wordBreak: "break-all",
                      }}>
                        {v}
                      </div>
                    </div>
                  ) : null
                )}
              </div>
            )}
          </div>

          {/* ── ATTRIBUTES TABLE ── */}
          <div style={{ borderRadius: 12, overflow: "hidden", boxShadow: BS.raisedSm }}>
            <SectionHeader
              title={`Attributes${attributes.length ? ` (${attributes.length})` : ""}`}
              expanded={expandedSections.attributes}
              onToggle={() => toggleSection("attributes")}
            />

            {expandedSections.attributes && (
              <div style={{
                background: "linear-gradient(160deg, #d0c8b8, #c0b8a8)",
                boxShadow: BS.insetDeep,
                borderRadius: "0 0 10px 10px",
                border: "1px solid rgba(0,0,0,.06)",
                borderTop: "none",
                overflow: "hidden",
              }}>
                {/* Table header */}
                <div style={{
                  display: "grid",
                  gridTemplateColumns: `1fr 80px 70px 110px 160px`,
                  padding: "11px 20px",
                  background: "rgba(0,0,0,.08)",
                  borderBottom: "1px solid rgba(0,0,0,.1)",
                }}>
                  {TABLE_COLS.map((col) => (
                    <div key={col.key} style={{
                      fontFamily: "'DM Mono', monospace",
                      fontSize: 9, fontWeight: 500, letterSpacing: ".14em",
                      textTransform: "uppercase", color: P.warmDrk,
                      textAlign: col.center ? "center" : "left",
                    }}>
                      {col.label}
                    </div>
                  ))}
                </div>

                {/* Body */}
                <div style={{ maxHeight: 440, overflowY: "auto", overscrollBehavior: "contain" }}>
                  {loadingAttributes ? (
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12, padding: "40px 20px" }}>
                      <div style={{
                        width: 20, height: 20, borderRadius: "50%",
                        border: "2px solid rgba(0,0,0,.12)", borderTopColor: P.copper,
                        animation: "hdl-spin .75s linear infinite",
                      }} />
                      <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 13, color: P.warmDrk, letterSpacing: ".04em" }}>
                        Loading attributes…
                      </span>
                    </div>
                  ) : attributes.length === 0 ? (
                    <div style={{ padding: "40px 20px", textAlign: "center" }}>
                      <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 12, color: P.warmDrk, letterSpacing: ".04em" }}>
                        No attributes found
                      </div>
                    </div>
                  ) : (
                    attributes.map((attr, idx) => (
                      <div
                        key={attr}
                        ref={(el) => { rowRefs.current[idx] = el; }}
                        style={{
                          display: "grid",
                          gridTemplateColumns: `1fr 80px 70px 110px 160px`,
                          padding: "10px 20px",
                          borderBottom: "1px solid rgba(0,0,0,.05)",
                          alignItems: "center",
                          background: idx % 2 === 0 ? "transparent" : "rgba(0,0,0,.025)",
                        }}
                      >
                        {/* Attribute name */}
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <div style={{
                            width: 5, height: 5, borderRadius: "50%", flexShrink: 0,
                            background: attributeData[attr]?.required ? P.copper : "rgba(0,0,0,.15)",
                            boxShadow: attributeData[attr]?.required ? `0 0 6px ${P.copper}` : "none",
                            transition: "all .22s",
                          }} />
                          <span style={{
                            fontFamily: "'DM Mono', monospace",
                            fontSize: 12, color: P.ink, letterSpacing: ".03em",
                          }}>
                            {attr}
                          </span>
                        </div>

                        {/* Required */}
                        <div style={{ display: "flex", justifyContent: "center" }}>
                          <NeuCheck
                            checked={Boolean(attributeData[attr]?.required)}
                            onChange={(v) => updateAttr(attr, "required", v)}
                          />
                        </div>

                        {/* Key */}
                        <div style={{ display: "flex", justifyContent: "center" }}>
                          <NeuCheck
                            checked={Boolean(attributeData[attr]?.keyValues)}
                            onChange={(v) => updateAttr(attr, "keyValues", v)}
                          />
                        </div>

                        {/* Data type */}
                        <div style={{
                          fontFamily: "'DM Mono', monospace",
                          fontSize: 11, color: P.inkLt, letterSpacing: ".04em",
                        }}>
                          {attributeData[attr]?.dataType || "—"}
                        </div>

                        {/* Lookup */}
                        <div style={{
                          fontFamily: "'DM Mono', monospace",
                          fontSize: 11, color: P.warmDrk, letterSpacing: ".03em",
                          whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                        }}>
                          {attributeData[attr]?.lookupValues?.[0]?.CODE_Name || "—"}
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Footer row count */}
                {!loadingAttributes && attributes.length > 0 && (
                  <div style={{
                    padding: "10px 20px",
                    borderTop: "1px solid rgba(0,0,0,.08)",
                    display: "flex", justifyContent: "flex-end",
                    fontFamily: "'DM Mono', monospace",
                    fontSize: 10, color: P.warmDrk, letterSpacing: ".08em",
                  }}>
                    {attributes.length} attributes
                  </div>
                )}
              </div>
            )}
          </div>

        </div>
      </div>

      {/* ══════ BOTTOM ACTION BAR ══════ */}
      <div style={{
        flexShrink: 0,
        display: "flex", justifyContent: "flex-end", alignItems: "center",
        gap: 12,
        padding: "14px 28px",
        background: "linear-gradient(160deg, #d0c8b8, #c0b8a8)",
        boxShadow: "0 -3px 14px rgba(0,0,0,.2), inset 0 1px 0 rgba(255,255,255,.4)",
        borderTop: "1px solid rgba(0,0,0,.08)",
      }}>
        {!loadingAttributes && attributes.length > 0 && (
          <span style={{
            fontFamily: "'DM Mono', monospace",
            fontSize: 11, color: P.warmDrk, letterSpacing: ".05em",
          }}>
            {attributes.filter(a => attributeData[a]?.required).length} required · {attributes.length} total
          </span>
        )}
        <NeuBtn onClick={handleValidate} accent disabled={loadingAttributes || !attributes.length}>
          Validate Data ✓
        </NeuBtn>
      </div>
    </div>
  );
}