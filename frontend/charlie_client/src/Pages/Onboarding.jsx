/* eslint-disable unicode-bom */
import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import {
  Box, Typography, TextField, Button,
  Avatar, Stack, Divider, CircularProgress,
  IconButton, Tooltip, Skeleton,
} from "@mui/material";
import EditIcon       from "@mui/icons-material/Edit";
import StorageIcon    from "@mui/icons-material/Storage";
import api           from "../services/api";

/* ── Fonts ──────────────────────────────────────────────── */
if (!document.getElementById("ob-fonts")) {
  const s = document.createElement("link");
  s.id   = "ob-fonts";
  s.rel  = "stylesheet";
  s.href = "https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Mono:wght@400;500&family=Instrument+Sans:wght@400;600;700&display=swap";
  document.head.appendChild(s);
}

/* ── Design tokens ──────────────────────────────────────── */
const C = {
  copper:   "#b87333",
  copperLt: "#d4935f",
  ink:      "#2c2420",
  inkLt:    "#5c4e44",
  warm:     "#a09283",
  green:    "#27ae60",
  danger:   "#c0392b",
  surface:  "linear-gradient(145deg, #e4dccc, #d4ccbc)",
  bg:       "linear-gradient(160deg, #ede8dc 0%, #d8d0c0 100%)",
};

const NEU_RAISED  = "6px 6px 16px rgba(0,0,0,.28), -4px -4px 12px rgba(255,255,255,.82)";
const NEU_PRESSED = "inset 4px 4px 12px rgba(0,0,0,.35), inset -3px -3px 8px rgba(255,255,255,.5)";
const NEU_INSET   = "inset 5px 5px 12px rgba(0,0,0,.22), inset -3px -3px 8px rgba(255,255,255,.62)";
const COPPER_GLOW = `6px 6px 16px rgba(0,0,0,.45), -2px -2px 8px rgba(255,255,255,.38), 0 0 18px rgba(184,115,51,.32)`;

/* ── Skeuomorphic TextField override ────────────────────── */
const neuField = (disabled) => ({
  "& .MuiInputLabel-root": {
    fontFamily: "'DM Mono', monospace",
    fontSize: 10, fontWeight: 500,
    letterSpacing: ".08em", textTransform: "uppercase",
    color: disabled ? C.warm : C.inkLt,
    "&.Mui-focused":  { color: C.copper },
    "&.Mui-disabled": { color: C.warm },
  },
  "& .MuiOutlinedInput-root": {
    fontFamily: "'Instrument Sans', sans-serif",
    fontSize: 13, color: C.ink,
    borderRadius: "12px",
    background: disabled
      ? "rgba(160,146,131,.08)"
      : "linear-gradient(145deg, #ccc4b4, #d8d0be)",
    boxShadow: disabled ? "none" : NEU_INSET,
    transition: "box-shadow .2s ease",
    "& fieldset":           { border: "none" },
    "&:hover":              { boxShadow: disabled ? "none" : `${NEU_INSET}, 0 0 0 1.5px rgba(184,115,51,.28)` },
    "&.Mui-focused":        { boxShadow: `${NEU_INSET}, 0 0 0 2px rgba(184,115,51,.42)` },
    "& input":              { color: disabled ? C.warm : C.ink, cursor: disabled ? "not-allowed" : "text" },
    "& input::placeholder": { color: C.warm, opacity: 1 },
    "&.Mui-disabled":       { background: "rgba(160,146,131,.06)", boxShadow: "none" },
  },
});

/* ── Brass rivet ─────────────────────────────────────────── */
const Rivet = ({ top, bottom, left, right }) => (
  <Box sx={{
    position: "absolute", top, bottom, left, right,
    width: 14, height: 14, borderRadius: "50%",
    background: "linear-gradient(135deg, #d4a95f, #8b6f4e, #c89b50)",
    boxShadow: "2px 2px 5px rgba(0,0,0,.48), -1px -1px 3px rgba(255,255,255,.4), inset 0 1px 1px rgba(255,255,255,.28)",
    zIndex: 1,
  }}>
    <Box sx={{ position:"absolute", top:"50%", left:"50%", width:"62%", height:1.5, bgcolor:"rgba(0,0,0,.34)", transform:"translate(-50%,-50%)" }} />
    <Box sx={{ position:"absolute", top:"50%", left:"50%", width:"62%", height:1.5, bgcolor:"rgba(0,0,0,.34)", transform:"translate(-50%,-50%) rotate(90deg)" }} />
  </Box>
);

/* ────────────────────────────────────────────────────────── */

