import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";

const EventDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [event, setEvent] = useState(null);
  const [seats, setSeats] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .get(`/events/${id}`)
      .then(({ data }) => setEvent(data))
      .catch(() => setError("Event not found"))
      .finally(() => setLoading(false));
  }, [id]);

  const handleProceed = () => {
    if (!user) {
      navigate("/login", { state: { from: `/checkout/${id}` } });
      return;
    }
    if (user.role !== "user") {
      setError("Please log in with a user account to book tickets.");
      return;
    }
    navigate(`/checkout/${id}`, { state: { seats } });
  };

  if (loading) return <div className="loading-wrap">Loading event...</div>;
  if (error && !event) return <div className="section empty-state">{error}</div>;
  if (!event) return null;

  const soldOut = event.availableSeats <= 0;

  return (
    <div className="section">
      <img
        className="event-hero-banner"
        src={event.bannerImage || "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=1000"}
        alt={event.title}
      />

      <div className="event-detail-grid">
        <div>
          <span className="badge">{event.category}</span>
          <h1 style={{ margin: "16px 0 8px" }}>{event.title}</h1>

          <div className="info-row">📅 {new Date(event.date).toDateString()} at {event.time}</div>
          <div className="info-row">
            📍 {event.venue}, {event.city}
            {event.address ? ` — ${event.address}` : ""}
          </div>
          <div className="info-row">
            🎟️ {event.availableSeats} / {event.totalSeats} seats available
          </div>
          <div className="info-row">
            🏢 Hosted by {event.organiser?.companyName || event.organiser?.name || "Organiser"}
          </div>

          <h3 style={{ marginTop: 28 }}>About this event</h3>
          <p style={{ color: "var(--text-dim)", lineHeight: 1.7 }}>{event.description}</p>
        </div>

        <div className="sticky-card">
          <h3 style={{ marginTop: 0 }}>Select Tickets</h3>
          <div className="price-line">
            <span>Price per ticket</span>
            <span>₹{event.price}</span>
          </div>

          {soldOut ? (
            <div className="alert alert-error" style={{ marginTop: 16 }}>
              Sold Out
            </div>
          ) : (
            <>
              <div className="seat-stepper">
                <button onClick={() => setSeats((s) => Math.max(1, s - 1))}>−</button>
                <span>{seats}</span>
                <button onClick={() => setSeats((s) => Math.min(event.availableSeats, 10, s + 1))}>+</button>
              </div>

              <div className="price-total">
                <span>Total</span>
                <span>₹{event.price * seats}</span>
              </div>

              {error && <div className="alert alert-error" style={{ marginTop: 12 }}>{error}</div>}

              <button className="btn btn-primary btn-block" style={{ marginTop: 16 }} onClick={handleProceed}>
                Proceed
              </button>

              {!user && (
                <p style={{ fontSize: 12, color: "var(--text-dim)", marginTop: 12, textAlign: "center" }}>
                  <Link to="/login" style={{ color: "var(--pink)" }}>
                    Login
                  </Link>{" "}
                  or continue to create an account at checkout
                </p>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default EventDetail;
