import { useEffect, useState } from "react";
import api from "../api/axios";
import DashboardNav from "../components/DashboardNav";

const PromoterDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get("/promoter/stats")
      .then(({ data }) => setStats(data))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading-wrap">Loading...</div>;

  return (
    <div>
      <DashboardNav role="promoter" />
      <div className="dash-body">
        <h2 className="section-title">Your Referral Dashboard</h2>

        <div className="card-panel" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ color: "var(--text-dim)", fontSize: 13 }}>Your Promo Code</div>
            <div style={{ fontSize: 24, fontWeight: 700, letterSpacing: 1 }}>{stats.promoCode}</div>
          </div>
          <span className="badge">{stats.commissionRate}% commission</span>
        </div>

        <div className="stat-grid">
          <div className="stat-card">
            <div className="label">Bookings via your code</div>
            <div className="value">{stats.totalBookings}</div>
          </div>
          <div className="stat-card">
            <div className="label">Tickets Sold</div>
            <div className="value">{stats.totalTicketsSold}</div>
          </div>
          <div className="stat-card">
            <div className="label">Revenue Generated</div>
            <div className="value">₹{stats.totalRevenueGenerated}</div>
          </div>
          <div className="stat-card">
            <div className="label">Commission Earned</div>
            <div className="value">₹{stats.commissionEarned}</div>
          </div>
        </div>

        <h3 className="section-title" style={{ fontSize: 18 }}>Recent Referral Bookings</h3>
        {stats.bookings.length === 0 ? (
          <div className="empty-state">No bookings via your code yet. Share your promo code to get started!</div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Event</th>
                  <th>Date</th>
                  <th>Seats</th>
                  <th>Amount</th>
                </tr>
              </thead>
              <tbody>
                {stats.bookings.map((b) => (
                  <tr key={b._id}>
                    <td>{b.event?.title}</td>
                    <td>{b.event ? new Date(b.event.date).toDateString() : "-"}</td>
                    <td>{b.seats}</td>
                    <td>₹{b.totalAmount}</td>
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

export default PromoterDashboard;
