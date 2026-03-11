import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { useState, useEffect, useCallback } from "react";
import Dashboard from "./Pages/Dashboard";
import Hierarchy from "./Pages/Hierarchy";
import HDL from "./Pages/HDL";
import Sidebar from "./Components/sidebar";
import Topbar from "./Components/Topbar";
import api from "./services/api";
import Configuration from "./Pages/Configuration";
import PostValidation from "./Pages/Post_Validation";
import Onboarding from "./Pages/Onboarding";
import "./App.css";

/* -------------------- Layout Wrapper -------------------- */

function AppContent() {
  const location = useLocation();
  const showTopbar = location.pathname !== "/hdl";

  useEffect(() => {
    const path = location.pathname;
    const routeToName = {
      "/": "Dashboard",
      "/dashboard": "Dashboard",
      "/hierarchy": "Hierarchy",
      "/hdl": "HDL",
      "/config": "Configuration",
      "/post-validation": "Post Validation",
      "/onboarding": "Onboarding",
    };
    let name = routeToName[path];
    if (!name) {
      const parts = path.replace(/^\//, "").split("/");
      if (parts.length && parts[0]) {
        name = parts[0].replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
      } else {
        name = "Dashboard";
      }
    }
    document.title = `Charlie Tool - Mythics - ${name}`;
  }, [location]);

  return (
    <div className="layout fade-in">
      <Sidebar />
      <div className="main-container">
        {showTopbar && <Topbar />}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0, overflow: "auto" }}>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/hierarchy" element={<Hierarchy />} />
            <Route path="/hdl" element={<HDL />} />
            <Route path="/config" element={<Configuration />} />
            <Route path="/post-validation" element={<PostValidation />} />
            <Route path="/onboarding" element={<Onboarding />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </div>
    </div>
  );
}

/* -------------------- Main App -------------------- */

function App() {
  const [loading, setLoading] = useState(true);
  const [serverStatus, setServerStatus] = useState("checking");
  const [checking, setChecking] = useState(false);
  const [success, setSuccess] = useState(false);

  const checkServer = useCallback(async () => {
    setChecking(true);
    try {
      await api.get("/health");
      setServerStatus("UP");
      setSuccess(true);

      // Show success animation for 1.5 seconds
      setTimeout(() => {
        setLoading(false);
      }, 1500);

    } catch (err) {
      setServerStatus("DOWN");
      setLoading(false);
    } finally {
      setChecking(false);
    }
  }, []);

  useEffect(() => {
    checkServer();
  }, [checkServer]);

  /* -------------------- Initial Loading -------------------- */

  if (loading && !success) {
    return (
      <div className="center-screen neo-container">
        <div className="neo-card">
          <div className="spinner"></div>
          <h2>Connecting to Charlie Engine</h2>
          <p>Initializing HDL Management Platform</p>
        </div>
      </div>
    );
  }

  /* -------------------- Success Animation -------------------- */

  if (success && loading) {
    return (
      <div className="center-screen neo-container">
        <div className="neo-card success-card">
          <div className="success-check">✔</div>
          <h2>Connection Established</h2>
          <p>Charlie Engine is Online</p>
        </div>
      </div>
    );
  }

  /* -------------------- Error UI -------------------- */

  if (serverStatus !== "UP") {
    return (
      <div className="center-screen neo-container">
        <div className="neo-card error-card">
          <div className="warning-icon">⚠</div>
          <h2>Backend Service Unavailable</h2>

          <button
            className="neo-button"
            onClick={checkServer}
            disabled={checking}
          >
            {checking ? "Checking..." : "Recheck Server"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;