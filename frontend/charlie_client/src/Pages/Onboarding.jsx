import React, { useState, useEffect } from "react";
import api from "../services/api";

/* ─────────────────────────────────────────
   TOKENS & STYLES
───────────────────────────────────────── */
const P = {
  warmDrk: "#a09283",
  copper:  "#b87333",
  ink:     "#2c2420",
  inkLt:   "#5c4e44",
  green:   "#27ae60",
  danger:  "#c0392b",
  amber:   "#c47820",
  bg:      "#e0d8c8",
};

const BS = {
  raisedSm:  "5px 5px 14px rgba(0,0,0,.25), -3px -3px 10px rgba(255,255,255,.7)",
  pressed:   "inset 4px 4px 12px rgba(0,0,0,.35), inset -3px -3px 8px rgba(255,255,255,.5)",
  insetDeep: "inset 5px 5px 14px rgba(0,0,0,.25), inset -4px -4px 12px rgba(255,255,255,.6)",
  copper:    "5px 5px 14px rgba(0,0,0,.45), -2px -2px 8px rgba(255,255,255,.4), 0 0 16px rgba(184,115,51,.3)",
};

/* ─────────────────────────────────────────
   REUSABLE INPUT COMPONENT
───────────────────────────────────────── */
const NeumorphicInput = ({ label, type = "text", value, onChange, placeholder, required, disabled }) => {
  const [focused, setFocused] = useState(false);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 16 }}>
      <label style={{
        fontFamily: "'DM Mono', monospace", fontSize: 11, fontWeight: 500,
        color: disabled ? P.warmDrk : P.inkLt, letterSpacing: ".05em", textTransform: "uppercase", paddingLeft: 4
      }}>
        {label} {required && !disabled && <span style={{ color: P.danger }}>*</span>}
      </label>
      <input
        type={type}
        value={value}
        onChange={onChange}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder={placeholder}
        required={required && !disabled}
        disabled={disabled}
        style={{
          width: "100%", padding: "12px 16px",
          borderRadius: 12, border: "none", outline: "none",
          background: disabled ? "rgba(160,146,131,.1)" : "linear-gradient(145deg, #c4bbb0, #cec6b8)",
          boxShadow: disabled ? "none" : focused ? `${BS.insetDeep}, 0 0 0 2px rgba(184,115,51,.38)` : BS.insetDeep,
          color: disabled ? P.warmDrk : P.ink, fontSize: 14, fontFamily: "'Instrument Sans', sans-serif",
          transition: "box-shadow .2s ease",
          cursor: disabled ? "not-allowed" : "text"
        }}
      />
    </div>
  );
};

