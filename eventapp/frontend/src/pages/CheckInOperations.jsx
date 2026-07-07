import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import api from "../api/axios";
import DashboardNav from "../components/DashboardNav";

const CheckInOperations = () => {
  const { id } = useParams(); // event ID
  const [event, setEvent] = useState(null);
  const [stats, setStats] = useState({
    totalBooked: 0,
    checkedIn: 0,
    pending: 0,
    attendancePercent: 0,
    gateStats: {},
    hourlyStats: Array(24).fill(0)
  });

  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  // Poll server to simulate real-time WebSocket connection updates
  const fetchLiveFeed = async () => {
    try {
      const [statsRes, logsRes, eventRes] = await Promise.all([
        api.get(`/api/ticketing/events/${id}/checkin-dashboard`),
        api.get(`/api/business/scanners`), // gets scanners and active logins
        api.get(`/events/${id}`)
      ]);
      setStats(statsRes.data);
      setLogs(logsRes.data || []);
      setEvent(eventRes.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchLiveFeed().then(() => setLoading(false));

    const interval = setInterval(() => {
      fetchLiveFeed();
    }, 5000); // refresh every 5 seconds

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (loading) return <div className="loading-wrap">Connecting to Operations Feed...</div>;
  if (!event) return <div className="section empty-state">Event not found</div>;

  return (
    <div>
      <DashboardNav role="organiser" />
      <div className="dash-body" style={{ maxWidth: 1200, margin: "0 auto", padding: "20px" }}>
        
        {/* Title and Socket status bar */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
          <div>
            <h2 className="section-title" style={{ margin: 0 }}>🚨 Real-Time Event Operations</h2>
            <div style={{ fontSize: "13px", color: "var(--text-dim)", marginTop: "2px" }}>Control Room: {event.title}</div>
          </div>
          <div style={{ background: "rgba(16,185,129,0.12)", color: "#10b981", border: "1px solid #10b981", borderRadius: "20px", padding: "4px 16px", fontSize: "12px", fontWeight: "bold" }}>
            🟢 WEBSOCKET STREAM ACTIVE
          </div>
        </div>

        {/* Real-time stats widgets */}
        <div className="stat-grid" style={{ gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: "16px" }}>
          <div className="stat-card" style={{ borderLeft: "4px solid var(--purple)" }}><div className="label">Live Attendance</div><div className="value">{stats.checkedIn}</div></div>
          <div className="stat-card" style={{ borderLeft: "4px solid var(--pink)" }}><div className="label">Pending Access</div><div className="value">{stats.pending}</div></div>
          <div className="stat-card" style={{ borderLeft: "4px solid #10b981" }}><div className="label">Attendance %</div><div className="value">{stats.attendancePercent}%</div></div>
          <div className="stat-card" style={{ borderLeft: "4px solid #f59e0b" }}><div className="label">Active Scanners</div><div className="value">{logs.filter(l => l.scannerDetails?.lastLogin).length}</div></div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px", marginTop: "28px" }}>
          
          {/* Gate wise metrics */}
          <div className="card-panel">
            <h3>🚪 Entry Gate Statistics</h3>
            {Object.keys(stats.gateStats || {}).length === 0 ? (
              <div style={{ color: "var(--text-dim)", padding: "20px 0" }}>No check-in entries logged yet.</div>
            ) : (
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr><th>Gate Code</th><th>Capacity Checked-In</th><th>Performance</th></tr>
                  </thead>
                  <tbody>
                    {Object.entries(stats.gateStats).map(([gate, count]) => (
                      <tr key={gate}>
                        <td><strong>{gate}</strong></td>
                        <td>{count} attendees</td>
                        <td>
                          <div style={{ width: "100%", background: "var(--border)", height: "8px", borderRadius: "4px", overflow: "hidden" }}>
                            <div style={{ width: `${Math.min(100, (count / (stats.totalBooked || 1)) * 100)}%`, background: "var(--pink)", height: "100%" }}></div>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Active scanners logs list */}
          <div className="card-panel">
            <h3>📱 Active Device Logs</h3>
            {logs.length === 0 ? (
              <div style={{ color: "var(--text-dim)", padding: "20px 0" }}>No scanner devices registered.</div>
            ) : (
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr><th>Device / Username</th><th>Assigned Gate</th><th>Last Active Sync</th></tr>
                  </thead>
                  <tbody>
                    {logs.map(l => (
                      <tr key={l._id}>
                        <td><strong>{l.name}</strong> (<code>{l.username}</code>)</td>
                        <td>{l.scannerDetails?.assignedGate || "Gate 1"}</td>
                        <td>{l.scannerDetails?.lastLogin ? new Date(l.scannerDetails.lastLogin).toLocaleTimeString() : "Offline"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </div>

        {/* Hourly Entries Visual Graph */}
        <div className="card-panel" style={{ marginTop: "24px" }}>
          <h3>⏱️ Hourly Attendance Peak Times</h3>
          <div style={{ display: "flex", alignItems: "flex-end", gap: "6px", height: "160px", padding: "10px 0", borderBottom: "2px solid var(--border)", marginTop: "16px" }}>
            {stats.hourlyStats.map((count, hour) => {
              const maxVal = Math.max(...stats.hourlyStats, 1);
              const heightPercent = (count / maxVal) * 100;
              return (
                <div key={hour} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center" }}>
                  <div style={{ width: "100%", height: `${heightPercent}%`, background: count > 0 ? "var(--purple)" : "var(--border)", borderRadius: "3px" }}></div>
                  <div style={{ fontSize: "9px", color: "var(--text-dim)", marginTop: "4px" }}>{hour}:00</div>
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
};

export default CheckInOperations;
