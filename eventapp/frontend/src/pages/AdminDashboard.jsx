import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/axios";
import DashboardNav from "../components/DashboardNav";

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState("stats"); // stats, users, events, bookings, withdrawals, cms, coupons, broadcast, verifications
  const [users, setUsers] = useState([]);
  const [events, setEvents] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [withdrawals, setWithdrawals] = useState([]);
  const [verificationsQueue, setVerificationsQueue] = useState([]);
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

  // CMS States
  const [convFee, setConvFee] = useState(25);
  const [taxRate, setTaxRate] = useState(18);
  const [aboutUsCMS, setAboutUsCMS] = useState("Welcome to EventHub, India's premier ticketing platform.");
  const [faqCMS, setFaqCMS] = useState("Q: How do I book tickets?\nA: Select your seats and complete checkout.");

  // Coupon States
  const [coupons, setCoupons] = useState([]);
  const [couponForm, setCouponForm] = useState({
    code: "",
    discountType: "percentage",
    discountValue: "",
    maxDiscount: "",
    minPurchase: "",
    expiryDate: "",
    usageLimit: ""
  });

  // Broadcast Announcement State
  const [broadcastTitle, setBroadcastTitle] = useState("");
  const [broadcastMessage, setBroadcastMessage] = useState("");

  const fetchData = async () => {
    setLoading(true);
    setError("");
    try {
      const [usersRes, eventsRes, bookingsRes, withdrawalsRes, couponRes, verificationsRes] = await Promise.all([
        api.get("/admin/users"),
        api.get("/admin/events"),
        api.get("/admin/bookings"),
        api.get("/admin/withdrawals"),
        api.get("/enterprise/admin/coupons"),
        api.get("/api/business/admin/verifications")
      ]);
      setUsers(usersRes.data);
      setEvents(eventsRes.data);
      setBookings(bookingsRes.data);
      setWithdrawals(withdrawalsRes.data);
      setCoupons(couponRes.data);
      setVerificationsQueue(verificationsRes.data);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || "Failed to load admin dashboard parameters");
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

  // Change Event approval status lifecycle flow
  const handleUpdateEventLifecycle = async (eventId, nextStatus) => {
    let remarks = "";
    if (nextStatus === "changes-requested") {
      remarks = prompt("Please enter detailed feedback/changes request comments for organiser:");
      if (!remarks) return;
    } else {
      remarks = prompt("Enter optional audit notes:");
    }

    try {
      await api.post(`/api/business/admin/events/${eventId}/flow`, {
        approvalStatus: nextStatus,
        remarks
      });
      alert(`Event status updated to ${nextStatus}`);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to update lifecycle status");
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

      setUsers((prev) => [data.user, ...prev]);
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

  const handleProcessWithdrawal = async (payoutId, status) => {
    let transactionId = "";
    let adminNotes = "";
    if (status === "approved") {
      transactionId = prompt("Enter Bank Settlement/UPI Transaction ID reference:");
      if (!transactionId) {
        alert("Transaction Reference ID is required to approve the settlement.");
        return;
      }
      adminNotes = prompt("Enter optional admin notes for organiser:");
    } else {
      adminNotes = prompt("Enter rejection reason:");
      if (!adminNotes) return;
    }

    try {
      const { data } = await api.put(`/admin/withdrawals/${payoutId}`, {
        status,
        transactionId,
        adminNotes
      });
      alert(data.message);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to process withdrawal");
    }
  };

  // Coupons campaign submit
  const handleCreateCoupon = async (e) => {
    e.preventDefault();
    try {
      const { data } = await api.post("/enterprise/admin/coupons", couponForm);
      setCoupons([data.coupon, ...coupons]);
      setCouponForm({
        code: "",
        discountType: "percentage",
        discountValue: "",
        maxDiscount: "",
        minPurchase: "",
        expiryDate: "",
        usageLimit: ""
      });
      alert("Discount campaign Coupon created successfully!");
    } catch (err) {
      alert(err.response?.data?.message || "Failed to create Coupon.");
    }
  };

  // Broadcast announcement submit
  const handleSendBroadcast = async (e) => {
    e.preventDefault();
    if (!broadcastTitle || !broadcastMessage) return;
    try {
      const { data } = await api.post("/enterprise/admin/broadcast", {
        title: broadcastTitle,
        message: broadcastMessage
      });
      alert(data.message);
      setBroadcastTitle("");
      setBroadcastMessage("");
    } catch (err) {
      alert("Failed to send broadcast announcement.");
    }
  };

  // Process Document Badge Verification
  const handleProcessVerification = async (orgId, status) => {
    const remarks = prompt("Enter status remarks / audit feedback note:");
    if (status === "rejected" && !remarks) {
      alert("Remarks are required to reject verification.");
      return;
    }
    try {
      await api.post(`/api/business/admin/verifications/${orgId}`, { status, remarks });
      alert(`Organiser status updated to ${status}`);
      fetchData();
    } catch (err) {
      alert("Failed to update verification status.");
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
      u.email?.toLowerCase().includes(userSearch.toLowerCase()) ||
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
      (b.event?.title || "").toLowerCase().includes(bookingSearch.toLowerCase())
  );

  return (
    <div>
      <DashboardNav role="admin" />
      <div className="dash-body" style={{ maxWidth: 1200, margin: "0 auto", padding: "24px 32px" }}>
        
        {/* Tab Buttons */}
        <div className="tab-container" style={{ display: "flex", gap: 6, marginBottom: 28, borderBottom: "1px solid var(--border)", paddingBottom: 12, flexWrap: "wrap" }}>
          {["stats", "users", "events", "bookings", "withdrawals", "verifications", "cms", "coupons", "broadcast"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className="btn btn-sm"
              style={{
                background: activeTab === tab ? "#8b5cf6" : "var(--surface-2)",
                color: "#fff",
                borderRadius: "8px",
                padding: "8px 16px",
                textTransform: "capitalize",
                fontSize: 13,
              }}
            >
              {tab === "stats" ? "Overview" : tab}
            </button>
          ))}
          <Link
            to="/admin/observability"
            className="btn btn-sm"
            style={{
              background: "var(--purple)",
              color: "#fff",
              borderRadius: "8px",
              padding: "8px 16px",
              fontSize: 13,
              textDecoration: "none"
            }}
          >
            ⚙️ Observability
          </Link>
          <Link
            to="/admin/feature-flags"
            className="btn btn-sm"
            style={{
              background: "#10b981",
              color: "#fff",
              borderRadius: "8px",
              padding: "8px 16px",
              fontSize: 13,
              textDecoration: "none"
            }}
          >
            🚩 Feature Flags
          </Link>
        </div>

        {error && <div className="alert alert-error" style={{ marginBottom: 20 }}>{error}</div>}

        {loading ? (
          <div className="loading-wrap">Loading System Data...</div>
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
                  <div className="card-panel" style={{ flex: 1, minWidth: 300 }}>
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
                  <input
                    type="text"
                    placeholder="Search users..."
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    style={{ padding: "8px 16px", borderRadius: "8px", border: "1px solid var(--border)", background: "var(--surface-2)", color: "#fff", width: 250 }}
                  />
                </div>
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Phone</th>
                        <th>Email</th>
                        <th>Role</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredUsers.map((u) => (
                        <tr key={u._id}>
                          <td>{u.name}</td>
                          <td>{u.phone}</td>
                          <td>{u.email || "-"}</td>
                          <td><span className={`status-pill ${u.role === "admin" ? "status-success" : "status-pending"}`}>{u.role}</span></td>
                          <td>
                            <span className={`status-pill ${u.isActive ? "status-success" : "status-failed"}`}>
                              {u.isActive ? "Active" : "Deactivated"}
                            </span>
                          </td>
                          <td>
                            {u.role !== "admin" && (
                              <button
                                onClick={() => handleToggleUserActive(u._id)}
                                className="btn btn-sm btn-outline"
                              >
                                {u.isActive ? "Suspend" : "Activate"}
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* EVENTS LIFE-CYCLE TAB */}
            {activeTab === "events" && (
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
                  <h2 className="section-title" style={{ margin: 0 }}>Events approval workflow</h2>
                  <input
                    type="text"
                    placeholder="Search events..."
                    value={eventSearch}
                    onChange={(e) => setEventSearch(e.target.value)}
                    style={{ padding: "8px 16px", borderRadius: "8px", border: "1px solid var(--border)", background: "var(--surface-2)", color: "#fff", width: 250 }}
                  />
                </div>
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>Event</th>
                        <th>Organiser</th>
                        <th>City</th>
                        <th>Date</th>
                        <th>Lifecycle State</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredEvents.map((e) => (
                        <tr key={e._id}>
                          <td><strong>{e.title}</strong></td>
                          <td>{e.organiser?.companyName || e.organiser?.name || "Organiser"}</td>
                          <td>{e.city}</td>
                          <td>{new Date(e.date).toDateString()}</td>
                          <td>
                            <span className="status-pill status-pending" style={{ textTransform: "uppercase" }}>
                              {e.approvalStatus || "approved"}
                            </span>
                          </td>
                          <td>
                            <div style={{ display: "flex", gap: "6px" }}>
                              <select 
                                value={e.approvalStatus || "approved"} 
                                onChange={(ev) => handleUpdateEventLifecycle(e._id, ev.target.value)}
                                style={{ padding: "4px 8px", fontSize: "12px", borderRadius: "4px" }}
                              >
                                <option value="draft">Draft</option>
                                <option value="under-review">Under Review</option>
                                <option value="changes-requested">Changes Requested</option>
                                <option value="approved">Approve & Publish</option>
                                <option value="cancelled">Cancel / Suspend</option>
                                <option value="archived">Archive</option>
                              </select>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* BOOKINGS TAB */}
            {activeTab === "bookings" && (
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
                  <h2 className="section-title" style={{ margin: 0 }}>Audited Bookings</h2>
                  <input
                    type="text"
                    placeholder="Search ticket ID..."
                    value={bookingSearch}
                    onChange={(e) => setBookingSearch(e.target.value)}
                    style={{ padding: "8px 16px", borderRadius: "8px", border: "1px solid var(--border)", background: "var(--surface-2)", color: "#fff", width: 250 }}
                  />
                </div>
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>Ticket ID</th>
                        <th>User</th>
                        <th>Event</th>
                        <th>Seats</th>
                        <th>Total Paid</th>
                        <th>GST Collected</th>
                        <th>Gateway Status</th>
                        <th>Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredBookings.map((b) => (
                        <tr key={b._id}>
                          <td style={{ fontFamily: "monospace" }}>{b.ticketId}</td>
                          <td>{b.user?.name}</td>
                          <td>{b.event?.title}</td>
                          <td>{b.seats}</td>
                          <td>₹{b.totalAmount}</td>
                          <td>{b.gstRate > 0 ? `₹${(b.cgst + b.sgst).toFixed(2)} (${b.gstRate}%)` : "₹0 (0%)"}</td>
                          <td><span className={`status-pill status-${b.paymentStatus}`}>{b.paymentStatus}</span></td>
                          <td>{new Date(b.createdAt).toLocaleDateString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* WITHDRAWALS TAB */}
            {activeTab === "withdrawals" && (
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                  <h2 className="section-title" style={{ margin: 0 }}>Organiser Settlements</h2>
                </div>
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>Organiser</th>
                        <th>Amount</th>
                        <th>Account / UPI</th>
                        <th>Status</th>
                        <th>Ref Transaction ID</th>
                        <th>Date</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {withdrawals.map((w) => (
                        <tr key={w._id}>
                          <td>
                            <div style={{ fontWeight: "600" }}>{w.organiser?.companyName || w.organiser?.name || "Organiser"}</div>
                            <div style={{ fontSize: 11, color: "var(--text-dim)" }}>{w.organiser?.phone}</div>
                          </td>
                          <td style={{ fontWeight: "bold" }}>₹{w.amount}</td>
                          <td>{w.upiId || w.accountNumber}</td>
                          <td>
                            <span className={`status-pill status-${w.status === "approved" ? "success" : "pending"}`}>
                              {w.status}
                            </span>
                          </td>
                          <td>{w.transactionId || "-"}</td>
                          <td>{new Date(w.createdAt).toDateString()}</td>
                          <td>
                            {w.status === "pending" ? (
                              <div style={{ display: "flex", gap: "6px" }}>
                                <button onClick={() => handleProcessWithdrawal(w._id, "approved")} className="btn btn-sm btn-outline" style={{ borderColor: "#10b981", color: "#10b981" }}>Approve</button>
                                <button onClick={() => handleProcessWithdrawal(w._id, "rejected")} className="btn btn-sm btn-outline" style={{ borderColor: "#ef4444", color: "#ef4444" }}>Reject</button>
                              </div>
                            ) : (
                              <span>Processed</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ORGANISERS DOCUMENTS VERIFICATION TAB */}
            {activeTab === "verifications" && (
              <div>
                <h2 className="section-title">Document Verifications queue</h2>
                {verificationsQueue.length === 0 ? (
                  <div className="empty-state">No pending verifications. All organisers verified!</div>
                ) : (
                  <div className="table-wrap">
                    <table>
                      <thead>
                        <tr>
                          <th>Organiser</th>
                          <th>Aadhaar link</th>
                          <th>PAN No</th>
                          <th>GSTIN</th>
                          <th>Cancelled Cheque</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {verificationsQueue.map((o) => (
                          <tr key={o._id}>
                            <td>
                              <strong>{o.name}</strong>
                              <div style={{ fontSize: "11px", color: "var(--text-dim)" }}>Phone: {o.phone}</div>
                            </td>
                            <td>{o.organiserDocuments?.aadhaarUrl ? <a href={o.organiserDocuments.aadhaarUrl} target="_blank" rel="noreferrer" style={{ color: "var(--pink)" }}>View Aadhaar</a> : "-"}</td>
                            <td><code>{o.organiserGSTProfile?.panNumber || o.organiserDocuments?.panUrl || "-"}</code></td>
                            <td><code>{o.organiserGSTProfile?.gstNumber || "-"}</code></td>
                            <td>{o.organiserDocuments?.cancelledChequeUrl ? <a href={o.organiserDocuments.cancelledChequeUrl} target="_blank" rel="noreferrer" style={{ color: "var(--pink)" }}>View Cheque</a> : "-"}</td>
                            <td>
                              <div style={{ display: "flex", gap: "6px" }}>
                                <button onClick={() => handleProcessVerification(o._id, "verified")} className="btn btn-sm btn-outline" style={{ borderColor: "#10b981", color: "#10b981" }}>Verify Badge</button>
                                <button onClick={() => handleProcessVerification(o._id, "rejected")} className="btn btn-sm btn-outline" style={{ borderColor: "#ef4444", color: "#ef4444" }}>Reject</button>
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

            {/* CMS CONFIG TAB */}
            {activeTab === "cms" && (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
                <div className="card-panel">
                  <h3>⚙️ Platform Transaction Configurations</h3>
                  <div className="form-group" style={{ marginBottom: "12px" }}>
                    <label>Default Convenience Fee (₹)</label>
                    <input type="number" value={convFee} onChange={(e) => setConvFee(Number(e.target.value))} />
                  </div>
                  <div className="form-group" style={{ marginBottom: "12px" }}>
                    <label>Internet Service GST Tax Rate (%)</label>
                    <input type="number" value={taxRate} onChange={(e) => setTaxRate(Number(e.target.value))} />
                  </div>
                  <button className="btn btn-primary btn-sm" onClick={() => alert("Convenience configurations updated.")}>
                    Update Fees
                  </button>
                </div>

                <div className="card-panel">
                  <h3>📄 CMS Editor (Static Pages content)</h3>
                  <div className="form-group" style={{ marginBottom: "12px" }}>
                    <label>About Us Page Content</label>
                    <textarea rows="3" value={aboutUsCMS} onChange={(e) => setAboutUsCMS(e.target.value)} />
                  </div>
                  <div className="form-group" style={{ marginBottom: "12px" }}>
                    <label>System FAQs</label>
                    <textarea rows="3" value={faqCMS} onChange={(e) => setFaqCMS(e.target.value)} />
                  </div>
                  <button className="btn btn-primary btn-sm" onClick={() => alert("CMS static content saved.")}>
                    Publish CMS content
                  </button>
                </div>
              </div>
            )}

            {/* COUPONS TAB */}
            {activeTab === "coupons" && (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1.2fr", gap: "20px" }}>
                <div className="card-panel">
                  <h3>🏷️ Launch Coupon Discount Campaign</h3>
                  <form onSubmit={handleCreateCoupon}>
                    <div className="form-row">
                      <div className="form-group">
                        <label>Promo Code</label>
                        <input required type="text" value={couponForm.code} onChange={(e) => setCouponForm({ ...couponForm, code: e.target.value })} placeholder="e.g. MONSOON20" />
                      </div>
                      <div className="form-group">
                        <label>Discount Type</label>
                        <select value={couponForm.discountType} onChange={(e) => setCouponForm({ ...couponForm, discountType: e.target.value })}>
                          <option value="percentage">Percentage (%)</option>
                          <option value="fixed">Fixed Amount (₹)</option>
                        </select>
                      </div>
                    </div>
                    <div className="form-row">
                      <div className="form-group">
                        <label>Discount Value</label>
                        <input required type="number" value={couponForm.discountValue} onChange={(e) => setCouponForm({ ...couponForm, discountValue: e.target.value })} />
                      </div>
                      <div className="form-group">
                        <label>Max Limit Discount (₹)</label>
                        <input type="number" value={couponForm.maxDiscount} onChange={(e) => setCouponForm({ ...couponForm, maxDiscount: e.target.value })} placeholder="0 for no cap" />
                      </div>
                    </div>
                    <div className="form-row">
                      <div className="form-group">
                        <label>Min Order Purchase (₹)</label>
                        <input type="number" value={couponForm.minPurchase} onChange={(e) => setCouponForm({ ...couponForm, minPurchase: e.target.value })} />
                      </div>
                      <div className="form-group">
                        <label>Expiry Date</label>
                        <input required type="date" value={couponForm.expiryDate} onChange={(e) => setCouponForm({ ...couponForm, expiryDate: e.target.value })} />
                      </div>
                    </div>
                    <div className="form-group" style={{ marginBottom: "16px" }}>
                      <label>Usage Limit (cap count)</label>
                      <input type="number" value={couponForm.usageLimit} onChange={(e) => setCouponForm({ ...couponForm, usageLimit: e.target.value })} />
                    </div>
                    <button type="submit" className="btn btn-primary btn-block btn-block btn-sm">Launch Promo Code Campaign</button>
                  </form>
                </div>

                <div className="card-panel">
                  <h3>Active Coupon Campaigns</h3>
                  {coupons.length === 0 ? (
                    <div style={{ color: "var(--text-dim)" }}>No active campaigns.</div>
                  ) : (
                    <div className="table-wrap">
                      <table>
                        <thead>
                          <tr>
                            <th>Code</th>
                            <th>Discount</th>
                            <th>Expiry</th>
                            <th>Limit</th>
                            <th>Used</th>
                          </tr>
                        </thead>
                        <tbody>
                          {coupons.map((c) => (
                            <tr key={c._id}>
                              <td><strong>{c.code}</strong></td>
                              <td>{c.discountType === "percentage" ? `${c.discountValue}%` : `₹${c.discountValue}`}</td>
                              <td>{new Date(c.expiryDate).toLocaleDateString()}</td>
                              <td>{c.usageLimit}</td>
                              <td>{c.usedCount}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* BROADCAST ANNOUNCEMENT TAB */}
            {activeTab === "broadcast" && (
              <div style={{ maxWidth: "550px" }}>
                <div className="card-panel">
                  <h3>📢 Broadcast Live Announcements</h3>
                  <p style={{ color: "var(--text-dim)", fontSize: "13px", marginBottom: "16px" }}>
                    Send a system-wide banner notification warning or campaign alert to all registered active user dashboards instantly.
                  </p>
                  <form onSubmit={handleSendBroadcast}>
                    <div className="form-group" style={{ marginBottom: "12px" }}>
                      <label>Announcement Subject Title</label>
                      <input required type="text" value={broadcastTitle} onChange={(e) => setBroadcastTitle(e.target.value)} placeholder="e.g. Schedule delay alert" />
                    </div>
                    <div className="form-group" style={{ marginBottom: "16px" }}>
                      <label>Message Content Details</label>
                      <textarea required rows="4" value={broadcastMessage} onChange={(e) => setBroadcastMessage(e.target.value)} placeholder="Provide full guideline text details..." />
                    </div>
                    <button type="submit" className="btn btn-primary btn-sm">Broadcast Announcement</button>
                  </form>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* CREATE PROMOTER ACCOUNT MODAL */}
      {showPromoterModal && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.8)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: 16 }}>
          <div className="card-panel" style={{ width: "100%", maxWidth: 480, position: "relative" }}>
            <button onClick={() => setShowPromoterModal(false)} style={{ position: "absolute", top: 16, right: 16, background: "none", border: "none", color: "var(--text-dim)", fontSize: 20, cursor: "pointer" }}>×</button>
            <h3 style={{ marginTop: 0, color: "#8b5cf6", marginBottom: 6 }}>Create Promoter Account</h3>
            <form onSubmit={handleCreatePromoter}>
              <div className="form-group" style={{ marginBottom: 12 }}><label>Name</label><input required value={pName} onChange={(e) => setPName(e.target.value)} /></div>
              <div className="form-group" style={{ marginBottom: 12 }}><label>Email</label><input required type="email" value={pEmail} onChange={(e) => setPEmail(e.target.value)} /></div>
              <div className="form-group" style={{ marginBottom: 12 }}><label>Password</label><input required type="password" value={pPassword} onChange={(e) => setPPassword(e.target.value)} /></div>
              <div className="form-group" style={{ marginBottom: 12 }}><label>Phone</label><input value={pPhone} onChange={(e) => setPPhone(e.target.value)} /></div>
              <div className="form-row" style={{ display: "flex", gap: 12 }}>
                <div className="form-group" style={{ flex: 1 }}><label>Promo Code</label><input required value={pPromoCode} onChange={(e) => setPPromoCode(e.target.value.toUpperCase())} /></div>
                <div className="form-group" style={{ flex: 1 }}><label>Commission Rate (%)</label><input required type="number" value={pCommission} onChange={(e) => setPCommission(Number(e.target.value))} /></div>
              </div>
              <button type="submit" className="btn btn-block btn-primary" style={{ marginTop: "16px" }} disabled={modalSubmitting}>Create Account</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
