import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import api from "../api/axios";
import DashboardNav from "../components/DashboardNav";

const ManageEvent = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [promoInput, setPromoInput] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  // Active Sub-Tab: stats, customForm, designer, seating, import, checkins, tables
  const [manageTab, setManageTab] = useState("stats");

  // VIP Lounge tables states
  const [tables, setTables] = useState([]);

  // Ticket Designer states
  const [designForm, setDesignForm] = useState({
    name: "",
    backgroundColor: "#1e3c72",
    themeColor: "#ff007f",
    backgroundImage: "",
    logoUrl: "",
    sponsorLogoUrl: "",
    fontFamily: "Arial",
    fontSize: "14px",
    qrPosition: "right",
    layoutType: "Classic",
    watermarkText: "",
    borderStyle: "solid"
  });

  // Custom Form Builder state
  const [formFields, setFormFields] = useState([]);
  const [newField, setNewField] = useState({ label: "", fieldType: "text", required: false, optionsCsv: "" });

  // Seating Layout configuration states
  const [seatingEnabled, setSeatingEnabled] = useState(false);
  const [seatSections, setSeatSections] = useState([
    { name: "VIP", rows: 5, seatsPerRow: 10 }
  ]);

  // CSV Attendee Imports states
  const [csvText, setCsvText] = useState("");
  const [importStatus, setImportStatus] = useState("");

  // Scan simulation states
  const [scanInput, setScanInput] = useState("");
  const [scanResult, setScanResult] = useState(null);
  const [scanError, setScanError] = useState("");
  const [scanning, setScanning] = useState(false);

  // Check-In hourly & scanner dashboard states
  const [checkInStats, setCheckInStats] = useState({
    totalBooked: 0,
    checkedIn: 0,
    pending: 0,
    attendancePercent: 0,
    gateStats: {},
    hourlyStats: Array(24).fill(0)
  });

  const loadData = () => {
    setLoading(true);
    Promise.all([
      api.get(`/events/${id}`),
      api.get(`/bookings/event/${id}`),
      api.get(`/api/ticketing/custom-forms/${id}`),
      api.get(`/api/ticketing/events/${id}/checkin-dashboard`),
      api.get(`/api/events/${id}/tables`)
    ])
      .then(([evRes, bookingsRes, formRes, checkInStatsRes, tablesRes]) => {
        setEvent(evRes.data);
        setBookings(bookingsRes.data);
        setFormFields(formRes.data?.fields || []);
        setCheckInStats(checkInStatsRes.data);
        setTables(tablesRes.data || []);
        setSeatingEnabled(evRes.data.seatingLayout?.enabled || false);
        if (evRes.data.seatingLayout?.sections?.length > 0) {
          setSeatSections(evRes.data.seatingLayout.sections);
        }
      })
      .catch(() => setError("Could not load event management options"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleDuplicate = async () => {
    if (!window.confirm("Duplicate this event? It will create a new draft copy.")) return;
    try {
      const { data } = await api.post(`/events/${id}/duplicate`);
      alert("Event duplicated successfully!");
      navigate(`/organiser/events/${data._id}`);
    } catch (err) {
      alert(err.response?.data?.message || "Could not duplicate event");
    }
  };

  const handleTogglePause = async () => {
    try {
      const { data } = await api.put(`/events/${id}/toggle-pause`);
      alert(data.message);
      loadData();
    } catch (err) {
      alert(err.response?.data?.message || "Could not toggle status");
    }
  };

  const handleCancelEvent = async () => {
    if (!window.confirm("Are you sure you want to cancel this event? This will stop all ticket bookings.")) return;
    try {
      await api.put(`/events/${id}/cancel`);
      alert("Event marked as cancelled.");
      loadData();
    } catch (err) {
      alert(err.response?.data?.message || "Could not cancel event");
    }
  };

  const handleAssignPromoter = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");
    try {
      const { data } = await api.post(`/events/${id}/assign-promoter`, { promoCodeOrEmail: promoInput });
      setMessage(data.message);
      setPromoInput("");
      loadData();
    } catch (err) {
      setError(err.response?.data?.message || "Could not assign promoter");
    }
  };

  // Ticket Template Designer submits
  const handleSaveDesignerTemplate = async (e) => {
    e.preventDefault();
    try {
      const { data } = await api.post("/api/ticketing/templates", {
        ...designForm,
        name: designForm.name || `${event.title} custom template`
      });
      // Link template to event
      await api.put(`/events/${id}`, { ticketTemplate: data._id });
      alert("Custom ticket design saved and linked successfully!");
    } catch (err) {
      alert("Failed to save designer template.");
    }
  };

  // Custom Form Builder field additions
  const handleAddField = () => {
    if (!newField.label) return;
    const opts = newField.optionsCsv ? newField.optionsCsv.split(",").map(s => s.trim()) : [];
    const fieldsCopy = [...formFields, { label: newField.label, fieldType: newField.fieldType, required: newField.required, options: opts }];
    setFormFields(fieldsCopy);
    setNewField({ label: "", fieldType: "text", required: false, optionsCsv: "" });
  };

  const handleRemoveField = (idx) => {
    setFormFields(formFields.filter((_, i) => i !== idx));
  };

  const handleSaveCustomForm = async () => {
    try {
      await api.post(`/api/ticketing/custom-forms/${id}`, { fields: formFields });
      alert("Custom registration form builder configured successfully!");
    } catch (err) {
      alert("Failed to save booking form builder.");
    }
  };

  // Interactive Seating layout save
  const handleSaveSeatingLayout = async () => {
    try {
      await api.put(`/events/${id}`, {
        seatingLayout: {
          enabled: seatingEnabled,
          sections: seatSections
        }
      });
      alert("Interactive seat map sections configured successfully!");
      loadData();
    } catch (err) {
      alert("Failed to update seating layout.");
    }
  };

  const handleSectionParamChange = (index, field, value) => {
    const copy = [...seatSections];
    copy[index][field] = field === "name" ? value : Number(value);
    setSeatSections(copy);
  };

  // CSV attendee invites import
  const handleImportCsvList = async () => {
    if (!csvText.trim()) return;
    setImportStatus("Parsing imported data...");
    
    // Parse simple CSV lines: Name,Email,Phone,Seat
    const lines = csvText.split("\n");
    const list = [];
    lines.forEach(line => {
      const parts = line.split(",").map(s => s.trim());
      if (parts[0]) {
        list.push({
          name: parts[0],
          email: parts[1] || "",
          phone: parts[2] || "",
          seat: parts[3] || ""
        });
      }
    });

    try {
      await api.post("/api/ticketing/tickets/import", { eventId: id, list });
      setImportStatus(`Successfully invited and generated ${list.length} tickets!`);
      setCsvText("");
      loadData();
    } catch (err) {
      setImportStatus("Import failed: check columns syntax");
    }
  };

  // Scanner simulator
  const handleScannerCheckIn = async (e) => {
    e.preventDefault();
    setScanResult(null);
    setScanError("");
    if (!scanInput.trim()) return;

    setScanning(true);
    try {
      const { data } = await api.post("/api/business/scanner/check-in", {
        ticketId: scanInput.trim(),
        gate: "Gate 1",
        entryType: "entry"
      });
      setScanResult(data);
      setScanInput("");
      loadData();
    } catch (err) {
      setScanError(err.response?.data?.message || "Check-in failed");
    } finally {
      setScanning(false);
    }
  };

  // VIP Table Reservation toggles (e.g. Block or Maintain table)
  const handleToggleTableStatus = async (tableId, currentStatus) => {
    const nextStatus = currentStatus === "Available" ? "Maintenance" : "Available";
    try {
      await api.put(`/api/tables/${tableId}`, { status: nextStatus });
      alert(`Table status updated to ${nextStatus}!`);
      loadData();
    } catch (err) {
      alert("Failed to toggle table status.");
    }
  };

  if (loading) return <div className="loading-wrap">Loading...</div>;
  if (!event) return <div className="section empty-state">Event not found</div>;

  const revenue = bookings.reduce((sum, b) => sum + b.totalAmount, 0);

  // VIP Table Stats
  const totalTables = tables.length;
  const bookedTables = tables.filter(t => t.status === "Booked").length;
  const occupancyPercent = totalTables > 0 ? Math.round((bookedTables / totalTables) * 100) : 0;
  const tableRevenue = tables.filter(t => t.status === "Booked").reduce((sum, t) => sum + t.finalPrice, 0);

  return (
    <div>
      <DashboardNav role="organiser" />
      <div className="dash-body">
        
        {/* Header Block */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px", marginBottom: "20px" }}>
          <div>
            <h2 className="section-title" style={{ margin: 0 }}>{event.title}</h2>
            <div style={{ display: "flex", gap: "8px", marginTop: "4px", flexWrap: "wrap" }}>
              <span className="status-pill status-success">{event.visibility.toUpperCase()}</span>
              <span className="status-pill status-pending">{event.approvalStatus?.toUpperCase() || "approved"}</span>
            </div>
          </div>
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            <Link to={`/organiser/events/${id}/designer`} className="btn btn-outline btn-sm" style={{ borderColor: "var(--purple)", color: "var(--purple)" }}>🎨 Visual Designer</Link>
            <Link to={`/organiser/events/${id}/lounge`} className="btn btn-outline btn-sm" style={{ borderColor: "#f59e0b", color: "#f59e0b" }}>💺 Lounge Designer</Link>
            <Link to={`/organiser/events/${id}/operations`} className="btn btn-outline btn-sm" style={{ borderColor: "#10b981", color: "#10b981" }}>🚨 Operations Feed</Link>
            <button className="btn btn-outline btn-sm" onClick={handleDuplicate}>Duplicate</button>
            <button className="btn btn-outline btn-sm" onClick={handleTogglePause}>
              {event.visibility === "draft" ? "Resume" : "Pause / Draft"}
            </button>
            {event.eventStatus !== "cancelled" && (
              <button className="btn btn-outline btn-sm" style={{ color: "var(--danger)", borderColor: "var(--danger)" }} onClick={handleCancelEvent}>Cancel</button>
            )}
          </div>
        </div>

        {/* Sub-Tab Navigation Bar */}
        <div style={{ display: "flex", gap: "8px", borderBottom: "1px solid var(--border)", paddingBottom: "10px", marginBottom: "24px", flexWrap: "wrap" }}>
          <button onClick={() => setManageTab("stats")} className={`btn btn-sm ${manageTab === "stats" ? "btn-primary" : "btn-outline"}`}>📊 General stats</button>
          <button onClick={() => setManageTab("tables")} className={`btn btn-sm ${manageTab === "tables" ? "btn-primary" : "btn-outline"}`}>🍾 VIP Table Reservations</button>
          <button onClick={() => setManageTab("designer")} className={`btn btn-sm ${manageTab === "designer" ? "btn-primary" : "btn-outline"}`}>🎨 Ticket Designer</button>
          <button onClick={() => setManageTab("customForm")} className={`btn btn-sm ${manageTab === "customForm" ? "btn-primary" : "btn-outline"}`}>📋 custom Registration form</button>
          <button onClick={() => setManageTab("seating")} className={`btn btn-sm ${manageTab === "seating" ? "btn-primary" : "btn-outline"}`}>💺 Seating Layout</button>
          <button onClick={() => setManageTab("import")} className={`btn btn-sm ${manageTab === "import" ? "btn-primary" : "btn-outline"}`}>📥 Attendee Imports</button>
          <button onClick={() => setManageTab("checkins")} className={`btn btn-sm ${manageTab === "checkins" ? "btn-primary" : "btn-outline"}`}>📱 Live scanner statistics</button>
        </div>

        {/* TAB CONTENTS */}
        {manageTab === "stats" && (
          <div>
            <div className="stat-grid">
              <div className="stat-card"><div className="label">Seats Sold</div><div className="value">{event.totalSeats - event.availableSeats}/{event.totalSeats}</div></div>
              <div className="stat-card"><div className="label">Confirmed bookings</div><div className="value">{bookings.length}</div></div>
              <div className="stat-card"><div className="label">Revenue</div><div className="value">₹{revenue}</div></div>
            </div>

            {/* Legacy assign promoters code */}
            <div className="card-panel" style={{ marginTop: "24px" }}>
              <h3>🔗 Assign Promoter code</h3>
              <form onSubmit={handleAssignPromoter} style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
                <input required value={promoInput} onChange={(e) => setPromoInput(e.target.value)} placeholder="Enter promoter promoCode or email" />
                <button className="btn btn-primary">Assign</button>
              </form>
              {message && <div style={{ color: "var(--success)", fontSize: "13px", marginTop: "8px" }}>{message}</div>}
            </div>
          </div>
        )}

        {/* VIP TABLE RESERVATIONS MODULE */}
        {manageTab === "tables" && (
          <div>
            {/* VIP Lounge Stats */}
            <div className="stat-grid" style={{ gridTemplateColumns: "1fr 1fr 1fr 1fr" }}>
              <div className="stat-card"><div className="label">Total VIP Tables</div><div className="value">{totalTables}</div></div>
              <div className="stat-card"><div className="label">Reserved / Booked</div><div className="value" style={{ color: "var(--pink)" }}>{bookedTables}</div></div>
              <div className="stat-card"><div className="label">Lounge Occupancy</div><div className="value">{occupancyPercent}%</div></div>
              <div className="stat-card"><div className="label">Table Revenue</div><div className="value" style={{ color: "#10b981" }}>₹{tableRevenue}</div></div>
            </div>

            {/* Visual Designer redirect reminder card */}
            <div className="card-panel" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderLeft: "4px solid #f59e0b", marginTop: "20px" }}>
              <div>
                <h4 style={{ margin: 0 }}>🎨 Need to design or coordinate your lounge floor layout?</h4>
                <p style={{ color: "var(--text-dim)", fontSize: "12px", margin: "4px 0 0 0" }}>Arrange tables, dance floors, bars, and VIP zones visually.</p>
              </div>
              <Link to={`/organiser/events/${id}/lounge`} className="btn btn-sm btn-primary">Open Lounge Designer</Link>
            </div>

            {/* Tables List */}
            <div className="card-panel" style={{ marginTop: "24px" }}>
              <h3>Lounge Tables Inventory</h3>
              {tables.length === 0 ? (
                <div className="empty-state" style={{ padding: "30px 0" }}>
                  No tables created yet. Click "Open Lounge Designer" above to configure your lounge plan.
                </div>
              ) : (
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr><th>Table Name</th><th>Category</th><th>Max Guests</th><th>Base Price</th><th>Status</th><th>Actions</th></tr>
                    </thead>
                    <tbody>
                      {tables.map(t => (
                        <tr key={t._id}>
                          <td><strong>{t.tableName}</strong></td>
                          <td>{t.category}</td>
                          <td>{t.capacity} Pax</td>
                          <td>₹{t.price}</td>
                          <td>
                            <span style={{
                              padding: "2px 8px",
                              borderRadius: "10px",
                              fontSize: "11px",
                              fontWeight: "bold",
                              background: t.status === "Booked" ? "rgba(239,68,68,0.15)" : t.status === "Maintenance" ? "rgba(245,158,11,0.15)" : "rgba(16,185,129,0.15)",
                              color: t.status === "Booked" ? "#ef4444" : t.status === "Maintenance" ? "#f59e0b" : "#10b981"
                            }}>
                              {t.status}
                            </span>
                          </td>
                          <td>
                            <button onClick={() => handleToggleTableStatus(t._id, t.status)} className="btn btn-xs btn-outline">
                              {t.status === "Maintenance" ? "Make Available" : "Block / Maintain"}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TICKET TEMPLATE DESIGNER */}
        {manageTab === "designer" && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
            <div className="card-panel">
              <h3>Live Template Customization</h3>
              <form onSubmit={handleSaveDesignerTemplate}>
                <div className="form-group"><label>Layout Theme Type</label>
                  <select value={designForm.layoutType} onChange={(e) => setDesignForm({ ...designForm, layoutType: e.target.value })}>
                    <option value="Classic">Classic Layout</option>
                    <option value="Modern">Modern Style</option>
                    <option value="Premium">Premium Gold</option>
                    <option value="VIP">VIP Dark Theme</option>
                    <option value="Luxury">Luxury Purple</option>
                    <option value="Minimal">Minimal Layout</option>
                  </select>
                </div>
                <div className="form-row" style={{ display: "flex", gap: "10px" }}>
                  <div className="form-group" style={{ flex: 1 }}><label>Bg Color</label>
                    <input type="color" value={designForm.backgroundColor} onChange={(e) => setDesignForm({ ...designForm, backgroundColor: e.target.value })} />
                  </div>
                  <div className="form-group" style={{ flex: 1 }}><label>Theme Accent</label>
                    <input type="color" value={designForm.themeColor} onChange={(e) => setDesignForm({ ...designForm, themeColor: e.target.value })} />
                  </div>
                </div>
                <div className="form-group"><label>Event Logo URL</label><input value={designForm.logoUrl} onChange={(e) => setDesignForm({ ...designForm, logoUrl: e.target.value })} /></div>
                <div className="form-group"><label>Sponsor Logo URL</label><input value={designForm.sponsorLogoUrl} onChange={(e) => setDesignForm({ ...designForm, sponsorLogoUrl: e.target.value })} /></div>
                <div className="form-group"><label>Font family</label><input value={designForm.fontFamily} onChange={(e) => setDesignForm({ ...designForm, fontFamily: e.target.value })} /></div>
                <div className="form-group"><label>Watermark text</label><input value={designForm.watermarkText} onChange={(e) => setDesignForm({ ...designForm, watermarkText: e.target.value })} /></div>
                <button type="submit" className="btn btn-primary btn-sm">Save & Apply Template Design</button>
              </form>
            </div>

            {/* LIVE DESIGN PREVIEW */}
            <div className="card-panel" style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", background: designForm.backgroundColor, border: `3px ${designForm.borderStyle} ${designForm.themeColor}`, color: "#fff", borderRadius: "12px", minHeight: "320px", padding: "20px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontSize: "12px", textTransform: "uppercase", color: designForm.themeColor }}>{designForm.layoutType} Pass</div>
                  <h2 style={{ margin: "4px 0 0 0", fontSize: "20px" }}>{event.title}</h2>
                </div>
                {designForm.logoUrl && <img src={designForm.logoUrl} alt="Logo" style={{ maxHeight: "40px", borderRadius: "4px" }} />}
              </div>

              {designForm.watermarkText && (
                <div style={{ fontSize: "38px", fontWeight: "bold", opacity: 0.1, position: "absolute", alignSelf: "center", transform: "rotate(-15deg)" }}>
                  {designForm.watermarkText}
                </div>
              )}

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginTop: "40px" }}>
                <div>
                  <div style={{ fontSize: "11px", opacity: 0.8 }}>ATTENDEE NAME</div>
                  <div style={{ fontWeight: "bold", fontSize: "15px" }}>John Doe</div>
                  <div style={{ fontSize: "11px", opacity: 0.8, marginTop: "6px" }}>VENUE</div>
                  <div style={{ fontSize: "13px" }}>{event.venue}</div>
                </div>
                {/* Simulated QR block based on position setting */}
                <div style={{ background: "#fff", padding: "6px", borderRadius: "6px", alignSelf: designForm.qrPosition === "right" ? "flex-end" : "center" }}>
                  <div style={{ width: "70px", height: "70px", background: "#000" }}></div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* CUSTOM BOOKING FORM BUILDER */}
        {manageTab === "customForm" && (
          <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: "24px" }}>
            <div className="card-panel">
              <h3>Create Custom Registration Form</h3>
              <p style={{ color: "var(--text-dim)", fontSize: "13px" }}>Configure what details (e.g. food preference, designations, T-shirt sizing) attendees must fill out when purchasing tickets.</p>
              
              <div style={{ display: "flex", flexDirection: "column", gap: "10px", margin: "16px 0" }}>
                <div className="form-group">
                  <label>Field Name / Label</label>
                  <input value={newField.label} onChange={(e) => setNewField({ ...newField, label: e.target.value })} placeholder="e.g. Dietary Preferences" />
                </div>
                <div className="form-row" style={{ display: "flex", gap: "10px" }}>
                  <div className="form-group" style={{ flex: 1 }}>
                    <label>Field Input Type</label>
                    <select value={newField.fieldType} onChange={(e) => setNewField({ ...newField, fieldType: e.target.value })}>
                      <option value="text">Text Box</option>
                      <option value="number">Number Box</option>
                      <option value="dropdown">Dropdown List</option>
                      <option value="textarea">Text Area</option>
                      <option value="checkbox">Checkbox Check</option>
                    </select>
                  </div>
                  <div className="form-group" style={{ flex: 0.5, display: "flex", flexDirection: "column", justifyContent: "center" }}>
                    <label>Required?</label>
                    <input type="checkbox" checked={newField.required} onChange={(e) => setNewField({ ...newField, required: e.target.checked })} />
                  </div>
                </div>
                {newField.fieldType === "dropdown" && (
                  <div className="form-group">
                    <label>Dropdown Options (comma separated)</label>
                    <input value={newField.optionsCsv} onChange={(e) => setNewField({ ...newField, optionsCsv: e.target.value })} placeholder="e.g. Veg, Non-Veg, Vegan" />
                  </div>
                )}
                <button type="button" onClick={handleAddField} className="btn btn-outline btn-sm">+ Add Field</button>
              </div>

              <button onClick={handleSaveCustomForm} className="btn btn-primary btn-block btn-sm">Save Registration Schema Form</button>
            </div>

            <div className="card-panel">
              <h3>Custom Form Fields Queue</h3>
              {formFields.length === 0 ? (
                <div style={{ color: "var(--text-dim)", fontSize: "13px" }}>Default form captures Name, email, and phone contact only. Add fields from designer panel.</div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  {formFields.map((f, i) => (
                    <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "var(--surface-2)", padding: "10px", borderRadius: "6px" }}>
                      <div>
                        <strong>{f.label}</strong> ({f.fieldType})
                        {f.required && <span style={{ color: "var(--pink)", marginLeft: "4px" }}>*Required</span>}
                      </div>
                      <button onClick={() => handleRemoveField(i)} style={{ background: "none", border: "none", color: "var(--danger)", cursor: "pointer" }}>Delete</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* SEATING LAYOUT CONFIG */}
        {manageTab === "seating" && (
          <div style={{ maxWidth: "550px" }}>
            <div className="card-panel">
              <h3>💺 Seating Sections Configuration</h3>
              <div style={{ display: "flex", gap: "10px", alignItems: "center", marginBottom: "16px" }}>
                <input type="checkbox" id="seatingEnabledCheck" checked={seatingEnabled} onChange={(e) => setSeatingEnabled(e.target.checked)} />
                <label htmlFor="seatingEnabledCheck" style={{ margin: 0, fontWeight: "bold", cursor: "pointer" }}>Enable Reserved Seat Selection Grid during checkout</label>
              </div>

              {seatingEnabled && (
                <div>
                  {seatSections.map((sect, idx) => (
                    <div key={idx} style={{ background: "var(--surface-2)", padding: "12px", borderRadius: "8px", marginBottom: "12px" }}>
                      <div className="form-group"><label>Section Name</label><input value={sect.name} onChange={(e) => handleSectionParamChange(idx, "name", e.target.value)} /></div>
                      <div className="form-row" style={{ display: "flex", gap: "10px" }}>
                        <div className="form-group" style={{ flex: 1 }}><label>Rows count</label><input type="number" value={sect.rows} onChange={(e) => handleSectionParamChange(idx, "rows", e.target.value)} /></div>
                        <div className="form-group" style={{ flex: 1 }}><label>Seats per row</label><input type="number" value={sect.seatsPerRow} onChange={(e) => handleSectionParamChange(idx, "seatsPerRow", e.target.value)} /></div>
                      </div>
                    </div>
                  ))}
                  <button type="button" onClick={() => setSeatSections([...seatSections, { name: "Platinum", rows: 4, seatsPerRow: 8 }])} className="btn btn-sm btn-outline">+ Add Section</button>
                </div>
              )}
              <button onClick={handleSaveSeatingLayout} className="btn btn-primary btn-block btn-sm" style={{ marginTop: "16px" }}>Save Seating Layout</button>
            </div>
          </div>
        )}

        {/* ATTENDEE IMPORT CSV */}
        {manageTab === "import" && (
          <div style={{ maxWidth: "600px" }}>
            <div className="card-panel">
              <h3>📥 Bulk Invite Attendees CSV Importer</h3>
              <p style={{ color: "var(--text-dim)", fontSize: "13px" }}>Paste attendee details. Format: <code>Name, Email, Phone, Seat</code> (One attendee per line).</p>
              
              <textarea 
                rows="6" 
                value={csvText} 
                onChange={(e) => setCsvText(e.target.value)} 
                placeholder="Ramesh Kumar, ramesh@gmail.com, 9876543210, VIP-A12&#10;Suresh Kumar, suresh@gmail.com, 9876543211, General-B14" 
                style={{ fontFamily: "monospace", fontSize: "12px", marginBottom: "16px" }}
              />
              
              <button onClick={handleImportCsvList} className="btn btn-primary btn-sm">Import Guests & Generate Tickets</button>
              {importStatus && <div style={{ color: "var(--success)", fontSize: "13px", marginTop: "12px" }}>{importStatus}</div>}
            </div>
          </div>
        )}

        {/* LIVE SCANNER STATISTICS DASHBOARD */}
        {manageTab === "checkins" && (
          <div>
            <div className="stat-grid" style={{ gridTemplateColumns: "1fr 1fr 1fr 1fr" }}>
              <div className="stat-card"><div className="label">Total Booked</div><div className="value">{checkInStats.totalBooked}</div></div>
              <div className="stat-card"><div className="label">Checked In</div><div className="value" style={{ color: "#10b981" }}>{checkInStats.checkedIn}</div></div>
              <div className="stat-card"><div className="label">Pending</div><div className="value" style={{ color: "var(--pink)" }}>{checkInStats.pending}</div></div>
              <div className="stat-card"><div className="label">Attendance %</div><div className="value">{checkInStats.attendancePercent}%</div></div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px", marginTop: "24px" }}>
              {/* Gate wise checkins logs */}
              <div className="card-panel">
                <h3>🚪 Gate-wise scan logs count</h3>
                {Object.keys(checkInStats.gateStats || {}).length === 0 ? (
                  <div style={{ color: "var(--text-dim)" }}>No checks scanned.</div>
                ) : (
                  <div className="table-wrap">
                    <table>
                      <thead><tr><th>Gate Code</th><th>Scanned entries</th></tr></thead>
                      <tbody>
                        {Object.entries(checkInStats.gateStats).map(([gate, count]) => (
                          <tr key={gate}><td><strong>{gate}</strong></td><td>{count} checked in</td></tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Simulated QR Code check-in log box */}
              <div className="card-panel">
                <h3>📱 Gate Scanner simulation checks</h3>
                <form onSubmit={handleScannerCheckIn} style={{ display: "flex", gap: "10px" }}>
                  <input required value={scanInput} onChange={(e) => setScanInput(e.target.value)} placeholder="Type/paste Ticket ID" style={{ fontSize: "13px" }} />
                  <button className="btn btn-primary" disabled={scanning}>{scanning ? "..." : "Scan"}</button>
                </form>
                {scanError && <div style={{ color: "#ef4444", fontSize: "13px", marginTop: "8px" }}>{scanError}</div>}
                {scanResult && <div style={{ color: "#10b981", fontSize: "13px", marginTop: "8px" }}>{scanResult.message}</div>}
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default ManageEvent;
