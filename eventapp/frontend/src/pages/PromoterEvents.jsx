import { useEffect, useState } from "react";
import api from "../api/axios";
import DashboardNav from "../components/DashboardNav";
import EventCard from "../components/EventCard";

const PromoterEvents = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get("/promoter/events")
      .then(({ data }) => setEvents(data))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <DashboardNav role="promoter" />
      <div className="dash-body">
        <h2 className="section-title">Events You're Promoting</h2>
        {loading && <div className="loading-wrap">Loading...</div>}
        {!loading && events.length === 0 && (
          <div className="empty-state">No events assigned to you yet. Ask an organiser to add your promo code.</div>
        )}
        {!loading && events.length > 0 && (
          <div className="event-grid">
            {events.map((ev) => (
              <EventCard key={ev._id} event={ev} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default PromoterEvents;
