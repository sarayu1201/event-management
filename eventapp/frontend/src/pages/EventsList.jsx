import { useEffect, useState } from "react";
import api from "../api/axios";
import EventCard from "../components/EventCard";

const EventsList = () => {
  const [events, setEvents] = useState([]);
  const [filters, setFilters] = useState({ cities: [], categories: [] });
  const [category, setCategory] = useState("All");
  const [city, setCity] = useState("All");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/events/meta/filters").then(({ data }) => setFilters(data)).catch(() => {});
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(true);
      const params = {};
      if (category !== "All") params.category = category;
      if (city !== "All") params.city = city;
      if (search) params.search = search;

      api
        .get("/events", { params })
        .then(({ data }) => setEvents(data))
        .catch(() => setEvents([]))
        .finally(() => setLoading(false));
    }, 300);
    return () => clearTimeout(timer);
  }, [category, city, search]);

  return (
    <div className="section">
      <h2 className="section-title">All Events</h2>

      <div className="filters-bar">
        <input placeholder="Search events, venues, cities..." value={search} onChange={(e) => setSearch(e.target.value)} />
        <select value={category} onChange={(e) => setCategory(e.target.value)}>
          <option value="All">All Categories</option>
          {filters.categories.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <select value={city} onChange={(e) => setCity(e.target.value)}>
          <option value="All">All Cities</option>
          {filters.cities.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      {loading && <div className="loading-wrap">Loading events...</div>}
      {!loading && events.length === 0 && <div className="empty-state">No events match your filters.</div>}
      {!loading && events.length > 0 && (
        <div className="event-grid">
          {events.map((ev) => (
            <EventCard key={ev._id} event={ev} />
          ))}
        </div>
      )}
    </div>
  );
};

export default EventsList;
