import React, { useState, useEffect, useRef, useCallback } from "react";
import { gsap } from "gsap";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

/* ─────────────────────────────────────────
   GLOBAL CSS
───────────────────────────────────────── */
if (!document.getElementById("sidebar-pvs-css")) {
  const s = document.createElement("style");
  s.id = "sidebar-pvs-css";
  s.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Mono:wght@400;500&family=Instrument+Sans:wght@400;600;700&display=swap');

    @keyframes sb-spin {
      to { transform: rotate(360deg); }
    }
    @keyframes sb-pulse {
      0%   { box-shadow: 0 0 0 0 rgba(39,174,96,.7); }
      70%  { box-shadow: 0 0 0 8px rgba(39,174,96,0); }
      100% { box-shadow: 0 0 0 0 rgba(39,174,96,0); }
    }

    .sb-nav {
      overflow-y: auto;
      overflow-x: hidden;
      overscroll-behavior: contain;
      -webkit-overflow-scrolling: touch;
    }
    .sb-nav::-webkit-scrollbar { width: 5px; }
    .sb-nav::-webkit-scrollbar-track { background: transparent; }
    .sb-nav::-webkit-scrollbar-thumb {
      background: rgba(184,115,51,.32);
      border-radius: 3px;
    }
    .sb-nav::-webkit-scrollbar-thumb:hover {
      background: rgba(184,115,51,.58);
    }

    /* Tooltip for collapsed mode */
    .sb-tip { position: relative; }
    .sb-tip::after {
      content: attr(data-tip);
      display: none;
      position: absolute;
      left: calc(100% + 10px);
      top: 50%;
      transform: translateY(-50%);
      background: #2c2420;
      color: #e8d5b7;
      font-family: 'DM Mono', monospace;
      font-size: 11px;
      letter-spacing: .04em;
      padding: 5px 10px;
      border-radius: 6px;
      white-space: nowrap;
      box-shadow: 4px 4px 12px rgba(0,0,0,.5);
      pointer-events: none;
      z-index: 9999;
    }
    .sb-tip::before {
      content: '';
      display: none;
      position: absolute;
      left: calc(100% + 5px);
      top: 50%;
      transform: translateY(-50%);
      border: 5px solid transparent;
      border-right-color: #2c2420;
      z-index: 9999;
    }
    .sb-tip:hover::after,
    .sb-tip:hover::before { display: block; }
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
  raisedSm:  "5px 5px 14px rgba(0,0,0,.38), -3px -3px 10px rgba(255,255,255,.82)",
  pressed:   "inset 4px 4px 14px rgba(0,0,0,.45), inset -3px -3px 10px rgba(255,255,255,.5)",
  insetDeep: "inset 6px 6px 18px rgba(0,0,0,.38), inset -4px -4px 14px rgba(255,255,255,.55)",
  insetSm:   "inset 3px 3px 8px rgba(0,0,0,.3),  inset -2px -2px 6px rgba(255,255,255,.55)",
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
   TREE NODE
───────────────────────────────────────── */
const INDENT = 16;
const MAX_IL = 48;

const TreeNode = React.memo(({
  node, parentPath, index, ancestors,
  expandedNodes, toggleNode, treeChildrenRefs,
  customerName, instanceName, navigate, collapsed,
}) => {
  const nodeId      = `${parentPath}-${index}`;
  const hasChildren = Boolean(node.children?.length);
  const isExpanded  = expandedNodes.has(nodeId);
  const depth       = parentPath.split("-").length;
  const isLevel3    = depth === 2;

  const [hovered,    setHovered]    = useState(false);
  const [cfgHovered, setCfgHovered] = useState(false);
  const rowRef = useRef(null);
  const cfgRef = useRef(null);

  const anc      = ancestors || [];
  const customer = anc[0]?.name || node.name;
  const instance = anc[1]?.name || node.name;

  const goLeaf = useCallback(() => {
    if (hasChildren) return;
    if (node.type === "post_validation") {
      navigate("/post-validation", { state: { customerName: customer, instanceName: instance } });
    } else {
      navigate("/hdl", { state: { nodeData: node, customerName, instanceName } });
    }
  }, [hasChildren, node, customer, instance, customerName, instanceName, navigate]);

  const goConfig = useCallback((e) => {
    e.stopPropagation();
    navigate("/config", { state: { targetNode: node.name, customerName: customer, instanceName: instance } });
  }, [node.name, customer, instance, navigate]);

  const doToggle = useCallback((e) => {
    e.stopPropagation();
    toggleNode(nodeId);
  }, [toggleNode, nodeId]);

  const onEnter = () => {
    setHovered(true);
    if (!collapsed && rowRef.current)
      gsap.to(rowRef.current, { x: 3, duration: .13, ease: "power2.out" });
  };
  const onLeave = () => {
    setHovered(false);
    if (rowRef.current) gsap.to(rowRef.current, { x: 0, duration: .18, ease: "power2.out" });
  };

  const iconChar = node.type === "post_validation" ? "✦"
    : isLevel3    ? "⚙"
    : hasChildren ? "▤" : "◈";

  const iconBg = isLevel3
    ? "linear-gradient(135deg, #c8843a, #7a4e28)"
    : node.type === "post_validation"
    ? "linear-gradient(135deg, #2e7d52, #1a4d32)"
    : "linear-gradient(145deg, #ddd6c6, #c0b8a8)";

  const iconColor = (isLevel3 || node.type === "post_validation") ? "#f8f0e0" : P.warmDrk;

  /* ── COLLAPSED: icon only, centered, with tooltip ── */
  if (collapsed) {
    return (
      <div style={{ display: "flex", flexDirection: "column" }}>
        <div
          className="sb-tip"
          data-tip={node.name}
          onClick={goLeaf}
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
          style={{
            display: "flex", alignItems: "center", justifyContent: "center",
            padding: "6px 0",
            borderRadius: 8,
            cursor: hasChildren ? "default" : "pointer",
            background: hovered ? "rgba(184,115,51,.13)" : "transparent",
            transition: "background .18s ease",
          }}
        >
          <div style={{
            width: 30, height: 30, borderRadius: 7, flexShrink: 0,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 13, background: iconBg, color: iconColor,
            boxShadow: isLevel3
              ? "4px 4px 10px rgba(0,0,0,.48), -1px -1px 5px rgba(255,255,255,.32)"
              : BS.raisedSm,
          }}>
            {iconChar}
          </div>
        </div>
        {/* still render children so expand state is preserved visually */}
        {hasChildren && isExpanded && (
          <div style={{ display: "flex", flexDirection: "column" }}>
            {node.children.map((child, idx) => (
              <TreeNode
                key={`${nodeId}-${idx}`}
                node={child} parentPath={nodeId} index={idx}
                ancestors={[...anc, node]}
                expandedNodes={expandedNodes} toggleNode={toggleNode}
                treeChildrenRefs={treeChildrenRefs}
                customerName={customerName} instanceName={instanceName}
                navigate={navigate} collapsed={collapsed}
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  /* ── EXPANDED: full row ── */
  const indent = Math.min((depth - 1) * INDENT, MAX_IL);

  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      <div
        ref={rowRef}
        role={hasChildren ? "button" : "link"}
        tabIndex={0}
        aria-expanded={hasChildren ? isExpanded : undefined}
        onClick={goLeaf}
        onKeyDown={(e) => e.key === "Enter" && goLeaf()}
        onMouseEnter={onEnter}
        onMouseLeave={onLeave}
        style={{
          display: "flex", alignItems: "center", gap: 8,
          paddingLeft: indent + 10,
          paddingRight: 10,
          paddingTop: 9, paddingBottom: 9,
          borderRadius: 9,
          cursor: "pointer", userSelect: "none", outline: "none",
          minHeight: 44,
          background: hovered
            ? isLevel3 ? "rgba(184,115,51,.14)" : "rgba(184,115,51,.08)"
            : isLevel3 ? "rgba(184,115,51,.05)" : "transparent",
          border: isLevel3
            ? `1px dashed rgba(184,115,51,${hovered ? .45 : .22})`
            : "1px solid transparent",
          transition: "background .18s ease, border-color .18s ease",
        }}
      >
        {/* Chevron */}
        {hasChildren ? (
          <button onClick={doToggle} aria-label={isExpanded ? "Collapse" : "Expand"} style={{
            width: 18, height: 18, flexShrink: 0, padding: 0,
            display: "flex", alignItems: "center", justifyContent: "center",
            background: "none", border: "none", cursor: "pointer",
            fontSize: 9, color: P.copper,
            transform: isExpanded ? "rotate(90deg)" : "rotate(0deg)",
            transition: "transform .22s ease",
          }}>▶</button>
        ) : (
          <span style={{ width: 18, flexShrink: 0 }} />
        )}

        {/* Icon badge */}
        <div style={{
          width: 30, height: 30, borderRadius: 8, flexShrink: 0,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 13, background: iconBg, color: iconColor,
          boxShadow: isLevel3
            ? "4px 4px 10px rgba(0,0,0,.48), -1px -1px 5px rgba(255,255,255,.32), 0 0 12px rgba(184,115,51,.2)"
            : BS.raisedSm,
        }}>
          {iconChar}
        </div>

        {/* Label */}
        <span style={{
          flex: 1,
          fontFamily: isLevel3 ? "'DM Mono', monospace" : "'Instrument Sans', sans-serif",
          fontSize: isLevel3 ? 13 : 14,
          fontWeight: isLevel3 ? 500 : 600,
          letterSpacing: isLevel3 ? ".03em" : ".01em",
          color: isLevel3 ? P.copper : P.inkLt,
          whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
          lineHeight: 1.3,
        }}>
          {node.name}
        </span>

        {/* Edit — level 3 only */}
        {isLevel3 && (
          <div
            ref={cfgRef}
            onClick={goConfig}
            onMouseEnter={() => {
              setCfgHovered(true);
              if (cfgRef.current) gsap.to(cfgRef.current, { boxShadow: BS.copper, duration: .18 });
            }}
            onMouseLeave={() => {
              setCfgHovered(false);
              if (cfgRef.current) gsap.to(cfgRef.current, { boxShadow: BS.raisedSm, duration: .18 });
            }}
            onMouseDown={() => { if (cfgRef.current) gsap.to(cfgRef.current, { scale: .94, boxShadow: BS.pressed, duration: .1 }); }}
            onMouseUp={() => { if (cfgRef.current) gsap.to(cfgRef.current, { scale: 1, boxShadow: BS.raisedSm, duration: .2, ease: "back.out(2)" }); }}
            role="button" tabIndex={0}
            onKeyDown={(e) => e.key === "Enter" && goConfig(e)}
            style={{
              padding: "5px 12px", borderRadius: 6,
              fontFamily: "'DM Mono', monospace",
              fontSize: 10, fontWeight: 500,
              letterSpacing: ".07em", textTransform: "uppercase",
              cursor: "pointer", flexShrink: 0,
              color: cfgHovered ? "#f8f0e0" : P.inkLt,
              background: cfgHovered
                ? "linear-gradient(135deg, #c8843a, #7a4e28)"
                : "linear-gradient(145deg, #ddd6c6, #c0b8a8)",
              boxShadow: BS.raisedSm,
              border: "none", outline: "none",
              transition: "color .15s ease, background .15s ease",
              userSelect: "none",
            }}
          >
            Edit
          </div>
        )}
      </div>

      {/* Children */}
      {hasChildren && isExpanded && (
        <div
          ref={(el) => { if (el) treeChildrenRefs.current[nodeId] = el; }}
          style={{
            display: "flex", flexDirection: "column", gap: 2,
            borderLeft: "1px dashed rgba(184,115,51,.24)",
            marginLeft: indent + 24,
            paddingLeft: 8,
          }}
        >
          {node.children.map((child, idx) => (
            <TreeNode
              key={`${nodeId}-${idx}`}
              node={child} parentPath={nodeId} index={idx}
              ancestors={[...anc, node]}
              expandedNodes={expandedNodes} toggleNode={toggleNode}
              treeChildrenRefs={treeChildrenRefs}
              customerName={customerName} instanceName={instanceName}
              navigate={navigate} collapsed={collapsed}
            />
          ))}
        </div>
      )}
    </div>
  );
});

TreeNode.displayName = "TreeNode";

/* ─────────────────────────────────────────
   SIDEBAR
───────────────────────────────────────── */
const COLLAPSED_W = 64;
const EXPANDED_W  = 360;

export default function Sidebar() {
  const navigate = useNavigate();

  const [collapsed,     setCollapsed]    = useState(false);
  const [hierarchyData, setHierarchyData]= useState([]);
  const [expandedNodes, setExpandedNodes]= useState(new Set(["0"]));
  const [loadState,     setLoadState]    = useState("loading");
  const [errorMsg,      setErrorMsg]     = useState("");
  const [sidebarWidth,  setSidebarWidth] = useState(EXPANDED_W);
  const [isDragging,    setIsDragging]   = useState(false);
  const [customerName,  setCustomerName] = useState("");
  const [instanceName,  setInstanceName] = useState("");

  const liveWidth        = useRef(EXPANDED_W);
  const sidebarRef       = useRef(null);
  const treeChildrenRefs = useRef({});
  const colBtnRef        = useRef(null);

  /* fetch */
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await api.get("utils/hdl/menu-items");
        if (cancelled) return;
        let data = res.data;
        if (data && typeof data === "object" && "hierarchy" in data) data = data.hierarchy;
        const arr = Array.isArray(data) ? data : [data];
        setCustomerName(res.data.level_1 || "");
        setInstanceName(res.data.level_2 || "");
        setHierarchyData(injectPost(arr));
        setLoadState("ok");
      } catch {
        if (!cancelled) { setErrorMsg("Failed to load"); setLoadState("error"); }
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const injectPost = (data) =>
    data.map((l1) => ({
      ...l1,
      children: l1.children?.map((l2) => ({
        ...l2,
        children: [
          { name: "Post Validation", type: "post_validation", isSynthetic: true },
          ...(l2.children || []),
        ],
      })),
    }));

  /* drag resize */
  const onResizeDown = useCallback(() => setIsDragging(true), []);
  useEffect(() => {
    if (!isDragging) return;
    let raf;
    const onMove = (e) => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const w = Math.max(280, Math.min(e.clientX, 580));
        liveWidth.current = w;
        if (sidebarRef.current) sidebarRef.current.style.width = `${w}px`;
      });
    };
    const onUp = () => {
      setIsDragging(false);
      setSidebarWidth(liveWidth.current);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
    };
  }, [isDragging]);

  /* toggle node */
  const toggleNode = useCallback((nodeId) => {
    const next = new Set(expandedNodes);
    if (next.has(nodeId)) {
      next.delete(nodeId);
      const el = treeChildrenRefs.current[nodeId];
      if (el) {
        gsap.to(el, { opacity: 0, height: 0, duration: .22, ease: "power2.in",
          onComplete: () => setExpandedNodes(new Set(next)) });
      } else {
        setExpandedNodes(new Set(next));
      }
    } else {
      next.add(nodeId);
      setExpandedNodes(new Set(next));
      requestAnimationFrame(() => {
        const el = treeChildrenRefs.current[nodeId];
        if (el) gsap.fromTo(el, { opacity: 0, height: 0 }, { opacity: 1, height: "auto", duration: .28, ease: "power2.out" });
      });
    }
  }, [expandedNodes]);

  /* collapse btn */
  const colDown = useCallback(() => {
    if (colBtnRef.current) gsap.to(colBtnRef.current, { scale: .9, boxShadow: BS.pressed, duration: .1 });
  }, []);
  const colUp = useCallback(() => {
    if (colBtnRef.current) gsap.to(colBtnRef.current, { scale: 1, boxShadow: BS.raisedSm, duration: .22, ease: "back.out(2)" });
    setCollapsed(c => !c);
  }, []);

  const W = collapsed ? COLLAPSED_W : sidebarWidth;

  return (
    <aside
      ref={sidebarRef}
      style={{
        width: W,
        minWidth: W,
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        position: "relative",
        overflow: "hidden",
        flexShrink: 0,
        transition: isDragging ? "none" : "width .22s ease, min-width .22s ease",
        background: "linear-gradient(160deg, #ede8dc 0%, #d8d0c0 100%)",
        boxShadow: "6px 0 28px rgba(0,0,0,.42), inset -1px 0 0 rgba(255,255,255,.4)",
        borderRight: "1px solid rgba(255,255,255,.3)",
        fontFamily: "'Instrument Sans', sans-serif",
        touchAction: "pan-y",
      }}
    >
      {/* Screws */}
      <Screw style={{ top: 11, left: 11  }} angle={45}  />
      <Screw style={{ top: 11, right: 11 }} angle={135} />
      <Screw style={{ bottom: 11, left: 11  }} angle={-45} />
      <Screw style={{ bottom: 11, right: 11 }} angle={90}  />

      {/* ══════════════════════════════════════
          HEADER
          ─ Always: collapse button pinned top-right
          ─ Expanded: logo + title on the left
          ─ Collapsed: logo centered below the button
      ══════════════════════════════════════ */}
      <header style={{
        flexShrink: 0,
        background: "linear-gradient(160deg, #d0c8b8, #c0b8a8)",
        boxShadow: `${BS.insetDeep}, 0 4px 12px rgba(0,0,0,.16)`,
        borderBottom: "1px solid rgba(0,0,0,.1)",
        position: "relative",          /* so the absolute button can anchor to it */
        padding: collapsed ? "14px 0 14px 0" : "18px 14px 18px 18px",
        display: "flex",
        alignItems: "center",
        minHeight: collapsed ? 112 : 76,
        /* In collapsed mode, stack logo below the btn; in expanded, row layout */
        flexDirection: collapsed ? "column" : "row",
        justifyContent: collapsed ? "flex-end" : "flex-start",
        gap: collapsed ? 10 : 12,
      }}>

        {/* ── Collapse / expand button — ALWAYS top-right ── */}
        <button
          ref={colBtnRef}
          onMouseDown={colDown}
          onMouseUp={colUp}
          onMouseLeave={() => {
            if (colBtnRef.current)
              gsap.to(colBtnRef.current, { scale: 1, boxShadow: BS.raisedSm, duration: .2 });
          }}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          style={{
            /* Pin absolutely to top-right corner regardless of header layout */
            position: "absolute",
            top: 14,
            right: 14,
            width: 30, height: 30,
            borderRadius: 7, flexShrink: 0,
            display: "flex", alignItems: "center", justifyContent: "center",
            cursor: "pointer",
            fontFamily: "'DM Mono', monospace",
            fontSize: 12,
            color: P.inkLt,
            background: "linear-gradient(145deg, #ddd6c6, #c0b8a8)",
            boxShadow: BS.raisedSm,
            border: "none", outline: "none", userSelect: "none",
            zIndex: 2,
          }}
        >
          {/* Arrow always points inward: ← to collapse (hide), → to expand (show) */}
          {collapsed ? "→" : "←"}
        </button>

        {/* ── Logo disc ── */}
        <div style={{
          width: 42, height: 42, borderRadius: "50%", flexShrink: 0,
          background: "linear-gradient(135deg, #c8843a, #7a4e28)",
          boxShadow: BS.copper,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontFamily: "'DM Serif Display', serif",
          fontSize: 17, color: "#f8f0e0",
          /* In collapsed mode the button is absolute so logo can center freely */
          alignSelf: collapsed ? "center" : "auto",
        }}>
          C
        </div>

        {/* ── Title — only in expanded mode ── */}
        {!collapsed && (
          <div style={{ flex: 1, minWidth: 0, overflow: "hidden" }}>
            <div style={{
              fontFamily: "'DM Mono', monospace",
              fontSize: 9, letterSpacing: ".2em", textTransform: "uppercase",
              color: P.warmDrk, marginBottom: 4, whiteSpace: "nowrap",
            }}>
              Data Migration Suite
            </div>
            <div style={{
              fontFamily: "'DM Serif Display', serif",
              fontSize: 21, color: P.ink, lineHeight: 1, whiteSpace: "nowrap",
            }}>
              Charlie
            </div>
          </div>
        )}
      </header>

      {/* ══════════════════════════════════════
          NAV TREE
      ══════════════════════════════════════ */}
      <nav
        className="sb-nav"
        aria-label="Navigation"
        style={{
          flex: 1,
          minHeight: 0,
          padding: collapsed ? "10px 8px" : "12px 12px",
          display: "flex",
          flexDirection: "column",
          gap: 2,
          background: "linear-gradient(160deg, #d0c8b8, #c0b8a8)",
          boxShadow: BS.insetDeep,
        }}
      >
        {loadState === "loading" && (
          <div style={{
            display: "flex",
            alignItems: "center",
            justifyContent: collapsed ? "center" : "flex-start",
            gap: 10, padding: "14px 6px",
          }}>
            <div style={{
              width: 16, height: 16, borderRadius: "50%", flexShrink: 0,
              border: "2px solid rgba(0,0,0,.12)", borderTopColor: P.copper,
              animation: "sb-spin .7s linear infinite",
            }} />
            {!collapsed && (
              <span style={{
                fontFamily: "'DM Mono', monospace",
                fontSize: 13, color: P.inkLt, letterSpacing: ".04em",
              }}>
                Loading…
              </span>
            )}
          </div>
        )}

        {loadState === "error" && (
          <div style={{
            fontFamily: "'DM Mono', monospace",
            fontSize: collapsed ? 16 : 13,
            color: P.active,
            padding: "13px 8px", borderRadius: 8,
            textAlign: collapsed ? "center" : "left",
            background: "rgba(192,57,43,.08)",
            border: "1px solid rgba(192,57,43,.22)",
          }}>
            {collapsed ? "!" : `⚠ ${errorMsg}`}
          </div>
        )}

        {loadState === "ok" && hierarchyData.map((node, idx) => (
          <TreeNode
            key={`0-${idx}`}
            node={node} parentPath="0" index={idx} ancestors={[]}
            expandedNodes={expandedNodes} toggleNode={toggleNode}
            treeChildrenRefs={treeChildrenRefs}
            customerName={customerName} instanceName={instanceName}
            navigate={navigate} collapsed={collapsed}
          />
        ))}
      </nav>

      {/* ══════════════════════════════════════
          FOOTER
      ══════════════════════════════════════ */}
      <footer style={{
        flexShrink: 0,
        padding: collapsed ? "12px 0" : "14px 18px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 8,
        background: "linear-gradient(160deg, #d0c8b8, #c0b8a8)",
        boxShadow: `${BS.insetSm}, 0 -2px 8px rgba(0,0,0,.1)`,
        borderTop: "1px solid rgba(0,0,0,.08)",
      }}>
        {/* Status dot / pill */}
        <div style={{
          width: collapsed ? 34 : "100%",
          display: "flex", alignItems: "center",
          justifyContent: collapsed ? "center" : "flex-start",
          gap: 9,
          padding: collapsed ? "8px 0" : "8px 14px",
          borderRadius: 8,
          background: "linear-gradient(145deg, #c8bfad, #d0c8b8)",
          boxShadow: BS.insetSm,
          border: "1px solid rgba(39,174,96,.2)",
        }}>
          <div style={{
            width: 9, height: 9, borderRadius: "50%", flexShrink: 0,
            background: P.green,
            animation: "sb-pulse 2.2s ease-out infinite",
          }} />
          {!collapsed && (
            <span style={{
              fontFamily: "'DM Mono', monospace",
              fontSize: 11, fontWeight: 500, letterSpacing: ".1em",
              textTransform: "uppercase", color: P.green, whiteSpace: "nowrap",
            }}>
              API Connected
            </span>
          )}
        </div>

        {!collapsed && (
          <div style={{
            fontFamily: "'DM Mono', monospace",
            fontSize: 10, color: P.warmDrk,
            letterSpacing: ".14em", textAlign: "center", opacity: .6,
          }}>
            v2.4.1 · Charlie HDL
          </div>
        )}
      </footer>

      {/* ══════════════════════════════════════
          RESIZE HANDLE (expanded only)
      ══════════════════════════════════════ */}
      {!collapsed && (
        <div
          role="separator"
          aria-label="Resize sidebar"
          onMouseDown={onResizeDown}
          style={{
            position: "absolute", right: 0, top: 0, bottom: 0, width: 6,
            cursor: "col-resize", zIndex: 10,
            background: "linear-gradient(to right, transparent, rgba(184,115,51,.1))",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "linear-gradient(to right, transparent, rgba(184,115,51,.5))";
            e.currentTarget.style.width = "8px";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "linear-gradient(to right, transparent, rgba(184,115,51,.1))";
            e.currentTarget.style.width = "6px";
          }}
        />
      )}

      {/* Copper edge inlay */}
      <div aria-hidden="true" style={{
        position: "absolute", right: 0, top: 0, bottom: 0, width: 2,
        background: "linear-gradient(to bottom, transparent, #c8843a, #b87333, #c8843a, transparent)",
        opacity: .28, pointerEvents: "none",
      }} />
    </aside>
  );
}