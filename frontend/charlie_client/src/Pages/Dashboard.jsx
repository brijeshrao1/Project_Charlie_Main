import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { gsap } from "gsap";
import api from "../services/api";

/* ─────────────────────────────────────────
   GLOBAL CSS
───────────────────────────────────────── */
if (!document.getElementById("dash-pvs-css")) {
  const s = document.createElement("style");
  s.id = "dash-pvs-css";
  s.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Mono:wght@400;500&family=Instrument+Sans:wght@400;600;700&display=swap');
    @keyframes dash-spin { to { transform: rotate(360deg); } }
    @keyframes dash-pulse-green {
      0%   { box-shadow: 0 0 0 0 rgba(39,174,96,.7); }
      70%  { box-shadow: 0 0 0 7px rgba(39,174,96,0); }
      100% { box-shadow: 0 0 0 0 rgba(39,174,96,0); }
    }
    @keyframes dash-pulse-amber {
      0%, 100% { opacity: 1; } 50% { opacity: .35; }
    }
    @keyframes dash-pulse-red {
      0%   { box-shadow: 0 0 0 0 rgba(192,57,43,.7); }
      70%  { box-shadow: 0 0 0 7px rgba(192,57,43,0); }
      100% { box-shadow: 0 0 0 0 rgba(192,57,43,0); }
    }
    @keyframes dash-count {
      from { opacity: 0; transform: translateY(8px) scale(.9); }
      to   { opacity: 1; transform: translateY(0) scale(1); }
    }

    .dash-scroll {
      overflow-y: auto;
      overscroll-behavior: contain;
    }
    .dash-scroll::-webkit-scrollbar { width: 6px; }
    .dash-scroll::-webkit-scrollbar-track { background: transparent; }
    .dash-scroll::-webkit-scrollbar-thumb {
      background: rgba(184,115,51,.3);
      border-radius: 3px;
    }
    .dash-scroll::-webkit-scrollbar-thumb:hover {
      background: rgba(184,115,51,.55);
    }

    .dash-action:hover .dash-action-inner {
      background: linear-gradient(145deg, #ddd6c6, #ccc4b4) !important;
      transform: translateY(-2px);
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
  copperLt:"#d4935f",
  ink:     "#2c2420",
  inkLt:   "#5c4e44",
  green:   "#27ae60",
  danger:  "#c0392b",
  amber:   "#c47820",
};

const BS = {
  raised:    "10px 10px 28px rgba(0,0,0,.42), -6px -6px 20px rgba(255,255,255,.9)",
  raisedSm:  "5px 5px 14px rgba(0,0,0,.38), -3px -3px 10px rgba(255,255,255,.82)",
  raisedMd:  "7px 7px 20px rgba(0,0,0,.4), -4px -4px 14px rgba(255,255,255,.85)",
  pressed:   "inset 4px 4px 12px rgba(0,0,0,.4), inset -3px -3px 8px rgba(255,255,255,.55)",
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
   STAT CARD
───────────────────────────────────────── */
const StatCard = React.forwardRef(({ icon, label, value, accentColor = P.copper }, ref) => {
  const [hovered, setHovered] = useState(false);
  const innerRef = useRef(null);

  useEffect(() => {
    if (innerRef.current)
      gsap.to(innerRef.current, {
        y: hovered ? -4 : 0,
        boxShadow: hovered ? BS.raised : BS.raisedMd,
        duration: .2, ease: "power2.out"
      });
  }, [hovered]);

  return (
    <div
      ref={ref}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{ flex: "1 1 200px", minWidth: 0 }}
    >
      <div
        ref={innerRef}
        style={{
          padding: "22px 22px",
          borderRadius: 14, position: "relative",
          background: "linear-gradient(160deg, #ede8dc 0%, #d8d0c0 100%)",
          boxShadow: BS.raisedMd,
          border: "1px solid rgba(255,255,255,.4)",
          cursor: "default",
          transition: "box-shadow .2s ease",
          overflow: "hidden",
        }}
      >
        <Screw style={{ top: 9, left: 9   }} angle={45}  />
        <Screw style={{ top: 9, right: 9  }} angle={135} />

        {/* Accent bar */}
        <div style={{
          position: "absolute", left: 0, top: 0, bottom: 0, width: 4,
          background: `linear-gradient(to bottom, ${accentColor}, ${accentColor}80)`,
          borderRadius: "14px 0 0 14px",
        }} />

        <div style={{ display: "flex", alignItems: "center", gap: 16, paddingLeft: 8 }}>
          {/* Icon disc */}
          <div style={{
            width: 48, height: 48, borderRadius: "50%", flexShrink: 0,
            background: "linear-gradient(145deg, #ddd6c6, #c0b8a8)",
            boxShadow: BS.raisedSm,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 22,
          }}>
            {icon}
          </div>

          <div>
            <div style={{
              fontFamily: "'DM Mono', monospace",
              fontSize: 9, letterSpacing: ".16em", textTransform: "uppercase",
              color: P.warmDrk, marginBottom: 6,
            }}>
              {label}
            </div>
            <div style={{
              fontFamily: "'DM Serif Display', serif",
              fontSize: 34, color: P.ink, lineHeight: 1,
              animation: "dash-count .45s ease",
            }}>
              {value}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});
StatCard.displayName = "StatCard";

/* ─────────────────────────────────────────
   STATUS INDICATOR
───────────────────────────────────────── */
const StatusIndicator = ({ label, status }) => {
  const color = status === "online" ? P.green : status === "offline" ? P.danger : P.amber;
  const dotAnim = status === "online"
    ? "dash-pulse-green 2.2s ease-out infinite"
    : status === "offline"
    ? "dash-pulse-red 2.2s ease-out infinite"
    : "dash-pulse-amber 1.2s ease-in-out infinite";
  const statusLabel = status === "online" ? "Online" : status === "offline" ? "Offline" : "Checking…";

  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 12,
      padding: "12px 16px", borderRadius: 9,
      background: "linear-gradient(145deg, #d0c8b8, #c4bcac)",
      boxShadow: BS.insetSm,
      border: `1px solid ${color}25`,
    }}>
      <div style={{
        width: 9, height: 9, borderRadius: "50%", flexShrink: 0,
        background: color, animation: dotAnim,
      }} />
      <span style={{
        fontFamily: "'Instrument Sans', sans-serif",
        fontSize: 13, fontWeight: 600, color: P.inkLt, flex: 1,
      }}>
        {label}
      </span>
      <span style={{
        fontFamily: "'DM Mono', monospace",
        fontSize: 10, color, letterSpacing: ".08em", textTransform: "uppercase",
      }}>
        {statusLabel}
      </span>
    </div>
  );
};

