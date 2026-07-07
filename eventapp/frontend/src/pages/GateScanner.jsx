import { useState, useEffect } from "react";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";
import DashboardNav from "../components/DashboardNav";

const GateScanner = () => {
  const { user, login: authLogin, logout: authLogout } = useAuth();
  
  // Login form for scanners
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loggingIn, setLoggingIn] = useState(false);

  // App State
  const [events, setEvents] = useState([]);
  const [selectedEventId, setSelectedEventId] = useState("");
  const [gate, setGate] = useState("Gate 1");
  const [entryMode, setEntryMode] = useState("entry"); // entry, exit

  // Scan simulation states
  const [ticketInput, setTicketInput] = useState("");
  const [scanResult, setScanResult] = useState(null); // { status: 'success'|'duplicate'|'error', message: '', booking: {} }
  const [checking, setChecking] = useState(false);

  // Stats
  const [totalCapacity, setTotalCapacity] = useState(0);
  const [checkedInCount, setCheckedInCount] = useState(0);
  const [remainingCount, setRemainingCount] = useState(0);

  // Offline log queue
  const [offlineQueue, setOfflineQueue] = useState([]);
  const [scanHistory, setScanHistory] = useState([]);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const loadEvents = async () => {
    try {
      // Scanners get events list, organisers get their own
      if (user.role === "scanner") {
        const { data } = await api.get("/events");
        // Scanners can view all or the one assigned to them
        setEvents(data);
        if (user.scannerDetails?.assignedEvent) {
          setSelectedEventId(user.scannerDetails.assignedEvent);
        } else if (data.length > 0) {
          setSelectedEventId(data[0]._id);
        }
      } else {
        const { data } = await api.get("/events/mine/organiser");
        setEvents(data);
        if (data.length > 0) setSelectedEventId(data[0]._id);
      }
    } catch (err) {
      console.error("Failed to load scanner events", err);
    }
  };

  useEffect(() => {
    if (user && (user.role === "scanner" || user.role === "organiser" || user.role === "admin")) {
      loadEvents();
      if (user.scannerDetails?.assignedGate) {
        setGate(user.scannerDetails.assignedGate);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // Load live statistics of selected event
  useEffect(() => {
    if (selectedEventId) {
      api.get(`/events/${selectedEventId}`)
        .then(({ data }) => {
          setTotalCapacity(data.totalSeats || 100);
          // Let's fetch event bookings to compute checked-in stats
          return api.get(`/admin/bookings`);
        })
        .then(({ data }) => {
          const matchingBookings = data.filter(b => b.event?._id === selectedEventId && b.paymentStatus === "success");
          const checkedIn = matchingBookings.filter(b => b.checkedIn).reduce((sum, b) => sum + b.seats, 0);
          const totalSold = matchingBookings.reduce((sum, b) => sum + b.seats, 0);
          setCheckedInCount(checkedIn);
          setRemainingCount(totalSold - checkedIn);
        })
        .catch(() => {});
    }
  }, [selectedEventId, scanHistory]);

  const handleScannerLogin = async (e) => {
    e.preventDefault();
    setLoginError("");
    setLoggingIn(true);
    try {
      const { data } = await api.post("/auth/login", { username, password, role: "scanner" });
      authLogin(data.token, data.user);
    } catch (err) {
      setLoginError(err.response?.data?.message || "Invalid username or password");
    } finally {
      setLoggingIn(false);
    }
  };

  // Perform ticket verification
  const handleVerifyTicket = async (e) => {
    e.preventDefault();
    if (!ticketInput.trim()) return;
    setChecking(true);
    setScanResult(null);

    const ticketCode = ticketInput.trim().toUpperCase();

    // Offline simulation mode
    if (!isOnline) {
      const offlineLog = {
        ticketId: ticketCode,
        gate,
        entryType: entryMode,
        timestamp: new Date().toISOString()
      };
      setOfflineQueue([...offlineQueue, offlineLog]);
      setScanHistory([
        { ticketId: ticketCode, message: "✔️ Queued Offline for sync", status: "success", timestamp: new Date() },
        ...scanHistory
      ]);
      setScanResult({
        status: "success",
        message: "✔️ Offline ticket queued. Will sync when back online.",
        booking: { ticketId: ticketCode }
      });
      setTicketInput("");
      setChecking(false);
      return;
    }

    try {
      const { data } = await api.post("/api/business/scanner/check-in", {
        ticketId: ticketCode,
        gate,
        entryType: entryMode
      });

      setScanResult({
        status: "success",
        message: data.message,
        booking: data.booking
      });

      setScanHistory([
        { ticketId: ticketCode, message: data.message, status: "success", timestamp: new Date() },
        ...scanHistory
      ]);
      setTicketInput("");
    } catch (err) {
      const errMsg = err.response?.data?.message || "Invalid Ticket";
      const isDuplicate = errMsg.toLowerCase().includes("duplicate");

      setScanResult({
        status: isDuplicate ? "duplicate" : "error",
        message: errMsg
      });

      setScanHistory([
        { ticketId: ticketCode, message: errMsg, status: isDuplicate ? "duplicate" : "error", timestamp: new Date() },
        ...scanHistory
      ]);
    } finally {
      setChecking(false);
    }
  };

  // Sync offline queued checks
  const handleSyncOfflineQueue = async () => {
    if (offlineQueue.length === 0) return;
    let successCount = 0;
    for (const log of offlineQueue) {
      try {
        await api.post("/api/business/scanner/check-in", log);
        successCount++;
      } catch (err) {
        console.error("Failed to sync ticket", log.ticketId);
      }
    }
    alert(`Offline logs synced! ${successCount} out of ${offlineQueue.length} verified.`);
    setOfflineQueue([]);
  };

  // If scanner is not logged in, show beautiful login form
  if (!user || (user.role !== "scanner" && user.role !== "organiser" && user.role !== "admin")) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "85vh", padding: "16px" }}>
        <div className="card-panel" style={{ width: "100%", maxWidth: "420px" }}>
          <h2 style={{ color: "var(--pink)", margin: "0 0 8px 0", textAlign: "center" }}>EventHub</h2>
          <h3 style={{ margin: "0 0 20px 0", textAlign: "center", fontSize: "16px", color: "var(--text-dim)" }}>Gate Entry Mobile Scanner Login</h3>
          
          {loginError && <div className="alert alert-error" style={{ marginBottom: "16px" }}>{loginError}</div>}

          <form onSubmit={handleScannerLogin}>
            <div className="form-group" style={{ marginBottom: "12px" }}>
              <label>Username / Login Code</label>
              <input required value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Enter assigned username" />
            </div>
            <div className="form-group" style={{ marginBottom: "20px" }}>
              <label>Password</label>
              <input required type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••" />
            </div>
            <button type="submit" className="btn btn-primary btn-block" disabled={loggingIn}>
              {loggingIn ? "Logging in..." : "Access Scanner Portal"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div>
      <DashboardNav role={user.role} />
      <div className="dash-body" style={{ maxWidth: "600px", margin: "0 auto", padding: "16px" }}>
        
        {/* Scanner configuration bar */}
        <div className="card-panel" style={{ marginBottom: "16px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <h3 style={{ margin: 0, fontSize: "16px" }}>📟 {user.name}</h3>
              <div style={{ fontSize: "12px", color: "var(--text-dim)", marginTop: "2px" }}>Role: {user.role} | Gate: {gate}</div>
            </div>
            <button onClick={authLogout} className="btn btn-sm btn-outline" style={{ color: "var(--danger)", borderColor: "var(--danger)" }}>Logout</button>
          </div>

          <div className="form-row" style={{ display: "flex", gap: "10px", marginTop: "16px" }}>
            <div style={{ flex: 1.5 }}>
              <label style={{ fontSize: "11px", textTransform: "uppercase" }}>Active Event</label>
              <select value={selectedEventId} onChange={(e) => setSelectedEventId(e.target.value)} style={{ padding: "8px", fontSize: "13px" }}>
                <option value="">Select Event</option>
                {events.map((ev) => <option key={ev._id} value={ev._id}>{ev.title}</option>)}
              </select>
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: "11px", textTransform: "uppercase" }}>Gate Code</label>
              <input value={gate} onChange={(e) => setGate(e.target.value)} style={{ padding: "8px", fontSize: "13px" }} />
            </div>
          </div>
        </div>

        {/* Online / Offline status notification bar */}
        <div style={{
          background: isOnline ? "rgba(16,185,129,0.12)" : "rgba(239,68,68,0.12)",
          color: isOnline ? "#10b981" : "#ef4444",
          border: `1px solid ${isOnline ? "#10b981" : "#ef4444"}`,
          borderRadius: "8px",
          padding: "10px 16px",
          marginBottom: "16px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          fontSize: "13px"
        }}>
          <span>● Connection: {isOnline ? "ONLINE" : "OFFLINE WORK MODE"}</span>
          {!isOnline && offlineQueue.length > 0 && (
            <button onClick={handleSyncOfflineQueue} className="btn btn-sm" style={{ background: "#ef4444", color: "#fff", padding: "2px 8px" }}>Sync Queue ({offlineQueue.length})</button>
          )}
        </div>

        {/* Live Gauges stats */}
        <div className="stat-grid" style={{ gridTemplateColumns: "1fr 1fr 1fr", gap: "8px", marginBottom: "16px" }}>
          <div className="stat-card" style={{ padding: "10px" }}><div className="label" style={{ fontSize: "10px" }}>Capacity</div><div className="value" style={{ fontSize: "16px" }}>{totalCapacity}</div></div>
          <div className="stat-card" style={{ padding: "10px" }}><div className="label" style={{ fontSize: "10px" }}>Checked-In</div><div className="value" style={{ fontSize: "16px", color: "#10b981" }}>{checkedInCount}</div></div>
          <div className="stat-card" style={{ padding: "10px" }}><div className="label" style={{ fontSize: "10px" }}>Pending</div><div className="value" style={{ fontSize: "16px", color: "var(--pink)" }}>{remainingCount}</div></div>
        </div>

        {/* Entry / Exit Mode Selector toggle */}
        <div style={{ display: "flex", background: "var(--surface-2)", borderRadius: "8px", padding: "4px", marginBottom: "16px" }}>
          <button onClick={() => setEntryMode("entry")} style={{ flex: 1, padding: "8px", borderRadius: "6px", border: "none", background: entryMode === "entry" ? "var(--pink)" : "none", color: "#fff", fontWeight: "bold", fontSize: "13px", cursor: "pointer" }}>
            🟢 ENTRY SCAN
          </button>
          <button onClick={() => setEntryMode("exit")} style={{ flex: 1, padding: "8px", borderRadius: "6px", border: "none", background: entryMode === "exit" ? "#eab308" : "none", color: "#fff", fontWeight: "bold", fontSize: "13px", cursor: "pointer" }}>
            🟡 EXIT LOG
          </button>
        </div>

        {/* Scan Input Panel */}
        <div className="card-panel" style={{ textAlign: "center", padding: "24px 16px" }}>
          <h4 style={{ margin: "0 0 16px 0", fontSize: "15px" }}>Simulate QR Ticket Scan</h4>
          <form onSubmit={handleVerifyTicket}>
            <input 
              required
              value={ticketInput} 
              onChange={(e) => setTicketInput(e.target.value)} 
              placeholder="Type / Paste Ticket ID (e.g. TKT-LJQY...)" 
              style={{ padding: "12px", borderRadius: "8px", fontSize: "15px", border: "1px solid var(--border)", background: "var(--surface-2)", color: "#fff", textAlign: "center", marginBottom: "16px" }}
            />
            <button className="btn btn-primary btn-block" style={{ background: entryMode === "entry" ? "var(--pink)" : "#eab308" }} disabled={checking}>
              {checking ? "Checking code..." : `Simulate ${entryMode.toUpperCase()} Check`}
            </button>
          </form>
        </div>

        {/* Scan Results Display popup alerts */}
        {scanResult && (
          <div style={{
            background: scanResult.status === "success" ? "rgba(16,185,129,0.12)" : scanResult.status === "duplicate" ? "rgba(234,179,8,0.12)" : "rgba(239,68,68,0.12)",
            border: `1px solid ${scanResult.status === "success" ? "#10b981" : scanResult.status === "duplicate" ? "#eab308" : "#ef4444"}`,
            borderRadius: "8px",
            padding: "16px",
            marginBottom: "16px",
            textAlign: "center"
          }}>
            <h4 style={{ margin: "0 0 6px 0", color: scanResult.status === "success" ? "#10b981" : scanResult.status === "duplicate" ? "#eab308" : "#ef4444" }}>
              {scanResult.status === "success" ? "ACCESS GRANTED" : scanResult.status === "duplicate" ? "DUPLICATE TICKET WARNING" : "INVALID TICKET"}
            </h4>
            <p style={{ margin: 0, fontSize: "13px", lineHeight: "1.5" }}>{scanResult.message}</p>
            {scanResult.booking && (
              <div style={{ fontSize: "12px", color: "var(--text-dim)", marginTop: "8px" }}>
                Ticket ID: {scanResult.booking.ticketId} | Tier: {scanResult.booking.ticketTypeName || "Regular"}
              </div>
            )}
          </div>
        )}

        {/* Local Scan history logs */}
        <div className="card-panel">
          <h4 style={{ margin: "0 0 12px 0", fontSize: "14px" }}>Session Scan Logs ({scanHistory.length})</h4>
          {scanHistory.length === 0 ? (
            <div style={{ color: "var(--text-dim)", fontSize: "12px" }}>No tickets scanned in this session.</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "8px", maxHeight: "250px", overflowY: "auto" }}>
              {scanHistory.map((h, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--border)", paddingBottom: "6px", fontSize: "12px" }}>
                  <div>
                    <code style={{ color: "var(--pink)" }}>{h.ticketId}</code>
                    <div style={{ color: "var(--text-dim)", fontSize: "11px", marginTop: "2px" }}>{h.message}</div>
                  </div>
                  <span style={{ fontSize: "11px", color: "var(--text-dim)" }}>
                    {new Date(h.timestamp).toLocaleTimeString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default GateScanner;
