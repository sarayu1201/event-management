import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import api from "../api/axios";

const BookingConfirmation = () => {
  const { bookingId } = useParams();
  const [booking, setBooking] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .get(`/bookings/${bookingId}`)
      .then(({ data }) => setBooking(data))
      .catch(() => setError("Could not load booking"));
  }, [bookingId]);

  if (error) return <div className="section empty-state">{error}</div>;
  if (!booking) return <div className="loading-wrap">Loading...</div>;

  const failed = booking.paymentStatus === "failed";

  return (
    <div className="confirmation-shell">
      <div className="confirmation-icon" style={failed ? { background: "rgba(239,68,68,0.15)", color: "#f87171" } : {}}>
        {failed ? "✕" : "✓"}
      </div>
      <h2>{failed ? "Payment Failed" : "Booking Confirmed!"}</h2>
      <p style={{ color: "var(--text-dim)" }}>
        {failed
          ? "Your payment could not be processed. Please try again."
          : "Your tickets have been booked successfully. See you at the event!"}
      </p>

      {!failed && (
        <div className="ticket-card">
          <div className="info-row">🎫 Ticket ID: <strong>{booking.ticketId}</strong></div>
          
          {/* Dynamic QR Code */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", margin: "24px 0", padding: "16px", background: "rgba(255,255,255,0.03)", borderRadius: "8px", border: "1px solid var(--border)" }}>
            <img 
              src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${booking.ticketId}`} 
              alt="Ticket QR Code" 
              style={{ border: "6px solid #fff", borderRadius: "8px", background: "#fff", width: 140, height: 140 }} 
            />
            <span style={{ fontSize: 11, color: "var(--text-dim)", marginTop: 10 }}>Scan at event entrance</span>
          </div>

          <div className="info-row">🎉 {booking.event.title}</div>
          <div className="info-row">📅 {new Date(booking.event.date).toDateString()} at {booking.event.time}</div>
          <div className="info-row">📍 {booking.event.venue}, {booking.event.city}</div>
          <div className="info-row">👥 Seats: {booking.seats}</div>
          {booking.discount > 0 && <div className="info-row">🏷️ Discount applied: ₹{booking.discount} (code: {booking.promoCodeUsed})</div>}
          <div className="info-row">💳 Transaction ID: {booking.transactionId}</div>
          <div className="price-total">
            <span>Total Paid</span>
            <span>₹{booking.totalAmount}</span>
          </div>
        </div>
      )}

      <div style={{ marginTop: 28, display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
        {!failed && (
          <a 
            href={`https://api.whatsapp.com/send?text=${encodeURIComponent(
              `🎫 Ticket Booked Successfully! 🎉\n\nTicket ID: ${booking.ticketId}\nEvent: ${booking.event.title}\nDate: ${new Date(booking.event.date).toDateString()} at ${booking.event.time}\nVenue: ${booking.event.venue}, ${booking.event.city}\nSeats: ${booking.seats}\nTotal Paid: ₹${booking.totalAmount}\n\nShow this ticket QR code at the entrance!`
            )}`} 
            target="_blank" 
            rel="noopener noreferrer" 
            className="btn btn-outline"
            style={{ borderColor: "#25D366", color: "#25D366", display: "inline-flex", alignItems: "center", gap: 8 }}
          >
            💬 WhatsApp Ticket
          </a>
        )}
        <Link to="/my-bookings" className="btn btn-outline">
          View My Bookings
        </Link>
        <Link to="/" className="btn btn-primary">
          Explore More Events
        </Link>
      </div>
    </div>
  );
};

export default BookingConfirmation;
