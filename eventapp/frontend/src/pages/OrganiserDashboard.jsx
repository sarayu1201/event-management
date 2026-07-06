import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/axios";
import DashboardNav from "../components/DashboardNav";

const OrganiserDashboard = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get("/events/mine/organiser")
      .then(({ data }) => setEvents(data))
      .finally(() => setLoading(false));
  }, []);

  const totalRevenue = events.reduce((sum, e) => sum + (e.revenue || 0), 0);
  const totalTickets = events.reduce((sum, e) => sum + (e.ticketsSold || 0), 0);

  return (
    <div>
      <DashboardNav role="organiser" />
      <div className="dash-body">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
          <h2 className="section-title" style={{ margin: 0 }}>Overview</h2>
          <Link to="/organiser/create-event" className="btn btn-primary">
            + Create Event
          </Link>
        </div>

        <div className="stat-grid">
          <div className="stat-card">
            <div className="label">Total Events</div>
            <div className="value">{events.length}</div>
          </div>
          <div className="stat-card">
            <div className="label">Tickets Sold</div>
            <div className="value">{totalTickets}</div>
          </div>
          <div className="stat-card">
            <div className="label">Total Revenue</div>
            <div className="value">₹{totalRevenue}</div>
          </div>
        </div>

        <h3 className="section-title" style={{ fontSize: 18 }}>Your Events</h3>
        {loading && <div className="loading-wrap">Loading...</div>}
        {!loading && events.length === 0 && (
          <div className="empty-state">
            You haven't created any events yet. <Link to="/organiser/create-event">Create your first event</Link>
          </div>
        )}
        {!loading && events.length > 0 && (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Date</th>
                  <th>Seats Left</th>
                  <th>Tickets Sold</th>
                  <th>Revenue</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {events.map((e) => (
                  <tr key={e._id}>
                    <td>{e.title}</td>
                    <td>{new Date(e.date).toDateString()}</td>
                    <td>{e.availableSeats}/{e.totalSeats}</td>
                    <td>{e.ticketsSold}</td>
                    <td>₹{e.revenue}</td>
                    <td>
                      <Link to={`/organiser/events/${e._id}`} className="btn btn-outline btn-sm">
                        Manage
                      </Link>
                    </td>
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

export default OrganiserDashboard;