export default function Onboarding() {
  const [customers,    setCustomers]    = useState([]);
  const [loadingList,  setLoadingList]  = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMsg,    setStatusMsg]    = useState({ type: "", text: "" });
  const [isEditing,    setIsEditing]    = useState(false);
  const [editTarget,   setEditTarget]   = useState(null);
  const [formData,     setFormData]     = useState({
    customerName: "", instanceName: "", oracleUrl: "", oracleUsername: "", oraclePassword: "",
  });

  const fetchCustomers = async () => {
    setLoadingList(true);
    try {
      const res = await api.get("/customers");
      if (Array.isArray(res.data)) setCustomers(res.data);
    } catch (err) {
      console.error("Failed to fetch customers", err);
    } finally {
      setLoadingList(false);
    }
  };

  useEffect(() => { fetchCustomers(); }, []);

  const location = useLocation();

  // Pre-fill edit form when navigated from sidebar with edit state
  useEffect(() => {
    const state = location.state;
    if (!state?.editMode || !state?.customerName) return;
    window.history.replaceState({}, "");

    // Normalize names to handle mismatches between hierarchy casing ("Acme Corp")
    // and .env-key casing ("ACME_CORP") returned by GET /api/customers
    const norm = (s) => (s || "").toUpperCase().replace(/[^A-Z0-9]/g, "_");

    api.get("/customers").then((res) => {
      if (!Array.isArray(res.data)) return;
      const cust = res.data.find((c) => norm(c.customerName) === norm(state.customerName));
      if (!cust) return;
      const inst = (cust.instances || []).find((i) => norm(i.instanceName) === norm(state.instanceName));
      if (!inst) return;
      handleEditClick(cust, inst);
      fetchCustomers(); // refresh directory list in parallel
    }).catch(console.error);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleEditClick = (cust, inst) => {
    setIsEditing(true);
    setEditTarget({ customerName: cust.customerName, instanceName: inst.instanceName });
    setFormData({
      customerName: cust.customerName, instanceName: inst.instanceName,
      oracleUrl: inst.oracleUrl || "", oracleUsername: inst.oracleUsername || "", oraclePassword: inst.oraclePassword || "",
    });
    setStatusMsg({ type: "", text: "" });
  };

  const handleCancelEdit = () => {
    setIsEditing(false); setEditTarget(null);
    setFormData({ customerName: "", instanceName: "", oracleUrl: "", oracleUsername: "", oraclePassword: "" });
    setStatusMsg({ type: "", text: "" });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setStatusMsg({ type: "", text: "" });
    const payload = [{ customerName: formData.customerName, instances: [{ instanceName: formData.instanceName, oracleUrl: formData.oracleUrl, oracleUsername: formData.oracleUsername, oraclePassword: formData.oraclePassword }] }];
    try {
      await api.post("/customers", payload);
      setStatusMsg({ type: "success", text: isEditing ? "Instance updated successfully!" : "Customer added successfully!" });
      handleCancelEdit(); fetchCustomers();
      setTimeout(() => setStatusMsg({ type: "", text: "" }), 3000);
    } catch (err) {
      console.error(err);
      setStatusMsg({ type: "error", text: isEditing ? "Failed to update instance." : "Failed to add customer." });
    } finally { setIsSubmitting(false); }
  };

  const set = (field) => (e) => setFormData((p) => ({ ...p, [field]: e.target.value }));

  return (
    <Box sx={{ display:"flex", gap:4, p:4, height:"calc(100vh - 68px)", background: C.bg, boxSizing:"border-box", overflow:"hidden", fontFamily:"'Instrument Sans', sans-serif" }}>

      {/* ══ LEFT PANEL — FORM ══════════════════════════════════ */}
      <Box sx={{ flex:"0 0 460px", position:"relative", display:"flex", flexDirection:"column",
                 background: C.surface, borderRadius:"20px",
                 boxShadow: NEU_RAISED, overflow:"hidden" }}>

        {/* Corner rivets */}
        <Rivet top={14} left={14} />
        <Rivet top={14} right={14} />
        <Rivet bottom={14} left={14} />
        <Rivet bottom={14} right={14} />

        <Box sx={{ flex:1, display:"flex", flexDirection:"column", p:"32px", overflowY:"auto" }}>

          {/* Header */}
          <Box mb={3.5}>
            <Typography sx={{ fontFamily:"'DM Serif Display', serif", fontSize:28, fontWeight:400, color: C.ink, lineHeight:1.2, mb:.75 }}>
              {isEditing ? "Update Configuration" : "Onboard Customer"}
            </Typography>
            <Typography sx={{ fontFamily:"'DM Mono', monospace", fontSize:11, color: C.warm, letterSpacing:".04em" }}>
              {isEditing
                ? `Editing credentials for ${editTarget?.instanceName}`
                : "Create a new customer profile and attach their Oracle instance."}
            </Typography>
          </Box>

          {/* Form */}
          <Box component="form" onSubmit={handleSubmit} sx={{ display:"flex", flexDirection:"column", flex:1, gap:2.5 }}>

            <TextField label="Customer / Client Name" placeholder="e.g. Acme Corp"
              value={formData.customerName} onChange={set("customerName")}
              required disabled={isEditing} size="small" fullWidth sx={neuField(isEditing)} />

            <Divider sx={{ borderColor:"rgba(160,146,131,.28)", my:.25 }} />

            <TextField label="Instance Name" placeholder="e.g. Production Environment"
              value={formData.instanceName} onChange={set("instanceName")}
              required disabled={isEditing} size="small" fullWidth sx={neuField(isEditing)} />

            <TextField label="Oracle URL" placeholder="jdbc:oracle:thin:@//host:port/service"
              value={formData.oracleUrl} onChange={set("oracleUrl")}
              required size="small" fullWidth sx={neuField(false)} />

            <Stack direction="row" gap={2}>
              <TextField label="DB Username" placeholder="system"
                value={formData.oracleUsername} onChange={set("oracleUsername")}
                required size="small" sx={{ flex:1, ...neuField(false) }} />
              <TextField label="DB Password" type="password" placeholder="••••••••"
                value={formData.oraclePassword} onChange={set("oraclePassword")}
                required={!isEditing} size="small" sx={{ flex:1, ...neuField(false) }} />
            </Stack>

            {/* Actions */}
            <Box sx={{ mt:"auto", pt:3 }}>
              {statusMsg.text && (
                <Box sx={{
                  mb:2, px:2, py:1.5, borderRadius:"10px", textAlign:"center",
                  fontFamily:"'DM Mono', monospace", fontSize:11, letterSpacing:".04em",
                  background: statusMsg.type==="success" ? "rgba(39,174,96,.1)" : "rgba(192,57,43,.1)",
                  color:      statusMsg.type==="success" ? C.green : C.danger,
                  border:`1px solid ${statusMsg.type==="success" ? "rgba(39,174,96,.3)" : "rgba(192,57,43,.3)"}`,
                }}>
                  {statusMsg.text}
                </Box>
              )}

              <Stack direction="row" gap={1.5}>
                {isEditing && (
                  <Button onClick={handleCancelEdit} disabled={isSubmitting}
                    sx={{
                      flex:1, py:1.4, borderRadius:"12px", textTransform:"none",
                      fontFamily:"'Instrument Sans', sans-serif", fontWeight:700, fontSize:14,
                      color: C.inkLt, background: C.surface,
                      boxShadow: NEU_RAISED, border:"none",
                      "&:hover":  { boxShadow: NEU_RAISED, opacity:.9 },
                      "&:active": { boxShadow: NEU_PRESSED },
                    }}>
                    Cancel
                  </Button>
                )}
                <Button type="submit" disabled={isSubmitting}
                  startIcon={isSubmitting ? <CircularProgress size={15} sx={{ color:"#f8f0e0" }} /> : null}
                  sx={{
                    flex: isEditing ? 2 : 1, py:1.4, borderRadius:"12px", textTransform:"none",
                    fontFamily:"'Instrument Sans', sans-serif", fontWeight:700, fontSize:14,
                    color:"#f8f0e0", letterSpacing:".02em",
                    background: isEditing
                      ? "linear-gradient(135deg, #2e7d52, #1a4d32)"
                      : `linear-gradient(135deg, #c8843a, #7a4e28)`,
                    boxShadow: isSubmitting ? NEU_PRESSED : COPPER_GLOW,
                    border:"none",
                    opacity: isSubmitting ? .82 : 1,
                    transition:"all .15s ease",
                    "&:hover":  { opacity:.9, filter:"brightness(1.05)" },
                    "&:active": { boxShadow: NEU_PRESSED, transform:"scale(.98)" },
                    "&:disabled": { background:"rgba(160,146,131,.3)", color:"rgba(255,255,255,.45)", boxShadow:"none" },
                  }}>
                  {isSubmitting
                    ? (isEditing ? "Updating…" : "Provisioning…")
                    : (isEditing ? "Save Changes" : "Add Customer & Instance")}
                </Button>
              </Stack>
            </Box>
          </Box>
        </Box>
      </Box>

      {/* ══ RIGHT PANEL — DIRECTORY ════════════════════════════ */}
      <Box sx={{ flex:1, display:"flex", flexDirection:"column", minWidth:0 }}>
        <Box mb={2.5}>
          <Typography sx={{ fontFamily:"'DM Serif Display', serif", fontSize:24, fontWeight:400, color: C.ink, mb:.25 }}>
            Active Directory
          </Typography>
          <Typography sx={{ fontFamily:"'DM Mono', monospace", fontSize:11, color: C.warm, letterSpacing:".04em" }}>
            Currently registered customers and instances.
          </Typography>
        </Box>

        <Box sx={{ flex:1, overflowY:"auto", pr:1, display:"flex", flexDirection:"column", gap:2 }}>

          {loadingList ? (
            [0,1,2].map((i) => (
              <Skeleton key={i} variant="rounded" height={88}
                sx={{ borderRadius:"14px", bgcolor:"rgba(160,146,131,.18)", transform:"none" }} />
            ))
          ) : customers.length === 0 ? (
            <Box sx={{ textAlign:"center", mt:10 }}>
              <StorageIcon sx={{ fontSize:52, color: C.warm, opacity:.3, mb:1.5 }} />
              <Typography sx={{ fontFamily:"'DM Mono', monospace", fontSize:12, color: C.warm }}>
                No customers registered yet.
              </Typography>
            </Box>
          ) : (
            customers.map((cust, i) => (
              <Box key={i} sx={{ background: C.surface, borderRadius:"16px", p:2.5, boxShadow: NEU_RAISED }}>

                {/* Customer header */}
                <Stack direction="row" alignItems="center" gap={1.5} mb={1.75}>
                  <Avatar sx={{
                    width:38, height:38, fontSize:16,
                    fontFamily:"'DM Serif Display', serif", fontWeight:400,
                    background:"linear-gradient(135deg, #c0b8a8, #a09080)",
                    boxShadow:"inset 3px 3px 7px rgba(0,0,0,.3), inset -2px -2px 5px rgba(255,255,255,.45)",
                    color: C.ink,
                  }}>
                    {cust.customerName.charAt(0).toUpperCase()}
                  </Avatar>
                  <Typography sx={{ fontFamily:"'Instrument Sans', sans-serif", fontSize:17, fontWeight:700, color: C.ink }}>
                    {cust.customerName}
                  </Typography>
                  <Box sx={{ ml:"auto" }}>
                    <Box sx={{
                      px:1.25, py:.35, borderRadius:"6px", fontSize:9,
                      fontFamily:"'DM Mono', monospace", fontWeight:500, letterSpacing:".06em",
                      color: C.copper,
                      background:"rgba(184,115,51,.1)",
                      boxShadow:"inset 2px 2px 5px rgba(0,0,0,.1), inset -1px -1px 3px rgba(255,255,255,.4)",
                    }}>
                      {(cust.instances||[]).length} INSTANCE{(cust.instances||[]).length !== 1 ? "S" : ""}
                    </Box>
                  </Box>
                </Stack>

                {/* Instances */}
                <Stack gap={1}>
                  {(cust.instances||[]).map((inst, j) => (
                    <Box key={j} sx={{
                      display:"flex", alignItems:"center", justifyContent:"space-between",
                      px:1.75, py:1, borderRadius:"8px",
                      background:"rgba(160,146,131,.1)",
                      border:"1px dashed rgba(160,146,131,.3)",
                      transition:"background .15s",
                      "&:hover": { background:"rgba(184,115,51,.07)" },
                    }}>
                      <Box>
                        <Typography sx={{ fontFamily:"'Instrument Sans', sans-serif", fontSize:13, fontWeight:600, color: C.inkLt }}>
                          {inst.instanceName}
                        </Typography>
                        <Typography sx={{ fontFamily:"'DM Mono', monospace", fontSize:10, color: C.copper }}>
                          {inst.oracleUsername || "—"}
                        </Typography>
                      </Box>
                      <Tooltip title="Edit credentials" arrow>
                        <IconButton size="small" onClick={() => handleEditClick(cust, inst)}
                          sx={{
                            width:28, height:28, borderRadius:"6px",
                            background: C.surface,
                            boxShadow: NEU_RAISED,
                            color: C.inkLt,
                            "&:hover":  { color: C.copper, boxShadow: NEU_RAISED },
                            "&:active": { boxShadow: NEU_PRESSED },
                          }}>
                          <EditIcon sx={{ fontSize:14 }} />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  ))}
                </Stack>

              </Box>
            ))
          )}
        </Box>
      </Box>

    </Box>
  );
}