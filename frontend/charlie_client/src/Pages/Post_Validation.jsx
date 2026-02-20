import React, { useState, useRef, useEffect, useCallback } from "react";
import { gsap } from "gsap";
import { Box, Card, Typography, Button, Grid, CircularProgress } from "@mui/material";
import api from "../services/api";

/* ─────────────────────────────────────────
   GLOBAL STYLES (injected once)
───────────────────────────────────────── */
const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Mono:wght@400;500&family=Instrument+Sans:wght@400;600;700&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --cream:    #f0ebe0;
    --cream-dk: #e2dace;
    --warm-mid: #c8bfad;
    --warm-drk: #a09283;
    --leather:  #8b6f4e;
    --copper:   #b87333;
    --copper-lt:#d4935f;
    --steel:    #5a6475;
    --ink:      #2c2420;
    --ink-lt:   #5c4e44;
    --shadow-a: rgba(0,0,0,.45);
    --shadow-b: rgba(255,255,255,.85);
    --active:   #c0392b;
    --active-lt:#e74c3c;
    --green:    #27ae60;
  }

  body {
    font-family: 'Instrument Sans', sans-serif;
    background: var(--cream-dk);
    color: var(--ink);
    min-height: 100vh;
  }

  select {
    appearance: none;
    -webkit-appearance: none;
    font-family: 'DM Mono', monospace;
    font-size: 12px;
    letter-spacing: .02em;
    background: var(--cream-dk);
    color: var(--ink);
    border: none;
    outline: none;
    cursor: pointer;
    width: 100%;
    padding: 8px 30px 8px 10px;
    border-radius: 8px;
    box-shadow:
      inset 4px 4px 10px rgba(0,0,0,.3),
      inset -3px -3px 8px rgba(255,255,255,.7);
  }

  ::-webkit-scrollbar { width: 8px; }
  ::-webkit-scrollbar-track { background: var(--cream-dk); }
  ::-webkit-scrollbar-thumb {
    background: var(--warm-drk);
    border-radius: 4px;
    box-shadow: inset 2px 2px 4px rgba(0,0,0,.3);
  }
