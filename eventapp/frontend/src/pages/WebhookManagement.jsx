import { useState, useEffect } from "react";
import api from "../api/axios";
import DashboardNav from "../components/DashboardNav";

const WebhookManagement = () => {
  const [endpoints, setEndpoints] = useState([]);
  const [logs, setLogs] = useState([]);
  const [url, setUrl] = useState("");
  const [events, setEvents] = useState(["booking.created", "payment.success"]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      const [epRes, logsRes] = await Promise.all([
        api.get("/api/production/webhooks"),
        api.get("/api/production/webhooks/logs")
      ]);
      setEndpoints(epRes.data || []);
      setLogs(logsRes.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!url) return;
    try {
      await api.post("/api/production/webhooks", { url, events });
      setUrl("");
      alert("Webhook URL registered successfully!");
      loadData();
    } catch (err) {
      alert("Registration failed");
    }
  };

  const handleTest = async (id) => {
    try {
      await api.post(`/api/production/webhooks/${id}/test`);
      alert("Test payload dispatched successfully!");
      loadData();
    } catch (err) {
      alert("Test failed");
    }
  };

  if (loading) return <div className="loading-wrap">Connecting to Webhook dashboard...</div>;

  return (
    <div>
      <DashboardNav role="organiser" />
      <div className="dash-body" style={{ maxWidth: 1000, margin: "0 auto", padding: "20px" }}>
        
        <h2 className="section-title">🔌 Webhook Subscriptions</h2>
        <p style={{ color: "var(--text-dim)", fontSize: "14px", marginBottom: "24px" }}>
          Subscribe to event notifications to sync ticket bookings with your external software servers.
        </p>

        <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: "24px" }}>
          
          {/* Register Form & Active webhooks list */}
          <div>
            <div className="card-panel">
              <h3>Register Webhook Endpoint</h3>
              <form onSubmit={handleRegister} style={{ marginTop: "12px" }}>
                <div className="form-group">
                  <label>Destination URL</label>
                  <input required value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://api.yourdomain.com/webhooks" />
                </div>
                <div className="form-group">
                  <label>Event Triggers (comma separated)</label>
                  <input value={events.join(",")} onChange={(e) => setEvents(e.target.value.split(","))} placeholder="booking.created, payment.success" />
                </div>
                <button className="btn btn-primary btn-sm btn-block">Add Endpoint</button>
              </form>
            </div>

            <div className="card-panel" style={{ marginTop: "20px" }}>
              <h3>Active Subscriptions</h3>
              {endpoints.length === 0 ? (
                <div style={{ color: "var(--text-dim)", fontSize: "13px" }}>No webhooks registered.</div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginTop: "12px" }}>
                  {endpoints.map((ep) => (
                    <div key={ep._id} style={{ background: "var(--surface-2)", padding: "12px", borderRadius: "8px", border: "1px solid var(--border)" }}>
                      <div style={{ wordBreak: "break-all", fontWeight: "bold" }}>{ep.url}</div>
                      <div style={{ fontSize: "11px", color: "var(--text-dim)", marginTop: "4px" }}>Secret: <code>{ep.secret}</code></div>
                      <div style={{ fontSize: "11px", color: "var(--pink)", marginTop: "4px" }}>Events: {ep.events.join(", ")}</div>
                      <button onClick={() => handleTest(ep._id)} className="btn btn-xs btn-outline" style={{ marginTop: "10px" }}>⚙️ Dispatch Test</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Webhook logs history list */}
          <div className="card-panel">
            <h3>Dispatched Attempts History</h3>
            {logs.length === 0 ? (
              <div style={{ color: "var(--text-dim)", fontSize: "13px", marginTop: "12px" }}>No attempts recorded.</div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "12px" }}>
                {logs.map((log) => (
                  <div key={log._id} style={{ padding: "10px", borderRadius: "6px", background: "var(--surface-2)", borderLeft: `4px solid ${log.status === "success" ? "#10b981" : "#ef4444"}` }}>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <strong>{log.eventType}</strong>
                      <span style={{ fontSize: "11px", fontWeight: "bold" }}>HTTP {log.statusCode}</span>
                    </div>
                    <div style={{ fontSize: "11px", color: "var(--text-dim)", marginTop: "4px" }}>Response: {log.responseBody}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  );
};

export default WebhookManagement;