/* ─────────────────────────────────────────
   MAIN PAGE COMPONENT
───────────────────────────────────────── */
export default function Onboarding() {
  // --- States ---
  const [customers, setCustomers] = useState([]);
  const [loadingList, setLoadingList] = useState(true);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMsg, setStatusMsg] = useState({ type: "", text: "" });

  // Edit Mode States
  const [isEditing, setIsEditing] = useState(false);
  const [editTarget, setEditTarget] = useState(null); // Stores original reference

  const [formData, setFormData] = useState({
    customerName: "",
    instanceName: "",
    oracleUrl: "",
    oracleUsername: "",
    oraclePassword: "",
  });

  // --- Fetch Existing Customers ---
  const fetchCustomers = async () => {
    setLoadingList(true);
    try {
      const response = await api.get("/customers");
      if (Array.isArray(response.data)) {
        setCustomers(response.data);
      }
    } catch (err) {
      console.error("Failed to fetch customers", err);
    } finally {
      setLoadingList(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  // --- Handle Edit Click ---
  const handleEditClick = (cust, inst) => {
    setIsEditing(true);
    setEditTarget({ customerName: cust.customerName, instanceName: inst.instanceName });
    setFormData({
      customerName: cust.customerName,
      instanceName: inst.instanceName,
      oracleUrl: inst.oracleUrl || "",
      oracleUsername: inst.oracleUsername || "",
      oraclePassword: inst.oraclePassword || "", // May be empty depending on your backend security
    });
    setStatusMsg({ type: "", text: "" });
  };

  // --- Cancel Edit ---
  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditTarget(null);
    setFormData({
      customerName: "", instanceName: "", oracleUrl: "",
      oracleUsername: "", oraclePassword: "",
    });
    setStatusMsg({ type: "", text: "" });
  };

// --- Handle Form Submission (POST & PUT) ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setStatusMsg({ type: "", text: "" });

    // WRAP IN AN ARRAY to satisfy the API's list requirement
    const payload = [
      {
        customerName: formData.customerName,
        instances: [
          {
            instanceName: formData.instanceName,
            oracleUrl: formData.oracleUrl,
            oracleUsername: formData.oracleUsername,
            oraclePassword: formData.oraclePassword
          }
        ]
      }
    ];

    try {
      if (isEditing) {
        await api.put("/customers", payload); 
        setStatusMsg({ type: "success", text: "Instance updated successfully!" });
      } else {
        await api.post("/customers", payload);
        setStatusMsg({ type: "success", text: "Customer added successfully!" });
      }
      
      handleCancelEdit(); // Reset form back to creation mode
      fetchCustomers();   // Refresh directory

      setTimeout(() => setStatusMsg({ type: "", text: "" }), 3000);
    } catch (err) {
      console.error(err);
      setStatusMsg({ type: "error", text: isEditing ? "Failed to update instance." : "Failed to add customer." });
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- Render ---
  return (
    <div style={{
      display: "flex", gap: 32, padding: "32px", height: "calc(100vh - 68px)",
      background: "linear-gradient(160deg, #ede8dc 0%, #d8d0c0 100%)",
      fontFamily: "'Instrument Sans', sans-serif",
      boxSizing: "border-box", overflow: "hidden"
    }}>

      {/* ── LEFT: DYNAMIC FORM ── */}
      <div style={{
        flex: 1, maxWidth: 500, display: "flex", flexDirection: "column",
        background: "linear-gradient(145deg, #e4dccc, #d4ccbc)",
        borderRadius: 20, padding: 32, boxShadow: BS.raisedSm,
        overflowY: "auto", position: "relative"
      }}>
        {/* Header changes based on mode */}
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 28, color: P.ink, margin: "0 0 8px 0", lineHeight: 1.2 }}>
            {isEditing ? "Update Configuration" : "Onboard Customer"}
          </h1>
          <p style={{ fontFamily: "'DM Mono', monospace", fontSize: 12, color: P.warmDrk, margin: 0 }}>
            {isEditing 
              ? `Editing credentials for ${editTarget?.instanceName}` 
              : "Create a new customer profile and attach their initial Oracle instance."}
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", flex: 1 }}>
          {/* Lock customer name during edit to prevent orphan records, or enable if your backend supports renaming */}
          <NeumorphicInput
            label="Customer / Client Name"
            placeholder="e.g. Acme Corp"
            value={formData.customerName}
            onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
            required
            disabled={isEditing} 
          />

          <div style={{ height: 1, background: "rgba(160,146,131,.3)", margin: "8px 0 24px 0" }} />

          <NeumorphicInput
            label="Instance Name"
            placeholder="e.g. Production Environment"
            value={formData.instanceName}
            onChange={(e) => setFormData({ ...formData, instanceName: e.target.value })}
            required
            disabled={isEditing} // Typically you don't rename the instance key, just the credentials
          />
          <NeumorphicInput
            label="Oracle URL"
            placeholder="jdbc:oracle:thin:@//host:port/service"
            value={formData.oracleUrl}
            onChange={(e) => setFormData({ ...formData, oracleUrl: e.target.value })}
            required
          />
          <div style={{ display: "flex", gap: 16 }}>
            <div style={{ flex: 1 }}>
              <NeumorphicInput
                label="DB Username"
                placeholder="system"
                value={formData.oracleUsername}
                onChange={(e) => setFormData({ ...formData, oracleUsername: e.target.value })}
                required
              />
            </div>
            <div style={{ flex: 1 }}>
              <NeumorphicInput
                label="DB Password"
                type="password"
                placeholder="••••••••"
                value={formData.oraclePassword}
                onChange={(e) => setFormData({ ...formData, oraclePassword: e.target.value })}
                required={!isEditing} // Might not be required on PUT if keeping old password
              />
            </div>
          </div>

          <div style={{ marginTop: "auto", paddingTop: 24 }}>
            {statusMsg.text && (
              <div style={{
                marginBottom: 16, padding: "12px 16px", borderRadius: 8,
                fontFamily: "'DM Mono', monospace", fontSize: 12, textAlign: "center",
                background: statusMsg.type === "success" ? "rgba(39,174,96,.1)" : "rgba(192,57,43,.1)",
                color: statusMsg.type === "success" ? P.green : P.danger,
                border: `1px solid ${statusMsg.type === "success" ? "rgba(39,174,96,.3)" : "rgba(192,57,43,.3)"}`
              }}>
                {statusMsg.text}
              </div>
            )}

            <div style={{ display: "flex", gap: 12 }}>
              {isEditing && (
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  disabled={isSubmitting}
                  style={{
                    flex: 1, padding: "14px", borderRadius: 12,
                    background: "linear-gradient(145deg, #e4dccc, #d4ccbc)",
                    boxShadow: BS.raisedSm, border: "none", cursor: "pointer",
                    fontFamily: "'Instrument Sans', sans-serif", fontSize: 15, fontWeight: 700,
                    color: P.inkLt, transition: "all .15s ease", outline: "none"
                  }}
                  onMouseDown={(e) => e.currentTarget.style.boxShadow = BS.pressed}
                  onMouseUp={(e) => e.currentTarget.style.boxShadow = BS.raisedSm}
                >
                  Cancel
                </button>
              )}
              
              <button
                type="submit"
                disabled={isSubmitting}
                style={{
                  flex: isEditing ? 2 : 1, padding: "14px", borderRadius: 12,
                  background: isEditing ? "linear-gradient(135deg, #2e7d52, #1a4d32)" : "linear-gradient(135deg, #c8843a, #7a4e28)",
                  boxShadow: isSubmitting ? BS.pressed : BS.copper,
                  border: "none", outline: "none", cursor: isSubmitting ? "wait" : "pointer",
                  fontFamily: "'Instrument Sans', sans-serif", fontSize: 15, fontWeight: 700,
                  color: "#f8f0e0", letterSpacing: ".02em",
                  transition: "all .15s ease", opacity: isSubmitting ? 0.8 : 1
                }}
              >
                {isSubmitting 
                  ? (isEditing ? "Updating..." : "Provisioning...") 
                  : (isEditing ? "Save Changes" : "Add Customer & Instance")}
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* ── RIGHT: EXISTING CUSTOMERS DIRECTORY ── */}
      <div style={{
        flex: 1, display: "flex", flexDirection: "column",
        background: "transparent",
      }}>
        <div style={{ marginBottom: 20 }}>
          <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 24, color: P.ink, margin: "0 0 4px 0" }}>
            Active Directory
          </h2>
          <p style={{ fontFamily: "'DM Mono', monospace", fontSize: 12, color: P.warmDrk, margin: 0 }}>
            Currently registered customers and instances.
          </p>
        </div>

        <div style={{
          flex: 1, overflowY: "auto", paddingRight: 8,
          display: "flex", flexDirection: "column", gap: 16
        }}>
          {loadingList ? (
            <div style={{ fontFamily: "'DM Mono', monospace", color: P.inkLt, fontSize: 13 }}>Fetching directory...</div>
          ) : customers.length === 0 ? (
            <div style={{ fontFamily: "'DM Mono', monospace", color: P.inkLt, fontSize: 13 }}>No customers found.</div>
          ) : (
            customers.map((cust, i) => (
              <div key={i} style={{
                background: "linear-gradient(145deg, #e4dccc, #d4ccbc)",
                borderRadius: 16, padding: 20, boxShadow: BS.raisedSm,
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: "50%",
                    background: "linear-gradient(135deg, #c0b8a8, #a09080)",
                    boxShadow: BS.insetSm, display: "flex", alignItems: "center", justifyContent: "center",
                    fontFamily: "'DM Serif Display', serif", fontSize: 16, color: P.ink
                  }}>
                    {cust.customerName.charAt(0).toUpperCase()}
                  </div>
                  <div style={{ fontFamily: "'Instrument Sans', sans-serif", fontSize: 18, fontWeight: 700, color: P.ink }}>
                    {cust.customerName}
                  </div>
                </div>

                {/* Nested Instances */}
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {(cust.instances || []).map((inst, j) => (
                    <div key={j} style={{
                      padding: "10px 14px", borderRadius: 8,
                      background: "rgba(160,146,131,.1)", border: "1px dashed rgba(160,146,131,.3)",
                      display: "flex", justifyContent: "space-between", alignItems: "center"
                    }}>
                      <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                        <span style={{ fontFamily: "'Instrument Sans', sans-serif", fontSize: 14, fontWeight: 600, color: P.inkLt }}>
                          {inst.instanceName}
                        </span>
                        <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: P.copper }}>
                          {inst.oracleUsername}
                        </span>
                      </div>

                      {/* Edit Button */}
                      <button
                        onClick={() => handleEditClick(cust, inst)}
                        title="Edit Instance"
                        style={{
                          width: 28, height: 28, borderRadius: 6,
                          background: "linear-gradient(145deg, #e4dccc, #d4ccbc)",
                          boxShadow: BS.raisedSm, border: "none", cursor: "pointer",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          transition: "all .1s ease", outline: "none"
                        }}
                        onMouseDown={(e) => e.currentTarget.style.boxShadow = BS.pressed}
                        onMouseUp={(e) => e.currentTarget.style.boxShadow = BS.raisedSm}
                      >
                        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                          <path d="M7 2.5V3.5M7 10.5V11.5M2.5 7H3.5M10.5 7H11.5M3.818 3.818L4.525 4.525M9.475 9.475L10.182 10.182M3.818 10.182L4.525 9.475M9.475 4.525L10.182 3.818" stroke={P.inkLt} strokeWidth="1.2" strokeLinecap="round"/>
                          <path d="M5.5 8.5A2 2 0 1 1 8.5 5.5A2 2 0 0 1 5.5 8.5Z" stroke={P.inkLt} strokeWidth="1.2"/>
                        </svg>
                      </button>

                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
      
    </div>
  );
}