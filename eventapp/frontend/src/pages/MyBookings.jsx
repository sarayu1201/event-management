import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";
import EventCard from "../components/EventCard";

const MyBookings = () => {
  const navigate = useNavigate();
  const { user, setUser, logout } = useAuth();
  
  // Tab control
  const [activeTab, setActiveTab] = useState("bookings"); // bookings, favorites, support, settings

  // Data states
  const [bookings, setBookings] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [showInvoice, setShowInvoice] = useState(null);

  // Individual Tickets states
  const [attendeeTickets, setAttendeeTickets] = useState([]);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [showBadge, setShowBadge] = useState(null);
  const [showWallet, setShowWallet] = useState(null);
  const [showTransfer, setShowTransfer] = useState(null);

  // Secure Time-Rotating QR states
  const [rotatingTokens, setRotatingTokens] = useState({});

  // Transfer Form & OTP state
  const [transferForm, setTransferForm] = useState({ name: "", email: "", phone: "", reason: "" });
  const [transferStep, setTransferStep] = useState(1); // 1 = Details, 2 = Verify OTP
  const [transferOtp, setTransferOtp] = useState("");
  const [demoOtpSent, setDemoOtpSent] = useState("");

  // Support ticket states
  const [tickets, setTickets] = useState([]);
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [category, setCategory] = useState("general");
  const [activeTicket, setActiveTicket] = useState(null);
  const [ticketReply, setTicketReply] = useState("");

  // Settings states
  const [pushPref, setPushPref] = useState(true);
  const [smsPref, setSmsPref] = useState(true);
  const [langPref, setLangPref] = useState("en");

  // Load user data & settings
  const loadUserData = async () => {
    try {
      const bookRes = await api.get("/bookings/mine");
      setBookings(bookRes.data);

      const favRes = await api.get("/enterprise/favorites");
      setFavorites(favRes.data);

      const ticketRes = await api.get("/enterprise/support/tickets");
      setTickets(ticketRes.data);
    } catch (err) {
      console.error("Dashboard load error", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }
    
    // Set preferences states
    if (user.notificationPreferences) {
      setPushPref(user.notificationPreferences.push);
      setSmsPref(user.notificationPreferences.sms);
    }
    if (user.language) {
      setLangPref(user.language);
    }

    loadUserData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, navigate]);

  // Secure Rotating QR tokens fetcher loops
  useEffect(() => {
    if (attendeeTickets.length === 0) return;

    const fetchRotatingTokens = async () => {
      const tokensCopy = { ...rotatingTokens };
      for (const t of attendeeTickets) {
        try {
          const { data } = await api.get(`/api/enterprise-ticketing/tickets/${t.ticketId}/secure-qr`);
          tokensCopy[t.ticketId] = data.secureToken;
        } catch (err) {
          console.error("Rotate token error", err);
        }
      }
      setRotatingTokens(tokensCopy);
    };

    fetchRotatingTokens();
    const interval = setInterval(fetchRotatingTokens, 15000); // refresh tokens every 15 seconds

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attendeeTickets]);

  // Load attendee tickets when a booking is selected
  const handleSelectBooking = async (booking) => {
    setSelectedBooking(booking);
    setAttendeeTickets([]);
    try {
      const { data } = await api.get(`/api/ticketing/bookings/${booking._id}/tickets`);
      setAttendeeTickets(data);
    } catch (err) {
      console.error(err);
    }
  };

  // Support ticket actions
  const handleSubmitTicket = async (e) => {
    e.preventDefault();
    if (!subject.trim() || !message.trim()) return;
    try {
      const { data } = await api.post("/enterprise/support/tickets", { subject, message, category });
      setTickets([data.ticket, ...tickets]);
      setSubject("");
      setMessage("");
      alert("Support ticket created successfully!");
    } catch (err) {
      alert("Failed to submit support ticket.");
    }
  };

  const handleReplyTicket = async (e) => {
    e.preventDefault();
    if (!ticketReply.trim() || !activeTicket) return;
    try {
      const { data } = await api.post(`/enterprise/support/tickets/${activeTicket._id}/reply`, {
        message: ticketReply
      });
      setTickets(prev => prev.map(t => t._id === activeTicket._id ? data.ticket : t));
      setActiveTicket(data.ticket);
      setTicketReply("");
    } catch (err) {
      alert("Failed to reply to ticket.");
    }
  };

  // Refund request action
  const handleRequestRefund = async (bookingId) => {
    if (!window.confirm("Submit refund request? Ticket slots will be cancelled and audited by admin.")) return;
    try {
      await api.post(`/enterprise/bookings/${bookingId}/refund`);
      alert("Refund request submitted successfully!");
      loadUserData();
      setSelectedBooking(null);
    } catch (err) {
      alert(err.response?.data?.message || "Refund request failed");
    }
  };

  // Profile preferences settings save
  const handleUpdatePreferences = async (e) => {
    e.preventDefault();
    try {
      const { data } = await api.put("/auth/profile", {
        notificationPreferences: { push: pushPref, sms: smsPref },
        language: langPref
      });
      setUser(data.user);
      alert("Preferences saved successfully!");
    } catch (err) {
      alert("Failed to save settings.");
    }
  };

  // Deactivate account
  const handleDeactivate = async () => {
    if (!window.confirm("WARNING: Are you sure you want to deactivate your account? This is irreversible.")) return;
    try {
      await api.put("/auth/deactivate");
      logout();
      navigate("/");
    } catch (err) {
      alert("Deactivation failed.");
    }
  };

  // Transfer Ticket step 1: Initiate & get OTP
  const handleTransferTicketInitiate = async (e) => {
    e.preventDefault();
    try {
      const { data } = await api.post(`/api/enterprise-ticketing/tickets/${selectedTicket.ticketId}/transfer/initiate`);
      setDemoOtpSent(data.otp);
      setTransferStep(2);
    } catch (err) {
      alert(err.response?.data?.message || "Failed to initiate transfer");
    }
  };

  // Transfer Ticket step 2: Confirm OTP & verify
  const handleTransferTicketConfirm = async (e) => {
    e.preventDefault();
    try {
      await api.post(`/api/enterprise-ticketing/tickets/${selectedTicket.ticketId}/transfer/confirm`, {
        otp: transferOtp,
        attendeeName: transferForm.name,
        attendeeEmail: transferForm.email,
        attendeePhone: transferForm.phone,
        reason: transferForm.reason
      });
      alert("Ticket transferred successfully! The pass code has been re-issued.");
      setShowTransfer(false);
      setTransferStep(1);
      setTransferOtp("");
      setDemoOtpSent("");
      setTransferForm({ name: "", email: "", phone: "", reason: "" });
      handleSelectBooking(selectedBooking);
    } catch (err) {
      alert(err.response?.data?.message || "Failed to confirm transfer");
    }
  };

  if (!user) return null;

  return (
    <div className="section" style={{ maxWidth: 1200 }}>
      <div style={{ display: "grid", gridTemplateColumns: "250px 1fr", gap: "30px" }}>
        
        {/* LEFT NAV PANEL */}
        <div className="card-panel" style={{ height: "fit-content" }}>
          <div style={{ textAlign: "center", marginBottom: "20px" }}>
            <div style={{ width: "80px", height: "80px", borderRadius: "50%", background: "var(--border)", margin: "0 auto 12px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "32px", fontWeight: "bold" }}>
              {user.name.charAt(0)}
            </div>
            <h3 style={{ margin: 0, fontSize: "16px" }}>{user.name}</h3>
            <div style={{ fontSize: "12px", color: "var(--text-dim)", marginTop: "2px" }}>{user.phone}</div>
          </div>
          
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            <button onClick={() => setActiveTab("bookings")} style={{ display: "flex", alignItems: "center", gap: "8px", background: activeTab === "bookings" ? "var(--pink)" : "none", border: "none", color: "#fff", width: "100%", textAlign: "left", padding: "10px 16px", borderRadius: "8px", cursor: "pointer", fontWeight: "bold" }}>🎟️ My Tickets</button>
            <button onClick={() => setActiveTab("favorites")} style={{ display: "flex", alignItems: "center", gap: "8px", background: activeTab === "favorites" ? "var(--pink)" : "none", border: "none", color: "#fff", width: "100%", textAlign: "left", padding: "10px 16px", borderRadius: "8px", cursor: "pointer", fontWeight: "bold" }}>❤️ Favorited Events</button>
            <button onClick={() => setActiveTab("support")} style={{ display: "flex", alignItems: "center", gap: "8px", background: activeTab === "support" ? "var(--pink)" : "none", border: "none", color: "#fff", width: "100%", textAlign: "left", padding: "10px 16px", borderRadius: "8px", cursor: "pointer", fontWeight: "bold" }}>💬 Support Help</button>
            <button onClick={() => setActiveTab("settings")} style={{ display: "flex", alignItems: "center", gap: "8px", background: activeTab === "settings" ? "var(--pink)" : "none", border: "none", color: "#fff", width: "100%", textAlign: "left", padding: "10px 16px", borderRadius: "8px", cursor: "pointer", fontWeight: "bold" }}>⚙️ settings</button>
            {user.role === "organiser" && <Link to="/organiser/dashboard" style={{ display: "flex", alignItems: "center", gap: "8px", border: "none", color: "#fff", width: "100%", padding: "10px 16px", borderRadius: "8px", fontWeight: "bold" }}>💼 Organiser Dashboard</Link>}
            {user.role === "admin" && <Link to="/admin/dashboard" style={{ display: "flex", alignItems: "center", gap: "8px", border: "none", color: "#fff", width: "100%", padding: "10px 16px", borderRadius: "8px", fontWeight: "bold" }}>👑 Admin Panel</Link>}
          </div>
        </div>

        {/* RIGHT CONTENT PANEL */}
        <div>
          {loading && <div className="loading-wrap">Loading dashboard info...</div>}

          {!loading && (
            <div>
              {/* BOOKINGS TAB */}
              {activeTab === "bookings" && (
                <div>
                  <h2 style={{ marginTop: 0, marginBottom: "20px" }}>Your Booked Passes</h2>
                  {bookings.length === 0 ? (
                    <div className="empty-state">You haven't booked any tickets yet. <Link to="/">Browse Events</Link></div>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                      {bookings.map((b) => (
                        <div key={b._id} className="card-panel" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px" }}>
                          <div>
                            <h3 style={{ margin: "0 0 6px 0", fontSize: "16px", color: "var(--pink)" }}>{b.event?.title}</h3>
                            <div style={{ fontSize: "12px", color: "var(--text-dim)" }}>
                              📅 {new Date(b.event?.date).toDateString()} | 📍 {b.event?.venue}
                            </div>
                            <div style={{ fontSize: "13px", marginTop: "8px" }}>
                              Tier: <strong>{b.ticketTypeName}</strong> | Quantity: <strong>{b.seats} Pass(es)</strong>
                            </div>
                          </div>
                          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                            <button onClick={() => handleSelectBooking(b)} className="btn btn-sm btn-primary">Expand Passes</button>
                            <button onClick={() => setShowInvoice(b)} className="btn btn-sm btn-outline">Invoice</button>
                            {b.bookingStatus !== "cancelled" && (
                              <button onClick={() => handleRequestRefund(b._id)} className="btn btn-sm btn-outline" style={{ color: "var(--danger)", borderColor: "var(--danger)" }}>Refund</button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* FAVORITES TAB */}
              {activeTab === "favorites" && (
                <div>
                  <h2 style={{ marginTop: 0, marginBottom: "20px" }}>Favorited Events</h2>
                  {favorites.length === 0 ? (
                    <div className="empty-state">No favorited events. Click the heart icon on event details to bookmark them!</div>
                  ) : (
                    <div className="event-grid">
                      {favorites.map((e) => <EventCard key={e._id} event={e} />)}
                    </div>
                  )}
                </div>
              )}

              {/* SUPPORT TAB */}
              {activeTab === "support" && (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
                  <div className="card-panel">
                    <h3>Submit Support Ticket</h3>
                    <form onSubmit={handleSubmitTicket}>
                      <div className="form-group"><label>Category</label>
                        <select value={category} onChange={(e) => setCategory(e.target.value)}>
                          <option value="general">General Support</option>
                          <option value="billing">Billing & Refund</option>
                          <option value="technical">Technical Glitch</option>
                        </select>
                      </div>
                      <div className="form-group"><label>Subject</label><input required value={subject} onChange={(e) => setSubject(e.target.value)} /></div>
                      <div className="form-group"><label>Message details</label><textarea required value={message} onChange={(e) => setMessage(e.target.value)} rows="3" /></div>
                      <button className="btn btn-primary btn-block btn-sm">Create Support Request</button>
                    </form>
                  </div>
                  <div className="card-panel">
                    <h3>Your Ticket Threads</h3>
                    {tickets.length === 0 ? (
                      <div style={{ color: "var(--text-dim)" }}>No active support requests.</div>
                    ) : (
                      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                        {tickets.map(t => (
                          <div key={t._id} onClick={() => setActiveTicket(t)} style={{ padding: "10px", borderRadius: "6px", background: "var(--surface-2)", cursor: "pointer", border: activeTicket?._id === t._id ? "1px solid var(--pink)" : "none" }}>
                            <strong>{t.subject}</strong> <span style={{ fontSize: "11px", background: "var(--border)", padding: "2px 6px", borderRadius: "10px", float: "right" }}>{t.status}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* SETTINGS TAB */}
              {activeTab === "settings" && (
                <div style={{ maxWidth: "500px" }}>
                  <div className="card-panel">
                    <h3>Profile settings preferences</h3>
                    <form onSubmit={handleUpdatePreferences}>
                      <div className="form-group" style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                        <input type="checkbox" id="pushNotif" checked={pushPref} onChange={(e) => setPushPref(e.target.checked)} />
                        <label htmlFor="pushNotif" style={{ margin: 0, cursor: "pointer" }}>Receive Push Notifications</label>
                      </div>
                      <div className="form-group" style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                        <input type="checkbox" id="smsNotif" checked={smsPref} onChange={(e) => setSmsPref(e.target.checked)} />
                        <label htmlFor="smsNotif" style={{ margin: 0, cursor: "pointer" }}>Receive SMS Updates</label>
                      </div>
                      <div className="form-group"><label>Interface Language</label>
                        <select value={langPref} onChange={(e) => setLangPref(e.target.value)}>
                          <option value="en">English</option>
                          <option value="hi">Hindi</option>
                        </select>
                      </div>
                      <button className="btn btn-primary btn-sm">Save Preferences</button>
                    </form>

                    <div style={{ marginTop: "32px", borderTop: "1px dashed var(--border)", paddingTop: "16px" }}>
                      <button onClick={handleDeactivate} className="btn btn-outline" style={{ color: "var(--danger)", borderColor: "var(--danger)" }}>Deactivate Account</button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

      </div>

      {/* INDIVIDUAL TICKETS LIST MODAL PANEL */}
      {selectedBooking && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.85)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: 16 }}>
          <div className="card-panel" style={{ width: "100%", maxWidth: 650, position: "relative", maxHeight: "90vh", overflowY: "auto" }}>
            <button onClick={() => setSelectedBooking(null)} style={{ position: "absolute", top: 16, right: 16, background: "none", border: "none", color: "var(--text-dim)", fontSize: 20, cursor: "pointer" }}>×</button>
            <h3 style={{ marginTop: 0, color: "var(--pink)" }}>🎟️ Scannable Passes list</h3>
            <p style={{ fontSize: "13px", color: "var(--text-dim)", marginBottom: "16px" }}>Each pass features secure time-rotating QR codes to prevent screenshot duplication.</p>

            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {attendeeTickets.map((t, idx) => (
                <div key={t._id} className="card-panel" style={{ background: "var(--surface-2)", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px", border: "1px solid var(--border)" }}>
                  <div>
                    <h4 style={{ margin: 0, fontSize: "14px" }}>Pass #{idx + 1}: {t.attendeeName}</h4>
                    <code style={{ fontSize: "11px", color: "var(--text-dim)" }}>Ticket ID: {t.ticketId}</code>
                    
                    {/* Rotating QR display status */}
                    <div style={{ color: "var(--purple)", fontSize: "12px", fontWeight: "bold", marginTop: "4px" }}>
                      🛡️ Secure Token: {rotatingTokens[t.ticketId] || "Loading Rotating Key..."}
                    </div>

                    {t.assignedSeat && <div style={{ fontSize: "12px", marginTop: "4px" }}>Seat: <strong>{t.assignedSeat}</strong></div>}
                    <div style={{ fontSize: "11px", background: "var(--border)", display: "inline-block", padding: "2px 6px", borderRadius: "4px", marginTop: "6px", textTransform: "uppercase" }}>{t.status}</div>
                  </div>

                  <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                    <button onClick={() => setShowBadge(t)} className="btn btn-sm btn-outline">Conference Badge</button>
                    <button onClick={() => setShowWallet(t)} className="btn btn-sm btn-outline">Wallet Pass</button>
                    {t.status !== "checked-in" && (
                      <button onClick={() => { setSelectedTicket(t); setShowTransfer(true); setTransferStep(1); }} className="btn btn-sm btn-outline">Transfer Pass</button>
                    )}
                    <button onClick={() => window.print()} className="btn btn-sm btn-primary">Print PDF</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* CONFERENCE BADGE GENERATOR MODAL */}
      {showBadge && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.85)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 101, padding: 16 }}>
          <div className="card-panel" style={{ width: "100%", maxWidth: 380, position: "relative", textAlign: "center", padding: "32px 24px", border: "4px solid #1e3c72" }}>
            <button onClick={() => setShowBadge(null)} style={{ position: "absolute", top: 16, right: 16, background: "none", border: "none", color: "var(--text-dim)", fontSize: 20, cursor: "pointer" }}>×</button>
            
            <div style={{ background: "#1e3c72", color: "#fff", padding: "10px", fontWeight: "bold", fontSize: "14px", textTransform: "uppercase", letterSpacing: "1px", borderRadius: "4px", marginBottom: "20px" }}>
              CONFERENCE SPEAKER PASS
            </div>

            <div style={{ width: "100px", height: "100px", borderRadius: "50%", background: "var(--border)", margin: "0 auto 16px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "36px", fontWeight: "bold" }}>
              {showBadge.attendeeName.charAt(0)}
            </div>

            <h3 style={{ margin: "0 0 6px 0", fontSize: "20px" }}>{showBadge.attendeeName}</h3>
            <div style={{ fontSize: "13px", color: "var(--text-dim)" }}>Lead Presenter</div>
            <div style={{ fontSize: "13px", fontWeight: "bold", color: "var(--pink)", marginTop: "2px" }}>Aashvee Tech Solutions</div>

            <div style={{ background: "#fff", padding: "12px", display: "inline-block", borderRadius: "6px", marginTop: "24px" }}>
              {/* Render Rotating Secure Token in Badge QR Code */}
              <div style={{ width: "100px", height: "100px", background: "#000" }}></div>
            </div>

            <div style={{ fontSize: "10px", color: "var(--text-dim)", marginTop: "16px" }}>Secure QR: {rotatingTokens[showBadge.ticketId] || "Loading..."}</div>
            
            <button onClick={() => window.print()} className="btn btn-sm btn-primary" style={{ marginTop: "20px" }}>Print Badge</button>
          </div>
        </div>
      )}

      {/* APPLE / GOOGLE WALLET PASS SIMULATOR */}
      {showWallet && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.85)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 101, padding: 16 }}>
          <div className="card-panel" style={{ width: "100%", maxWidth: 350, position: "relative", background: "#000", color: "#fff", borderRadius: "16px", padding: "20px", border: "1px solid var(--border)" }}>
            <button onClick={() => setShowWallet(null)} style={{ position: "absolute", top: 16, right: 16, background: "none", border: "none", color: "#fff", fontSize: 20, cursor: "pointer" }}>×</button>
            
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: "14px", fontWeight: "bold", color: "var(--pink)" }}>EventHub Pass</span>
              <span style={{ fontSize: "11px", color: "var(--text-dim)" }}>Google Wallet</span>
            </div>

            <h3 style={{ margin: "16px 0 4px 0", fontSize: "18px" }}>{selectedBooking?.event?.title}</h3>
            <div style={{ fontSize: "12px", color: "var(--text-dim)" }}>📅 {new Date(selectedBooking?.event?.date).toDateString()}</div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginTop: "20px", borderTop: "1px solid var(--border)", paddingTop: "12px" }}>
              <div><div style={{ fontSize: "10px", color: "var(--text-dim)" }}>ATTENDEE</div><div style={{ fontSize: "13px", fontWeight: "bold" }}>{showWallet.attendeeName}</div></div>
              <div>
                <div style={{ fontSize: "10px", color: "var(--text-dim)" }}>SEAT</div>
                <div style={{ fontSize: "13px", fontWeight: "bold" }}>{showWallet.assignedSeat || "GA-ROW 1"}</div>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginTop: "12px" }}>
              <div><div style={{ fontSize: "10px", color: "var(--text-dim)" }}>GATE</div><div style={{ fontSize: "13px", fontWeight: "bold" }}>GATE 2</div></div>
              <div><div style={{ fontSize: "10px", color: "var(--text-dim)" }}>TIER</div><div style={{ fontSize: "13px", fontWeight: "bold" }}>{showWallet.ticketTypeName}</div></div>
            </div>

            <div style={{ textAlign: "center", marginTop: "24px", background: "#fff", padding: "16px", borderRadius: "10px" }}>
              <div style={{ height: "40px", background: "#000", marginBottom: "8px" }}></div>
              <div style={{ fontSize: "11px", color: "#000", fontFamily: "monospace" }}>{rotatingTokens[showWallet.ticketId] || "Loading..."}</div>
            </div>
          </div>
        </div>
      )}

      {/* TRANSFER TICKET MODAL (WITH OTP STEP) */}
      {showTransfer && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.85)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 101, padding: 16 }}>
          <div className="card-panel" style={{ width: "100%", maxWidth: 450, position: "relative" }}>
            <button onClick={() => setShowTransfer(false)} style={{ position: "absolute", top: 16, right: 16, background: "none", border: "none", color: "var(--text-dim)", fontSize: 20, cursor: "pointer" }}>×</button>
            <h3 style={{ marginTop: 0 }}>Transfer ticket pass</h3>

            {transferStep === 1 ? (
              <div>
                <p style={{ fontSize: "13px", color: "var(--text-dim)", marginBottom: "16px" }}>Provide the contact details of the recipient user. An OTP authorization check will be triggered.</p>
                <form onSubmit={handleTransferTicketInitiate}>
                  <div className="form-group"><label>Recipient Name</label><input required value={transferForm.name} onChange={(e) => setTransferForm({ ...transferForm, name: e.target.value })} /></div>
                  <div className="form-group"><label>Recipient Email</label><input type="email" required value={transferForm.email} onChange={(e) => setTransferForm({ ...transferForm, email: e.target.value })} /></div>
                  <div className="form-group"><label>Recipient Phone</label><input required value={transferForm.phone} onChange={(e) => setTransferForm({ ...transferForm, phone: e.target.value })} /></div>
                  <div className="form-group"><label>Reason (optional)</label><input value={transferForm.reason} onChange={(e) => setTransferForm({ ...transferForm, reason: e.target.value })} /></div>
                  <button type="submit" className="btn btn-primary btn-block" style={{ marginTop: "16px" }}>Initiate Transfer & Get OTP</button>
                </form>
              </div>
            ) : (
              <div>
                <p style={{ fontSize: "13px", color: "var(--text-dim)", marginBottom: "16px" }}>Enter the 6-digit verification code sent to your phone. (Demo code: <strong>{demoOtpSent}</strong>)</p>
                <form onSubmit={handleTransferTicketConfirm}>
                  <div className="form-group">
                    <label>Verification OTP Code</label>
                    <input required value={transferOtp} onChange={(e) => setTransferOtp(e.target.value)} placeholder="e.g. 888888" style={{ textAlign: "center", fontSize: "18px", letterSpacing: "4px" }} />
                  </div>
                  <button type="submit" className="btn btn-primary btn-block" style={{ marginTop: "16px" }}>Confirm OTP & complete transfer</button>
                </form>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAX BILLING INVOICE MODAL */}
      {showInvoice && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.85)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: 16 }}>
          <div className="card-panel" style={{ width: "100%", maxWidth: 600, position: "relative", maxHeight: "90vh", overflowY: "auto" }}>
            <button onClick={() => setShowInvoice(null)} style={{ position: "absolute", top: 16, right: 16, background: "none", border: "none", color: "var(--text-dim)", fontSize: 20, cursor: "pointer" }}>×</button>
            
            <div style={{ textAlign: "center", borderBottom: "1px solid var(--border)", paddingBottom: "16px", marginBottom: "16px" }}>
              <h2 style={{ margin: 0, color: "var(--pink)" }}>TAX INVOICE</h2>
              <div style={{ fontSize: "12px", color: "var(--text-dim)", marginTop: "4px" }}>HSN/SAC: 9996 | Invoice Ref: {showInvoice.ticketId}</div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", fontSize: "13px", marginBottom: "20px" }}>
              <div>
                <strong>Billed By (Organizer):</strong>
                <div style={{ color: "var(--text-dim)", marginTop: "4px" }}>EventHub Promoter Host Pvt Ltd</div>
                <div style={{ color: "var(--text-dim)" }}>GSTIN: 36AAAAA1111A1Z1</div>
              </div>
              <div>
                <strong>Billed To (Buyer):</strong>
                <div style={{ color: "var(--text-dim)", marginTop: "4px" }}>{user.name}</div>
                <div style={{ color: "var(--text-dim)" }}>Phone: {user.phone}</div>
              </div>
            </div>

            <div className="table-wrap">
              <table>
                <thead><tr><th>Ticket Details</th><th>Seats</th><th>Unit Price</th><th>Tax rate</th><th>Gross Amount</th></tr></thead>
                <tbody>
                  <tr>
                    <td><strong>{showInvoice.event?.title}</strong> ({showInvoice.ticketTypeName})</td>
                    <td>{showInvoice.seats}</td>
                    <td>₹{showInvoice.unitPrice}</td>
                    <td>{showInvoice.gstRate || 0}%</td>
                    <td>₹{showInvoice.totalAmount}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "16px" }}>
              <div style={{ width: "220px", fontSize: "13px" }}>
                <div className="price-line"><span>Net Value</span><span>₹{(showInvoice.totalAmount - (showInvoice.cgst + showInvoice.sgst)).toFixed(2)}</span></div>
                <div className="price-line"><span>CGST</span><span>₹{showInvoice.cgst || 0}</span></div>
                <div className="price-line"><span>SGST</span><span>₹{showInvoice.sgst || 0}</span></div>
                <div className="price-total" style={{ borderTop: "1px solid var(--border)", paddingTop: "8px", marginTop: "8px" }}>
                  <span>Gross Total</span>
                  <span>₹{showInvoice.totalAmount}</span>
                </div>
              </div>
            </div>

            <div style={{ display: "flex", gap: "10px", marginTop: "24px" }}>
              <button onClick={() => window.print()} className="btn btn-primary btn-sm">Print Invoice Receipt</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default MyBookings;