/* ─────────────────────────────────────────
   QUICK ACTION CARD
───────────────────────────────────────── */
const ActionCard = ({ icon, label, onClick }) => {
  const ref    = useRef(null);
  const [hov, setHov] = useState(false);

  const enter = () => {
    setHov(true);
    if (ref.current) gsap.to(ref.current, { y: -3, boxShadow: BS.raisedMd, duration: .18, ease: "power2.out" });
  };
  const leave = () => {
    setHov(false);
    if (ref.current) gsap.to(ref.current, { y: 0, boxShadow: BS.raisedSm, duration: .2, ease: "power2.out" });
  };
  const down = () => { if (ref.current) gsap.to(ref.current, { scale: .96, boxShadow: BS.pressed, duration: .1 }); };
  const up   = () => { if (ref.current) gsap.to(ref.current, { scale: 1, boxShadow: BS.raisedSm, duration: .2, ease: "back.out(2)" }); };

  return (
    <div
      ref={ref}
      onClick={onClick}
      onMouseEnter={enter}
      onMouseLeave={leave}
      onMouseDown={down}
      onMouseUp={up}
      role="button" tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && onClick?.()}
      style={{
        flex: "1 1 160px", minWidth: 0,
        padding: "18px 16px",
        borderRadius: 11,
        cursor: "pointer",
        userSelect: "none",
        background: "linear-gradient(145deg, #e0d8c8, #d0c8b8)",
        boxShadow: BS.raisedSm,
        border: "1px solid rgba(255,255,255,.38)",
        display: "flex", alignItems: "center", gap: 12,
        transition: "background .15s ease",
      }}
    >
      <div style={{
        width: 38, height: 38, borderRadius: 9, flexShrink: 0,
        background: hov
          ? "linear-gradient(135deg, #c8843a, #7a4e28)"
          : "linear-gradient(145deg, #ddd6c6, #c0b8a8)",
        boxShadow: hov ? BS.copper : BS.raisedSm,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 17,
        transition: "background .18s ease, box-shadow .18s ease",
      }}>
        {icon}
      </div>
      <span style={{
        fontFamily: "'Instrument Sans', sans-serif",
        fontSize: 13, fontWeight: 600, color: hov ? P.copper : P.inkLt,
        transition: "color .15s ease",
      }}>
        {label}
      </span>
    </div>
  );
};

