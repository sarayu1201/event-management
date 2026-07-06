import { useEffect, useState } from "react";
import api from "../api/axios";
import EventCard from "../components/EventCard";

const Home = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const { data } = await api.get("/events");
        setEvents(data);
      } catch (err) {
        setError("Could not load events. Is the backend server running?");
      } finally {
        setLoading(false);
      }
    };
    fetchEvents();
  }, []);

  return (
    <div>
      <section className="hero">
        <div>
          <h1>
            Discover
            <br />
            <span className="accent">Premium Events</span>
            <br />
            In India
          </h1>
          <a href="#events" className="btn btn-white">
            Explore All Events!
          </a>
        </div>
        <div
          className="hero-visual"
          style={{
            backgroundImage:
              "url(https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=600)",
          }}
        />
      </section>

      <div className="exclusivity-banner">
        <h2>
          Experience <span className="accent">Exclusivity!</span>
        </h2>
        <p>Find the hottest events and venues in the town! Right here</p>
      </div>

      <section className="section" id="events">
        <h2 className="section-title">Popular Events</h2>
        {loading && <div className="loading-wrap">Loading events...</div>}
        {error && <div className="alert alert-error">{error}</div>}
        {!loading && !error && events.length === 0 && (
          <div className="empty-state">No events yet — check back soon, or run the seed script for demo data.</div>
        )}
        {!loading && events.length > 0 && (
          <div className="event-grid">
            {events.map((ev) => (
              <EventCard key={ev._id} event={ev} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default Home;
