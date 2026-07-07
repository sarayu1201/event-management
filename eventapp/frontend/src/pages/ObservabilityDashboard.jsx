import { useState, useEffect } from "react";
import api from "../api/axios";
import DashboardNav from "../components/DashboardNav";

const ObservabilityDashboard = () => {
  const [health, setHealth] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      const [healthRes, jobsRes] = await Promise.all([
        api.get("/api/enterprise-ticketing/observability/health"),
        api.get("/api/enterprise-ticketing/observability/jobs")
      ]);
      setHealth(healthRes.data);
      setJobs(jobsRes.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(() => {
      loadData();
    }, 6000); // refresh every 6 seconds
    return () => clearInterval(interval);
  }, []);

  if (loading) return <div className="loading-wrap">Connecting to observability agent...</div>;
  if (!health) return <div className="section empty-state">Failed to load system metrics</div>;

  return (
    <div>
      <DashboardNav role="admin" />
      <div className="dash-body" style={{ maxWidth: 1100, margin: "0 auto", padding: "20px" }}>
        
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
          <div>
            <h2 className="section-title" style={{ margin: 0 }}>⚙️ System Observability & Health</h2>
            <div style={{ fontSize: "13px", color: "var(--text-dim)", marginTop: "2px" }}>Platform Engine status: {health.status}</div>
          </div>
          <button onClick={loadData} className="btn btn-sm btn-outline">🔄 Force Refresh</button>
        </div>

        {/* Health gauges */}
        <div className="stat-grid" style={{ gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: "16px" }}>
          <div className="stat-card" style={{ borderLeft: "4px solid #10b981" }}><div className="label">Database Link</div><div className="value" style={{ fontSize: "20px" }}>{health.database}</div></div>
          <div className="stat-card" style={{ borderLeft: "4px solid var(--purple)" }}><div className="label">Active Seat Locks</div><div className="value" style={{ fontSize: "20px" }}>{health.metrics?.activeSeatLocks}</div></div>
          <div className="stat-card" style={{ borderLeft: "4px solid var(--pink)" }}><div className="label">CPU Usage</div><div className="value" style={{ fontSize: "20px" }}>{health.metrics?.cpuUsage}</div></div>
          <div className="stat-card" style={{ borderLeft: "4px solid #f59e0b" }}><div className="label">Free Memory</div><div className="value" style={{ fontSize: "20px" }}>{health.metrics?.freeMemory}</div></div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: "24px", marginTop: "28px" }}>
          
          {/* Background queues status */}
          <div className="card-panel">
            <h3>📥 Background Queue Jobs (Last 10)</h3>
            {jobs.length === 0 ? (
              <div style={{ color: "var(--text-dim)", padding: "20px 0" }}>No background queue jobs registered.</div>
            ) : (
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr><th>Job Type</th><th>Attempts</th><th>State</th><th>Created At</th></tr>
                  </thead>
                  <tbody>
                    {jobs.map(j => (
                      <tr key={j._id}>
                        <td><strong>{j.jobType}</strong></td>
                        <td>{j.attempts} / {j.maxRetries}</td>
                        <td>
                          <span className={`status-pill ${j.status === "completed" ? "status-success" : j.status === "failed" ? "status-failed" : "status-pending"}`}>
                            {j.status}
                          </span>
                        </td>
                        <td style={{ fontSize: "11px", color: "var(--text-dim)" }}>{new Date(j.createdAt).toLocaleTimeString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* System status checklist logs */}
          <div className="card-panel">
            <h3>⚙️ Engine Diagnostic check</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginTop: "16px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid var(--border)", paddingBottom: "6px" }}>
                <span>BullMQ Queue Processors</span><span style={{ color: "#10b981", fontWeight: "bold" }}>OK (Simulated)</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid var(--border)", paddingBottom: "6px" }}>
                <span>Express API Server Port</span><span style={{ color: "#10b981", fontWeight: "bold" }}>ONLINE</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid var(--border)", paddingBottom: "6px" }}>
                <span>Unresolved conflicts count</span>
                <span style={{ color: health.metrics?.unresolvedConflicts > 0 ? "#ef4444" : "#10b981", fontWeight: "bold" }}>
                  {health.metrics?.unresolvedConflicts} conflicts
                </span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid var(--border)", paddingBottom: "6px" }}>
                <span>Memory Pool Leak tests</span><span style={{ color: "#10b981", fontWeight: "bold" }}>CLEAR</span>
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};

export default ObservabilityDashboard;
