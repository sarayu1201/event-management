import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api/axios";

const TableBookingFlow = () => {
  const { id } = useParams(); // event ID
  const navigate = useNavigate();

  const [event, setEvent] = useState(null);
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);

  // Selection states
  const [selectedTableId, setSelectedTableId] = useState(null);
  const [guestsCount, setGuestsCount] = useState(2);
  const [selectedServices, setSelectedServices] = useState([]);
  const [notes, setNotes] = useState("");
  const [floor, setFloor] = useState("Indoor");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    Promise.all([
      api.get(`/events/${id}`),
      api.get(`/api/events/${id}/tables`)
    ]).then(([eventRes, tabRes]) => {
      setEvent(eventRes.data);
      setTables(tabRes.data || []);
    }).catch(() => setError("Failed to load tables list"))
      .finally(() => setLoading(false));
  }, [id]);

  const handleSelectTable = (table) => {
    if (table.status !== "Available") return;
    setSelectedTableId(table._id);
    setGuestsCount(table.minPersons);
    setSelectedServices([]);
    setError("");
  };

  const handleServiceToggle = (service) => {
    setSelectedServices(prev => {
      const exists = prev.some(s => s.name === service.name);
      if (exists) {
        return prev.filter(s => s.name !== service.name);
      } else {
        return [...prev, service];
      }
    });
  };

  const handleConfirmReservation = async () => {
    if (!selectedTableId) {
      setError("Please select a table from the floor layout plan.");
      return;
    }
    const table = tables.find(t => t._id === selectedTableId);
    if (!table) return;

    setSubmitting(true);
    setError("");

    try {
      const { data } = await api.post("/api/table-bookings", {
        eventId: id,
        tableId: selectedTableId,
        numberOfGuests: guestsCount,
        selectedServices,
        notes
      });
      // Redirect to simulated payment layout
      navigate(`/payment/${data._id}?type=table`);
    } catch (err) {
      setError(err.response?.data?.message || "Could not complete booking reservation.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="loading-wrap">Loading floor map layouts...</div>;
  if (!event) return <div className="section empty-state">Event not found</div>;

  const activeTable = tables.find(t => t._id === selectedTableId);
  const basePrice = activeTable ? activeTable.finalPrice : 0;
  const servicesTotal = selectedServices.reduce((sum, s) => sum + s.price, 0);
  const totalPayable = basePrice + servicesTotal;

  return (
    <div className="section" style={{ maxWidth: 1000, margin: "0 auto", padding: "20px" }}>
      <h2 className="section-title">VIP Table & Lounge Reservations</h2>
      <p style={{ color: "var(--text-dim)", fontSize: "14px", marginBottom: "20px" }}>
        Select your preferred table from the floor layout below to book.
      </p>

      <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: "24px" }}>
        
        {/* FLOOR MAP SELECTOR */}
        <div className="card-panel" style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
          <div style={{ display: "flex", gap: "10px", marginBottom: "16px" }}>
            <button onClick={() => setFloor("Indoor")} className={`btn btn-sm ${floor === "Indoor" ? "btn-primary" : "btn-outline"}`}>Indoor lounge</button>
            <button onClick={() => setFloor("Outdoor")} className={`btn btn-sm ${floor === "Outdoor" ? "btn-primary" : "btn-outline"}`}>Outdoor patio</button>
          </div>

          <div style={{
            width: "100%",
            maxWidth: "480px",
            height: "360px",
            background: "#0f172a",
            border: "1px solid var(--border)",
            borderRadius: "8px",
            position: "relative",
            overflow: "hidden"
          }}>
            {/* Restroom / exits */}
            <div style={{ position: "absolute", top: "10px", left: "10px", fontSize: "10px", color: "var(--text-dim)" }}>🚽 Restrooms</div>
            <div style={{ position: "absolute", top: "10px", right: "10px", fontSize: "10px", color: "#ef4444" }}>🚪 EXIT</div>

            {tables.filter(t => t.location === floor).map((t) => {
              const isSelected = t._id === selectedTableId;
              const isBooked = t.status === "Booked";
              return (
                <div
                  key={t._id}
                  onClick={() => handleSelectTable(t)}
                  style={{
                    position: "absolute",
                    left: t.positionX,
                    top: t.positionY,
                    width: t.width,
                    height: t.height,
                    borderRadius: t.shape === "round" ? "50%" : "4px",
                    background: isSelected ? "var(--pink)" : isBooked ? "rgba(239,68,68,0.2)" : "rgba(16,185,129,0.2)",
                    border: `2px solid ${isSelected ? "var(--pink)" : isBooked ? "#ef4444" : "#10b981"}`,
                    color: "#fff",
                    cursor: isBooked ? "not-allowed" : "pointer",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "11px",
                    fontWeight: "bold"
                  }}
                >
                  <div>{t.tableName}</div>
                  <div style={{ fontSize: "8px", opacity: 0.8 }}>({t.capacity} pax)</div>
                </div>
              );
            })}
          </div>

          <div style={{ display: "flex", gap: "16px", marginTop: "16px", fontSize: "12px" }}>
            <span style={{ display: "flex", gap: "6px", alignItems: "center" }}><span style={{ width: "12px", height: "12px", borderRadius: "50%", background: "rgba(16,185,129,0.2)", border: "2px solid #10b981" }}></span> Available</span>
            <span style={{ display: "flex", gap: "6px", alignItems: "center" }}><span style={{ width: "12px", height: "12px", borderRadius: "50%", background: "rgba(239,68,68,0.2)", border: "2px solid #ef4444" }}></span> Booked</span>
            <span style={{ display: "flex", gap: "6px", alignItems: "center" }}><span style={{ width: "12px", height: "12px", borderRadius: "50%", background: "var(--pink)", border: "2px solid var(--pink)" }}></span> Selected</span>
          </div>
        </div>

        {/* BOOKING CONTROLS & ADDONS PANEL */}
        <div>
          {activeTable ? (
            <div className="card-panel" style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <h3 style={{ margin: 0, color: "var(--pink)" }}>Table: {activeTable.tableName} ({activeTable.category})</h3>
              <p style={{ color: "var(--text-dim)", fontSize: "13px", margin: 0 }}>Capacity holds up to {activeTable.capacity} guests. Minimum booking: {activeTable.minPersons} persons.</p>

              {/* Guests slider */}
              <div className="form-group">
                <label>Number of Guests</label>
                <div style={{ display: "flex", gap: "12px", alignItems: "center", marginTop: "6px" }}>
                  <button type="button" onClick={() => setGuestsCount(g => Math.max(activeTable.minPersons, g - 1))} className="btn btn-xs btn-outline">−</button>
                  <span style={{ fontSize: "16px", fontWeight: "bold" }}>{guestsCount}</span>
                  <button type="button" onClick={() => setGuestsCount(g => Math.min(activeTable.maxPersons, g + 1))} className="btn btn-xs btn-outline">+</button>
                </div>
              </div>

              {/* Service addons list */}
              <div>
                <label style={{ fontWeight: "bold", fontSize: "14px" }}>Add Premium Lounge Services</label>
                <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "10px" }}>
                  {[
                    { name: "Complimentary Drinks Package", price: 1200, description: "Includes craft beers, premium whiskeys" },
                    { name: "Bottle Service Addon", price: 2500, description: "Vodka or gin with unlimited sodas" },
                    { name: "Dedicated VIP Waiter", price: 1500, description: "Direct table hospitality waiter assistance" }
                  ].map((s) => {
                    const isSelected = selectedServices.some(item => item.name === s.name);
                    return (
                      <div 
                        key={s.name}
                        onClick={() => handleServiceToggle(s)}
                        style={{
                          padding: "10px 14px",
                          borderRadius: "8px",
                          border: `1px solid ${isSelected ? "var(--pink)" : "var(--border)"}`,
                          background: isSelected ? "rgba(236,30,121,0.06)" : "var(--surface-2)",
                          cursor: "pointer",
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center"
                        }}
                      >
                        <div>
                          <div style={{ fontWeight: "600", fontSize: "13px" }}>{s.name}</div>
                          <div style={{ fontSize: "11px", color: "var(--text-dim)", marginTop: "2px" }}>{s.description}</div>
                        </div>
                        <div style={{ fontWeight: "bold", color: "var(--pink)" }}>+ ₹{s.price}</div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Notes */}
              <div className="form-group">
                <label>Special Requests / Notes</label>
                <textarea rows="2" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="e.g. Near stage, rooftop views preferred" />
              </div>

              {/* Price Breakdown */}
              <div style={{ borderTop: "1px dashed var(--border)", paddingTop: "14px", marginTop: "10px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", color: "var(--text-dim)", marginBottom: "6px" }}>
                  <span>Table Base Price</span><span>₹{basePrice}</span>
                </div>
                {servicesTotal > 0 && (
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", color: "var(--text-dim)", marginBottom: "6px" }}>
                    <span>Lounge Addons Total</span><span>₹{servicesTotal}</span>
                  </div>
                )}
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "16px", fontWeight: "bold", marginTop: "12px", borderTop: "1px solid var(--border)", paddingTop: "8px" }}>
                  <span>Total Amount</span><span style={{ color: "var(--pink)" }}>₹{totalPayable}</span>
                </div>
              </div>

              {error && <div className="alert alert-error">{error}</div>}

              <button onClick={handleConfirmReservation} disabled={submitting} className="btn btn-primary btn-block">
                {submitting ? "Please wait..." : `Reserve Table (Pay Deposit)`}
              </button>

            </div>
          ) : (
            <div className="card-panel empty-state">Select a table from the floor map layout grid.</div>
          )}
        </div>

      </div>
    </div>
  );
};

export default TableBookingFlow;
