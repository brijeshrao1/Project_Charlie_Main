import React, { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { gsap } from "gsap";

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
const NeuBtn = ({ children, onClick, disabled, accent, fullWidth, style }) => {
  const ref = useRef(null);

  const down = () => {
    if (disabled) return;
    gsap.to(ref.current, {
      boxShadow: "inset 4px 4px 14px rgba(0,0,0,.45), inset -3px -3px 10px rgba(255,255,255,.5)",
      scale: .97, duration: .1
    });
  };
  const up = () => {
    if (disabled) return;
    gsap.to(ref.current, {
      boxShadow: accent
        ? "10px 10px 28px rgba(0,0,0,.5), -4px -4px 16px rgba(255,255,255,.3)"
        : "10px 10px 28px rgba(0,0,0,.4), -6px -6px 20px rgba(255,255,255,.9)",
      scale: 1, duration: .2, ease: "back.out(2)"
    });
  };

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
        padding: "14px 28px",
        borderRadius: 10,
        border: "none",
        cursor: disabled ? "not-allowed" : "pointer",
        color: accent ? "#f8f0e0" : "var(--ink)",
        background: accent
          ? "linear-gradient(135deg, #c8843a, #7a4e28)"
          : "linear-gradient(145deg, #ede6d6, #cec5b5)",
        boxShadow: disabled
          ? "inset 2px 2px 5px rgba(0,0,0,.15), inset -2px -2px 5px rgba(255,255,255,.5)"
          : accent
            ? "10px 10px 28px rgba(0,0,0,.5), -4px -4px 16px rgba(255,255,255,.3)"
            : "10px 10px 28px rgba(0,0,0,.4), -6px -6px 20px rgba(255,255,255,.9)",
        opacity: disabled ? .6 : 1,
        transition: "opacity .2s, box-shadow .2s",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "8px",
        width: fullWidth ? "100%" : "auto",
        ...style
      }}
    >
      {children}
    </button>
  );
};

/* ─────────────────────────────────────────
   NEUMORPHIC INPUT
───────────────────────────────────────── */
const NeuInput = ({ label, type = "text", name, value, onChange, placeholder, icon, onIconClick }) => {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "8px", width: "100%" }}>
      {label && (
        <label style={{
          fontFamily: "'DM Mono', monospace",
          fontSize: 11,
          color: "var(--ink-lt)",
          letterSpacing: ".06em",
          textTransform: "uppercase",
          marginLeft: 4
        }}>
          {label}
        </label>
      )}
      <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
        <input
          type={type}
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          style={{
            fontFamily: "'Instrument Sans', sans-serif",
            fontSize: 15,
            padding: "16px 20px",
            paddingRight: icon ? "48px" : "20px",
            borderRadius: "12px",
            border: "none",
            background: "var(--cream-dk)",
            color: "var(--ink)",
            outline: "none",
            width: "100%",
            boxShadow: "inset 5px 5px 12px rgba(0,0,0,.15), inset -5px -5px 12px rgba(255,255,255,.7)",
            transition: "box-shadow 0.3s ease",
          }}
          onFocus={(e) => {
            e.target.style.boxShadow = "inset 6px 6px 14px rgba(0,0,0,.2), inset -6px -6px 14px rgba(255,255,255,.8), 0 0 0 2px rgba(184,115,51,.3)";
          }}
          onBlur={(e) => {
            e.target.style.boxShadow = "inset 5px 5px 12px rgba(0,0,0,.15), inset -5px -5px 12px rgba(255,255,255,.7)";
          }}
        />
        {icon && (
          <div 
            onClick={onIconClick}
            style={{
              position: "absolute",
              right: "16px",
              cursor: onIconClick ? "pointer" : "default",
              color: "var(--warm-drk)",
              display: "flex"
            }}
          >
            {icon}
          </div>
        )}
      </div>
    </div>
  );
};

