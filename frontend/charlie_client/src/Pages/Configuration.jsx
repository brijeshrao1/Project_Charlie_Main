import React, { useState, useRef, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { gsap } from "gsap";
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
`;

if (!document.getElementById("pvs-css")) {
  const s = document.createElement("style");
  s.id = "pvs-css";
  s.textContent = GLOBAL_CSS;
  document.head.appendChild(s);
}

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
          ? "inset 2px 2px 5px rgba(0,0,0,.2), inset -2px -2px 5px rgba(255,255,255,.4)"
          : accent
            ? "10px 10px 28px rgba(0,0,0,.5), -4px -4px 16px rgba(255,255,255,.3)"
            : "10px 10px 28px rgba(0,0,0,.4), -6px -6px 20px rgba(255,255,255,.9)",
        opacity: disabled ? .6 : 1,
        transition: "opacity .2s, box-shadow .2s",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "8px"
      }}
    >
      {children}
    </button>
  );
};

/* ─────────────────────────────────────────
   MAIN COMPONENT
───────────────────────────────────────── */
export default function Configuration() {
  const [lookupLoading, setLookupLoading] = useState(false);
  const [mandatoryLoading, setMandatoryLoading] = useState(false);
  const [lookupDone, setLookupDone] = useState(false);
  const [mandatoryDone, setMandatoryDone] = useState(false);
  
  const location = useLocation();
  const { customerName, instanceName, targetNode } = location.state || {};
  const activeCustomer = customerName || "Unknown Customer";
  const activeInstance = instanceName || "Unknown Instance";

  const cardRef = useRef(null);

  /* Card entrance animation */
  useEffect(() => {
    gsap.fromTo(cardRef.current,
      { y: 80, opacity: 0, scale: .95 },
      { y: 0, opacity: 1, scale: 1, duration: 1.1, ease: "expo.out" }
    );
  }, []);

  const payload = {
    customerName: activeCustomer,
    instanceName: activeInstance,
    target_node: targetNode || "Global"
  };

  const handleLookupLoad = async () => {
    try {
      setLookupLoading(true);
      console.log("Sending payload →", payload);
      await api.post("/hdl/oracle_fetch/lookupdataload", payload);
      setLookupDone(true);
    } catch (err) {
      console.error(err);
      alert("Lookup load failed");
    } finally {
      setLookupLoading(false);
    }
  };

  const handleMandatoryLoad = async () => {
    try {
      setMandatoryLoading(true);
      console.log("Sending payload →", payload);
      await api.post("/hdl/oracle_fetch/mandatoryFields", payload);
      setMandatoryDone(true);
    } catch (err) {
      console.error(err);
      alert("Mandatory load failed");
    } finally {
      setMandatoryLoading(false);
    }
  };

  return (
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

        {/* HEADER */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 44 }}>
          <div>
            <div style={{
              fontFamily: "'DM Serif Display', serif",
              fontSize: 34, marginBottom: 6, color: "var(--ink)",
            }}>
              Customer: <span style={{ color: "var(--copper)" }}>{activeCustomer}</span>
            </div>
            <div style={{
              fontFamily: "'DM Mono', monospace",
              fontSize: 14, color: "var(--ink-lt)", letterSpacing: ".05em",
            }}>
              Instance: {activeInstance}
            </div>
          </div>
          
          {targetNode && (
            <div style={{ textAlign: "right" }}>
              <div style={{
                fontFamily: "'Instrument Sans', sans-serif",
                fontSize: 10, letterSpacing: ".12em", textTransform: "uppercase",
                color: "var(--warm-drk)", fontWeight: 700, marginBottom: 4
              }}>
                Configuring Node
              </div>
              <div style={{
                fontFamily: "'DM Mono', monospace",
                fontSize: 16, color: "var(--copper-lt)", fontWeight: 500
              }}>
                ⚙️ {targetNode}
              </div>
            </div>
          )}
        </div>

        <div style={{
          height: 1,
          background: "linear-gradient(90deg, transparent, var(--warm-mid), transparent)",
          marginBottom: 44,
        }} />

        {/* CARDS GRID */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 32 }}>

          {/* LOOKUP CARD */}
          <div style={{
            padding: "40px 32px", textAlign: "center", borderRadius: 16,
            background: "linear-gradient(145deg, #ede6d6, #d8cfc0)",
            boxShadow: "10px 10px 30px rgba(0,0,0,.4), -8px -8px 22px rgba(255,255,255,.9)",
            border: "1px solid rgba(255,255,255,.5)",
            display: "flex", flexDirection: "column", justifyContent: "space-between"
          }}>
            <div>
              <div style={{
                fontFamily: "'DM Serif Display', serif",
                fontSize: 22, color: "var(--ink)", marginBottom: 12,
              }}>Lookup Data Load</div>
              <div style={{
                fontFamily: "'Instrument Sans', sans-serif",
                fontSize: 14, color: "var(--ink-lt)", marginBottom: 32, lineHeight: 1.5
              }}>
                Loads lookup data from Oracle API for <strong style={{color: "var(--copper)"}}>{targetNode || "All Modules"}</strong>.
              </div>
            </div>
            <NeuBtn
              onClick={handleLookupLoad}
              disabled={lookupLoading || lookupDone}
              accent={!lookupDone && !lookupLoading}
            >
              {lookupDone ? "Loaded ✔" : lookupLoading ? "Loading..." : "Load Lookup Data ↓"}
            </NeuBtn>
          </div>

          {/* MANDATORY CARD */}
          <div style={{
            padding: "40px 32px", textAlign: "center", borderRadius: 16,
            background: "linear-gradient(145deg, #ede6d6, #d8cfc0)",
            boxShadow: "10px 10px 30px rgba(0,0,0,.4), -8px -8px 22px rgba(255,255,255,.9)",
            border: "1px solid rgba(255,255,255,.5)",
            display: "flex", flexDirection: "column", justifyContent: "space-between"
          }}>
            <div>
              <div style={{
                fontFamily: "'DM Serif Display', serif",
                fontSize: 22, color: "var(--ink)", marginBottom: 12,
              }}>Mandatory Fields Load</div>
              <div style={{
                fontFamily: "'Instrument Sans', sans-serif",
                fontSize: 14, color: "var(--ink-lt)", marginBottom: 32, lineHeight: 1.5
              }}>
                Loads mandatory configuration definitions directly from Oracle.
              </div>
            </div>
            <NeuBtn
              onClick={handleMandatoryLoad}
              disabled={mandatoryLoading || mandatoryDone}
              accent={!mandatoryDone && !mandatoryLoading}
            >
              {mandatoryDone ? "Loaded ✔" : mandatoryLoading ? "Loading..." : "Load Mandatory Fields ↓"}
            </NeuBtn>
          </div>

        </div>

        {/* STATUS */}
        <div style={{
          marginTop: 48,
          padding: "16px",
          textAlign: "center",
          borderRadius: 12,
          background: lookupDone && mandatoryDone ? "rgba(39,174,96,.1)" : "rgba(0,0,0,.04)",
          border: lookupDone && mandatoryDone ? "1px solid rgba(39,174,96,.25)" : "1px solid transparent",
          transition: "all 0.4s ease"
        }}>
          <div style={{
            fontFamily: "'DM Mono', monospace",
            fontSize: 13,
            letterSpacing: ".06em",
            color: lookupDone && mandatoryDone ? "var(--green)" : "var(--ink-lt)",
            fontWeight: lookupDone && mandatoryDone ? 500 : 400
          }}>
            {lookupDone && mandatoryDone
              ? "Configuration Ready ✔"
              : "Load both datasets to continue."}
          </div>
        </div>

      </div>
    </div>
  );
}