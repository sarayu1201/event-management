import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/axios";

const statusClass = {
  success: "status-success",
  pending: "status-pending",
  failed: "status-failed",
};

const MyBookings = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState(null);

  useEffect(() => {
    api
      .get("/bookings/mine")
      .then(({ data }) => setBookings(data))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="dash-body">
      <h2 className="section-title">My Bookings</h2>

      {loading && <div className="loading-wrap">Loading...</div>}

      {!loading && bookings.length === 0 && (
        <div className="empty-state">
          You haven't booked any events yet. <Link to="/">Browse events</Link>
        </div>
      )}

      {!loading && bookings.length > 0 && (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Event</th>
                <th>Date</th>
                <th>Seats</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Ticket ID</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {bookings.map((b) => (
                <tr key={b._id}>
                  <td>{b.event?.title}</td>
                  <td>{b.event ? new Date(b.event.date).toDateString() : "-"}</td>
                  <td>{b.seats}</td>
                  <td>₹{b.totalAmount}</td>
                  <td>
                    <span className={`status-pill ${statusClass[b.paymentStatus]}`}>{b.paymentStatus}</span>
                  </td>
                  <td>{b.ticketId || "-"}</td>
                  <td>
                    {b.paymentStatus === "success" && (
                      <button 
                        onClick={() => setSelectedBooking(b)} 
                        className="btn btn-outline btn-sm"
                        style={{ padding: "4px 10px", fontSize: 12 }}
                      >
                        View Ticket
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selectedBooking && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "rgba(0,0,0,0.8)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1000,
          padding: "20px"
        }}>
          <div style={{
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: "16px",
            width: "100%",
            maxWidth: "440px",
            overflow: "hidden",
            position: "relative"
          }}>
            {/* Ticket Header */}
            <div style={{
              background: selectedBooking.event?.ticketThemeColor || "linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)",
              padding: "24px",
              textAlign: "center",
              position: "relative"
            }}>
              {selectedBooking.event?.ticketHeaderImage && (
                <img 
                  src={selectedBooking.event.ticketHeaderImage} 
                  alt="Banner" 
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    opacity: 0.3
                  }}
                />
              )}
              <h3 style={{ margin: 0, color: "#fff", fontSize: "18px", position: "relative" }}>
                {selectedBooking.event?.title}
              </h3>
              <p style={{ margin: "4px 0 0", color: "rgba(255,255,255,0.8)", fontSize: "12px", position: "relative" }}>
                Official Ticket
              </p>
            </div>

            {/* Ticket Body */}
            <div style={{ padding: "20px" }}>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: "20px" }}>
                <img 
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${selectedBooking.ticketId}`} 
                  alt="QR Code"
                  style={{ border: "5px solid #fff", borderRadius: "8px", background: "#fff", width: 130, height: 130 }} 
                />
                <span style={{ fontSize: "11px", color: "var(--text-dim)", marginTop: "6px" }}>
                  Scan at event entrance
                </span>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "8px", fontSize: "13px", color: "var(--text-dim)" }}>
                <div>🎫 Ticket ID: <strong style={{ color: "var(--text)" }}>{selectedBooking.ticketId}</strong></div>
                <div>📅 Date & Time: <strong>{new Date(selectedBooking.event?.date).toDateString()} at {selectedBooking.event?.time}</strong></div>
                <div>📍 Venue: <strong>{selectedBooking.event?.venue}, {selectedBooking.event?.city}</strong></div>
                <div>👥 Seats: <strong>{selectedBooking.seats} Ticket(s)</strong></div>
                <div style={{ borderTop: "1px solid var(--border)", paddingTop: "8px", display: "flex", justifyContent: "space-between", color: "var(--text)", fontWeight: "bold" }}>
                  <span>Total Paid</span>
                  <span>₹{selectedBooking.totalAmount}</span>
                </div>
              </div>

              {/* Special Instructions */}
              <div style={{
                marginTop: "16px",
                padding: "10px",
                background: "rgba(239,68,68,0.06)",
                border: "1px dashed rgba(239,68,68,0.3)",
                borderRadius: "8px",
                fontSize: "12px",
                color: "#f87171"
              }}>
                <strong>⚠️ Guidelines:</strong> {selectedBooking.event?.ticketInstructions || "Please carry a valid ID card."}
              </div>
            </div>

            {/* Modal Footer */}
            <div style={{
              padding: "12px 20px",
              borderTop: "1px solid var(--border)",
              background: "var(--surface-2)",
              display: "flex",
              gap: "8px",
              justifyContent: "flex-end"
            }}>
              <a 
                href={`https://api.whatsapp.com/send?text=${encodeURIComponent(
                  `🎫 Ticket ID: ${selectedBooking.ticketId}\nEvent: ${selectedBooking.event?.title}\nDate: ${new Date(selectedBooking.event?.date).toDateString()} at ${selectedBooking.event?.time}\nVenue: ${selectedBooking.event?.venue}\nSeats: ${selectedBooking.seats}\nTotal Paid: ₹${selectedBooking.totalAmount}`
                )}`} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="btn btn-outline btn-sm"
                style={{ borderColor: "#25D366", color: "#25D366", display: "inline-flex", alignItems: "center", gap: "6px" }}
              >
                💬 Share
              </a>
              <button 
                onClick={() => setSelectedBooking(null)}
                className="btn btn-primary btn-sm"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyBookings;
