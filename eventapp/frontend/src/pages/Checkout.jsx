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
  const [seats, setSeats] = useState(location.state?.seats || 1);
  const [promoCode, setPromoCode] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    api.get(`/events/${id}`).then(({ data }) => setEvent(data));
  }, [id]);

  const handleConfirm = async () => {
    setError("");
    setSubmitting(true);
    try {
      const { data } = await api.post("/bookings", {
        eventId: id,
        seats,
        promoCode: promoCode.trim() || undefined,
      });
      navigate(`/payment/${data._id}`);
    } catch (err) {
      setError(err.response?.data?.message || "Could not create booking");
    } finally {
      setSubmitting(false);
    }
  };

  if (!event) return <div className="loading-wrap">Loading...</div>;

  return (
    <div className="section" style={{ maxWidth: 600 }}>
      <h2 className="section-title">Attendee Info & Review</h2>

      <div className="card-panel">
        <div className="info-row">🎫 {event.title}</div>
        <div className="info-row">📅 {new Date(event.date).toDateString()} at {event.time}</div>
        <div className="info-row">📍 {event.venue}, {event.city}</div>
      </div>

      <div className="card-panel">
        <div className="form-group">
          <label>Booking For</label>
          <input value={user?.name || ""} disabled />
        </div>
        <div className="form-group">
          <label>Email</label>
          <input value={user?.email || ""} disabled />
        </div>
        <div className="form-group">
          <label>Number of Tickets</label>
          <div className="seat-stepper" style={{ margin: "6px 0" }}>
            <button type="button" onClick={() => setSeats((s) => Math.max(1, s - 1))}>−</button>
            <span>{seats}</span>
            <button type="button" onClick={() => setSeats((s) => Math.min(event.availableSeats, 10, s + 1))}>+</button>
          </div>
        </div>
        <div className="form-group">
          <label>Promo Code (optional)</label>
          <input value={promoCode} onChange={(e) => setPromoCode(e.target.value)} placeholder="e.g. PRIYA10" />
        </div>
      </div>

      <div className="card-panel">
        <div className="price-line">
          <span>Tickets ({seats} × ₹{event.price})</span>
          <span>₹{event.price * seats}</span>
        </div>
        <div className="price-total">
          <span>Payable Now</span>
          <span>₹{event.price * seats}</span>
        </div>
        {promoCode && (
          <p style={{ fontSize: 12, color: "var(--text-dim)", marginTop: 8 }}>
            Discount (if valid) will be applied at checkout.
          </p>
        )}
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <button className="btn btn-primary btn-block" disabled={submitting} onClick={handleConfirm}>
        {submitting ? "Please wait..." : `Continue to Payment`}
      </button>
    </div>
  );
};

export default Checkout;
