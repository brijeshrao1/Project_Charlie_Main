import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { gsap } from "gsap";
import api from "../services/api";

/* ─────────────────────────────────────────
   GLOBAL CSS — injected once
───────────────────────────────────────── */
if (!document.getElementById("topbar-pvs-css")) {
  const s = document.createElement("style");
  s.id = "topbar-pvs-css";
  s.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Mono:wght@400;500&family=Instrument+Sans:wght@400;600;700&display=swap');
    
    @keyframes tb-tick {
      from { opacity: 0; transform: translateY(-3px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    .tb-dropdown-item {
      transition: all 0.2s ease;
    }
    .tb-dropdown-item:hover {
      background: linear-gradient(145deg, #d4ccbd, #c4bcad) !important;
    }
    .tb-action-btn {
      transition: all 0.1s ease;
      outline: none;
    }
    .tb-action-btn:active {
      box-shadow: inset 3px 3px 8px rgba(0,0,0,.2), inset -2px -2px 6px rgba(255,255,255,.5) !important;
      transform: scale(0.98);
    }
    .tb-nav-btn:hover {
      background: linear-gradient(145deg, #ddd6c6, #ccc4b0) !important;
    }
  `;
  document.head.appendChild(s);
}

/* ─────────────────────────────────────────
   TOKENS — exact PostValidationStepper palette
───────────────────────────────────────── */
const P = {
  warmDrk: "#a09283",
  copper:  "#b87333",
  ink:     "#2c2420",
  inkLt:   "#5c4e44",
  green:   "#27ae60",
  danger:  "#c0392b",
  amber:   "#c47820",
};

const BS = {
  raisedSm:  "5px 5px 14px rgba(0,0,0,.38), -3px -3px 10px rgba(255,255,255,.82)",
  pressed:   "inset 4px 4px 12px rgba(0,0,0,.42), inset -3px -3px 8px rgba(255,255,255,.55)",
  insetDeep: "inset 5px 5px 14px rgba(0,0,0,.35), inset -4px -4px 12px rgba(255,255,255,.6)",
  insetSm:   "inset 3px 3px 8px rgba(0,0,0,.28), inset -2px -2px 6px rgba(255,255,255,.6)",
  copper:    "5px 5px 14px rgba(0,0,0,.45), -2px -2px 8px rgba(255,255,255,.4), 0 0 16px rgba(184,115,51,.3)",
  dropdown:  "0 10px 30px rgba(0,0,0,.4), 0 0 0 1px rgba(255,255,255,.4) inset",
};

/* ─────────────────────────────────────────
   SCREW
───────────────────────────────────────── */
const Screw = ({ style, angle = 45 }) => (
  <div aria-hidden="true" style={{
    position: "absolute", ...style, zIndex: 6,
    width: 11, height: 11, borderRadius: "50%",
    background: "linear-gradient(135deg, #c0b8a8, #a09080)",
    boxShadow: "2px 2px 4px rgba(0,0,0,.42), -1px -1px 3px rgba(255,255,255,.55)",
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
   TOPBAR
───────────────────────────────────────── */
export default function Topbar() {
  const navigate = useNavigate();
  
  const [time,          setTime]        = useState(new Date());
  const [searchFocused, setSearchFocused]= useState(false);
  
  // Dropdown States
  const [avatarHovered, setAvatarHovered] = useState(false);
  const [dropdownOpen, setDropdownOpen]   = useState(false);
  const [activeIndex, setActiveIndex]     = useState(0);
  
  // Account List (Defaults fallback)
  const [accounts, setAccounts] = useState([{}]);

  const avatarContainerRef = useRef(null);
  const avatarRef          = useRef(null);
  const logoRef            = useRef(null);

  /* Click outside listener for Dropdown */
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (avatarContainerRef.current && !avatarContainerRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  /* Array user data fetch */
  useEffect(() => {
    const fetchCustomers = async () => {
      try { 
        const response = await api.get("/customers");
        const data = response.data;

        if (Array.isArray(data)) {
          const flattened = data.flatMap(customer =>
            (customer.instances || []).map(inst => ({
              customerName: customer.customerName,
              instanceName: inst.instanceName,
              oracleUrl: inst.oracleUrl,
              oracleUsername: inst.oracleUsername,
              oraclePassword: inst.oraclePassword
            }))
          );

          if (flattened.length > 0) {
            setAccounts(flattened);
          }
        }
      } catch (err) {
        console.error("Failed to fetch customers:", err);
      }
    };
    fetchCustomers();
    const id = setInterval(fetchCustomers, 30000); // Polling every 30s
    return () => clearInterval(id);
  }, []);

  /* clock */
  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  /* logo entrance */
  useEffect(() => {
    if (logoRef.current)
      gsap.fromTo(logoRef.current, { scale: .75, opacity: 0 }, { scale: 1, opacity: 1, duration: .65, ease: "back.out(2.5)" });
  }, []);

  /* avatar GSAP */
  const handleAvatarClick = () => {
    if (avatarRef.current) gsap.fromTo(avatarRef.current, { scale: .95 }, { scale: 1, duration: .3, ease: "back.out(2)" });
    setDropdownOpen((prev) => !prev);
  };

  /* Navigation Handlers */
  const activeAccount = accounts[activeIndex] || accounts[0];

  const handleAddNewCustomer = () => {
    setDropdownOpen(false);
    navigate("/onboarding");
  };

  const handleConfiguration = () => {
    navigate("/config", { 
      state: { 
        customerName: activeAccount?.customerName, 
        instanceName: activeAccount?.instanceName 
      } 
    });
  };

  /* time parts */
  const full = time.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true });
  const [hhmm, ampm] = full.split(" ");
  const ss = time.getSeconds().toString().padStart(2, "0");

  const avatarInitial = activeAccount?.customerName ? activeAccount.customerName.charAt(0).toUpperCase() : "A";

  const Divider = () => (
    <div style={{
      width: 1, height: 28, flexShrink: 0,
      background: "linear-gradient(to bottom, transparent, rgba(160,146,131,.45), transparent)",
    }} />
  );

  return (
    <header style={{
      position: "sticky", top: 0, zIndex: 200,
      display: "flex", alignItems: "center", justifyContent: "space-between",
      gap: 16, height: 68, padding: "0 26px",
      background: "linear-gradient(160deg, #d8d2c4 0%, #ccc4b4 100%)",
      boxShadow: "0 4px 20px rgba(0,0,0,.3), 0 1px 0 rgba(255,255,255,.5)",
      borderBottom: "1px solid rgba(255,255,255,.3)",
      fontFamily: "'Instrument Sans', sans-serif", flexShrink: 0,
    }}>

      {/* Screws */}
      <Screw style={{ top: 8, left: 10  }} angle={45}  />
      <Screw style={{ top: 8, right: 10 }} angle={135} />
      <Screw style={{ bottom: 8, left: 10  }} angle={-45} />
      <Screw style={{ bottom: 8, right: 10 }} angle={90}  />

      {/* ── LEFT: Logo + Title ── */}
      <div style={{ display: "flex", alignItems: "center", gap: 14, flexShrink: 0 }}>
        <div ref={logoRef} style={{
          width: 42, height: 42, borderRadius: "50%",
          background: "linear-gradient(135deg, #c8843a, #7a4e28)",
          boxShadow: BS.copper, display: "flex", alignItems: "center", justifyContent: "center",
          fontFamily: "'DM Serif Display', serif", fontSize: 15, color: "#f8f0e0", userSelect: "none", flexShrink: 0,
        }}>
          CH
        </div>
        <div>
          <div style={{
            fontFamily: "'DM Mono', monospace", fontSize: 8, letterSpacing: ".22em", textTransform: "uppercase",
            color: P.warmDrk, marginBottom: 4,
          }}>
            SmartERP's 
          </div>
          <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 18, color: P.ink, lineHeight: 1 }}>
            Charlie
          </div>
        </div>
      </div>

      {/* ── CENTER: Search ── */}
      <div style={{ flex: 1, maxWidth: 440, position: "relative" }}>
        <svg style={{
          position: "absolute", left: 13, top: "50%", transform: "translateY(-50%)", pointerEvents: "none", opacity: .38,
        }} width="14" height="14" viewBox="0 0 14 14" fill="none">
          <circle cx="5.5" cy="5.5" r="4" stroke={P.ink} strokeWidth="1.5"/>
          <path d="M9 9L12.5 12.5" stroke={P.ink} strokeWidth="1.5" strokeLinecap="round"/>
        </svg>

        <input
          type="text"
          placeholder="Search components, files…"
          onFocus={() => setSearchFocused(true)}
          onBlur={() => setSearchFocused(false)}
          style={{
            width: "100%", padding: "10px 44px 10px 36px",
            borderRadius: 10, border: "none", outline: "none",
            background: "linear-gradient(145deg, #c4bbb0, #cec6b8)",
            boxShadow: searchFocused ? `${BS.insetDeep}, 0 0 0 2px rgba(184,115,51,.38)` : BS.insetDeep,
            color: P.ink, fontSize: 12, fontFamily: "'DM Mono', monospace", letterSpacing: ".03em",
            transition: "box-shadow .2s ease",
          }}
        />

        {!searchFocused && (
          <div style={{
            position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)",
            display: "flex", gap: 3, pointerEvents: "none",
          }}>
            {["⌘", "K"].map((k) => (
              <span key={k} style={{
                fontSize: 9, color: P.warmDrk, padding: "2px 5px", borderRadius: 4, fontFamily: "system-ui",
                background: "linear-gradient(145deg, #ddd6c6, #ccc4b0)", boxShadow: "2px 2px 4px rgba(0,0,0,.28), -1px -1px 3px rgba(255,255,255,.7)",
              }}>
                {k}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* ── RIGHT: Config + Clock + Avatar Dropdown ── */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>

        {/* Configuration Button */}
        <button
          onClick={handleConfiguration}
          className="tb-action-btn tb-nav-btn"
          style={{
            display: "flex", alignItems: "center", gap: 8, 
            padding: "8px 14px", borderRadius: 9,
            background: "linear-gradient(145deg, #e0d8c8, #d0c8b8)", 
            boxShadow: BS.raisedSm, border: "none", cursor: "pointer",
            fontFamily: "'Instrument Sans', sans-serif", fontSize: 12, fontWeight: 600, color: P.ink
          }}
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M5.5 8.5A2 2 0 1 1 8.5 5.5A2 2 0 0 1 5.5 8.5Z" stroke={P.ink} strokeWidth="1.2"/>
            <path d="M7 2.5V3.5M7 10.5V11.5M2.5 7H3.5M10.5 7H11.5M3.818 3.818L4.525 4.525M9.475 9.475L10.182 10.182M3.818 10.182L4.525 9.475M9.475 4.525L10.182 3.818" stroke={P.ink} strokeWidth="1.2" strokeLinecap="round"/>
          </svg>
          Configuration
        </button>

        <Divider />

        {/* Clock */}
        <div style={{
          display: "flex", alignItems: "baseline", gap: 1, padding: "8px 16px", borderRadius: 9,
          background: "linear-gradient(145deg, #ddd6c6, #ccc4b4)", boxShadow: BS.raisedSm, fontVariantNumeric: "tabular-nums", flexShrink: 0,
        }}>
          <span style={{ fontFamily: "'DM Serif Display', serif", fontSize: 18, color: P.ink, letterSpacing: "-.3px", lineHeight: 1 }}>{hhmm}</span>
          <span key={ss} style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, fontWeight: 500, color: P.copper, margin: "0 2px", lineHeight: 1, animation: "tb-tick .15s ease" }}>:{ss}</span>
          <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: P.warmDrk, letterSpacing: ".08em", alignSelf: "flex-end", paddingBottom: 1 }}>{ampm}</span>
        </div>

        <Divider />

        {/* Avatar Container with Dropdown */}
        <div ref={avatarContainerRef} style={{ position: "relative" }}>
          
          {/* Main Avatar Button */}
          <div
            ref={avatarRef}
            role="button"
            tabIndex={0}
            onClick={handleAvatarClick}
            onMouseLeave={() => setAvatarHovered(false)}
            onMouseEnter={() => setAvatarHovered(true)}
            onKeyDown={(e) => e.key === "Enter" && handleAvatarClick()}
            style={{
              display: "flex", alignItems: "center", gap: 10,
              padding: "6px 12px 6px 6px", borderRadius: 10, cursor: "pointer",
              background: avatarHovered || dropdownOpen
                ? "linear-gradient(145deg, #ddd6c6, #ccc4b0)"
                : "linear-gradient(145deg, #e0d8c8, #d0c8b8)",
              boxShadow: dropdownOpen ? BS.pressed : BS.raisedSm,
              userSelect: "none", transition: "all .15s ease",
            }}
          >
            <div style={{
              width: 30, height: 30, borderRadius: "50%",
              background: "linear-gradient(135deg, #c8843a, #7a4e28)",
              boxShadow: "3px 3px 8px rgba(0,0,0,.38), -1px -1px 5px rgba(255,255,255,.5)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontFamily: "'DM Serif Display', serif", fontSize: 13, color: "#f8f0e0",
            }}>
              {avatarInitial}
            </div>
            <div>
              <div style={{ fontFamily: "'Instrument Sans', sans-serif", fontSize: 12, fontWeight: 700, color: P.ink, lineHeight: 1 }}>
                {activeAccount?.customerName || "Loading..."}
              </div>
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: P.warmDrk, letterSpacing: ".06em", marginTop: 2 }}>
                {activeAccount?.instanceName || "Loading..."}
              </div>
            </div>
            <svg 
              width="9" height="9" viewBox="0 0 9 9" fill="none" 
              style={{ 
                opacity: .5, flexShrink: 0, 
                transform: dropdownOpen ? "rotate(180deg)" : "rotate(0deg)", 
                transition: "transform 0.3s ease" 
              }}
            >
              <path d="M1.5 3.5L4.5 6.5L7.5 3.5" stroke={P.ink} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>

          {/* Dropdown Menu */}
          {dropdownOpen && (
            <div style={{
              position: "absolute", top: "100%", right: 0, marginTop: 12,
              width: 220, background: "linear-gradient(160deg, #e0d8c8 0%, #ccc4b4 100%)",
              borderRadius: 12, boxShadow: BS.dropdown,
              border: "1px solid rgba(255,255,255,.5)",
              zIndex: 300, overflow: "hidden",
              display: "flex", flexDirection: "column",
              animation: "tb-tick .2s ease forwards"
            }}>
              {/* Header inside dropdown */}
              <div style={{ 
                padding: "10px 14px", borderBottom: "1px solid rgba(160,146,131,.2)",
                fontFamily: "'DM Mono', monospace", fontSize: 9, letterSpacing: ".1em", 
                textTransform: "uppercase", color: P.warmDrk 
              }}>
                Switch Instance
              </div>

              {/* Account List */}
              <div style={{ maxHeight: 200, overflowY: "auto" }}>
                {accounts.map((acc, index) => {
                  const isSelected = index === activeIndex;
                  return (
                    <div
                      key={index}
                      className="tb-dropdown-item"
                      onClick={() => {
                        setActiveIndex(index);
                        setDropdownOpen(false);
                      }}
                      style={{
                        padding: "10px 14px", cursor: "pointer",
                        display: "flex", alignItems: "center", justifyContent: "space-between",
                        background: isSelected ? "rgba(160,146,131,.15)" : "transparent",
                        borderLeft: isSelected ? `3px solid ${P.copper}` : "3px solid transparent",
                      }}
                    >
                      <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                        <span style={{ fontFamily: "'Instrument Sans', sans-serif", fontSize: 13, fontWeight: isSelected ? 700 : 500, color: P.ink }}>
                          {acc.customerName}
                        </span>
                        <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: P.inkLt }}>
                          {acc.instanceName}
                        </span>
                      </div>
                      
                      {/* Checkmark for selected */}
                      {isSelected && (
                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                          <path d="M10 3L4.5 8.5L2 6" stroke={P.copper} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* ── Add New Customer Button ── */}
              <div style={{ 
                padding: "10px", 
                borderTop: "1px solid rgba(160,146,131,.3)",
                background: "rgba(160,146,131,.08)",
              }}>
                <button
                  onClick={handleAddNewCustomer}
                  className="tb-action-btn tb-nav-btn"
                  style={{
                    width: "100%", padding: "8px", borderRadius: 8,
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                    background: "linear-gradient(145deg, #e0d8c8, #d0c8b8)",
                    boxShadow: BS.raisedSm, border: "none", cursor: "pointer",
                    fontFamily: "'Instrument Sans', sans-serif", fontSize: 13, fontWeight: 600, color: P.ink
                  }}
                >
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ marginLeft: "4px" }}>
                    <path d="M7 3V11M3 7H11" stroke={P.ink} strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                  Add New Customer
                </button>
              </div>

            </div>
          )}

        </div>
      </div>
    </header>
  );
}