/* ─────────────────────────────────────────
   SECTION TITLE
───────────────────────────────────────── */
const SectionTitle = ({ children }) => (
  <div style={{
    fontFamily: "'DM Serif Display', serif",
    fontSize: 20, color: P.ink, marginBottom: 14,
    display: "flex", alignItems: "center", gap: 10,
  }}>
    <div style={{
      width: 3, height: 20, borderRadius: 2,
      background: `linear-gradient(to bottom, ${P.copper}, ${P.copperLt})`,
    }} />
    {children}
  </div>
);

/* ─────────────────────────────────────────
   DASHBOARD
───────────────────────────────────────── */
export default function Dashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({ totalNodes: 0, totalFiles: 0, totalTemplates: 0, totalCustomers: 0 });
  const [systemStatus, setSystemStatus] = useState({ backendAPI: "checking", oracleDB: "checking", nlpService: "checking" });
  const [loading, setLoading] = useState(true);
  // eslint-disable-next-line no-unused-vars
  const [error,   setError]   = useState(null);

  const statRefs  = useRef([]);
  const heroRef   = useRef(null);
  /* cardsRef reserved for future animations */

  /* ── stats from hierarchy ── */
  const calculateStats = useCallback((nodes) => {
    let totalNodes = 0, totalFiles = 0, totalTemplates = 0;
    const customers = new Set();
    const traverse = (list) => {
      list.forEach((n) => {
        totalNodes++;
        if (n.level_1) customers.add(n.level_1);
        if (n.file?.trim()) totalFiles++;
        if (n.dat_template?.trim()) totalTemplates++;
        if (n.children?.length) traverse(n.children);
      });
    };
    traverse(nodes);
    return { totalNodes, totalFiles, totalTemplates, totalCustomers: customers.size };
  }, []);

  /* ── fetch ── */
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await api.get("/utils/hdl/menu-items");
        if (cancelled) return;
        const data = res.data.hierarchy || [];
        setStats(calculateStats(data));

        /* stagger card entrances */
        setTimeout(() => {
          if (heroRef.current)
            gsap.fromTo(heroRef.current, { opacity: 0, y: -20 }, { opacity: 1, y: 0, duration: .5, ease: "power2.out" });

          statRefs.current.filter(Boolean).forEach((el, i) =>
            gsap.fromTo(el, { opacity: 0, y: 28, scale: .95 },
              { opacity: 1, y: 0, scale: 1, duration: .5, delay: .1 + i * .08, ease: "expo.out" })
          );
        }, 80);

        /* system status */
        try {
          const sr = await api.get("/utils/system-status");
          if (!cancelled) setSystemStatus(sr.data.status || {});
        } catch { /* keep defaults */ }

      } catch (err) {
        if (!cancelled) setError("Failed to load dashboard data.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [calculateStats]);

  /* ── LOADING ── */
  if (loading) {
    return (
      <div style={{
        flex: 1, display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center", gap: 16,
        background: "linear-gradient(160deg, #ede8dc 0%, #d8d0c0 100%)",
        fontFamily: "'Instrument Sans', sans-serif",
      }}>
        <div style={{
          width: 48, height: 48, borderRadius: "50%",
          border: "3px solid rgba(0,0,0,.1)", borderTopColor: P.copper,
          animation: "dash-spin .8s linear infinite",
        }} />
        <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 13, color: P.warmDrk, letterSpacing: ".06em" }}>
          Loading dashboard…
        </span>
      </div>
    );
  }

  const statItems = [
    { icon: "📊", label: "Total Nodes",  value: stats.totalNodes,     color: P.copper  },
    { icon: "📄", label: "Files",        value: stats.totalFiles,     color: "#5a6475" },
    { icon: "📋", label: "Templates",    value: stats.totalTemplates, color: P.green   },
    { icon: "🏢", label: "Customers",    value: stats.totalCustomers, color: P.amber   },
  ];

  const actions = [
    { icon: "→",  label: "Onboarding",              onClick: () => navigate("/onboarding") },
    { icon: "⇋",  label: "Data Transformation",      onClick: () => navigate("/hdl") },
    { icon: "✧",  label: "Pre Upload Validations",   onClick: () => navigate("/hierarchy") },
    { icon: "▥",  label: "Import and Load Data",     onClick: () => navigate("/hdl") },
    { icon: "✦",  label: "Post Upload Validations",  onClick: () => navigate("/post-validation") },
    { icon: "⚙",  label: "Configuration",            onClick: () => navigate("/config") },
  ];

  return (
    <div style={{
      flex: 1, display: "flex", flexDirection: "column",
      background: "linear-gradient(160deg, #ede8dc 0%, #d8d0c0 100%)",
      overflow: "hidden",
      fontFamily: "'Instrument Sans', sans-serif",
    }}>
      <div className="dash-scroll" style={{ flex: 1, minHeight: 0, padding: "32px 32px" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", display: "flex", flexDirection: "column", gap: 28 }}>


          {/* ── STAT CARDS ── */}
          <div>
            <SectionTitle>Overview</SectionTitle>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 16 }}>
              {statItems.map((item, i) => (
                <StatCard
                  key={item.label}
                  ref={(el) => { statRefs.current[i] = el; }}
                  icon={item.icon}
                  label={item.label}
                  value={item.value}
                  accentColor={item.color}
                />
              ))}
            </div>
          </div>

          {/* ── QUICK ACTIONS ── */}
          <div>
            <SectionTitle>Quick Actions</SectionTitle>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
              {actions.map((a) => (
                <ActionCard key={a.label} icon={a.icon} label={a.label} onClick={a.onClick} />
              ))}
            </div>
          </div>

          {/* ── SYSTEM STATUS ── */}
          <div>
            <SectionTitle>System Status</SectionTitle>
            <div style={{
              padding: "20px",
              borderRadius: 12, position: "relative",
              background: "linear-gradient(160deg, #d8d0c0, #cac0b0)",
              boxShadow: BS.insetDeep,
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
              gap: 12,
            }}>
              <StatusIndicator label="Backend API"    status={systemStatus.backendAPI}  />
              <StatusIndicator label="Oracle Database" status={systemStatus.oracleDB}   />
              <StatusIndicator label="NLP Service"    status={systemStatus.nlpService}  />
            </div>
          </div>

          {/* ── RECENT ACTIVITY placeholder ── */}
          <div style={{ paddingBottom: 12 }}>
            <SectionTitle>At a Glance</SectionTitle>
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
              gap: 14,
            }}>
              {[
                { label: "Validated Today",   value: "—",    icon: "✓" },
                { label: "Pending Review",    value: "—",    icon: "⏳" },
                { label: "Active Migrations", value: "—",    icon: "⚡" },
              ].map((item) => (
                <div key={item.label} style={{
                  padding: "18px 20px",
                  borderRadius: 11,
                  background: "linear-gradient(160deg, #d8d0c0, #cac0b0)",
                  boxShadow: BS.insetSm,
                  display: "flex", alignItems: "center", gap: 14,
                }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: 8, flexShrink: 0,
                    background: "linear-gradient(145deg, #ddd6c6, #c0b8a8)",
                    boxShadow: BS.raisedSm,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 16,
                  }}>
                    {item.icon}
                  </div>
                  <div>
                    <div style={{
                      fontFamily: "'DM Mono', monospace",
                      fontSize: 9, letterSpacing: ".14em", textTransform: "uppercase",
                      color: P.warmDrk, marginBottom: 4,
                    }}>
                      {item.label}
                    </div>
                    <div style={{
                      fontFamily: "'DM Serif Display', serif",
                      fontSize: 22, color: P.ink,
                    }}>
                      {item.value}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}