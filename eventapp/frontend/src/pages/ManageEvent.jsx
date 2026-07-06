import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import api from "../api/axios";
import DashboardNav from "../components/DashboardNav";

const ManageEvent = () => {
  const { id } = useParams();
  const [event, setEvent] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [promoInput, setPromoInput] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const loadData = () => {
    setLoading(true);
    Promise.all([api.get(`/events/${id}`), api.get(`/bookings/event/${id}`)])
      .then(([evRes, bookingsRes]) => {
        setEvent(evRes.data);
        setBookings(bookingsRes.data);
      })
      .catch(() => setError("Could not load event data"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

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

  if (loading) return <div className="loading-wrap">Loading...</div>;
  if (!event) return <div className="section empty-state">Event not found</div>;

  const revenue = bookings.reduce((sum, b) => sum + b.totalAmount, 0);

  return (
    <div>
      <DashboardNav role="organiser" />
      <div className="dash-body">
        <h2 className="section-title">{event.title}</h2>

        <div className="stat-grid">
          <div className="stat-card">
            <div className="label">Seats Left</div>
            <div className="value">{event.availableSeats}/{event.totalSeats}</div>
          </div>
          <div className="stat-card">
            <div className="label">Confirmed Bookings</div>
            <div className="value">{bookings.length}</div>
          </div>
          <div className="stat-card">
            <div className="label">Revenue</div>
            <div className="value">₹{revenue}</div>
          </div>
        </div>

        <div className="card-panel">
          <h3 style={{ marginTop: 0 }}>Assign a Promoter</h3>
          <p style={{ color: "var(--text-dim)", fontSize: 14 }}>
            Enter a promoter's referral code or email to let them sell tickets for this event with a discount code.
          </p>
          {message && <div className="alert alert-success">{message}</div>}
          {error && <div className="alert alert-error">{error}</div>}
          <form onSubmit={handleAssignPromoter} style={{ display: "flex", gap: 10 }}>
            <input
              value={promoInput}
              onChange={(e) => setPromoInput(e.target.value)}
              placeholder="Promoter code or email, e.g. PRIYA10"
              style={{ flex: 1, background: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--text)", padding: "11px 14px", borderRadius: 8 }}
            />
            <button className="btn btn-primary">Assign</button>
          </form>
          {event.promoters?.length > 0 && (
            <p style={{ fontSize: 13, color: "var(--text-dim)", marginTop: 12 }}>
              {event.promoters.length} promoter(s) currently assigned.
            </p>
          )}
        </div>

        <h3 className="section-title" style={{ fontSize: 18 }}>Bookings</h3>
        {bookings.length === 0 ? (
          <div className="empty-state">No confirmed bookings yet.</div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Attendee</th>
                  <th>Email</th>
                  <th>Seats</th>
                  <th>Amount</th>
                  <th>Promo</th>
                  <th>Ticket ID</th>
                </tr>
              </thead>
              <tbody>
                {bookings.map((b) => (
                  <tr key={b._id}>
                    <td>{b.user?.name}</td>
                    <td>{b.user?.email}</td>
                    <td>{b.seats}</td>
                    <td>₹{b.totalAmount}</td>
                    <td>{b.promoCodeUsed || "-"}</td>
                    <td>{b.ticketId}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default ManageEvent;