`;

if (!document.getElementById("pvs-css")) {
  const s = document.createElement("style");
  s.id = "pvs-css";
  s.textContent = GLOBAL_CSS;
  document.head.appendChild(s);
}

/* ─────────────────────────────────────────
   DIAL LOADER
───────────────────────────────────────── */
const DialLoader = ({ progress, show }) => {
  const overlayRef = useRef(null);
  const needleRef  = useRef(null);
  const numRef     = useRef(null);
  const tickRefs   = useRef([]);

  useEffect(() => {
    if (!overlayRef.current) return;
    if (show) {
      gsap.fromTo(overlayRef.current,
        { opacity: 0 },
        { opacity: 1, duration: .4, ease: "power2.out" }
      );
    } else {
      gsap.to(overlayRef.current, { opacity: 0, duration: .35, ease: "power2.in" });
    }
  }, [show]);

  useEffect(() => {
    if (!show || !needleRef.current) return;
    const angle = -135 + progress * 2.7;
    gsap.to(needleRef.current, {
      rotation: angle,
      duration: .5,
      ease: "elastic.out(1,.6)",
      transformOrigin: "50% 85%"
    });
    gsap.to(numRef.current, {
      innerText: progress,
      duration: .4,
      snap: { innerText: 1 },
      ease: "none"
    });
    tickRefs.current.forEach((t, i) => {
      if (!t) return;
      gsap.to(t, {
        opacity: i / 36 <= progress / 100 ? 1 : .2,
        duration: .15,
        delay: i * .004,
        ease: "none"
      });
    });
  }, [progress, show]);

  const ticks = Array.from({ length: 37 }, (_, i) => i);

  return (
    <div ref={overlayRef} style={{
      position: "fixed", inset: 0, zIndex: 9999,
      background: "rgba(224,218,206,.75)",
      backdropFilter: "blur(8px)",
      display: "flex", alignItems: "center", justifyContent: "center",
      pointerEvents: show ? "all" : "none",
      opacity: 0,
    }}>
      <div style={{
        width: 260, height: 260,
        borderRadius: "50%",
        background: "linear-gradient(145deg, #e8e0d0, #cec5b5)",
        boxShadow: "20px 20px 50px rgba(0,0,0,.5), -12px -12px 35px rgba(255,255,255,.9), inset 0 0 0 3px rgba(255,255,255,.4)",
        position: "relative",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        {/* Tick marks */}
        {ticks.map((i) => {
          const angle = -135 + i * (270 / 36);
          const rad = angle * Math.PI / 180;
          const r = 110;
          const x = 130 + r * Math.sin(rad);
          const y = 130 - r * Math.cos(rad);
          const isMajor = i % 9 === 0;
          return (
            <div key={i} ref={el => tickRefs.current[i] = el} style={{
              position: "absolute",
              left: x - (isMajor ? 2 : 1),
              top:  y - (isMajor ? 8 : 5),
              width: isMajor ? 4 : 2,
              height: isMajor ? 14 : 8,
              background: i / 36 <= progress / 100 ? "var(--copper)" : "var(--warm-drk)",
              borderRadius: 2,
              transform: `rotate(${angle}deg)`,
              transformOrigin: "50% 50%",
              opacity: .3,
            }} />
          );
        })}

        {/* Inner bowl */}
        <div style={{
          width: 170, height: 170, borderRadius: "50%",
          background: "linear-gradient(145deg, #d8d0c0, #e4ddd0)",
          boxShadow: "inset 8px 8px 20px rgba(0,0,0,.4), inset -6px -6px 18px rgba(255,255,255,.8)",
          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
          position: "relative", zIndex: 2,
        }}>
          <div ref={numRef} style={{
            fontFamily: "'DM Serif Display', serif",
            fontSize: 46, fontWeight: 400, color: "var(--ink)", lineHeight: 1,
          }}>0</div>
          <div style={{
            fontFamily: "'DM Mono', monospace",
            fontSize: 10, letterSpacing: ".15em", textTransform: "uppercase",
            color: "var(--ink-lt)", marginTop: 4,
          }}>Processing</div>
          <div style={{
            width: 6, height: 6, borderRadius: "50%", marginTop: 10,
            background: "var(--copper)",
            boxShadow: "0 0 8px var(--copper), 0 0 20px var(--copper-lt)",
          }} />
        </div>

        {/* Needle */}
        <div ref={needleRef} style={{
          position: "absolute",
          width: 5, height: 95,
          background: "linear-gradient(to top, var(--copper), var(--ink))",
          borderRadius: "3px 3px 0 0",
          bottom: "50%", left: "calc(50% - 2.5px)",
          transformOrigin: "50% 85%",
          transform: "rotate(-135deg)",
          zIndex: 3,
          boxShadow: "0 0 6px rgba(0,0,0,.6)",
        }} />

        {/* Center knob */}
        <div style={{
          position: "absolute", width: 20, height: 20, borderRadius: "50%",
          background: "linear-gradient(145deg, #c8b89a, #a09070)",
          boxShadow: "4px 4px 10px rgba(0,0,0,.5), -2px -2px 6px rgba(255,255,255,.4)",
          zIndex: 4,
        }} />
      </div>
    </div>
  );
};

/* ─────────────────────────────────────────
   TOGGLE SWITCH
───────────────────────────────────────── */
const Toggle = ({ active, onClick, color = "var(--copper)" }) => {
  const knobRef = useRef(null);
  const trackRef = useRef(null);

  useEffect(() => {
    if (!knobRef.current) return;
    gsap.to(knobRef.current, { x: active ? 20 : 0, duration: .25, ease: "back.out(2)" });
  }, [active]);

  return (
    <div
      ref={trackRef}
      onClick={onClick}
      style={{
        width: 44, height: 24, borderRadius: 12,
        background: active
          ? `linear-gradient(135deg, ${color}, color-mix(in srgb, ${color} 60%, black))`
          : "linear-gradient(145deg, #c8bfad, #d8d0c0)",
        boxShadow: active
          ? `inset 2px 2px 6px rgba(0,0,0,.4), 0 0 12px ${color}55`
          : "inset 3px 3px 8px rgba(0,0,0,.35), inset -2px -2px 6px rgba(255,255,255,.7)",
        cursor: "pointer",
        position: "relative",
        flexShrink: 0,
        transition: "background .25s, box-shadow .25s",
      }}
    >
      <div ref={knobRef} style={{
        position: "absolute", top: 3, left: 3,
        width: 18, height: 18, borderRadius: "50%",
        background: "linear-gradient(145deg, #f4ede0, #d8cfc0)",
        boxShadow: "3px 3px 8px rgba(0,0,0,.4), -1px -1px 4px rgba(255,255,255,.8)",
      }} />
    </div>
  );
};

/* ─────────────────────────────────────────
   NEUMORPHIC BUTTON
───────────────────────────────────────── */
const NeuBtn = ({ children, onClick, disabled, accent }) => {
  const ref = useRef(null);

  const down = () => gsap.to(ref.current, {
    boxShadow: "inset 4px 4px 14px rgba(0,0,0,.45), inset -3px -3px 10px rgba(255,255,255,.5)",
    scale: .97, duration: .1
  });
  const up = () => gsap.to(ref.current, {
    boxShadow: accent
      ? "10px 10px 28px rgba(0,0,0,.5), -4px -4px 16px rgba(255,255,255,.3)"
      : "10px 10px 28px rgba(0,0,0,.4), -6px -6px 20px rgba(255,255,255,.9)",
    scale: 1, duration: .2, ease: "back.out(2)"
  });

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
        fontWeight: 700,
        fontSize: 13,
        letterSpacing: ".08em",
        textTransform: "uppercase",
        padding: "14px 36px",
        borderRadius: 10,
        border: "none",
        cursor: disabled ? "not-allowed" : "pointer",
        color: accent ? "#f8f0e0" : "var(--ink)",
        background: accent
          ? "linear-gradient(135deg, #c8843a, #7a4e28)"
          : "linear-gradient(145deg, #ede6d6, #cec5b5)",
        boxShadow: disabled
          ? "none"
          : accent
            ? "10px 10px 28px rgba(0,0,0,.5), -4px -4px 16px rgba(255,255,255,.3)"
            : "10px 10px 28px rgba(0,0,0,.4), -6px -6px 20px rgba(255,255,255,.9)",
        opacity: disabled ? .5 : 1,
        transition: "opacity .2s",
      }}
    >
      {children}
    </button>
  );
};

/* ─────────────────────────────────────────
   DROP ZONE
───────────────────────────────────────── */
const DropZone = ({ label, file, onFile, inputRef }) => {
  const ref = useRef(null);

  const enter = () => gsap.to(ref.current, {
    scale: 1.02,
    boxShadow: "inset 6px 6px 18px rgba(0,0,0,.35), inset -4px -4px 14px rgba(255,255,255,.7), 0 0 30px rgba(184,115,51,.2)",
    duration: .2
  });
  const leave = () => gsap.to(ref.current, {
    scale: 1,
    boxShadow: "10px 10px 30px rgba(0,0,0,.4), -8px -8px 22px rgba(255,255,255,.9)",
    duration: .2
  });

  return (
    <div
      ref={ref}
      onClick={() => inputRef.current.click()}
      onDragEnter={enter}
      onDragOver={e => e.preventDefault()}
      onDragLeave={leave}
      onDrop={e => { e.preventDefault(); leave(); const f = e.dataTransfer.files[0]; if (f?.name.endsWith(".xlsx")) onFile(f); }}
      style={{
        flex: 1, padding: "40px 24px", textAlign: "center",
        borderRadius: 16, cursor: "pointer",
        background: "linear-gradient(145deg, #ede6d6, #d8cfc0)",
        boxShadow: "10px 10px 30px rgba(0,0,0,.4), -8px -8px 22px rgba(255,255,255,.9)",
        border: "1px solid rgba(255,255,255,.5)",
        userSelect: "none",
      }}
    >
      <div style={{ marginBottom: 18 }}>
        <svg width="52" height="60" viewBox="0 0 52 60" fill="none">
          <rect x="10" y="9" width="36" height="45" rx="3" fill="rgba(0,0,0,.08)" />
          <rect x="8" y="7" width="36" height="45" rx="3" fill="rgba(0,0,0,.12)" />
          <rect x="6" y="5" width="36" height="45" rx="3"
            fill={file ? "#e8d4b8" : "var(--cream)"}
            stroke="rgba(0,0,0,.18)" strokeWidth="1"
          />
          <line x1="13" y1="17" x2="35" y2="17" stroke="rgba(0,0,0,.15)" strokeWidth="1.5" strokeLinecap="round"/>
          <line x1="13" y1="24" x2="35" y2="24" stroke="rgba(0,0,0,.15)" strokeWidth="1.5" strokeLinecap="round"/>
          <line x1="13" y1="31" x2="27" y2="31" stroke="rgba(0,0,0,.15)" strokeWidth="1.5" strokeLinecap="round"/>
          {file ? (
            <path d="M15 42 L22 49 L38 33" stroke="#27ae60" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
          ) : (
            <>
              <path d="M24 42 L24 36 M24 36 L21 39 M24 36 L27 39" stroke="var(--copper)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
              <line x1="19" y1="46" x2="29" y2="46" stroke="var(--copper)" strokeWidth="1.8" strokeLinecap="round"/>
            </>
          )}
        </svg>
      </div>

      <div style={{
        fontFamily: "'DM Serif Display', serif",
        fontSize: 17, color: "var(--ink)", marginBottom: 8,
      }}>{label}</div>

      {file ? (
        <div style={{
          fontFamily: "'DM Mono', monospace",
          fontSize: 11, color: "#27ae60",
          letterSpacing: ".05em",
          background: "rgba(39,174,96,.1)",
          padding: "5px 12px", borderRadius: 6,
          display: "inline-block",
          border: "1px solid rgba(39,174,96,.25)",
        }}>{file.name}</div>
      ) : (
        <div style={{
          fontFamily: "'DM Mono', monospace",
          fontSize: 11, color: "var(--ink-lt)", letterSpacing: ".05em",
        }}>drop .xlsx · click to browse</div>
      )}

      <input ref={inputRef} type="file" accept=".xlsx" hidden
        onChange={e => { const f = e.target.files[0]; if (f) onFile(f); }} />
    </div>
  );
};

/* ─────────────────────────────────────────
   STEPPER HEADER
───────────────────────────────────────── */
const StepperHeader = ({ active }) => {
  const steps = ["Upload Files", "Review Mapping"];
  return (
    <div style={{ display: "flex", alignItems: "center", marginBottom: 44 }}>
      {steps.map((s, i) => (
        <React.Fragment key={s}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
            <div style={{
              width: 40, height: 40, borderRadius: "50%",
              background: i <= active
                ? "linear-gradient(135deg, #c8843a, #7a4e28)"
                : "linear-gradient(145deg, #ddd6c6, #c0b8a8)",
              boxShadow: i <= active
                ? "5px 5px 14px rgba(0,0,0,.5), -2px -2px 8px rgba(255,255,255,.4), 0 0 18px rgba(184,115,51,.35)"
                : "5px 5px 14px rgba(0,0,0,.3), -3px -3px 10px rgba(255,255,255,.7)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontFamily: "'DM Serif Display', serif",
              color: i <= active ? "#f8f0e0" : "var(--warm-drk)",
              fontSize: 17,
              transition: "all .5s ease",
            }}>{i + 1}</div>
            <div style={{
              fontFamily: "'Instrument Sans', sans-serif",
              fontSize: 10, letterSpacing: ".12em", textTransform: "uppercase",
              color: i <= active ? "var(--copper)" : "var(--warm-drk)",
              fontWeight: 700, transition: "color .4s",
            }}>{s}</div>
          </div>

          {i < steps.length - 1 && (
            <div style={{
              flex: 1, height: 2, margin: "0 18px", marginBottom: 20,
              background: active >= 1
                ? "linear-gradient(90deg, #c8843a, #d4935f)"
                : "var(--warm-mid)",
              boxShadow: active >= 1 ? "0 0 8px rgba(184,115,51,.6)" : "none",
              borderRadius: 1,
              transition: "all .6s ease",
            }} />
          )}
        </React.Fragment>
      ))}
    </div>
  );
};

/* ─────────────────────────────────────────
   MAIN COMPONENT
───────────────────────────────────────── */
export default function PostValidationStepper() {
  const [activeStep,    setActiveStep]    = useState(0);
  const [legacyFile,    setLegacyFile]    = useState(null);
  const [oracleFile,    setOracleFile]    = useState(null);
  const [rows,          setRows]          = useState([]);
  const [targetOptions, setTargetOptions] = useState([]);
  const [loading,       setLoading]       = useState(false);
  const [progress,      setProgress]      = useState(0);
  const [error,         setError]         = useState("");

  const cardRef     = useRef(null);
  const step1Ref    = useRef(null);
  const step2Ref    = useRef(null);
  const sourceInput = useRef();
  const targetInput = useRef();
  const rowRefs     = useRef([]);

  /* Card entrance */
  useEffect(() => {
    gsap.fromTo(cardRef.current,
      { y: 80, opacity: 0, scale: .95 },
      { y: 0, opacity: 1, scale: 1, duration: 1.1, ease: "expo.out" }
    );
  }, []);

  /* Step transition */
  const transitionToStep = useCallback((step) => {
    const outEl = step === 1 ? step1Ref.current : step2Ref.current;
    const inEl  = step === 1 ? step2Ref.current : step1Ref.current;

    gsap.to(outEl, {
      x: step === 1 ? -60 : 60,
      opacity: 0,
      duration: .35,
      ease: "power2.in",
      onComplete: () => {
        setActiveStep(step);
        gsap.set(inEl, { display: "block" });
        gsap.set(outEl, { display: "none" });
        gsap.fromTo(inEl,
          { x: step === 1 ? 60 : -60, opacity: 0 },
          { x: 0, opacity: 1, duration: .5, ease: "expo.out" }
        );
      }
    });
  }, []);

  /* Row stagger */
  useEffect(() => {
    if (activeStep !== 1 || rowRefs.current.length === 0) return;
    const validRefs = rowRefs.current.filter(Boolean);
    gsap.fromTo(validRefs,
      { x: 30, opacity: 0 },
      { x: 0, opacity: 1, stagger: .035, duration: .4, ease: "power3.out", delay: .15 }
    );
  }, [activeStep, rows]);

  const simulateProgress = () => new Promise(res => {
    let p = 15;
    const id = setInterval(() => {
      p += Math.random() * 12 + 3;
      if (p >= 95) { clearInterval(id); res(); return; }
      setProgress(Math.round(p));
    }, 180);
  });

const runMapping = async () => {
  if (!legacyFile || !oracleFile) {
    setError("Please upload both files.");
    return;
  }

  setError("");
  setLoading(true);
  setProgress(5);

  try {
    const form = new FormData();
    form.append("legacyFile", legacyFile);
    form.append("oracleFile", oracleFile);
    form.append("legacySheet", "");
    form.append("oracleSheet", "");
    form.append("customerName", "default");
    form.append("instanceName", "default");

    let lastUpdate = 0;

    const res = await api.post(
      "/excel/columns/mapping",
      form,
      {
        onUploadProgress: e => {
          if (!e.total) return;

          const now = Date.now();
          if (now - lastUpdate < 100) return;
          lastUpdate = now;

          const percent = Math.round((e.loaded * 100) / e.total);
          requestAnimationFrame(() => setProgress(percent));
        }
      }
    );

    /* simulate backend thinking phase */
    await simulateProgress();

    /* ---------- SAFE RESPONSE PARSE ---------- */

    const legacyCols = Array.isArray(res.data?.legacy_columns)
      ? res.data.legacy_columns
      : [];

    const oracleCols = Array.isArray(res.data?.oracle_columns)
      ? res.data.oracle_columns
      : [];

    const suggested = res.data?.suggested_mapping || {};
    const dateCols = res.data?.date_columns || [];

    if (!legacyCols.length || !oracleCols.length)
      throw new Error("Invalid API response");

    /* ---------- STATE SET ---------- */

    setTargetOptions(oracleCols);

    setRows(
      legacyCols.map((col, i) => ({
        id: i,
        source: col,
        target: suggested[col] || oracleCols[0] || "",
        isKey: false,
        isDate: dateCols.includes(col),
        validate: true,
        include: false
      }))
    );

    /* ---------- SUCCESS ---------- */

    setProgress(100);

    setTimeout(() => {
      setLoading(false);
      transitionToStep(1);
      setProgress(0);
    }, 400);

  } catch (err) {

    console.error("Mapping error:", err);

    if (err.response) {
      const code = err.response.status;

      if (code === 400) setError("Invalid Excel format");
      else if (code === 422) setError("Missing required fields");
      else if (code === 500) setError("Server processing error");
      else setError("Unexpected server error");
    }
    else if (err.request)
      setError("Server not reachable");
    else
      setError("Request failed");

    setLoading(false);
  }
};


  const updateRow = (id, field, val) => {
    setRows(r => r.map(x => x.id === id ? { ...x, [field]: val } : x));
    const el = rowRefs.current[id];
    if (el) {
      gsap.fromTo(el,
        { backgroundColor: "rgba(184,115,51,.13)" },
        { backgroundColor: "transparent", duration: .7, ease: "power2.out" }
      );
    }
  };

const handleValidate = async () => {
  const keys = rows.filter(r => r.isKey).map(r => r.source);

  if (keys.length === 0) {
    setError("Select at least one Key column before validating.");
    return;
  }

  try {
    setLoading(true);
    setProgress(10);

    const mappings = {};
    rows.forEach(r => {
      mappings[r.source] = r.target;
    });

    const includedColumns = rows.filter(r => r.include).map(r => r.source);
    const dateColumns = rows.filter(r => r.isDate).map(r => r.source);
    const validateColumns = rows.filter(r => r.validate).map(r => r.source);

    const form = new FormData();

    /* FILES */
    form.append("legacyFile", legacyFile);
    form.append("oracleFile", oracleFile);

    /* REQUIRED META */
    form.append("customerName", "default");
    form.append("instanceName", "default");

    /* ARRAYS + OBJECTS (STRINGIFIED JSON) */
    form.append("mappings", JSON.stringify(mappings));
    form.append("keyColumns", JSON.stringify(keys));
    form.append("includedColumns", JSON.stringify(includedColumns));
    form.append("dateColumns", JSON.stringify(dateColumns));
    form.append("timestampColumns", JSON.stringify([]));
    form.append("dateColumnstarget", JSON.stringify(dateColumns));
    form.append("timestampColumnstarget", JSON.stringify([]));

    /* OPTIONAL */
    form.append("legacySheet", "");
    form.append("oracleSheet", "");
    form.append("includeSourceTargetFiles", false);

    const res = await api.post(
      "/excel/post_validation/validate",
      form,
      {
        responseType: "blob",   // ⭐ REQUIRED
        onUploadProgress: e => {
          if (!e.total) return;
          const percent = Math.round((e.loaded * 100) / e.total);
          setProgress(percent);
        }
      }
    );

    /* -------- DOWNLOAD FILE -------- */

    const blob = new Blob([res.data]);

    // try to read filename from backend header
    let filename = "validated.xlsx";
    const disposition = res.headers["content-disposition"];

    if (disposition && disposition.includes("filename=")) {
      filename = disposition
        .split("filename=")[1]
        .replace(/"/g, "")
        .trim();
    }

    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();

    link.remove();
    window.URL.revokeObjectURL(url);


    setProgress(100);
    console.log("VALIDATION RESULT:", res.data);

  } catch (err) {
    console.error(err);
    setError("Validation failed");
  } finally {
    setLoading(false);
  }
};


  const grid = {
    display: "grid",
    gridTemplateColumns: "1.8fr 1.8fr 60px 60px 72px 72px",
    alignItems: "center",
    gap: 8,
  };

  return (
    <>
      <DialLoader progress={progress} show={loading} />

      <div style={{
        minHeight: "100vh",
        padding: "48px 32px",
        background: `
          radial-gradient(ellipse at 20% 10%, rgba(184,115,51,.07) 0%, transparent 55%),
          radial-gradient(ellipse at 80% 90%, rgba(90,100,117,.07) 0%, transparent 55%),
          #dfd8cc
        `,
      }}>
        <div ref={cardRef} style={{
          maxWidth: 980,
          margin: "0 auto",
          padding: 52,
          borderRadius: 24,
          background: "linear-gradient(160deg, #ede8dc 0%, #d8d0c0 100%)",
          boxShadow: "28px 28px 70px rgba(0,0,0,.5), -16px -16px 50px rgba(255,255,255,.95), inset 0 1px 0 rgba(255,255,255,.6)",
          border: "1px solid rgba(255,255,255,.4)",
          position: "relative",
          overflow: "hidden",
        }}>

          {/* Corner screws */}
          {[{top:16,left:16},{top:16,right:16},{bottom:16,left:16},{bottom:16,right:16}].map((pos, i) => (
            <div key={i} style={{
              position: "absolute", ...pos,
              width: 15, height: 15, borderRadius: "50%",
              background: "linear-gradient(135deg, #c0b8a8, #a09080)",
              boxShadow: "2px 2px 5px rgba(0,0,0,.45), -1px -1px 3px rgba(255,255,255,.5)",
            }}>
              <div style={{
                position: "absolute", top: "50%", left: "50%",
                width: "60%", height: 2,
                background: "rgba(0,0,0,.45)",
                transform: `translate(-50%,-50%) rotate(${45 + i * 45}deg)`,
              }} />
            </div>
          ))}

          <StepperHeader active={activeStep} />

          {/* STEP 1 */}
          <div ref={step1Ref}>
            <div style={{
              fontFamily: "'DM Serif Display', serif",
              fontSize: 30, marginBottom: 6, color: "var(--ink)",
            }}>Upload Validation Files</div>
            <div style={{
              fontFamily: "'DM Mono', monospace",
              fontSize: 12, color: "var(--ink-lt)", letterSpacing: ".05em", marginBottom: 38,
            }}>Provide source (legacy) and target (oracle) .xlsx spreadsheets to begin mapping</div>

            <div style={{ display: "flex", gap: 24, marginBottom: 36 }}>
              <DropZone label="Source File" file={legacyFile} onFile={setLegacyFile} inputRef={sourceInput} />
              <DropZone label="Target File" file={oracleFile} onFile={setOracleFile} inputRef={targetInput} />
            </div>

            <div style={{
              height: 1,
              background: "linear-gradient(90deg, transparent, var(--warm-mid), transparent)",
              marginBottom: 30,
            }} />

            {error && (
              <div style={{
                fontFamily: "'DM Mono', monospace",
                fontSize: 12, color: "var(--active)", letterSpacing: ".04em",
                marginBottom: 20,
                padding: "12px 16px", borderRadius: 10,
                background: "rgba(192,57,43,.08)",
                border: "1px solid rgba(192,57,43,.2)",
              }}>{error}</div>
            )}

            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <NeuBtn onClick={runMapping} disabled={!legacyFile || !oracleFile} accent>
                Run Mapping →
              </NeuBtn>
            </div>
          </div>

          {/* STEP 2 */}
          <div ref={step2Ref} style={{ display: "none" }}>
            <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 28 }}>
              <div>
                <div style={{
                  fontFamily: "'DM Serif Display', serif",
                  fontSize: 30, marginBottom: 6, color: "var(--ink)",
                }}>Column Configuration</div>
                <div style={{
                  fontFamily: "'DM Mono', monospace",
                  fontSize: 11, color: "var(--ink-lt)", letterSpacing: ".06em",
                }}>
                  {rows.length} columns · {rows.filter(r => r.isKey).length} key{rows.filter(r=>r.isKey).length !== 1 ? "s" : ""} selected
                </div>
              </div>

              {/* Legend */}
              <div style={{ display: "flex", gap: 18, alignItems: "center" }}>
                {[["Key","#b87333"],["Date","#5a6475"],["Validate","#27ae60"],["Include","#c0392b"]].map(([l,c]) => (
                  <div key={l} style={{ display: "flex", alignItems: "center", gap: 5 }}>
                    <div style={{ width: 7, height: 7, borderRadius: "50%", background: c, boxShadow: `0 0 5px ${c}` }} />
                    <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: "var(--ink-lt)", letterSpacing: ".08em", textTransform: "uppercase" }}>{l}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Table */}
            <div style={{
              borderRadius: 14,
              background: "linear-gradient(160deg, #d0c8b8, #c0b8a8)",
              boxShadow: "inset 6px 6px 18px rgba(0,0,0,.38), inset -4px -4px 14px rgba(255,255,255,.55)",
              overflow: "hidden",
            }}>
              {/* Header */}
              <div style={{
                ...grid,
                padding: "14px 20px",
                background: "rgba(0,0,0,.08)",
                borderBottom: "1px solid rgba(0,0,0,.12)",
              }}>
                {["Source Column","Target Column","Key","Date","Validate","Include"].map(h => (
                  <div key={h} style={{
                    fontFamily: "'DM Mono', monospace",
                    fontSize: 9, fontWeight: 500, letterSpacing: ".14em",
                    textTransform: "uppercase", color: "var(--ink-lt)",
                    textAlign: h.length <= 7 ? "center" : "left",
                  }}>{h}</div>
                ))}
              </div>

              {/* Rows */}
              <div style={{ maxHeight: 400, overflowY: "auto" }}>
                {rows.map((r, idx) => (
                  <div
                    key={r.id}
                    ref={el => rowRefs.current[idx] = el}
                    style={{
                      ...grid,
                      padding: "11px 20px",
                      borderBottom: "1px solid rgba(0,0,0,.06)",
                    }}
                  >
                    <div style={{
                      fontFamily: "'DM Mono', monospace",
                      fontSize: 12, color: "var(--ink)",
                      letterSpacing: ".03em",
                      display: "flex", alignItems: "center", gap: 8,
                    }}>
                      <div style={{
                        width: 6, height: 6, borderRadius: "50%", flexShrink: 0,
                        background: r.isKey ? "var(--copper)" : "rgba(0,0,0,.15)",
                        boxShadow: r.isKey ? "0 0 7px var(--copper)" : "none",
                        transition: "all .25s",
                      }} />
                      {r.source}
                    </div>

                    <div style={{ position: "relative" }}>
                      <select value={r.target} onChange={e => updateRow(r.id, "target", e.target.value)}>
                        {targetOptions.map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                      <div style={{
                        position: "absolute", right: 10, top: "50%",
                        transform: "translateY(-50%)",
                        pointerEvents: "none", color: "var(--ink-lt)", fontSize: 10,
                      }}>▾</div>
                    </div>

                    {[["isKey","#b87333"],["isDate","#5a6475"],["validate","#27ae60"],["include","#c0392b"]].map(([field,color]) => (
                      <div key={field} style={{ display: "flex", justifyContent: "center" }}>
                        <Toggle active={r[field]} onClick={() => updateRow(r.id, field, !r[field])} color={color} />
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>

            {error && (
              <div style={{
                fontFamily: "'DM Mono', monospace",
                fontSize: 12, color: "var(--active)", letterSpacing: ".04em",
                marginTop: 18,
                padding: "12px 16px", borderRadius: 10,
                background: "rgba(192,57,43,.08)",
                border: "1px solid rgba(192,57,43,.2)",
              }}>{error}</div>
            )}

            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 32, alignItems: "center" }}>
              <NeuBtn onClick={() => transitionToStep(0)}>← Back</NeuBtn>
              <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
                <div style={{
                  fontFamily: "'DM Mono', monospace",
                  fontSize: 11, color: "var(--ink-lt)", letterSpacing: ".05em",
                }}>
                  {rows.filter(r => r.validate).length} of {rows.length} cols to validate
                </div>
                <NeuBtn onClick={handleValidate} accent>Validate Mapping ✓</NeuBtn>
              </div>
            </div>
          </div>

        </div>
      </div>
    </>
  );
}