/* ─────────────────────────────────────────
   STEPPER HEADER
───────────────────────────────────────── */
const StepperHeader = ({ active }) => {
  const steps = ["Select Customer", "Configure Instances", "Review & Finish"];
  return (
    <div style={{ display: "flex", alignItems: "center", marginBottom: 44, justifyContent: "space-between" }}>
      {steps.map((s, i) => {
        const isCompleted = i < active;
        const isActive = i === active;
        return (
          <React.Fragment key={s}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, zIndex: 2 }}>
              <div style={{
                width: 44, height: 44, borderRadius: "50%",
                background: isActive || isCompleted
                  ? "linear-gradient(135deg, #c8843a, #7a4e28)"
                  : "linear-gradient(145deg, #ddd6c6, #c0b8a8)",
                boxShadow: isActive || isCompleted
                  ? "5px 5px 14px rgba(0,0,0,.4), -2px -2px 8px rgba(255,255,255,.4), 0 0 18px rgba(184,115,51,.35)"
                  : "5px 5px 14px rgba(0,0,0,.3), -3px -3px 10px rgba(255,255,255,.7)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontFamily: "'DM Serif Display', serif",
                color: isActive || isCompleted ? "#f8f0e0" : "var(--warm-drk)",
                fontSize: 18,
                transition: "all .5s ease",
              }}>
                {isCompleted ? (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                ) : (
                  i + 1
                )}
              </div>
              <div style={{
                fontFamily: "'Instrument Sans', sans-serif",
                fontSize: 11, letterSpacing: ".08em", textTransform: "uppercase",
                color: isActive || isCompleted ? "var(--copper)" : "var(--warm-drk)",
                fontWeight: 700, transition: "color .4s",
                position: "absolute",
                transform: "translateY(55px)",
                whiteSpace: "nowrap"
              }}>
                {s}
              </div>
            </div>

            {i < steps.length - 1 && (
              <div style={{
                flex: 1, height: 3, margin: "0 10px",
                background: isCompleted
                  ? "linear-gradient(90deg, #c8843a, #d4935f)"
                  : "var(--warm-mid)",
                boxShadow: isCompleted ? "0 0 8px rgba(184,115,51,.6)" : "inset 1px 1px 3px rgba(0,0,0,.2)",
                borderRadius: 2,
                transition: "all .6s ease",
              }} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};

/* ─────────────────────────────────────────
   MAIN COMPONENT
───────────────────────────────────────── */
export default function OnboardingPage() {
  const navigate = useNavigate();
  
  // States
  const [activeStep, setActiveStep] = useState(0);
  const [customers, setCustomers] = useState([]);
  const [newCustomerName, setNewCustomerName] = useState("");
  const [selectedCustomerId, setSelectedCustomerId] = useState(null);
  
  const [instanceForm, setInstanceForm] = useState({
    name: "", url: "", username: "", password: ""
  });
  const [showPassword, setShowPassword] = useState(false);

  // Refs for animation
  const cardRef = useRef(null);
  const stepRefs = useRef([]);
  stepRefs.current = [useRef(null), useRef(null), useRef(null)];

  /* Initial entrance */
  useEffect(() => {
    gsap.fromTo(cardRef.current,
      { y: 60, opacity: 0, scale: .97 },
      { y: 0, opacity: 1, scale: 1, duration: 1, ease: "expo.out" }
    );
  }, []);

  /* Transition Logic */
  const changeStep = useCallback((newStep) => {
    const currentEl = stepRefs.current[activeStep].current;
    const nextEl = stepRefs.current[newStep].current;
    const direction = newStep > activeStep ? -40 : 40;

    gsap.to(currentEl, {
      x: direction, opacity: 0, duration: 0.3, ease: "power2.in",
      onComplete: () => {
        setActiveStep(newStep);
        gsap.set(currentEl, { display: "none" });
        gsap.set(nextEl, { display: "block" });
        gsap.fromTo(nextEl,
          { x: -direction, opacity: 0 },
          { x: 0, opacity: 1, duration: 0.4, ease: "power3.out" }
        );
      }
    });
  }, [activeStep]);

  /* Handlers */
  const handleAddCustomer = () => {
    if (!newCustomerName.trim()) return;
    const newCust = {
      id: Date.now().toString(),
      name: newCustomerName,
      instances: []
    };
    setCustomers([...customers, newCust]);
    setSelectedCustomerId(newCust.id);
    setNewCustomerName("");
  };

  const handleAddInstance = () => {
    if (!instanceForm.name || !instanceForm.url) return;
    
    setCustomers(customers.map(c => {
      if (c.id === selectedCustomerId) {
        return { ...c, instances: [...c.instances, { ...instanceForm, id: Date.now().toString() }] };
      }
      return c;
    }));
    
    setInstanceForm({ name: "", url: "", username: "", password: "" });
  };

  const selectedCustomer = customers.find(c => c.id === selectedCustomerId);

  return (
    <div style={{
      minHeight: "100vh",
      padding: "64px 32px",
      background: `
        radial-gradient(ellipse at 20% 10%, rgba(184,115,51,.07) 0%, transparent 55%),
        radial-gradient(ellipse at 80% 90%, rgba(90,100,117,.07) 0%, transparent 55%),
        #dfd8cc
      `,
    }}>
      <div ref={cardRef} style={{
        maxWidth: 860,
        margin: "0 auto",
        padding: "52px 64px 64px 64px",
        borderRadius: 24,
        background: "linear-gradient(160deg, #ede8dc 0%, #d8d0c0 100%)",
        boxShadow: "28px 28px 70px rgba(0,0,0,.5), -16px -16px 50px rgba(255,255,255,.95), inset 0 1px 0 rgba(255,255,255,.6)",
        border: "1px solid rgba(255,255,255,.4)",
        position: "relative",
      }}>
        
        {/* Title */}
        <div style={{ textAlign: "center", marginBottom: 50 }}>
          <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 36, color: "var(--ink)" }}>
            Customer Onboarding
          </div>
        </div>

        <StepperHeader active={activeStep} />

        <div style={{ marginTop: 70, minHeight: 350 }}>
          
          {/* STEP 0: Select Customer */}
          <div ref={stepRefs.current[0]} style={{ display: activeStep === 0 ? "block" : "none" }}>
            <div style={{ fontFamily: "'Instrument Sans', sans-serif", fontSize: 16, color: "var(--ink-lt)", textAlign: "center", marginBottom: 32 }}>
              Select an existing customer or add a new one to begin.
            </div>

            <div style={{
              padding: "24px", borderRadius: "16px",
              background: "rgba(0,0,0,.03)",
              boxShadow: "inset 4px 4px 12px rgba(0,0,0,.08), inset -4px -4px 12px rgba(255,255,255,.6)",
              marginBottom: 40
            }}>
              <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
                <div style={{ flex: 1 }}>
                  <NeuInput 
                    placeholder="New Customer Name" 
                    value={newCustomerName}
                    onChange={(e) => setNewCustomerName(e.target.value)}
                  />
                </div>
                <NeuBtn accent onClick={handleAddCustomer} disabled={!newCustomerName.trim()}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <line x1="12" y1="5" x2="12" y2="19"></line>
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                  </svg>
                  Add
                </NeuBtn>
              </div>
            </div>

            <div>
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 12, color: "var(--ink-lt)", letterSpacing: ".05em", marginBottom: 16, textTransform: "uppercase" }}>
                Existing Customers:
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 16 }}>
                {customers.map(c => (
                  <div
                    key={c.id}
                    onClick={() => setSelectedCustomerId(c.id)}
                    style={{
                      padding: "12px 20px", borderRadius: "30px",
                      background: selectedCustomerId === c.id ? "linear-gradient(135deg, #2c2420, #4a3e36)" : "linear-gradient(145deg, #ede6d6, #cec5b5)",
                      color: selectedCustomerId === c.id ? "#fff" : "var(--ink)",
                      boxShadow: selectedCustomerId === c.id 
                        ? "5px 5px 15px rgba(0,0,0,.4), -3px -3px 10px rgba(255,255,255,.2)"
                        : "5px 5px 12px rgba(0,0,0,.2), -4px -4px 10px rgba(255,255,255,.7)",
                      cursor: "pointer", display: "flex", alignItems: "center", gap: 10,
                      fontFamily: "'Instrument Sans', sans-serif", fontWeight: 600, fontSize: 14,
                      transition: "all 0.2s ease"
                    }}
                  >
                    {selectedCustomerId === c.id && (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--copper-lt)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10"></circle>
                        <line x1="12" y1="8" x2="12" y2="12"></line>
                        <line x1="12" y1="16" x2="12.01" y2="16"></line>
                      </svg>
                    )}
                    {c.name}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* STEP 1: Configure Instances */}
          <div ref={stepRefs.current[1]} style={{ display: activeStep === 1 ? "block" : "none" }}>
            <div style={{ fontFamily: "'Instrument Sans', sans-serif", fontSize: 16, color: "var(--ink-lt)", textAlign: "center", marginBottom: 32 }}>
              Now, let's configure the Oracle instances for <strong style={{ color: "var(--ink)" }}>{selectedCustomer?.name}</strong>.
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 20, marginBottom: 24 }}>
              <NeuInput label="Instance Name" placeholder="e.g. DEV1" value={instanceForm.name} onChange={e => setInstanceForm({...instanceForm, name: e.target.value})} />
              <NeuInput label="Oracle URL" placeholder="https://" value={instanceForm.url} onChange={e => setInstanceForm({...instanceForm, url: e.target.value})} />
              <NeuInput label="Oracle Username" placeholder="admin@domain.com" value={instanceForm.username} onChange={e => setInstanceForm({...instanceForm, username: e.target.value})} />
              <NeuInput 
                label="Oracle Password" 
                type={showPassword ? "text" : "password"} 
                placeholder="••••••••••" 
                value={instanceForm.password} 
                onChange={e => setInstanceForm({...instanceForm, password: e.target.value})}
                onIconClick={() => setShowPassword(!showPassword)}
                icon={
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    {showPassword ? (
                      <>
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                        <line x1="1" y1="1" x2="23" y2="23"></line>
                      </>
                    ) : (
                      <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></>
                    )}
                  </svg>
                }
              />
            </div>
            
            <NeuBtn fullWidth accent onClick={handleAddInstance} disabled={!instanceForm.name}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
                <polyline points="17 21 17 13 7 13 7 21"></polyline>
                <polyline points="7 3 7 8 15 8"></polyline>
              </svg>
              Add Instance
            </NeuBtn>

            <div style={{ marginTop: 40 }}>
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 12, color: "var(--ink-lt)", letterSpacing: ".05em", marginBottom: 16 }}>
                Instances for {selectedCustomer?.name}:
              </div>
              
              {selectedCustomer?.instances.length === 0 ? (
                <div style={{
                  padding: "24px", textAlign: "center", borderRadius: "12px",
                  border: "1.5px dashed var(--warm-drk)", color: "var(--warm-drk)",
                  fontFamily: "'Instrument Sans', sans-serif", fontSize: 14
                }}>
                  No instances assigned to this customer yet.
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {selectedCustomer?.instances.map(inst => (
                    <div key={inst.id} style={{
                      padding: "16px 20px", borderRadius: "12px",
                      background: "linear-gradient(145deg, #ede6d6, #d8cfc0)",
                      boxShadow: "5px 5px 12px rgba(0,0,0,.15), -4px -4px 10px rgba(255,255,255,.7)",
                      display: "flex", justifyContent: "space-between", alignItems: "center"
                    }}>
                      <div>
                        <div style={{ fontFamily: "'Instrument Sans', sans-serif", fontWeight: 700, fontSize: 15, color: "var(--ink)" }}>{inst.name}</div>
                        <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: "var(--ink-lt)", marginTop: 4 }}>{inst.url}</div>
                      </div>
                      <div style={{ color: "var(--green)" }}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12"></polyline>
                        </svg>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* STEP 2: Review & Finish */}
          <div ref={stepRefs.current[2]} style={{ display: activeStep === 2 ? "block" : "none" }}>
            <div style={{ textAlign: "center", marginBottom: 40 }}>
              <div style={{ width: 80, height: 80, margin: "0 auto 24px", borderRadius: "50%", background: "linear-gradient(135deg, #27ae60, #1e8449)", boxShadow: "10px 10px 20px rgba(0,0,0,.3), -5px -5px 15px rgba(255,255,255,.8)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff" }}>
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
              </div>
              <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 28, color: "var(--ink)" }}>Ready to Configure</div>
              <div style={{ fontFamily: "'Instrument Sans', sans-serif", fontSize: 15, color: "var(--ink-lt)", marginTop: 8 }}>
                Workspace initialized for <strong>{selectedCustomer?.name}</strong> with {selectedCustomer?.instances.length} instance(s).
              </div>
            </div>

            <div style={{
              padding: "24px", borderRadius: "16px",
              background: "rgba(0,0,0,.03)",
              boxShadow: "inset 4px 4px 12px rgba(0,0,0,.08), inset -4px -4px 12px rgba(255,255,255,.6)",
            }}>
              <NeuBtn 
                fullWidth 
                accent 
                onClick={() => navigate("/configuration", { state: { customerName: selectedCustomer?.name, instanceName: selectedCustomer?.instances[0]?.name || "None" }})}
              >
                Go to Configuration Page →
              </NeuBtn>
            </div>
          </div>

        </div>

        {/* NAVIGATION FOOTER */}
        <div style={{
          marginTop: 48, paddingTop: 32,
          borderTop: "1px solid rgba(0,0,0,.08)",
          display: "flex",
          justifyContent: activeStep > 0 ? "space-between" : "flex-end"
        }}>
          {activeStep > 0 && (
            <NeuBtn onClick={() => changeStep(activeStep - 1)}>
              ← Back
            </NeuBtn>
          )}
          
          {activeStep < 2 && (
            <NeuBtn 
              onClick={() => changeStep(activeStep + 1)} 
              disabled={
                (activeStep === 0 && !selectedCustomerId) || 
                (activeStep === 1 && selectedCustomer?.instances.length === 0)
              }
            >
              Next →
            </NeuBtn>
          )}
        </div>

      </div>
    </div>
  );
}