import { useEffect, useState } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";

const Checkout = () => {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [event, setEvent] = useState(null);
  const [ticketTypeName, setTicketTypeName] = useState("");
  const [ticketPrice, setTicketPrice] = useState(0);
  const [maxSeats, setMaxSeats] = useState(10);
  const [seats, setSeats] = useState(location.state?.seats || 1);
  const [promoCode, setPromoCode] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Custom Form Builder fields
  const [customFormFields, setCustomFormFields] = useState([]);
  
  // Seating states
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [lockedByOthers, setLockedByOthers] = useState([]);
  const [timeLeft, setTimeLeft] = useState(0); // in seconds

  // Attendees list state
  const [attendees, setAttendees] = useState([
    { name: "", email: "", phone: "", seat: "", customResponses: {} }
  ]);

  // GST State
  const [gstRate, setGstRate] = useState(0);

  const loadData = () => {
    Promise.all([
      api.get(`/events/${id}`),
      api.get(`/api/ticketing/custom-forms/${id}`),
      api.get(`/api/enterprise-ticketing/events/${id}/seat-locks`)
    ]).then(([eventRes, formRes, locksRes]) => {
      const data = eventRes.data;
      setEvent(data);
      setCustomFormFields(formRes.data?.fields || []);
      setLockedByOthers(locksRes.data || []);

      if (data.ticketTypes && data.ticketTypes.length > 0) {
        setTicketTypeName(data.ticketTypes[0].name);
        setTicketPrice(data.ticketTypes[0].price);
        setMaxSeats(data.ticketTypes[0].bookingLimit || 10);
        setGstRate(data.ticketTypes[0].gstRate || 0);
      } else {
        setTicketPrice(data.price);
        setMaxSeats(Math.min(data.availableSeats, 10));
        setGstRate(data.price > 499 ? 18 : 0);
      }
    }).catch(err => {
      console.error(err);
      setError("Failed to load checkout details. Make sure your backend server is deployed and online.");
      // Set empty event to bypass loader screen and show the error message
      setEvent({});
    });
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // Countdown timer effect
  useEffect(() => {
    if (timeLeft <= 0) {
      if (selectedSeats.length > 0) {
        alert("⚠️ Seating reservation lock expired! Your selected seats have been released.");
        setSelectedSeats([]);
      }
      return;
    }
    const interval = setInterval(() => {
      setTimeLeft(t => t - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [timeLeft, selectedSeats]);

  // Keep attendees list size matching the number of seats
  useEffect(() => {
    const count = Number(seats);
    setAttendees((prev) => {
      const copy = [...prev];
      if (copy.length < count) {
        while (copy.length < count) {
          copy.push({ name: "", email: "", phone: "", seat: "", customResponses: {} });
        }
      } else if (copy.length > count) {
        copy.splice(count);
      }
      return copy;
    });
  }, [seats]);

  // Autofill attendee 1 with logged in user details
  useEffect(() => {
    if (user && attendees.length > 0 && !attendees[0].name) {
      setAttendees(prev => {
        const copy = [...prev];
        copy[0] = {
          ...copy[0],
          name: user.name,
          email: user.email || "",
          phone: user.phone || ""
        };
        return copy;
      });
    }
  }, [user, attendees]);

  const handleTicketTypeChange = (name) => {
    const option = event.ticketTypes.find((t) => t.name === name);
    if (option) {
      setTicketTypeName(name);
      setTicketPrice(option.price);
      setMaxSeats(option.bookingLimit || 10);
      setGstRate(option.gstRate || 0);
      setSeats(1);
      setSelectedSeats([]);
      setTimeLeft(0);
    }
  };

  const handleAttendeeChange = (index, field, value) => {
    setAttendees((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  const handleCustomResponseChange = (index, label, value) => {
    setAttendees((prev) => {
      const copy = [...prev];
      copy[index] = {
        ...copy[index],
        customResponses: { ...copy[index].customResponses, [label]: value }
      };
      return copy;
    });
  };

  // Seating grid selector with lock triggers
  const handleSelectSeat = async (seatId) => {
    const allReserved = event.seatingLayout?.sections?.flatMap(s => s.reservedSeats || []) || [];
    if (allReserved.includes(seatId) || lockedByOthers.includes(seatId)) return;

    if (selectedSeats.includes(seatId)) {
      try {
        await api.post("/api/enterprise-ticketing/seat-locks/release", { eventId: id, seatId });
        setSelectedSeats(selectedSeats.filter(s => s !== seatId));
      } catch (err) {
        alert("Failed to release seat lock");
      }
    } else {
      if (selectedSeats.length >= seats) {
        // Release oldest locked seat first
        const oldest = selectedSeats[0];
        try {
          await api.post("/api/enterprise-ticketing/seat-locks/release", { eventId: id, seatId: oldest });
          setSelectedSeats(prev => prev.filter(s => s !== oldest));
        } catch (err) {
          console.error("Failed oldest release", err);
        }
      }

      // Lock seat in Database
      try {
        await api.post("/api/enterprise-ticketing/seat-locks", { eventId: id, seatId });
        setSelectedSeats(prev => [...prev, seatId]);
        // Set lock timer to 10 minutes (600 seconds)
        if (timeLeft <= 0) setTimeLeft(600);
      } catch (err) {
        alert(err.response?.data?.message || "Seat is held by another buyer");
      }
    }
  };

  // Map selected seats back to attendees array
  useEffect(() => {
    setAttendees(prev => {
      return prev.map((att, i) => ({
        ...att,
        seat: selectedSeats[i] || ""
      }));
    });
  }, [selectedSeats]);

  const handleConfirm = async () => {
    setError("");
    for (let i = 0; i < attendees.length; i++) {
      if (!attendees[i].name) {
        setError(`Please enter the name for Attendee #${i + 1}`);
        return;
      }
    }

    if (event.seatingLayout?.enabled && selectedSeats.length < seats) {
      setError(`Please select precisely ${seats} seats on the seat layout grid.`);
      return;
    }

    setSubmitting(true);
    const { cgst, sgst } = calculateTaxBreakdown();

    try {
      const { data } = await api.post("/bookings", {
        eventId: id,
        seats,
        promoCode: promoCode.trim() || undefined,
        ticketTypeName,
        gstRate,
        cgst,
        sgst,
        igst: 0,
        attendees
      });
      // Clear seat locks selection timers
      setTimeLeft(0);
      setSelectedSeats([]);
      navigate(`/payment/${data._id}`);
    } catch (err) {
      setError(err.response?.data?.message || "Could not create booking");
    } finally {
      setSubmitting(false);
    }
  };

  const calculateTaxBreakdown = () => {
    const gross = ticketPrice * seats;
    if (gstRate === 0) return { net: gross, totalGst: 0, cgst: 0, sgst: 0 };
    const net = Math.round((gross / (1 + gstRate / 100)) * 100) / 100;
    const totalGst = Math.round((gross - net) * 100) / 100;
    const cgst = Math.round((totalGst / 2) * 100) / 100;
    const sgst = cgst;
    return { net, totalGst, cgst, sgst };
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  if (!event) return <div className="loading-wrap">Loading...</div>;

  const { net, totalGst, cgst, sgst } = calculateTaxBreakdown();

  return (
    <div className="section" style={{ maxWidth: 650, margin: "0 auto" }}>
      <h2 className="section-title">Checkout Details</h2>

      {/* Seat Reserve Expiration timer widget */}
      {timeLeft > 0 && (
        <div style={{
          background: "rgba(239,68,68,0.12)",
          border: "1px solid #ef4444",
          color: "#ef4444",
          borderRadius: "8px",
          padding: "12px",
          marginBottom: "16px",
          textAlign: "center",
          fontWeight: "bold",
          fontSize: "14px"
        }}>
          ⏱️ Holding your selected seats. Expiration timer: {formatTime(timeLeft)}
        </div>
      )}

      <div className="card-panel">
        <div className="info-row">🎫 <strong>{event.title}</strong></div>
        <div className="info-row">📅 {new Date(event.date).toDateString()} at {event.time}</div>
        <div className="info-row">📍 {event.venue}, {event.city}</div>
      </div>

      {/* Ticket Tier selection */}
      {event.ticketTypes && event.ticketTypes.length > 0 && (
        <div className="card-panel">
          <h3 style={{ marginTop: 0, fontSize: "15px" }}>Choose Ticket Tier</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "10px" }}>
            {event.ticketTypes.map((t) => (
              <div 
                key={t.name}
                onClick={() => handleTicketTypeChange(t.name)}
                style={{
                  padding: "12px",
                  borderRadius: "8px",
                  border: `2px solid ${ticketTypeName === t.name ? "var(--pink)" : "var(--border)"}`,
                  background: ticketTypeName === t.name ? "rgba(236,30,121,0.04)" : "var(--surface-2)",
                  cursor: "pointer",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center"
                }}
              >
                <div>
                  <div style={{ fontWeight: "600", color: "var(--text)" }}>{t.name}</div>
                  <div style={{ fontSize: "12px", color: "var(--text-dim)", marginTop: "2px" }}>{t.benefits}</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontWeight: "bold", fontSize: "16px", color: "var(--pink)" }}>₹{t.price}</div>
                  <div style={{ fontSize: "11px", color: "var(--text-dim)" }}>{t.availableQuantity} left</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Ticket Counter Stepper */}
      <div className="card-panel">
        <div className="form-group" style={{ margin: 0 }}>
          <label style={{ fontWeight: "600" }}>Number of Tickets</label>
          <div className="seat-stepper" style={{ margin: "10px 0" }}>
            <button type="button" onClick={() => setSeats((s) => Math.max(1, s - 1))}>−</button>
            <span style={{ fontSize: "18px", fontWeight: "bold" }}>{seats}</span>
            <button type="button" onClick={() => setSeats((s) => Math.min(maxSeats, s + 1))}>+</button>
          </div>
        </div>
      </div>

      {/* SEAT SELECTION MAP GRID */}
      {event.seatingLayout?.enabled && (
        <div className="card-panel">
          <h3 style={{ marginTop: 0, fontSize: "15px" }}>💺 Choose Your Seating Selection</h3>
          <p style={{ fontSize: "12px", color: "var(--text-dim)" }}>Select precisely {seats} seats from the sections grid below.</p>
          
          {event.seatingLayout.sections.map((sect) => {
            const rowsArray = Array.from({ length: sect.rows }, (_, r) => String.fromCharCode(65 + r));
            const seatsArray = Array.from({ length: sect.seatsPerRow }, (_, s) => s + 1);
            
            return (
              <div key={sect.name} style={{ marginTop: "16px", borderTop: "1px solid var(--border)", paddingTop: "12px" }}>
                <h4 style={{ margin: "0 0 10px 0", fontSize: "14px" }}>Section: {sect.name}</h4>
                <div style={{ display: "flex", flexDirection: "column", gap: "6px", overflowX: "auto", paddingBottom: "10px" }}>
                  {rowsArray.map((row) => (
                    <div key={row} style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                      <span style={{ width: "20px", fontWeight: "bold", fontSize: "12px" }}>{row}</span>
                      {seatsArray.map((num) => {
                        const seatId = `${sect.name}-${row}${num}`;
                        const isReserved = sect.reservedSeats?.includes(seatId);
                        const isLockedByOther = lockedByOthers.includes(seatId);
                        const isSelected = selectedSeats.includes(seatId);
                        return (
                          <div 
                            key={seatId}
                            onClick={() => handleSelectSeat(seatId)}
                            style={{
                              width: "28px",
                              height: "28px",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              borderRadius: "4px",
                              fontSize: "10px",
                              fontWeight: "bold",
                              cursor: (isReserved || isLockedByOther) ? "not-allowed" : "pointer",
                              background: isReserved ? "rgba(239,68,68,0.2)" : isLockedByOther ? "rgba(245,158,11,0.2)" : isSelected ? "var(--pink)" : "var(--surface-2)",
                              color: isReserved ? "#ef4444" : isLockedByOther ? "#f59e0b" : "#fff",
                              border: `1px solid ${isSelected ? "var(--pink)" : "var(--border)"}`
                            }}
                          >
                            {num}
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MULTIPLE ATTENDEES FORM LOOPS */}
      {seats > 0 && (
        <div className="card-panel">
          <h3 style={{ marginTop: 0, fontSize: "15px" }}>📋 Attendees Details Information</h3>
          {Array.from({ length: seats }).map((_, idx) => (
            <div key={idx} style={{ marginTop: "20px", borderTop: idx > 0 ? "1px dashed var(--border)" : "none", paddingTop: idx > 0 ? "16px" : "0" }}>
              <h4 style={{ margin: "0 0 12px 0", fontSize: "14px", color: "var(--pink)" }}>Attendee #{idx + 1}</h4>
              
              <div className="form-row">
                <div className="form-group">
                  <label>Full Name</label>
                  <input required value={attendees[idx]?.name || ""} onChange={(e) => handleAttendeeChange(idx, "name", e.target.value)} placeholder="Attendee Name" />
                </div>
                <div className="form-group">
                  <label>Email Address</label>
                  <input type="email" value={attendees[idx]?.email || ""} onChange={(e) => handleAttendeeChange(idx, "email", e.target.value)} placeholder="email@domain.com" />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Phone Number</label>
                  <input value={attendees[idx]?.phone || ""} onChange={(e) => handleAttendeeChange(idx, "phone", e.target.value)} placeholder="10-digit mobile" />
                </div>
                {event.seatingLayout?.enabled && (
                  <div className="form-group">
                    <label>Assigned Seat</label>
                    <input value={attendees[idx]?.seat || ""} disabled style={{ background: "var(--surface-2)" }} />
                  </div>
                )}
              </div>

              {/* RENDER CUSTOM FORM FIELDS BUILDER SCHEMA */}
              {customFormFields.map((field) => (
                <div className="form-group" key={field.label}>
                  <label>{field.label} {field.required && <span style={{ color: "var(--pink)" }}>*</span>}</label>
                  {field.fieldType === "dropdown" ? (
                    <select required={field.required} value={attendees[idx]?.customResponses?.[field.label] || ""} onChange={(e) => handleCustomResponseChange(idx, field.label, e.target.value)}>
                      <option value="">Select Option</option>
                      {field.options?.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                    </select>
                  ) : field.fieldType === "textarea" ? (
                    <textarea required={field.required} value={attendees[idx]?.customResponses?.[field.label] || ""} onChange={(e) => handleCustomResponseChange(idx, field.label, e.target.value)} rows="2" />
                  ) : (
                    <input required={field.required} type={field.fieldType} value={attendees[idx]?.customResponses?.[field.label] || ""} onChange={(e) => handleCustomResponseChange(idx, field.label, e.target.value)} />
                  )}
                </div>
              ))}
            </div>
          ))}
        </div>
      )}

      {/* PROMO CODES */}
      <div className="card-panel">
        <div className="form-group" style={{ margin: 0 }}>
          <label>Promo Code (optional)</label>
          <input value={promoCode} onChange={(e) => setPromoCode(e.target.value)} placeholder="e.g. PRIYA10" />
        </div>
      </div>

      {/* TAX BILLING SUMMARY */}
      <div className="card-panel">
        <h3 style={{ marginTop: 0, fontSize: "15px", marginBottom: "12px" }}>Tax Summary Breakdown</h3>
        <div className="price-line" style={{ fontSize: "13px", color: "var(--text-dim)", marginBottom: "6px" }}>
          <span>Ticket base price (Excl. GST)</span>
          <span>₹{net}</span>
        </div>
        {gstRate > 0 && (
          <>
            <div className="price-line" style={{ fontSize: "13px", color: "var(--text-dim)", marginBottom: "6px" }}>
              <span>CGST ({gstRate/2}%)</span>
              <span>₹{cgst}</span>
            </div>
            <div className="price-line" style={{ fontSize: "13px", color: "var(--text-dim)", marginBottom: "6px" }}>
              <span>SGST ({gstRate/2}%)</span>
              <span>₹{sgst}</span>
            </div>
          </>
        )}
        <div className="price-total" style={{ borderTop: "1px solid var(--border)", paddingTop: "10px", marginTop: "10px" }}>
          <span>Total Payable (Incl. GST)</span>
          <span>₹{ticketPrice * seats}</span>
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <button className="btn btn-primary btn-block" disabled={submitting} onClick={handleConfirm}>
        {submitting ? "Please wait..." : `Continue to Payment`}
      </button>
    </div>
  );
};

export default Checkout;
