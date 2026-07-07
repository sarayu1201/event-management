import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/axios";
import DashboardNav from "../components/DashboardNav";

const OrganiserDashboard = () => {
  const [activeTab, setActiveTab] = useState("events"); // events, payouts, analytics, gst, payoutProfiles, docs, settings, scanners
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  // Legacy Payout states
  const [payoutOverview, setPayoutOverview] = useState({
    availableBalance: 0,
    pendingBalance: 0,
    totalWithdrawn: 0,
    totalEarned: 0,
    bankDetails: { accountHolderName: "", accountNumber: "", ifscCode: "", upiId: "" },
  });
  const [payoutHistory, setPayoutHistory] = useState([]);
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [bankForm, setBankForm] = useState({
    accountHolderName: "",
    accountNumber: "",
    ifscCode: "",
    upiId: "",
  });
  const [payoutMessage, setPayoutMessage] = useState("");
  const [payoutError, setPayoutError] = useState("");

  // Analytics states
  const [analytics, setAnalytics] = useState({
    monthlyRevenue: {},
    topEvents: {},
    totalClicks: 0,
    totalConversions: 0,
    conversionRate: 0,
    peakHours: Array(24).fill(0),
    totalEventsCount: 0
  });

  // GST States
  const [gstForm, setGstForm] = useState({
    gstRegistered: false,
    gstNumber: "",
    legalBusinessName: "",
    panNumber: "",
    businessAddress: "",
    state: "",
    gstCertificateUrl: "",
    declarationAccepted: false
  });

  // Payout Profiles states
  const [payoutProfiles, setPayoutProfiles] = useState([]);
  const [showPayoutModal, setShowPayoutModal] = useState(false);
  const [payoutProfileForm, setPayoutProfileForm] = useState({
    label: "",
    accountHolderName: "",
    bankName: "",
    branchName: "",
    accountNumber: "",
    ifscCode: "",
    upiId: "",
    panNumber: "",
    gstNumber: "",
    isDefault: false
  });

  // Document Center states
  const [docForm, setDocForm] = useState({
    panUrl: "",
    gstCertificateUrl: "",
    businessRegistrationUrl: "",
    cancelledChequeUrl: "",
    aadhaarUrl: "",
    agreementUrl: "",
    licenseUrl: ""
  });

  // Business settings
  const [bizForm, setBizForm] = useState({
    defaultCurrency: "INR",
    timezone: "Asia/Kolkata",
    invoicePrefix: "INV",
    bookingPrefix: "BKG",
    ticketPrefix: "TKT",
    refundRules: "",
    cancellationPolicy: "",
    termsAndConditions: "",
    privacyPolicy: ""
  });

  // Scanner States
  const [scanners, setScanners] = useState([]);
  const [showScannerModal, setShowScannerModal] = useState(false);
  const [scannerForm, setScannerForm] = useState({
    name: "",
    mobile: "",
    username: "",
    password: "",
    gateName: "Gate 1",
    eventId: ""
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const [eventsRes, payoutOverviewRes, payoutHistoryRes, analyticsRes, profilesRes, scannerRes, profileRes] = await Promise.all([
        api.get("/events/mine/organiser"),
        api.get("/payouts/overview"),
        api.get("/payouts"),
        api.get("/enterprise/organiser/analytics"),
        api.get("/api/business/payout-profiles"),
        api.get("/api/business/scanners"),
        api.get("/auth/me")
      ]);
      setEvents(eventsRes.data);
      setPayoutOverview(payoutOverviewRes.data);
      setPayoutHistory(payoutHistoryRes.data);
      setAnalytics(analyticsRes.data);
      setPayoutProfiles(profilesRes.data);
      setScanners(scannerRes.data);

      const organiser = profileRes.data.user;
      if (organiser) {
        if (organiser.organiserGSTProfile) {
          setGstForm({
            gstRegistered: organiser.organiserGSTProfile.gstRegistered || false,
            gstNumber: organiser.organiserGSTProfile.gstNumber || "",
            legalBusinessName: organiser.organiserGSTProfile.legalBusinessName || "",
            panNumber: organiser.organiserGSTProfile.panNumber || "",
            businessAddress: organiser.organiserGSTProfile.businessAddress || "",
            state: organiser.organiserGSTProfile.state || "",
            gstCertificateUrl: organiser.organiserGSTProfile.gstCertificateUrl || "",
            declarationAccepted: organiser.organiserGSTProfile.declarationAccepted || false
          });
        }
        if (organiser.organiserDocuments) {
          setDocForm({
            panUrl: organiser.organiserDocuments.panUrl || "",
            gstCertificateUrl: organiser.organiserDocuments.gstCertificateUrl || "",
            businessRegistrationUrl: organiser.organiserDocuments.businessRegistrationUrl || "",
            cancelledChequeUrl: organiser.organiserDocuments.cancelledChequeUrl || "",
            aadhaarUrl: organiser.organiserDocuments.aadhaarUrl || "",
            agreementUrl: organiser.organiserDocuments.agreementUrl || "",
            licenseUrl: organiser.organiserDocuments.licenseUrl || ""
          });
        }
        if (organiser.businessSettings) {
          setBizForm({
            defaultCurrency: organiser.businessSettings.defaultCurrency || "INR",
            timezone: organiser.businessSettings.timezone || "Asia/Kolkata",
            invoicePrefix: organiser.businessSettings.invoicePrefix || "INV",
            bookingPrefix: organiser.businessSettings.bookingPrefix || "BKG",
            ticketPrefix: organiser.businessSettings.ticketPrefix || "TKT",
            refundRules: organiser.businessSettings.refundRules || "",
            cancellationPolicy: organiser.businessSettings.cancellationPolicy || "",
            termsAndConditions: organiser.businessSettings.termsAndConditions || "",
            privacyPolicy: organiser.businessSettings.privacyPolicy || ""
          });
        }
      }

      setBankForm({
        accountHolderName: payoutOverviewRes.data.bankDetails?.accountHolderName || "",
        accountNumber: payoutOverviewRes.data.bankDetails?.accountNumber || "",
        ifscCode: payoutOverviewRes.data.bankDetails?.ifscCode || "",
        upiId: payoutOverviewRes.data.bankDetails?.upiId || "",
      });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleUpdateBankDetails = async (e) => {
    e.preventDefault();
    setPayoutMessage("");
    setPayoutError("");
    try {
      const { data } = await api.put("/auth/profile", { bankDetails: bankForm });
      setPayoutMessage(data.message);
      loadData();
    } catch (err) {
      setPayoutError(err.response?.data?.message || "Could not update bank details");
    }
  };

  const handleRequestWithdrawal = async (e) => {
    e.preventDefault();
    setPayoutMessage("");
    setPayoutError("");
    if (!withdrawAmount || isNaN(Number(withdrawAmount)) || Number(withdrawAmount) <= 0) {
      setPayoutError("Please enter a valid amount to withdraw.");
      return;
    }

    try {
      const { data } = await api.post("/payouts/withdraw", {
        amount: Number(withdrawAmount),
        ...bankForm,
      });
      setPayoutMessage(data.message);
      setWithdrawAmount("");
      loadData();
    } catch (err) {
      setPayoutError(err.response?.data?.message || "Withdrawal request failed");
    }
  };

  // GST profile submit
  const handleSaveGST = async (e) => {
    e.preventDefault();
    try {
      await api.post("/api/business/profile/gst", gstForm);
      alert("GST details saved successfully!");
      loadData();
    } catch (err) {
      alert(err.response?.data?.message || "Could not save GST details");
    }
  };

  // Business settings submit
  const handleSaveBizSettings = async (e) => {
    e.preventDefault();
    try {
      await api.post("/api/business/settings", bizForm);
      alert("Business Settings configured successfully!");
      loadData();
    } catch (err) {
      alert("Could not update business settings.");
    }
  };

  // Document Center submit
  const handleSaveDocs = async (e) => {
    e.preventDefault();
    try {
      await api.post("/api/business/documents", docForm);
      alert("Documents uploaded and queued for Admin review!");
      loadData();
    } catch (err) {
      alert("Could not upload documents.");
    }
  };

  // Payout profiles creation
  const handleCreatePayoutProfile = async (e) => {
    e.preventDefault();
    try {
      await api.post("/api/business/payout-profiles", payoutProfileForm);
      alert("Settlement profile added successfully!");
      setShowPayoutModal(false);
      setPayoutProfileForm({
        label: "",
        accountHolderName: "",
        bankName: "",
        branchName: "",
        accountNumber: "",
        ifscCode: "",
        upiId: "",
        panNumber: "",
        gstNumber: "",
        isDefault: false
      });
      loadData();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to create payout profile");
    }
  };

  const handleSetDefaultPayout = async (id) => {
    try {
      await api.put(`/api/business/payout-profiles/${id}/default`);
      alert("Default payout account updated.");
      loadData();
    } catch (err) {
      alert("Failed to update default profile.");
    }
  };

  // Gate Scanner creation
  const handleCreateScanner = async (e) => {
    e.preventDefault();
    try {
      await api.post("/api/business/scanners", scannerForm);
      alert("Scanner credential setup successfully!");
      setShowScannerModal(false);
      setScannerForm({
        name: "",
        mobile: "",
        username: "",
        password: "",
        gateName: "Gate 1",
        eventId: ""
      });
      loadData();
    } catch (err) {
      alert(err.response?.data?.message || "Scanner registration failed");
    }
  };

  const handleResetScannerPwd = async (scannerId) => {
    const pwd = prompt("Enter a new password for scanner (minimum 6 characters):");
    if (!pwd || pwd.length < 6) return;
    try {
      await api.put(`/api/business/scanners/${scannerId}/reset-password`, { password: pwd });
      alert("Scanner password updated.");
    } catch (err) {
      alert("Failed to reset password.");
    }
  };

  const downloadSalesCSV = () => {
    let csv = "Event Title,Date,Total Seats,Tickets Sold,Revenue\n";
    events.forEach(e => {
      csv += `"${e.title}","${new Date(e.date).toLocaleDateString()}","${e.totalSeats}","${e.ticketsSold}","₹${e.revenue}"\n`;
    });
    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `sales_report_${Date.now()}.csv`;
    a.click();
  };

  const totalRevenue = events.reduce((sum, e) => sum + (e.revenue || 0), 0);
  const totalTickets = events.reduce((sum, e) => sum + (e.ticketsSold || 0), 0);

  return (
    <div>
      <DashboardNav role="organiser" />
      <div className="dash-body">
        
        {/* Tab Buttons bar */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24, flexWrap: "wrap", gap: "10px" }}>
          <div>
            <h2 className="section-title" style={{ margin: 0 }}>Organiser Dashboard</h2>
            <div style={{ display: "flex", gap: "8px", marginTop: "12px", flexWrap: "wrap" }}>
              <button onClick={() => setActiveTab("events")} className={`btn btn-sm ${activeTab === "events" ? "btn-primary" : "btn-outline"}`}>📅 Events</button>
              <button onClick={() => setActiveTab("payouts")} className={`btn btn-sm ${activeTab === "payouts" ? "btn-primary" : "btn-outline"}`}>💳 settlements</button>
              <button onClick={() => setActiveTab("analytics")} className={`btn btn-sm ${activeTab === "analytics" ? "btn-primary" : "btn-outline"}`}>📊 Analytics</button>
              <button onClick={() => setActiveTab("gst")} className={`btn btn-sm ${activeTab === "gst" ? "btn-primary" : "btn-outline"}`}>📋 GST Info</button>
              <button onClick={() => setActiveTab("payoutProfiles")} className={`btn btn-sm ${activeTab === "payoutProfiles" ? "btn-primary" : "btn-outline"}`}>🏦 Bank Profiles</button>
              <button onClick={() => setActiveTab("docs")} className={`btn btn-sm ${activeTab === "docs" ? "btn-primary" : "btn-outline"}`}>📁 Doc Center</button>
              <button onClick={() => setActiveTab("settings")} className={`btn btn-sm ${activeTab === "settings" ? "btn-primary" : "btn-outline"}`}>⚙️ settings</button>
              <button onClick={() => setActiveTab("scanners")} className={`btn btn-sm ${activeTab === "scanners" ? "btn-primary" : "btn-outline"}`}>📱 Gate Scanners</button>
              <Link to="/organiser/webhooks" className="btn btn-sm btn-outline" style={{ display: "flex", alignItems: "center", textDecoration: "none" }}>🔌 Webhooks</Link>
            </div>
          </div>
          <div style={{ display: "flex", gap: "10px" }}>
            {activeTab === "analytics" && <button onClick={downloadSalesCSV} className="btn btn-outline">Export Sales</button>}
            <Link to="/organiser/create-event" className="btn btn-primary">+ Create Event</Link>
          </div>
        </div>

        {loading && <div className="loading-wrap">Loading portal metrics...</div>}

        {!loading && (
          <div className="tab-content">
            {/* EVENTS TAB */}
            {activeTab === "events" && (
              <>
                <div className="stat-grid">
                  <div className="stat-card"><div className="label">Total Events</div><div className="value">{events.length}</div></div>
                  <div className="stat-card"><div className="label">Tickets Sold</div><div className="value">{totalTickets}</div></div>
                  <div className="stat-card"><div className="label">Gross Sales</div><div className="value">₹{totalRevenue}</div></div>
                </div>
                <h3 className="section-title" style={{ fontSize: 18, marginTop: 28 }}>Your Event Catalog</h3>
                {events.length === 0 ? (
                  <div className="empty-state">No events found. <Link to="/organiser/create-event">Create one now</Link></div>
                ) : (
                  <div className="table-wrap">
                    <table>
                      <thead>
                        <tr><th>Title</th><th>Date</th><th>Seats</th><th>Sold</th><th>Revenue</th><th>Lifecycle</th><th>Action</th></tr>
                      </thead>
                      <tbody>
                        {events.map((e) => (
                          <tr key={e._id}>
                            <td><strong>{e.title}</strong></td>
                            <td>{new Date(e.date).toDateString()}</td>
                            <td>{e.availableSeats}/{e.totalSeats}</td>
                            <td>{e.ticketsSold}</td>
                            <td>₹{e.revenue}</td>
                            <td><span className="status-pill status-pending">{e.approvalStatus || "approved"}</span></td>
                            <td><Link to={`/organiser/events/${e._id}`} className="btn btn-outline btn-sm">Manage</Link></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </>
            )}

            {/* PAYOUTS TAB */}
            {activeTab === "payouts" && (
              <>
                <div className="stat-grid">
                  <div className="stat-card"><div className="label">Withdraw Balance</div><div className="value" style={{ color: "var(--success)" }}>₹{payoutOverview.availableBalance}</div></div>
                  <div className="stat-card"><div className="label">Pending Processing</div><div className="value">₹{payoutOverview.pendingBalance}</div></div>
                  <div className="stat-card"><div className="label">Total Withdrawn</div><div className="value">₹{payoutOverview.totalWithdrawn}</div></div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginTop: "24px" }}>
                  <div className="card-panel">
                    <h3>💸 Submit Withdrawal</h3>
                    <form onSubmit={handleRequestWithdrawal}>
                      <div className="form-group"><label>Amount (₹)</label><input type="number" min="1" value={withdrawAmount} onChange={(e) => setWithdrawAmount(e.target.value)} /></div>
                      <button className="btn btn-primary btn-block" disabled={payoutOverview.availableBalance <= 0}>Submit Request</button>
                    </form>
                  </div>
                  <div className="card-panel">
                    <h3>🏦 Default Bank / Settlement</h3>
                    <form onSubmit={handleUpdateBankDetails}>
                      <div className="form-group"><label>Holder Name</label><input value={bankForm.accountHolderName} onChange={(e) => setBankForm({ ...bankForm, accountHolderName: e.target.value })} /></div>
                      <div className="form-group"><label>Account Number</label><input value={bankForm.accountNumber} onChange={(e) => setBankForm({ ...bankForm, accountNumber: e.target.value })} /></div>
                      <div className="form-group"><label>IFSC Code</label><input value={bankForm.ifscCode} onChange={(e) => setBankForm({ ...bankForm, ifscCode: e.target.value })} /></div>
                      <button className="btn btn-outline btn-block">Update Settlement Account</button>
                    </form>
                  </div>
                </div>
              </>
            )}

            {/* ANALYTICS TAB */}
            {activeTab === "analytics" && (
              <div>
                <div className="stat-grid">
                  <div className="stat-card"><div className="label">Clicks / Views</div><div className="value">{analytics.totalClicks}</div></div>
                  <div className="stat-card"><div className="label">Ticket Conversions</div><div className="value">{analytics.totalConversions}</div></div>
                  <div className="stat-card"><div className="label">Conversion Rate</div><div className="value">{analytics.conversionRate}%</div></div>
                </div>
              </div>
            )}

            {/* GST INFO TAB */}
            {activeTab === "gst" && (
              <div style={{ maxWidth: "600px" }}>
                <div className="card-panel">
                  <h3>GST Profile Configurations</h3>
                  <form onSubmit={handleSaveGST}>
                    <div className="form-group" style={{ marginBottom: "12px" }}>
                      <label>GST Registered Business?</label>
                      <select value={gstForm.gstRegistered ? "yes" : "no"} onChange={(e) => setGstForm({ ...gstForm, gstRegistered: e.target.value === "yes" })}>
                        <option value="no">No (Declaration Needed)</option>
                        <option value="yes">Yes (Provide Business GSTIN)</option>
                      </select>
                    </div>

                    {gstForm.gstRegistered ? (
                      <>
                        <div className="form-group"><label>GSTIN number</label><input required value={gstForm.gstNumber} onChange={(e) => setGstForm({ ...gstForm, gstNumber: e.target.value.toUpperCase() })} placeholder="e.g. 36AAAAA1111A1Z1" /></div>
                        <div className="form-group"><label>PAN number</label><input required value={gstForm.panNumber} onChange={(e) => setGstForm({ ...gstForm, panNumber: e.target.value.toUpperCase() })} placeholder="e.g. ABCDE1234F" /></div>
                        <div className="form-group"><label>Legal Business Name</label><input required value={gstForm.legalBusinessName} onChange={(e) => setGstForm({ ...gstForm, legalBusinessName: e.target.value })} /></div>
                        <div className="form-group"><label>Address</label><input required value={gstForm.businessAddress} onChange={(e) => setGstForm({ ...gstForm, businessAddress: e.target.value })} /></div>
                        <div className="form-group"><label>State</label><input required value={gstForm.state} onChange={(e) => setGstForm({ ...gstForm, state: e.target.value })} /></div>
                        <div className="form-group"><label>GST Certificate URL link</label><input value={gstForm.gstCertificateUrl} onChange={(e) => setGstForm({ ...gstForm, gstCertificateUrl: e.target.value })} /></div>
                      </>
                    ) : (
                      <div style={{ background: "rgba(236,30,121,0.06)", border: "1px dashed var(--pink)", borderRadius: "8px", padding: "16px", marginBottom: "16px" }}>
                        <h4 style={{ margin: "0 0 10px 0" }}>⚠️ GST Exemption Declaration</h4>
                        <p style={{ fontSize: "12px", color: "var(--text-dim)", lineHeight: "1.6" }}>
                          I hereby declare that my business turnover is below the taxable threshold defined under Indian GST Acts, and I am not registered under GST. Any taxes or charges generated remain my host liabilities.
                        </p>
                        <div style={{ display: "flex", gap: "10px", alignItems: "center", marginTop: "12px" }}>
                          <input type="checkbox" id="acceptDeclaration" checked={gstForm.declarationAccepted} onChange={(e) => setGstForm({ ...gstForm, declarationAccepted: e.target.checked })} />
                          <label htmlFor="acceptDeclaration" style={{ margin: 0, fontSize: "13px", cursor: "pointer" }}>I accept the above declaration</label>
                        </div>
                      </div>
                    )}
                    <button type="submit" className="btn btn-primary btn-sm">Save GST Profile</button>
                  </form>
                </div>
              </div>
            )}

            {/* BANK PAYOUT PROFILES TAB */}
            {activeTab === "payoutProfiles" && (
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                  <h3 style={{ margin: 0 }}>Linked Payout Settlements Accounts</h3>
                  <button onClick={() => setShowPayoutModal(true)} className="btn btn-sm btn-primary">+ Add Payout Profile</button>
                </div>

                {payoutProfiles.length === 0 ? (
                  <div className="empty-state">No linked payout profiles.</div>
                ) : (
                  <div className="table-wrap">
                    <table>
                      <thead>
                        <tr><th>Label</th><th>Holder</th><th>Bank / Branch</th><th>Account No</th><th>UPI</th><th>PAN / GST</th><th>Status</th><th>Actions</th></tr>
                      </thead>
                      <tbody>
                        {payoutProfiles.map((p) => (
                          <tr key={p._id}>
                            <td><strong>{p.label}</strong> {p.isDefault && <span style={{ background: "var(--pink)", color: "#fff", fontSize: "10px", padding: "2px 6px", borderRadius: "10px" }}>Default</span>}</td>
                            <td>{p.accountHolderName}</td>
                            <td>{p.bankName} ({p.branchName})</td>
                            <td>{p.accountNumber} <div style={{ fontSize: "11px", color: "var(--text-dim)" }}>IFSC: {p.ifscCode}</div></td>
                            <td>{p.upiId || "-"}</td>
                            <td>{p.panNumber} / {p.gstNumber || "-"}</td>
                            <td><span className={`status-pill status-${p.verificationStatus}`}>{p.verificationStatus}</span></td>
                            <td>
                              {!p.isDefault && (
                                <button onClick={() => handleSetDefaultPayout(p._id)} className="btn btn-sm btn-outline">Set Default</button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* DOCUMENT CENTER TAB */}
            {activeTab === "docs" && (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
                <div className="card-panel">
                  <h3>Document Upload Center</h3>
                  <form onSubmit={handleSaveDocs}>
                    <div className="form-group"><label>Aadhaar Card Link</label><input value={docForm.aadhaarUrl} onChange={(e) => setDocForm({ ...docForm, aadhaarUrl: e.target.value })} /></div>
                    <div className="form-group"><label>PAN Card Link</label><input value={docForm.panUrl} onChange={(e) => setDocForm({ ...docForm, panUrl: e.target.value })} /></div>
                    <div className="form-group"><label>GST Certificate Link</label><input value={docForm.gstCertificateUrl} onChange={(e) => setDocForm({ ...docForm, gstCertificateUrl: e.target.value })} /></div>
                    <div className="form-group"><label>Business Registration License</label><input value={docForm.businessRegistrationUrl} onChange={(e) => setDocForm({ ...docForm, businessRegistrationUrl: e.target.value })} /></div>
                    <div className="form-group"><label>Cancelled Cheque image link</label><input value={docForm.cancelledChequeUrl} onChange={(e) => setDocForm({ ...docForm, cancelledChequeUrl: e.target.value })} /></div>
                    <button type="submit" className="btn btn-primary btn-sm" style={{ marginTop: "12px" }}>Submit Documents for Verification</button>
                  </form>
                </div>
                <div className="card-panel">
                  <h3>Verification Badge Status</h3>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", margin: "16px 0" }}>
                    <span style={{ fontSize: "16px" }}>Badge Status:</span>
                    {/* Badge badge display */}
                    <span style={{
                      background: payoutOverview.availableBalance > 0 || events.length > 0 ? "rgba(16,185,129,0.15)" : "rgba(245,158,11,0.15)",
                      color: payoutOverview.availableBalance > 0 || events.length > 0 ? "#10b981" : "#f59e0b",
                      padding: "6px 16px",
                      borderRadius: "20px",
                      fontWeight: "bold",
                      textTransform: "uppercase"
                    }}>
                      VERIFIED BADGE
                    </span>
                  </div>
                  <p style={{ color: "var(--text-dim)", fontSize: "13px", lineHeight: "1.6" }}>
                    Platform super administrators review document certificates. If documents mismatch, rejection reasons will be detailed here.
                  </p>
                </div>
              </div>
            )}

            {/* SETTINGS TAB */}
            {activeTab === "settings" && (
              <div style={{ maxWidth: "600px" }}>
                <div className="card-panel">
                  <h3>Business settings & policies</h3>
                  <form onSubmit={handleSaveBizSettings}>
                    <div className="form-row">
                      <div className="form-group"><label>Default Currency</label><input value={bizForm.defaultCurrency} onChange={(e) => setBizForm({ ...bizForm, defaultCurrency: e.target.value })} /></div>
                      <div className="form-group"><label>Timezone</label><input value={bizForm.timezone} onChange={(e) => setBizForm({ ...bizForm, timezone: e.target.value })} /></div>
                    </div>
                    <div className="form-row">
                      <div className="form-group"><label>Invoice Prefix</label><input value={bizForm.invoicePrefix} onChange={(e) => setBizForm({ ...bizForm, invoicePrefix: e.target.value })} /></div>
                      <div className="form-group"><label>Booking Prefix</label><input value={bizForm.bookingPrefix} onChange={(e) => setBizForm({ ...bizForm, bookingPrefix: e.target.value })} /></div>
                      <div className="form-group"><label>Ticket Prefix</label><input value={bizForm.ticketPrefix} onChange={(e) => setBizForm({ ...bizForm, ticketPrefix: e.target.value })} /></div>
                    </div>
                    <div className="form-group"><label>Refund rules</label><textarea value={bizForm.refundRules} onChange={(e) => setBizForm({ ...bizForm, refundRules: e.target.value })} /></div>
                    <div className="form-group"><label>Cancellation Policy</label><textarea value={bizForm.cancellationPolicy} onChange={(e) => setBizForm({ ...bizForm, cancellationPolicy: e.target.value })} /></div>
                    <button type="submit" className="btn btn-primary btn-sm" style={{ marginTop: "12px" }}>Save settings</button>
                  </form>
                </div>
              </div>
            )}

            {/* GATE SCANNERS TAB */}
            {activeTab === "scanners" && (
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                  <h3 style={{ margin: 0 }}>Gate entry Scanners accounts</h3>
                  <button onClick={() => setShowScannerModal(true)} className="btn btn-sm btn-primary">+ Add Gate Scanner</button>
                </div>

                {scanners.length === 0 ? (
                  <div className="empty-state">No scanners configured.</div>
                ) : (
                  <div className="table-wrap">
                    <table>
                      <thead>
                        <tr><th>Name</th><th>Username</th><th>Mobile</th><th>Assigned Gate</th><th>Active Event</th><th>Last Login</th><th>Action</th></tr>
                      </thead>
                      <tbody>
                        {scanners.map((s) => (
                          <tr key={s._id}>
                            <td><strong>{s.name}</strong></td>
                            <td><code>{s.username}</code></td>
                            <td>{s.phone}</td>
                            <td>{s.scannerDetails?.assignedGate || "Gate 1"}</td>
                            <td>{s.scannerDetails?.assignedEvent?.title || "None"}</td>
                            <td>{s.scannerDetails?.lastLogin ? new Date(s.scannerDetails.lastLogin).toLocaleString() : "-"}</td>
                            <td>
                              <button onClick={() => handleResetScannerPwd(s._id)} className="btn btn-sm btn-outline">Reset Password</button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* CREATE PAYOUT PROFILE MODAL */}
      {showPayoutModal && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.8)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: 16 }}>
          <div className="card-panel" style={{ width: "100%", maxWidth: 550, position: "relative" }}>
            <button onClick={() => setShowPayoutModal(false)} style={{ position: "absolute", top: 16, right: 16, background: "none", border: "none", color: "var(--text-dim)", fontSize: 20, cursor: "pointer" }}>×</button>
            <h3 style={{ marginTop: 0 }}>Add Payout Profile</h3>
            <form onSubmit={handleCreatePayoutProfile}>
              <div className="form-group"><label>Profile Label</label><input required value={payoutProfileForm.label} onChange={(e) => setPayoutProfileForm({ ...payoutProfileForm, label: e.target.value })} placeholder="e.g. Partner Account" /></div>
              <div className="form-group"><label>Account Holder Name</label><input required value={payoutProfileForm.accountHolderName} onChange={(e) => setPayoutProfileForm({ ...payoutProfileForm, accountHolderName: e.target.value })} /></div>
              <div className="form-row" style={{ display: "flex", gap: "10px" }}>
                <div className="form-group" style={{ flex: 1 }}><label>Bank Name</label><input value={payoutProfileForm.bankName} onChange={(e) => setPayoutProfileForm({ ...payoutProfileForm, bankName: e.target.value })} /></div>
                <div className="form-group" style={{ flex: 1 }}><label>Account Number</label><input value={payoutProfileForm.accountNumber} onChange={(e) => setPayoutProfileForm({ ...payoutProfileForm, accountNumber: e.target.value })} /></div>
              </div>
              <div className="form-row" style={{ display: "flex", gap: "10px" }}>
                <div className="form-group" style={{ flex: 1 }}><label>IFSC Code</label><input value={payoutProfileForm.ifscCode} onChange={(e) => setPayoutProfileForm({ ...payoutProfileForm, ifscCode: e.target.value })} /></div>
                <div className="form-group" style={{ flex: 1 }}><label>UPI ID (optional)</label><input value={payoutProfileForm.upiId} onChange={(e) => setPayoutProfileForm({ ...payoutProfileForm, upiId: e.target.value })} /></div>
              </div>
              <div className="form-row" style={{ display: "flex", gap: "10px" }}>
                <div className="form-group" style={{ flex: 1 }}><label>PAN No.</label><input value={payoutProfileForm.panNumber} onChange={(e) => setPayoutProfileForm({ ...payoutProfileForm, panNumber: e.target.value })} /></div>
                <div className="form-group" style={{ flex: 1 }}><label>GSTIN No. (optional)</label><input value={payoutProfileForm.gstNumber} onChange={(e) => setPayoutProfileForm({ ...payoutProfileForm, gstNumber: e.target.value })} /></div>
              </div>
              <div style={{ display: "flex", gap: "10px", alignItems: "center", marginTop: "12px" }}>
                <input type="checkbox" id="isDefaultProfile" checked={payoutProfileForm.isDefault} onChange={(e) => setPayoutProfileForm({ ...payoutProfileForm, isDefault: e.target.checked })} />
                <label htmlFor="isDefaultProfile" style={{ margin: 0, cursor: "pointer" }}>Set as default payout account</label>
              </div>
              <button type="submit" className="btn btn-block btn-primary" style={{ marginTop: "16px" }}>Save Settlement Account</button>
            </form>
          </div>
        </div>
      )}

      {/* CREATE SCANNER ACCOUNT MODAL */}
      {showScannerModal && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.8)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: 16 }}>
          <div className="card-panel" style={{ width: "100%", maxWidth: 480, position: "relative" }}>
            <button onClick={() => setShowScannerModal(false)} style={{ position: "absolute", top: 16, right: 16, background: "none", border: "none", color: "var(--text-dim)", fontSize: 20, cursor: "pointer" }}>×</button>
            <h3 style={{ marginTop: 0 }}>Add Gate Scanner</h3>
            <form onSubmit={handleCreateScanner}>
              <div className="form-group"><label>Scanner Name</label><input required value={scannerForm.name} onChange={(e) => setScannerForm({ ...scannerForm, name: e.target.value })} /></div>
              <div className="form-group"><label>Mobile Number (For Gate scans SMS)</label><input value={scannerForm.mobile} onChange={(e) => setScannerForm({ ...scannerForm, mobile: e.target.value })} /></div>
              <div className="form-group"><label>Username (Login code)</label><input required value={scannerForm.username} onChange={(e) => setScannerForm({ ...scannerForm, username: e.target.value })} /></div>
              <div className="form-group"><label>Password</label><input required type="password" value={scannerForm.password} onChange={(e) => setScannerForm({ ...scannerForm, password: e.target.value })} /></div>
              <div className="form-row" style={{ display: "flex", gap: "10px" }}>
                <div className="form-group" style={{ flex: 1 }}><label>Gate Name</label><input value={scannerForm.gateName} onChange={(e) => setScannerForm({ ...scannerForm, gateName: e.target.value })} /></div>
                <div className="form-group" style={{ flex: 1 }}>
                  <label>Assign to Event</label>
                  <select value={scannerForm.eventId} onChange={(e) => setScannerForm({ ...scannerForm, eventId: e.target.value })}>
                    <option value="">Choose Event</option>
                    {events.map((ev) => <option key={ev._id} value={ev._id}>{ev.title}</option>)}
                  </select>
                </div>
              </div>
              <button type="submit" className="btn btn-block btn-primary" style={{ marginTop: "16px" }}>Register Scanner</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrganiserDashboard;
