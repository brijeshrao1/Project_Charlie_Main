import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import Dashboard from "./Pages/Dashboard";
import Hierarchy from "./Pages/Hierarchy";
import HDL from "./Pages/HDL";
import Sidebar from "./Components/sidebar";
import Topbar from "./Components/Topbar";
import api from "./services/api";
import Configuration from "./Pages/Configuration";
import "./App.css";
import PostValidation from "./Pages/Post_Validation";
import Onboarding from "./Pages/Onboarding";

function AppContent() {
  const location = useLocation();
  const showTopbar = location.pathname !== "/hdl";
  const [customerName, setCustomerName] = useState("");
  const [instanceName, setInstanceName] = useState("");

  return (
    <div className="layout">
      <Sidebar
        customerName={customerName}
        instanceName={instanceName}
       />
      <div className="main-container">
        {showTopbar && <Topbar />}
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/hierarchy" element={<Hierarchy />} />
          <Route path="/hdl" element={<HDL />} />
          <Route path="/upload" element={<Dashboard />} />
          <Route path="/validation" element={<Dashboard />} />
          <Route path="/transformation" element={<Dashboard />} />
          <Route path="/lookup" element={<Dashboard />} />
          <Route path="/oracle" element={<Dashboard />} />
          <Route path="/settings" element={<Dashboard />} />
          <Route path="/config" element={<Configuration /> } />
          <Route path="/post-validation" element={<PostValidation />} />
          <Route path="/onboarding" element={<Onboarding />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </div>
  );
}

function App() {
  const [loading, setLoading] = useState(true);
  const [serverStatus, setServerStatus] = useState("checking");

  useEffect(() => {
    const checkServer = async () => {
      try {
        // Check if API is responding
        await api.get("/health");
        setServerStatus("UP");
      } catch (err) {
        console.error("Server check failed:", err.message);
        setServerStatus("DOWN");
      } finally {
        setLoading(false);
      }
    };

    checkServer();
    
    // Recheck every 60 seconds
    const interval = setInterval(checkServer, 60000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="center-screen">
        <div className="spinner"></div>
        <h2>Connecting to Charlie Engine...</h2>
        <p>Initializing HDL Management Platform</p>
      </div>
    );
  }

  if (serverStatus !== "UP") {
    return (
      <div className="center-screen">
        <div style={{ fontSize: "48px" }}>⚠️</div>
        <h2>Backend Service Unavailable</h2>
        <p>Please ensure the FastAPI backend is running on localhost:8000</p>
        <p style={{ fontSize: "12px", marginTop: "20px" }}>
          Command: uvicorn Server.Main:app --reload --port 8000
        </p>
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
