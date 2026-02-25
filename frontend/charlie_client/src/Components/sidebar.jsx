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
      overflow-x: auto; /* Enabled horizontal scrolling for deep trees */
      overscroll-behavior: contain;
      -webkit-overflow-scrolling: touch;
    }
    .sb-nav::-webkit-scrollbar { width: 6px; height: 6px; }
    .sb-nav::-webkit-scrollbar-track { background: transparent; }
    .sb-nav::-webkit-scrollbar-thumb {
      background: rgba(184,115,51,.32);
      border-radius: 4px;
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
   SYNTHETIC NODE ICON MAP
───────────────────────────────────────── */
const SYNTHETIC_ICONS = {
  dashboard:         { char: "▦", bg: "linear-gradient(135deg, #3a7ca8, #285880)" },
  setup:             { char: "⚙", bg: "linear-gradient(135deg, #6a7a5a, #4a5a3a)" },
  pre_upload_parent: { char: "✧", bg: "linear-gradient(135deg, #8a6ab8, #5a4080)" },
  hcm_parent:        { char: "▤", bg: "linear-gradient(135deg, #508080, #305858)" },
  import_load:       { char: "▥", bg: "linear-gradient(135deg, #a07030, #785020)" },
  post_validation:   { char: "✦", bg: "linear-gradient(135deg, #2e7d52, #1a4d32)" },
};

/* ─────────────────────────────────────────
   TREE HELPERS — mandatory / non‑mandatory collectors
───────────────────────────────────────── */
const collectMandatoryObjects = (node) => {
  let result = [];
  if (!node) return result;
  if (node.Mandatory_Objects) result.push(node.name);
  if (Array.isArray(node.children)) {
    node.children.forEach((child) => {
      result = result.concat(collectMandatoryObjects(child));
    });
  }
  return result;
};

const collectNonMandatoryObjects = (node) => {
  let result = [];
  if (!node) return result;
  if (node.file && !node.Mandatory_Objects) result.push(node.name);
  if (Array.isArray(node.children)) {
    node.children.forEach((child) => {
      result = result.concat(collectNonMandatoryObjects(child));
    });
  }
  return result;
};

const safeGetSessionJSON = (key) => {
  try { return JSON.parse(sessionStorage.getItem(key) || "[]"); }
  catch { return []; }
};

/* ─────────────────────────────────────────
   MENU LINK (top-level hardcoded items)
───────────────────────────────────────── */
/* ─────────────────────────────────────────
   UPLOAD DIALOG MODAL
───────────────────────────────────────── */
const UploadDialog = ({ node, customerName, instanceName, onClose }) => {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [response, setResponse] = useState(null);
  const [error, setError] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef(null);
  const modalRef = useRef(null);

  useEffect(() => {
    if (modalRef.current) {
      gsap.fromTo(modalRef.current, { opacity: 0, scale: 0.96, y: 12 }, { opacity: 1, scale: 1, y: 0, duration: 0.22, ease: "power2.out" });
    }
  }, []);

  const handleFileSelect = (e) => {
    const f = e.target.files?.[0];
    if (f) {
      if (!f.name.endsWith(".xlsx") && !f.name.endsWith(".xls")) {
        setError("Please select a valid Excel file (.xlsx or .xls)");
        return;
      }
      setFile(f);
      setError("");
      setResponse(null);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files?.[0];
    if (f) {
      if (!f.name.endsWith(".xlsx") && !f.name.endsWith(".xls")) {
        setError("Please select a valid Excel file (.xlsx or .xls)");
        return;
      }
      setFile(f);
      setError("");
      setResponse(null);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError("Please select a file first");
      return;
    }
    setUploading(true);
    setError("");
    setResponse(null);
    try {
      const formData = new FormData();

      // Core fields
      formData.append("parent_name", node?.name || "");
      formData.append("excelFile", file);
      formData.append("Mandatory_Objects", String(node?.Mandatory_Objects ?? false));

      // Customer / Instance
      formData.append("customerName", customerName || node?.level_1 || "");
      formData.append("InstanceName", instanceName || node?.level_2 || "");

      // SessionStorage‑backed action lists
      const termActions = safeGetSessionJSON("TermActions");
      formData.append("TermActions", JSON.stringify(termActions));

      const hireActions = [
        ...safeGetSessionJSON("HireActions"),
        ...safeGetSessionJSON("RehireActions"),
      ];
      formData.append("HireActions", JSON.stringify(hireActions));

      let globalTransfers = [];
      try {
        const stored = sessionStorage.getItem("GlobalTransferActions");
        if (stored) {
          const parsed = JSON.parse(stored);
          globalTransfers = Array.isArray(parsed)
            ? parsed
            : typeof parsed === "string"
              ? parsed.split(",").map((s) => s.trim().toUpperCase()).filter(Boolean)
              : [];
        }
      } catch { /* ignore */ }
      formData.append("glbTransfers", JSON.stringify(globalTransfers));

      const assignmentStatusRules = safeGetSessionJSON("AssignmentStatusRows");
      formData.append("assignment_status_rules", JSON.stringify(assignmentStatusRules));

      // Mandatory / non‑mandatory object lists (walk the node tree)
      formData.append("all_mandatory_objects", JSON.stringify(collectMandatoryObjects(node)));
      formData.append("all_non_mandatory_objects", JSON.stringify(collectNonMandatoryObjects(node)));

      const res = await api.post("hdl/bulk-excel-upload", formData);
      setResponse(res.data);
    } catch (err) {
      const detail = err.response?.data?.detail || err.message || "Upload failed";
      setError(typeof detail === "string" ? detail : JSON.stringify(detail));
    } finally {
      setUploading(false);
    }
  };

  const formatSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1048576).toFixed(2)} MB`;
  };

  return (
    <div
      onClick={(e) => e.target === e.currentTarget && onClose()}
      style={{
        position: "fixed", inset: 0,
        background: "rgba(44,36,32,.55)",
        zIndex: 10000,
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: 24,
      }}
    >
      <div ref={modalRef} style={{
        width: "100%", maxWidth: 780,
        borderRadius: 16,
        background: "linear-gradient(160deg, #ede8dc 0%, #d8d0c0 100%)",
        boxShadow: "16px 16px 40px rgba(0,0,0,.55), -8px -8px 28px rgba(255,255,255,.9)",
        position: "relative", overflow: "hidden",
        display: "flex", flexDirection: "column",
        maxHeight: "85vh",
      }}>
        {/* Header */}
        <div style={{
          padding: "18px 22px",
          background: "linear-gradient(160deg, #d0c8b8, #c0b8a8)",
          boxShadow: BS.insetSm,
          borderBottom: "1px solid rgba(0,0,0,.08)",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          flexShrink: 0,
        }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <span style={{ fontFamily: "'DM Serif Display', serif", fontSize: 18, color: P.ink }}>
              Upload Excel File
            </span>
            {node && (
              <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: P.warmDrk, letterSpacing: ".06em" }}>
                {node.name}
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            style={{
              width: 30, height: 30, borderRadius: 7,
              background: "linear-gradient(145deg, #ddd6c6, #c8bfad)",
              boxShadow: BS.raisedSm,
              border: "none", cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontFamily: "'DM Mono', monospace", fontSize: 14, color: P.inkLt,
            }}
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: "20px 22px", flex: 1, overflowY: "auto" }}>
          {/* Drop zone */}
          <div
            onClick={() => fileRef.current?.click()}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            style={{
              padding: "32px 20px",
              borderRadius: 12,
              border: `2px dashed ${dragOver ? P.copper : "rgba(184,115,51,.3)"}`,
              background: dragOver
                ? "rgba(184,115,51,.1)"
                : "linear-gradient(145deg, #d8d0c0, #cac0b0)",
              boxShadow: BS.insetSm,
              cursor: "pointer",
              display: "flex", flexDirection: "column",
              alignItems: "center", gap: 10,
              transition: "all .18s ease",
            }}
          >
            <input
              ref={fileRef}
              type="file"
              accept=".xlsx,.xls"
              style={{ display: "none" }}
              onChange={handleFileSelect}
            />
            <span style={{ fontSize: 32, opacity: 0.6 }}>📂</span>
            <span style={{
              fontFamily: "'Instrument Sans', sans-serif",
              fontSize: 13, fontWeight: 600, color: P.inkLt,
              textAlign: "center",
            }}>
              {file ? "Click or drop to replace" : "Click or drag & drop an Excel file"}
            </span>
            <span style={{
              fontFamily: "'DM Mono', monospace",
              fontSize: 10, color: P.warmDrk, letterSpacing: ".06em",
            }}>
              Accepted: .xlsx, .xls
            </span>
          </div>

          {/* Selected file info */}
          {file && (
            <div style={{
              marginTop: 14, padding: "12px 14px", borderRadius: 9,
              background: "linear-gradient(145deg, #ccc4b4, #c4bcac)",
              boxShadow: BS.insetSm,
              display: "flex", alignItems: "center", gap: 10,
            }}>
              <span style={{ fontSize: 18 }}>📄</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontFamily: "'DM Mono', monospace", fontSize: 12, color: P.ink,
                  whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                }}>
                  {file.name}
                </div>
                <div style={{
                  fontFamily: "'DM Mono', monospace", fontSize: 10, color: P.warmDrk,
                  letterSpacing: ".04em", marginTop: 2,
                }}>
                  {formatSize(file.size)}
                </div>
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); setFile(null); setResponse(null); setError(""); }}
                style={{
                  width: 24, height: 24, borderRadius: 6,
                  background: "linear-gradient(145deg, #ddd6c6, #c8bfad)",
                  boxShadow: BS.raisedSm,
                  border: "none", cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontFamily: "'DM Mono', monospace", fontSize: 11, color: P.inkLt,
                }}
              >
                ✕
              </button>
            </div>
          )}

          {/* Error message */}
          {error && (
            <div style={{
              marginTop: 14, padding: "12px 14px", borderRadius: 9,
              background: "rgba(192,57,43,.08)",
              border: "1px solid rgba(192,57,43,.22)",
              fontFamily: "'DM Mono', monospace", fontSize: 12, color: "#c0392b",
              lineHeight: 1.5,
            }}>
              ⚠ {error}
            </div>
          )}

          {/* Success response */}
          {response && (
            <div style={{
              marginTop: 14, padding: "14px 16px", borderRadius: 9,
              background: "rgba(39,174,96,.08)",
              border: "1px solid rgba(39,174,96,.22)",
              display: "flex", flexDirection: "column", gap: 10,
            }}>
              {/* ── Header row ── */}
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{
                  width: 22, height: 22, borderRadius: "50%",
                  background: "linear-gradient(135deg, #27ae60, #1a7a42)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 11, color: "#fff", flexShrink: 0,
                }}>✔</span>
                <span style={{
                  fontFamily: "'Instrument Sans', sans-serif",
                  fontSize: 13, fontWeight: 600, color: "#1a7a42",
                }}>
                  {response.message || "Upload successful"}
                </span>
              </div>

              {/* ── Parent badge ── */}
              {response.parent && (
                <div style={{
                  padding: "6px 12px", borderRadius: 7,
                  background: "rgba(39,174,96,.06)",
                  fontFamily: "'DM Mono', monospace", fontSize: 11, color: "#2a6a42",
                  letterSpacing: ".03em",
                }}>
                  <span style={{ color: P.warmDrk, fontSize: 9, letterSpacing: ".1em", textTransform: "uppercase" }}>Parent: </span>
                  {response.parent}
                </div>
              )}

              {response.excelFileName && (
                <div style={{
                  padding: "6px 12px", borderRadius: 7,
                  background: "rgba(39,174,96,.06)",
                  fontFamily: "'DM Mono', monospace", fontSize: 11, color: "#2a6a42",
                  letterSpacing: ".03em",
                }}>
                  <span style={{ color: P.warmDrk, fontSize: 9, letterSpacing: ".1em", textTransform: "uppercase" }}>File: </span>
                  {response.excelFileName}
                </div>
              )}

              {/* ── Files table ── */}
              {Array.isArray(response.files) && response.files.length > 0 && (
                <div style={{
                  borderRadius: 8, overflow: "hidden",
                  border: "1px solid rgba(39,174,96,.18)",
                }}>
                  <div style={{
                    padding: "6px 10px",
                    background: "rgba(39,174,96,.10)",
                    fontFamily: "'DM Mono', monospace", fontSize: 9,
                    letterSpacing: ".12em", textTransform: "uppercase",
                    color: "#1a7a42", fontWeight: 500,
                  }}>
                    Extracted Sheets ({response.files.length})
                  </div>
                  <div style={{ overflowX: "auto" }}>
                    <table style={{
                      width: "100%", borderCollapse: "collapse",
                      fontFamily: "'DM Mono', monospace", fontSize: 11,
                    }}>
                      <thead>
                        <tr style={{ background: "rgba(39,174,96,.06)" }}>
                          {["#", "Sheet", "Child", "File"].map((h) => (
                            <th key={h} style={{
                              padding: "7px 10px", textAlign: "left",
                              fontSize: 9, letterSpacing: ".1em", textTransform: "uppercase",
                              color: P.warmDrk, fontWeight: 500,
                              borderBottom: "1px solid rgba(39,174,96,.14)",
                              whiteSpace: "nowrap",
                            }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {response.files.map((f, i) => (
                          <tr key={i} style={{
                            background: i % 2 === 0 ? "transparent" : "rgba(39,174,96,.03)",
                          }}>
                            <td style={{
                              padding: "6px 10px", color: P.warmDrk, fontSize: 10,
                              borderBottom: "1px solid rgba(39,174,96,.08)",
                              whiteSpace: "nowrap",
                            }}>{i + 1}</td>
                            <td style={{
                              padding: "6px 10px", color: "#2a6a42", fontWeight: 500,
                              borderBottom: "1px solid rgba(39,174,96,.08)",
                              whiteSpace: "nowrap",
                            }}>{f.sheet}</td>
                            <td style={{
                              padding: "6px 10px", color: "#3a5a42",
                              borderBottom: "1px solid rgba(39,174,96,.08)",
                              whiteSpace: "nowrap",
                            }}>{f.child}</td>
                            <td style={{
                              padding: "6px 10px", color: "#3a5a42", fontSize: 10,
                              borderBottom: "1px solid rgba(39,174,96,.08)",
                              wordBreak: "break-all",
                              maxWidth: 220,
                            }}>
                              {f.file?.split(/[/\\]/).pop() || f.file}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* ── Other response keys (excluding handled ones) ── */}
              {Object.entries(response).filter(([k]) => !['message','excelFileName','parent','files'].includes(k)).length > 0 && (
                <div style={{
                  padding: "8px 12px", borderRadius: 7,
                  background: "rgba(39,174,96,.04)",
                  fontFamily: "'DM Mono', monospace", fontSize: 10, color: "#3a5a42",
                  whiteSpace: "pre-wrap", lineHeight: 1.6,
                }}>
                  {Object.entries(response)
                    .filter(([k]) => !['message','excelFileName','parent','files'].includes(k))
                    .map(([k, v]) => (
                      <div key={k}>
                        <span style={{ color: P.warmDrk, textTransform: "uppercase", letterSpacing: ".08em", fontSize: 9 }}>{k}: </span>
                        {typeof v === "object" ? JSON.stringify(v, null, 2) : String(v)}
                      </div>
                    ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: "14px 22px",
          background: "linear-gradient(160deg, #d0c8b8, #c0b8a8)",
          boxShadow: `${BS.insetSm}, 0 -2px 8px rgba(0,0,0,.1)`,
          borderTop: "1px solid rgba(0,0,0,.08)",
          display: "flex", justifyContent: "flex-end", gap: 10,
          flexShrink: 0,
        }}>
          <button
            onClick={onClose}
            style={{
              padding: "9px 18px", borderRadius: 8,
              fontFamily: "'Instrument Sans', sans-serif",
              fontSize: 12, fontWeight: 600, letterSpacing: ".04em",
              color: P.inkLt,
              background: "linear-gradient(145deg, #ddd6c6, #c8bfad)",
              boxShadow: BS.raisedSm,
              border: "none", cursor: "pointer",
            }}
          >
            {response ? "Close" : "Cancel"}
          </button>
          {!response && (
            <button
              onClick={handleUpload}
              disabled={!file || uploading}
              style={{
                padding: "9px 22px", borderRadius: 8,
                fontFamily: "'Instrument Sans', sans-serif",
                fontSize: 12, fontWeight: 700, letterSpacing: ".05em",
                textTransform: "uppercase",
                color: (!file || uploading) ? "rgba(248,240,224,.5)" : "#f8f0e0",
                background: (!file || uploading)
                  ? "linear-gradient(135deg, #a08060, #7a5e40)"
                  : "linear-gradient(135deg, #c8843a, #7a4e28)",
                boxShadow: (!file || uploading) ? "none" : BS.copper,
                border: "none",
                cursor: (!file || uploading) ? "not-allowed" : "pointer",
                display: "flex", alignItems: "center", gap: 8,
              }}
            >
              {uploading && (
                <div style={{
                  width: 14, height: 14, borderRadius: "50%",
                  border: "2px solid rgba(248,240,224,.3)",
                  borderTopColor: "#f8f0e0",
                  animation: "sb-spin .7s linear infinite",
                }} />
              )}
              {uploading ? "Uploading…" : "Upload"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

/* ─────────────────────────────────────────
   MENU LINK (top-level hardcoded items)
───────────────────────────────────────── */
const MenuLink = ({ icon, label, onClick, collapsed }) => {
  const [hovered, setHovered] = useState(false);
  const ref = useRef(null);

  return collapsed ? (
    <div
      className="sb-tip"
      data-tip={label}
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: "6px 0", borderRadius: 8, cursor: "pointer",
        background: hovered ? "rgba(184,115,51,.13)" : "transparent",
        transition: "background .18s ease",
      }}
    >
      <div style={{
        width: 30, height: 30, borderRadius: 7, flexShrink: 0,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 13,
        background: hovered
          ? "linear-gradient(135deg, #c8843a, #7a4e28)"
          : "linear-gradient(145deg, #ddd6c6, #c0b8a8)",
        color: hovered ? "#f8f0e0" : P.inkLt,
        boxShadow: hovered ? BS.copper : BS.raisedSm,
        transition: "background .18s ease, color .18s ease, box-shadow .18s ease",
      }}>
        {icon}
      </div>
    </div>
  ) : (
    <div
      ref={ref}
      onClick={onClick}
      onMouseEnter={() => {
        setHovered(true);
        if (ref.current) gsap.to(ref.current, { x: 3, duration: .13, ease: "power2.out" });
      }}
      onMouseLeave={() => {
        setHovered(false);
        if (ref.current) gsap.to(ref.current, { x: 0, duration: .18, ease: "power2.out" });
      }}
      role="link"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && onClick?.()}
      style={{
        display: "flex", alignItems: "center", gap: 8,
        padding: "9px 10px", borderRadius: 9,
        cursor: "pointer", userSelect: "none", outline: "none",
        minHeight: 44,
        background: hovered ? "rgba(184,115,51,.08)" : "transparent",
        border: "1px solid transparent",
        transition: "background .18s ease",
      }}
    >
      <span style={{ width: 18, flexShrink: 0 }} />
      <div style={{
        width: 30, height: 30, borderRadius: 8, flexShrink: 0,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 13,
        background: hovered
          ? "linear-gradient(135deg, #c8843a, #7a4e28)"
          : "linear-gradient(145deg, #ddd6c6, #c0b8a8)",
        color: hovered ? "#f8f0e0" : P.inkLt,
        boxShadow: hovered ? BS.copper : BS.raisedSm,
        transition: "background .18s ease, color .18s ease, box-shadow .18s ease",
      }}>
        {icon}
      </div>
      <span style={{
        flex: 1,
        fontFamily: "'Instrument Sans', sans-serif",
        fontSize: 14, fontWeight: 600, letterSpacing: ".01em",
        color: hovered ? P.copper : P.inkLt,
        whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
        lineHeight: 1.3,
        transition: "color .15s ease",
      }}>
        {label}
      </span>
    </div>
  );
};

/* ─────────────────────────────────────────
   TREE NODE
───────────────────────────────────────── */
const TreeNode = React.memo(({
  node, parentPath, index, ancestors,
  expandedNodes, toggleNode, treeChildrenRefs,
  customerName, instanceName, navigate, collapsed, level,
  onUploadClick
}) => {
  const nodeId      = `${parentPath}-${index}`;
  const hasChildren = Boolean(node.children?.length);
  const isExpanded  = expandedNodes.has(nodeId);
  const isLevel3    = level === 3;

  const [hovered,    setHovered]    = useState(false);
  const [cfgHovered, setCfgHovered] = useState(false);
  const [upHovered,  setUpHovered]  = useState(false);
  const rowRef = useRef(null);
  const cfgRef = useRef(null);
  const upRef  = useRef(null);

  const isApiNode = !node.isSynthetic && !['dashboard','setup','pre_upload_parent','import_load','post_validation'].includes(node.type);

  const anc      = ancestors || [];
  const customer = anc[0]?.name || node.name;
  const instance = anc[1]?.name || node.name;

  const goUpload = useCallback((e) => {
    e.stopPropagation();
    if (onUploadClick) {
      onUploadClick(node);
    }
  }, [node, onUploadClick]);

  const goLeaf = useCallback(() => {
    if (hasChildren && node.isSynthetic) return;
    // Non-synthetic parent nodes (e.g. "Core HR") should toggle expansion, not navigate
    if (hasChildren && !node.isSynthetic) {
      toggleNode(nodeId);
      return;
    }
    if (node.type === "dashboard") {
      navigate("/dashboard");
    } else if (node.type === "setup") {
      navigate("/config", { state: { customerName: customer, instanceName: instance } });
    } else if (node.type === "import_load") {
      navigate("/hdl", { state: { customerName, instanceName } });
    } else if (node.type === "post_validation") {
      navigate("/post-validation", { state: { customerName: customer, instanceName: instance } });
    } else {
      navigate("/hdl", { state: { nodeData: node, customerName, instanceName } });
    }
  }, [hasChildren, node, customer, instance, customerName, instanceName, navigate, toggleNode, nodeId]);

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

  const synIcon = SYNTHETIC_ICONS[node.type];
  const isSynthetic = Boolean(synIcon);

  const iconChar = synIcon ? synIcon.char
    : isLevel3    ? "⚙"
    : hasChildren ? "▤" : "◈";

  const iconBg = synIcon ? synIcon.bg
    : isLevel3
    ? "linear-gradient(135deg, #c8843a, #7a4e28)"
    : "linear-gradient(145deg, #ddd6c6, #c0b8a8)";

  const iconColor = (isLevel3 || isSynthetic) ? "#f8f0e0" : P.warmDrk;

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
            cursor: (hasChildren && node.isSynthetic) ? "default" : "pointer",
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
                navigate={navigate} collapsed={collapsed} level={level + 1}
                onUploadClick={onUploadClick}
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  /* ── EXPANDED: Full row with dynamic depth indent ── */
  // Base padding per level depth to perfectly align deep nested children up to level 10
  const indent = (level - 3) * 20;

  return (
    <div style={{ display: "flex", flexDirection: "column", minWidth: "max-content" }}>
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
          cursor: (hasChildren && node.isSynthetic) ? "default" : "pointer",
          userSelect: "none", outline: "none",
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

        {/* Upload — dat-file level nodes (level_6 matches node name) */}
        {isApiNode && node.level_6 && node.level_6 === node.name && (
          <div
            ref={upRef}
            onClick={goUpload}
            onMouseEnter={() => {
              setUpHovered(true);
              if (upRef.current) gsap.to(upRef.current, { boxShadow: BS.copper, duration: .18 });
            }}
            onMouseLeave={() => {
              setUpHovered(false);
              if (upRef.current) gsap.to(upRef.current, { boxShadow: BS.raisedSm, duration: .18 });
            }}
            onMouseDown={() => { if (upRef.current) gsap.to(upRef.current, { scale: .94, boxShadow: BS.pressed, duration: .1 }); }}
            onMouseUp={() => { if (upRef.current) gsap.to(upRef.current, { scale: 1, boxShadow: BS.raisedSm, duration: .2, ease: "back.out(2)" }); }}
            role="button" tabIndex={0}
            onKeyDown={(e) => e.key === "Enter" && goUpload(e)}
            title={`Upload data for ${node.name}`}
            style={{
              padding: "5px 10px", borderRadius: 6,
              fontFamily: "'DM Mono', monospace",
              fontSize: 10, fontWeight: 500,
              letterSpacing: ".07em", textTransform: "uppercase",
              cursor: "pointer", flexShrink: 0,
              color: upHovered ? "#f8f0e0" : P.inkLt,
              background: upHovered
                ? "linear-gradient(135deg, #2e7d52, #1a4d32)"
                : "linear-gradient(145deg, #ddd6c6, #c0b8a8)",
              boxShadow: BS.raisedSm,
              border: "none", outline: "none",
              transition: "color .15s ease, background .15s ease",
              userSelect: "none",
              display: "flex", alignItems: "center", gap: 4,
            }}
          >
            <span style={{ fontSize: 11 }}>↑</span> Upload
          </div>
        )}

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
            position: "relative",
          }}
        >
          {/* Vertical dashed guideline aligned perfectly with the chevron center */}
          <div style={{
            position: "absolute",
            top: 22, bottom: 22,
            left: indent + 19, /* 10 (base pad) + 9 (half width of 18px chevron) */
            width: 1, borderLeft: "1px dashed rgba(184,115,51,.28)"
          }} />
          
          {node.children.map((child, idx) => (
            <TreeNode
              key={`${nodeId}-${idx}`}
              node={child} parentPath={nodeId} index={idx}
              ancestors={[...anc, node]}
              expandedNodes={expandedNodes} toggleNode={toggleNode}
              treeChildrenRefs={treeChildrenRefs}
              customerName={customerName} instanceName={instanceName}
              navigate={navigate} collapsed={collapsed} level={level + 1}
              onUploadClick={onUploadClick}
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
  const [searchTerm,    setSearchTerm]   = useState("");
  const [uploadNode,    setUploadNode]   = useState(null);

  const liveWidth        = useRef(EXPANDED_W);
  const sidebarRef       = useRef(null);
  const treeChildrenRefs = useRef({});
  const colBtnRef        = useRef(null);

  /* upload dialog handler */
  const handleUploadClick = useCallback((node) => {
    setUploadNode(node);
  }, []);

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
        setHierarchyData(injectMenuStructure(arr));
        setLoadState("ok");
      } catch {
        if (!cancelled) { setErrorMsg("Failed to load"); setLoadState("error"); }
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const injectMenuStructure = (data) =>
    data.map((l1) => ({
      ...l1,
      children: l1.children?.map((l2) => ({
        ...l2,
        children: [
          { name: "Dashboard", type: "dashboard", isSynthetic: true },
          { name: "Setup", type: "setup", isSynthetic: true },
          { name: "Pre Upload Validations", type: "pre_upload_parent", isSynthetic: true },
          ...(l2.children || []).map(child => ({ ...child, type: child.type || "hcm_parent" })),
          { name: "Import and Load Data", type: "import_load", isSynthetic: true },
          { name: "Post Upload Validations", type: "post_validation", isSynthetic: true },
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
        // Expanded max boundary to 1200px to allow deep tree visibility
        const w = Math.max(280, Math.min(e.clientX, 1200));
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
      ══════════════════════════════════════ */}
      <header style={{
        flexShrink: 0,
        background: "linear-gradient(160deg, #d0c8b8, #c0b8a8)",
        boxShadow: `${BS.insetDeep}, 0 4px 12px rgba(0,0,0,.16)`,
        borderBottom: "1px solid rgba(0,0,0,.1)",
        position: "relative",
        padding: collapsed ? "14px 0 14px 0" : "18px 14px 18px 18px",
        display: "flex",
        alignItems: "center",
        minHeight: collapsed ? 112 : 76,
        flexDirection: collapsed ? "column" : "row",
        justifyContent: collapsed ? "flex-end" : "flex-start",
        gap: collapsed ? 10 : 12,
      }}>
        {/* Collapse / expand button */}
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
            position: "absolute", top: 14, right: 14,
            width: 30, height: 30, borderRadius: 7, flexShrink: 0,
            display: "flex", alignItems: "center", justifyContent: "center",
            cursor: "pointer", fontFamily: "'DM Mono', monospace",
            fontSize: 12, color: P.inkLt,
            background: "linear-gradient(145deg, #ddd6c6, #c0b8a8)",
            boxShadow: BS.raisedSm, border: "none", outline: "none", userSelect: "none",
            zIndex: 2,
          }}
        >
          {collapsed ? "→" : "←"}
        </button>

        {/* Logo disc */}
        <div style={{
          width: 42, height: 42, borderRadius: "50%", flexShrink: 0,
          background: "linear-gradient(135deg, #c8843a, #7a4e28)",
          boxShadow: BS.copper, display: "flex", alignItems: "center", justifyContent: "center",
          fontFamily: "'DM Serif Display', serif", fontSize: 17, color: "#f8f0e0",
          alignSelf: collapsed ? "center" : "auto",
        }}>
          C
        </div>

        {/* Title */}
        {!collapsed && (
          <div style={{ flex: 1, minWidth: 0, overflow: "hidden" }}>
            <div style={{
              fontFamily: "'DM Mono', monospace", fontSize: 9, letterSpacing: ".2em", textTransform: "uppercase",
              color: P.warmDrk, marginBottom: 4, whiteSpace: "nowrap",
            }}>
              SmartERP's
            </div>
            <div style={{
              fontFamily: "'DM Serif Display', serif", fontSize: 21, color: P.ink, lineHeight: 1, whiteSpace: "nowrap",
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
        <div style={{ minWidth: collapsed ? "auto" : "max-content" }}>
          {/* ── Search bar ── */}
          <div style={{ padding: collapsed ? "4px 0" : "4px 6px 8px 6px" }}>
            <div style={{
              display: "flex", alignItems: "center", gap: 8,
              padding: collapsed ? "8px 0" : "8px 12px",
              borderRadius: 9,
              background: "linear-gradient(145deg, #c8bfad, #d0c8b8)",
              boxShadow: BS.insetSm,
              justifyContent: collapsed ? "center" : "flex-start",
            }}>
              <span style={{ fontSize: 13, color: P.warmDrk, flexShrink: 0 }}>🔍</span>
              {!collapsed && (
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{
                    flex: 1, border: "none", outline: "none",
                    background: "transparent",
                    fontFamily: "'DM Mono', monospace",
                    fontSize: 12, color: P.inkLt,
                    letterSpacing: ".04em",
                  }}
                />
              )}
            </div>
          </div>

          {/* ── Hardcoded top-level items ── */}
          <MenuLink icon="→" label="Onboarding" onClick={() => navigate("/onboarding")} collapsed={collapsed} />
          <MenuLink icon="⇋" label="Data Transformation" onClick={() => navigate("/hdl")} collapsed={collapsed} />
          {!collapsed && (
            <div style={{ height: 1, margin: "6px 10px", background: "rgba(184,115,51,.18)" }} />
          )}
          {collapsed && <div style={{ height: 6 }} />}

          {loadState === "loading" && (
            <div style={{
              display: "flex", alignItems: "center",
              justifyContent: collapsed ? "center" : "flex-start",
              gap: 10, padding: "14px 6px",
            }}>
              <div style={{
                width: 16, height: 16, borderRadius: "50%", flexShrink: 0,
                border: "2px solid rgba(0,0,0,.12)", borderTopColor: P.copper,
                animation: "sb-spin .7s linear infinite",
              }} />
              {!collapsed && (
                <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 13, color: P.inkLt, letterSpacing: ".04em" }}>
                  Loading…
                </span>
              )}
            </div>
          )}

          {loadState === "error" && (
            <div style={{
              fontFamily: "'DM Mono', monospace", fontSize: collapsed ? 16 : 13, color: P.active,
              padding: "13px 8px", borderRadius: 8, textAlign: collapsed ? "center" : "left",
              background: "rgba(192,57,43,.08)", border: "1px solid rgba(192,57,43,.22)",
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
              navigate={navigate} collapsed={collapsed} level={3}
              onUploadClick={handleUploadClick}
            />
          ))}
        </div>
      </nav>

      {/* ══════════════════════════════════════
          FOOTER
      ══════════════════════════════════════ */}
      <footer style={{
        flexShrink: 0, padding: collapsed ? "12px 0" : "14px 18px",
        display: "flex", flexDirection: "column", alignItems: "center", gap: 8,
        background: "linear-gradient(160deg, #d0c8b8, #c0b8a8)",
        boxShadow: `${BS.insetSm}, 0 -2px 8px rgba(0,0,0,.1)`,
        borderTop: "1px solid rgba(0,0,0,.08)",
      }}>
        <div style={{
          width: collapsed ? 34 : "100%", display: "flex", alignItems: "center",
          justifyContent: collapsed ? "center" : "flex-start", gap: 9,
          padding: collapsed ? "8px 0" : "8px 14px", borderRadius: 8,
          background: "linear-gradient(145deg, #c8bfad, #d0c8b8)",
          boxShadow: BS.insetSm, border: "1px solid rgba(39,174,96,.2)",
        }}>
          <div style={{
            width: 9, height: 9, borderRadius: "50%", flexShrink: 0,
            background: P.green, animation: "sb-pulse 2.2s ease-out infinite",
          }} />
          {!collapsed && (
            <span style={{
              fontFamily: "'DM Mono', monospace", fontSize: 11, fontWeight: 500, letterSpacing: ".1em",
              textTransform: "uppercase", color: P.green, whiteSpace: "nowrap",
            }}>
              API Connected
            </span>
          )}
        </div>

        {!collapsed && (
          <div style={{
            fontFamily: "'DM Mono', monospace", fontSize: 10, color: P.warmDrk,
            letterSpacing: ".14em", textAlign: "center", opacity: .6,
          }}>
            v2.4.1 · Charlie HDL
          </div>
        )}
      </footer>

      {/* ══════════════════════════════════════
          RESIZE HANDLE
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

      {/* Upload Dialog */}
      {uploadNode && (
        <UploadDialog
          node={uploadNode}
          customerName={customerName}
          instanceName={instanceName}
          onClose={() => setUploadNode(null)}
        />
      )}
    </aside>
  );
}