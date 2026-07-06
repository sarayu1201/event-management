import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/axios";
import DashboardNav from "../components/DashboardNav";

const OrganiserEvents = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get("/events/mine/organiser")
      .then(({ data }) => setEvents(data))
      .finally(() => setLoading(false));
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this event? This cannot be undone.")) return;
    await api.delete(`/events/${id}`);
    setEvents((prev) => prev.filter((e) => e._id !== id));
  };

  return (
    <div>
      <DashboardNav role="organiser" />
      <div className="dash-body">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
          <h2 className="section-title" style={{ margin: 0 }}>My Events</h2>
          <Link to="/organiser/create-event" className="btn btn-primary">
            + Create Event
          </Link>
        </div>

        {loading && <div className="loading-wrap">Loading...</div>}
        {!loading && events.length === 0 && <div className="empty-state">No events yet.</div>}

        {!loading && events.length > 0 && (
          <div className="event-grid">
            {events.map((e) => (
              <div key={e._id} className="event-card">
                <img className="thumb" src={e.bannerImage || "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=600"} alt={e.title} />
                <div className="body">
                  <div className="date">{new Date(e.date).toDateString()}</div>
                  <div className="title">{e.title}</div>
                  <div className="venue">{e.venue}, {e.city}</div>
                  <div className="price">₹{e.price} · {e.availableSeats}/{e.totalSeats} left</div>
                  <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                    <Link to={`/organiser/events/${e._id}`} className="btn btn-outline btn-sm" style={{ flex: 1 }}>
                      Manage
                    </Link>
                    <button className="btn btn-outline btn-sm" onClick={() => handleDelete(e._id)}>
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default OrganiserEvents;
