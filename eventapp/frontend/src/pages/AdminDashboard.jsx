import { useEffect, useState } from "react";
import api from "../api/axios";
import DashboardNav from "../components/DashboardNav";

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState("stats"); // stats, users, events, bookings
  const [users, setUsers] = useState([]);
  const [events, setEvents] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Promoter Modal State
  const [showPromoterModal, setShowPromoterModal] = useState(false);
  const [pName, setPName] = useState("");
  const [pEmail, setPEmail] = useState("");
  const [pPassword, setPPassword] = useState("");
  const [pPhone, setPPhone] = useState("");
  const [pPromoCode, setPPromoCode] = useState("");
  const [pCommission, setPCommission] = useState(10);
  const [modalSubmitting, setModalSubmitting] = useState(false);
  const [modalError, setModalError] = useState("");

  // Search Filter States
  const [userSearch, setUserSearch] = useState("");
  const [eventSearch, setEventSearch] = useState("");
  const [bookingSearch, setBookingSearch] = useState("");

  const fetchData = async () => {
    setLoading(true);
    setError("");
    try {
      const [usersRes, eventsRes, bookingsRes] = await Promise.all([
        api.get("/admin/users"),
        api.get("/admin/events"),
        api.get("/admin/bookings"),
      ]);
      setUsers(usersRes.data);
      setEvents(eventsRes.data);
      setBookings(bookingsRes.data);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || "Failed to load admin data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleToggleUserActive = async (userId) => {
    try {
      const { data } = await api.put(`/admin/users/${userId}/toggle-active`);
      setUsers((prev) =>
        prev.map((u) => (u._id === userId ? { ...u, isActive: data.user.isActive } : u))
      );
    } catch (err) {
      alert(err.response?.data?.message || "Failed to toggle user status");
    }
  };

  const handleUpdateEventStatus = async (eventId, status) => {
    try {
      const { data } = await api.put(`/admin/events/${eventId}/status`, { status });
      setEvents((prev) =>
        prev.map((e) => (e._id === eventId ? { ...e, status: data.event.status } : e))
      );
    } catch (err) {
      alert(err.response?.data?.message || "Failed to update event status");
    }
  };

  const handleCreatePromoter = async (e) => {
    e.preventDefault();
    setModalError("");
    setModalSubmitting(true);
    try {
      const { data } = await api.post("/admin/promoters", {
        name: pName,
        email: pEmail,
        password: pPassword,
        phone: pPhone,
        promoCode: pPromoCode,
        commissionRate: pCommission,
      });

      // Add to local state
      setUsers((prev) => [data.user, ...prev]);

      // Clear fields & close modal
      setPName("");
      setPEmail("");
      setPPassword("");
      setPPhone("");
      setPPromoCode("");
      setPCommission(10);
      setShowPromoterModal(false);
    } catch (err) {
      setModalError(err.response?.data?.message || "Failed to create promoter account");
    } finally {
      setModalSubmitting(false);
    }
  };

  // Stats Calculations
  const activeEventsCount = events.filter((e) => e.status === "approved").length;
  const successfulBookings = bookings.filter((b) => b.paymentStatus === "success");
  const totalRevenue = successfulBookings.reduce((sum, b) => sum + b.totalAmount, 0);
  const totalTicketsSold = successfulBookings.reduce((sum, b) => sum + b.seats, 0);

  // Filters
  const filteredUsers = users.filter(
    (u) =>
      u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.email.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.role.toLowerCase().includes(userSearch.toLowerCase())
  );

  const filteredEvents = events.filter(
    (e) =>
      e.title.toLowerCase().includes(eventSearch.toLowerCase()) ||
      e.city.toLowerCase().includes(eventSearch.toLowerCase()) ||
      (e.organiser?.companyName || e.organiser?.name || "")
        .toLowerCase()
        .includes(eventSearch.toLowerCase())
  );

  const filteredBookings = bookings.filter(
    (b) =>
      b.ticketId.toLowerCase().includes(bookingSearch.toLowerCase()) ||
      (b.user?.name || "").toLowerCase().includes(bookingSearch.toLowerCase()) ||
      (b.event?.title || "").toLowerCase().includes(bookingSearch.toLowerCase()) ||
      (b.transactionId || "").toLowerCase().includes(bookingSearch.toLowerCase())
  );

  return (
    <div>
      <DashboardNav role="admin" />
      <div className="dash-body" style={{ maxWidth: 1200, margin: "0 auto", padding: "24px 32px" }}>
        
        {/* Tab Buttons */}
        <div className="tab-container" style={{ display: "flex", gap: 12, marginBottom: 28, borderBottom: "1px solid var(--border)", paddingBottom: 12 }}>
          {["stats", "users", "events", "bookings"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className="btn"
              style={{
                background: activeTab === tab ? "#8b5cf6" : "var(--surface-2)",
                color: "#fff",
                borderRadius: "8px",
                padding: "8px 16px",
                textTransform: "capitalize",
                fontSize: 14,
              }}
            >
              {tab === "stats" ? "Overview" : tab}
            </button>
          ))}
        </div>

        {error && <div className="alert alert-error" style={{ marginBottom: 20 }}>{error}</div>}

        {loading ? (
          <div className="loading-wrap">Loading Dashboard Data...</div>
        ) : (
          <>
            {/* STATS OVERVIEW TAB */}
            {activeTab === "stats" && (
              <div>
                <h2 className="section-title" style={{ color: "#8b5cf6" }}>System Metrics</h2>
                <div className="stat-grid">
                  <div className="stat-card" style={{ borderLeft: "4px solid #8b5cf6" }}>
                    <div className="label">Total Revenue</div>
                    <div className="value">₹{totalRevenue}</div>
                  </div>
                  <div className="stat-card" style={{ borderLeft: "4px solid #10b981" }}>
                    <div className="label">Tickets Sold</div>
                    <div className="value">{totalTicketsSold}</div>
                  </div>
                  <div className="stat-card" style={{ borderLeft: "4px solid #3b82f6" }}>
                    <div className="label">Registered Users</div>
                    <div className="value">{users.length}</div>
                  </div>
                  <div className="stat-card" style={{ borderLeft: "4px solid #f59e0b" }}>
                    <div className="label">Active Events</div>
                    <div className="value">{activeEventsCount} / {events.length}</div>
                  </div>
                </div>

                <div style={{ marginTop: 40, display: "flex", gap: 24, flexWrap: "wrap" }}>
                  <div className="card-panel" style={{ flex: 1, minWidth: 300, background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius)", padding: 24 }}>
                    <h3 style={{ marginTop: 0, marginBottom: 16 }}>System Admin Quick Tools</h3>
                    <p style={{ color: "var(--text-dim)", fontSize: 14, lineHeight: "1.6" }}>
                      As a Super Administrator, you have total access to EventHub database objects. Use the tabs above to toggle user access, approve new event listings from event organisers, audit card/Cashfree transaction histories, and manage local promoters.
                    </p>
                    <button className="btn" onClick={() => setShowPromoterModal(true)} style={{ background: "#8b5cf6", color: "#fff", marginTop: 12 }}>
                      + Create Promoter Account
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* USERS TAB */}
            {activeTab === "users" && (
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
                  <h2 className="section-title" style={{ margin: 0 }}>Registered Accounts</h2>
                  <div style={{ display: "flex", gap: 12 }}>
                    <input
                      type="text"
                      placeholder="Search users..."
                      value={userSearch}
                      onChange={(e) => setUserSearch(e.target.value)}
                      style={{
                        padding: "8px 16px",
                        borderRadius: "8px",
                        border: "1px solid var(--border)",
                        background: "var(--surface-2)",
                        color: "#fff",
                        width: 220,
                      }}
                    />
                    <button className="btn" onClick={() => setShowPromoterModal(true)} style={{ background: "#8b5cf6", color: "#fff" }}>
                      + Add Promoter
                    </button>
                  </div>
                </div>

                {filteredUsers.length === 0 ? (
                  <div className="empty-state">No users match your query.</div>
                ) : (
                  <div className="table-wrap">
                    <table>
                      <thead>
                        <tr>
                          <th>Name</th>
                          <th>Email</th>
                          <th>Phone</th>
                          <th>Role</th>
                          <th>Details / Code</th>
                          <th>Access</th>
                          <th>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredUsers.map((u) => (
                          <tr key={u._id}>
                            <td>{u.name}</td>
                            <td>{u.email}</td>
                            <td>{u.phone || "N/A"}</td>
                            <td>
                              <span
                                style={{
                                  padding: "2px 8px",
                                  borderRadius: "12px",
                                  fontSize: 12,
                                  background:
                                    u.role === "admin"
                                      ? "#8b5cf6"
                                      : u.role === "organiser"
                                      ? "#ec1e79"
                                      : u.role === "promoter"
                                      ? "#3b82f6"
                                      : "var(--surface-2)",
                                  color: "#fff",
                                }}
                              >
                                {u.role}
                              </span>
                            </td>
                            <td>
                              {u.role === "promoter" && (
                                <span style={{ color: "var(--text-dim)", fontSize: 13 }}>
                                  Promo: <strong>{u.promoCode}</strong> ({u.commissionRate}% comm)
                                </span>
                              )}
                              {u.role === "organiser" && u.companyName && (
                                <span style={{ color: "var(--text-dim)", fontSize: 13 }}>
                                  Company: {u.companyName}
                                </span>
                              )}
                              {u.role === "user" && <span style={{ color: "var(--text-dim)" }}>-</span>}
                            </td>
                            <td>
                              <span style={{ color: u.isActive ? "#10b981" : "#ef4444" }}>
                                {u.isActive ? "● Active" : "● Blocked"}
                              </span>
                            </td>
                            <td>
                              <button
                                className={`btn btn-sm ${u.isActive ? "btn-outline" : "btn-primary"}`}
                                disabled={u.role === "admin"}
                                onClick={() => handleToggleUserActive(u._id)}
                                style={{
                                  padding: "4px 12px",
                                  fontSize: 12,
                                  borderColor: u.isActive ? "#ef4444" : "",
                                  color: u.isActive ? "#ef4444" : "",
                                }}
                              >
                                {u.isActive ? "Block" : "Unblock"}
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* EVENTS TAB */}
            {activeTab === "events" && (
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                  <h2 className="section-title" style={{ margin: 0 }}>Event Listings</h2>
                  <input
                    type="text"
                    placeholder="Search events..."
                    value={eventSearch}
                    onChange={(e) => setEventSearch(e.target.value)}
                    style={{
                      padding: "8px 16px",
                      borderRadius: "8px",
                      border: "1px solid var(--border)",
                      background: "var(--surface-2)",
                      color: "#fff",
                      width: 250,
                    }}
                  />
                </div>

                {filteredEvents.length === 0 ? (
                  <div className="empty-state">No events match your query.</div>
                ) : (
                  <div className="table-wrap">
                    <table>
                      <thead>
                        <tr>
                          <th>Title</th>
                          <th>Organiser</th>
                          <th>Category</th>
                          <th>City</th>
                          <th>Date</th>
                          <th>Tickets</th>
                          <th>Price</th>
                          <th>Status</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredEvents.map((e) => (
                          <tr key={e._id}>
                            <td>{e.title}</td>
                            <td>
                              <div style={{ fontSize: 13 }}>{e.organiser?.companyName || e.organiser?.name || "Unknown"}</div>
                              <div style={{ fontSize: 11, color: "var(--text-dim)" }}>{e.organiser?.email}</div>
                            </td>
                            <td>{e.category}</td>
                            <td>{e.city}</td>
                            <td>{new Date(e.date).toLocaleDateString()}</td>
                            <td>{e.availableSeats}/{e.totalSeats}</td>
                            <td>₹{e.price}</td>
                            <td>
                              <span
                                style={{
                                  color:
                                    e.status === "approved"
                                      ? "#10b981"
                                      : e.status === "cancelled"
                                      ? "#ef4444"
                                      : "#f59e0b",
                                  fontSize: 13,
                                  textTransform: "capitalize",
                                }}
                              >
                                {e.status}
                              </span>
                            </td>
                            <td>
                              <div style={{ display: "flex", gap: 6 }}>
                                {e.status !== "approved" && (
                                  <button
                                    onClick={() => handleUpdateEventStatus(e._id, "approved")}
                                    className="btn"
                                    style={{ background: "#10b981", color: "#fff", padding: "4px 8px", fontSize: 11 }}
                                  >
                                    Approve
                                  </button>
                                )}
                                {e.status !== "cancelled" && (
                                  <button
                                    onClick={() => handleUpdateEventStatus(e._id, "cancelled")}
                                    className="btn"
                                    style={{ background: "#ef4444", color: "#fff", padding: "4px 8px", fontSize: 11 }}
                                  >
                                    Cancel
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* BOOKINGS TAB */}
            {activeTab === "bookings" && (
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                  <h2 className="section-title" style={{ margin: 0 }}>Transactions History</h2>
                  <input
                    type="text"
                    placeholder="Search bookings/transactions..."
                    value={bookingSearch}
                    onChange={(e) => setBookingSearch(e.target.value)}
                    style={{
                      padding: "8px 16px",
                      borderRadius: "8px",
                      border: "1px solid var(--border)",
                      background: "var(--surface-2)",
                      color: "#fff",
                      width: 280,
                    }}
                  />
                </div>

                {filteredBookings.length === 0 ? (
                  <div className="empty-state">No transaction logs match your query.</div>
                ) : (
                  <div className="table-wrap">
                    <table>
                      <thead>
                        <tr>
                          <th>Ticket ID</th>
                          <th>Buyer</th>
                          <th>Event</th>
                          <th>Seats</th>
                          <th>Total Amount</th>
                          <th>Status</th>
                          <th>Payment Info</th>
                          <th>Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredBookings.map((b) => (
                          <tr key={b._id}>
                            <td style={{ fontFamily: "monospace", fontSize: 12 }}>{b.ticketId}</td>
                            <td>
                              <div style={{ fontSize: 13 }}>{b.user?.name || "N/A"}</div>
                              <div style={{ fontSize: 11, color: "var(--text-dim)" }}>{b.user?.email || "N/A"}</div>
                            </td>
                            <td>{b.event?.title || "N/A"}</td>
                            <td>{b.seats}</td>
                            <td>₹{b.totalAmount}</td>
                            <td>
                              <span
                                style={{
                                  padding: "2px 8px",
                                  borderRadius: "10px",
                                  fontSize: 11,
                                  background:
                                    b.paymentStatus === "success"
                                      ? "rgba(16, 185, 129, 0.15)"
                                      : b.paymentStatus === "failed"
                                      ? "rgba(239, 68, 68, 0.15)"
                                      : "rgba(245, 158, 11, 0.15)",
                                  color:
                                    b.paymentStatus === "success"
                                      ? "#10b981"
                                      : b.paymentStatus === "failed"
                                      ? "#ef4444"
                                      : "#f59e0b",
                                }}
                              >
                                {b.paymentStatus}
                              </span>
                            </td>
                            <td>
                              {b.paymentStatus === "success" ? (
                                <div style={{ fontSize: 12 }}>
                                  Method: <span style={{ textTransform: "capitalize", fontWeight: "bold" }}>{b.paymentMethod}</span>
                                  <div style={{ fontSize: 10, color: "var(--text-dim)", fontFamily: "monospace" }}>ID: {b.transactionId}</div>
                                </div>
                              ) : (
                                <span style={{ color: "var(--text-dim)" }}>-</span>
                              )}
                            </td>
                            <td style={{ fontSize: 12 }}>{new Date(b.createdAt).toLocaleString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* CREATE PROMOTER MODAL OVERLAY */}
      {showPromoterModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0,0,0,0.75)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 100,
            padding: 16,
          }}
        >
          <div
            className="card-panel"
            style={{
              width: "100%",
              maxWidth: 480,
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: "var(--radius)",
              padding: 28,
              position: "relative",
              maxHeight: "90vh",
              overflowY: "auto",
            }}
          >
            <button
              onClick={() => setShowPromoterModal(false)}
              style={{
                position: "absolute",
                top: 16,
                right: 16,
                background: "none",
                border: "none",
                color: "var(--text-dim)",
                fontSize: 20,
              }}
            >
              ×
            </button>
            <h3 style={{ marginTop: 0, color: "#8b5cf6", marginBottom: 6 }}>Create Promoter Account</h3>
            <p style={{ fontSize: 13, color: "var(--text-dim)", marginBottom: 20 }}>
              Add a marketer who can promote events and earn commissions using referral promo codes.
            </p>

            {modalError && <div className="alert alert-error" style={{ marginBottom: 16 }}>{modalError}</div>}

            <form onSubmit={handleCreatePromoter}>
              <div className="form-group" style={{ marginBottom: 12 }}>
                <label>Promoter Name</label>
                <input required type="text" value={pName} onChange={(e) => setPName(e.target.value)} placeholder="e.g. Priya Nair" />
              </div>
              <div className="form-group" style={{ marginBottom: 12 }}>
                <label>Email Address</label>
                <input required type="email" value={pEmail} onChange={(e) => setPEmail(e.target.value)} placeholder="e.g. priya@gmail.com" />
              </div>
              <div className="form-group" style={{ marginBottom: 12 }}>
                <label>Password</label>
                <input required type="password" minLength={6} value={pPassword} onChange={(e) => setPPassword(e.target.value)} placeholder="Minimum 6 characters" />
              </div>
              <div className="form-group" style={{ marginBottom: 12 }}>
                <label>Phone Number (optional)</label>
                <input type="text" value={pPhone} onChange={(e) => setPPhone(e.target.value)} placeholder="e.g. 9876511111" />
              </div>
              <div className="form-row" style={{ display: "flex", gap: 12, marginBottom: 20 }}>
                <div className="form-group" style={{ flex: 1 }}>
                  <label>Promo Code</label>
                  <input required type="text" value={pPromoCode} onChange={(e) => setPPromoCode(e.target.value.toUpperCase())} placeholder="e.g. PRIYA10" />
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                  <label>Commission Rate (%)</label>
                  <input required type="number" min={0} max={100} value={pCommission} onChange={(e) => setPCommission(Number(e.target.value))} />
                </div>
              </div>

              <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
                <button type="button" className="btn btn-outline" onClick={() => setShowPromoterModal(false)} disabled={modalSubmitting}>
                  Cancel
                </button>
                <button type="submit" className="btn" style={{ background: "#8b5cf6", color: "#fff" }} disabled={modalSubmitting}>
                  {modalSubmitting ? "Creating..." : "Create Account"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
