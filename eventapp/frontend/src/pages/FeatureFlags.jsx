import { useState, useEffect } from "react";
import api from "../api/axios";
import DashboardNav from "../components/DashboardNav";

const FeatureFlags = () => {
  const [flags, setFlags] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadFlags = async () => {
    try {
      const { data } = await api.get("/api/production/flags");
      setFlags(data);
    } catch (err) {
      console.error("Flags load failed", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFlags();
  }, []);

  const handleToggle = async (key, currentStatus) => {
    try {
      await api.put(`/api/production/flags/${key}`, { isEnabled: !currentStatus });
      alert(`Feature flag '${key}' updated successfully!`);
      loadFlags();
    } catch (err) {
      alert("Failed to update feature flag.");
    }
  };

  if (loading) return <div className="loading-wrap">Loading Feature Flags...</div>;

  return (
    <div>
      <DashboardNav role="admin" />
      <div className="dash-body" style={{ maxWidth: 800, margin: "0 auto", padding: "20px" }}>
        <h2 className="section-title">⚙️ Platform Module Feature Flags</h2>
        <p style={{ color: "var(--text-dim)", fontSize: "14px", marginBottom: "24px" }}>
          Toggle platform features dynamically without rebuilding or redeploying code.
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {flags.map((f) => (
            <div 
              key={f.flagKey}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                background: "var(--surface-2)",
                padding: "16px 20px",
                borderRadius: "10px",
                border: "1px solid var(--border)"
              }}
            >
              <div>
                <strong style={{ fontSize: "16px", textTransform: "capitalize", color: "var(--text)" }}>{f.flagKey.replace("_", " ")}</strong>
                <div style={{ fontSize: "12px", color: "var(--text-dim)", marginTop: "4px" }}>{f.description}</div>
              </div>
              <div>
                <button
                  onClick={() => handleToggle(f.flagKey, f.isEnabled)}
                  style={{
                    padding: "8px 18px",
                    borderRadius: "20px",
                    fontWeight: "bold",
                    fontSize: "12px",
                    cursor: "pointer",
                    border: "none",
                    background: f.isEnabled ? "#10b981" : "rgba(239,68,68,0.2)",
                    color: f.isEnabled ? "#fff" : "#ef4444"
                  }}
                >
                  {f.isEnabled ? "ACTIVE / ENABLED" : "DISABLED"}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default FeatureFlags;
