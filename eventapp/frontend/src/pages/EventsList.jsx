import { useEffect, useState, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import api from "../api/axios";
import EventCard from "../components/EventCard";
import { useAuth } from "../context/AuthContext";

const categories = ["Movies", "Concerts", "Plays", "Sports", "Comedy", "Workshops", "Festivals", "Other"];
const languages = ["English", "Hindi", "Telugu", "Tamil", "Kannada", "Spanish", "French"];

const EventsList = () => {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  // Search input & Suggestions
  const [searchQuery, setSearchQuery] = useState(searchParams.get("keyword") || "");
  const [suggestions, setSuggestions] = useState([]);
  const [recentSearches, setRecentSearches] = useState(
    JSON.parse(localStorage.getItem("recent_searches") || "[]")
  );

  // Filters Drawer state
  const [showFilters, setShowFilters] = useState(false);
  const [category, setCategory] = useState(searchParams.get("category") || "All");
  const [city, setCity] = useState("All");
  const [priceMin, setPriceMin] = useState("");
  const [priceMax, setPriceMax] = useState("");
  const [freeOnly, setFreeOnly] = useState(false);
  const [exclusive, setExclusive] = useState("All");
  const [eventStatus, setEventStatus] = useState("All");
  const [sort, setSort] = useState("newest");
  const [radius, setRadius] = useState(""); // km
  const [language, setLanguage] = useState("All");
  const [savedFilters, setSavedFilters] = useState([]);

  // Data states
  const [events, setEvents] = useState([]);
  const [metaFilters, setMetaFilters] = useState({ cities: [], categories: [] });
  const [loading, setLoading] = useState(true);

  // Pagination states
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // GPS Coordinates
  const [gpsCoords, setGpsCoords] = useState(null);

  const autocompleteRef = useRef(null);

  // Load static meta filters & saved filters
  useEffect(() => {
    api.get("/events/meta/filters").then(({ data }) => setMetaFilters(data)).catch(() => {});
    
    if (user) {
      api.get("/enterprise/settings/saved-filters")
        .then(({ data }) => setSavedFilters(data))
        .catch(() => {});
    }

    // Auto-fetch GPS coordinates for distance filtering
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((pos) => {
        setGpsCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      });
    }
  }, [user]);

  // Fetch search suggestions
  useEffect(() => {
    if (searchQuery.length < 2) {
      setSuggestions([]);
      return;
    }
    const delayDebounceFn = setTimeout(() => {
      api.get(`/enterprise/events/suggestions?q=${searchQuery}`)
        .then(({ data }) => setSuggestions(data))
        .catch(() => setSuggestions([]));
    }, 200);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  // Fetch events based on current query parameters
  const loadEvents = () => {
    setLoading(true);
    const params = {
      page,
      limit: 6,
      sort
    };

    if (searchQuery) params.keyword = searchQuery;
    if (category !== "All") params.category = category;
    if (city !== "All") params.city = city;
    if (priceMin) params.priceMin = priceMin;
    if (priceMax) params.priceMax = priceMax;
    if (freeOnly) params.freeOnly = "true";
    if (exclusive !== "All") params.exclusive = exclusive === "Exclusive" ? "true" : "false";
    if (eventStatus !== "All") params.status = eventStatus.toLowerCase();
    
    if (radius && gpsCoords) {
      params.lat = gpsCoords.lat;
      params.lng = gpsCoords.lng;
      params.radius = radius;
    }

    api.get("/enterprise/events/search", { params })
      .then(({ data }) => {
        setEvents(data.events);
        setTotalPages(data.totalPages);
      })
      .catch(() => setEvents([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadEvents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category, city, priceMin, priceMax, freeOnly, exclusive, eventStatus, sort, radius, language, page]);

  // Handle Enter on search input
  const handleSearchSubmit = (e) => {
    if (e) e.preventDefault();
    setSuggestions([]);
    
    if (searchQuery.trim()) {
      const updated = [searchQuery.trim(), ...recentSearches.filter(s => s !== searchQuery.trim())].slice(0, 5);
      setRecentSearches(updated);
      localStorage.setItem("recent_searches", JSON.stringify(updated));
    }

    setPage(1);
    loadEvents();
  };

  // Saved Filters
  const handleSaveFilter = async () => {
    if (!user) return alert("Log in to save search filters.");
    const name = prompt("Enter a name for this search filter:");
    if (!name) return;

    const filterObj = {
      category,
      city,
      priceMin,
      priceMax,
      freeOnly,
      exclusive,
      sort,
      language
    };

    try {
      const { data } = await api.post("/enterprise/settings/saved-filters", {
        name,
        query: JSON.stringify(filterObj)
      });
      setSavedFilters(prev => [...prev, data]);
      alert("Filter saved successfully!");
    } catch (err) {
      alert("Could not save filter.");
    }
  };

  const handleApplySavedFilter = (filterStr) => {
    try {
      const f = JSON.parse(filterStr);
      if (f.category) setCategory(f.category);
      if (f.city) setCity(f.city);
      if (f.priceMin) setPriceMin(f.priceMin);
      if (f.priceMax) setPriceMax(f.priceMax);
      if (f.freeOnly !== undefined) setFreeOnly(f.freeOnly);
      if (f.exclusive) setExclusive(f.exclusive);
      if (f.sort) setSort(f.sort);
      if (f.language) setLanguage(f.language);
      setPage(1);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="section" style={{ maxWidth: 1000, margin: "0 auto" }}>
      <h2 className="section-title">🔍 Enterprise Search & Discovery</h2>

      {/* SEARCH FIELD WITH AUTOCOMPLETE & SUGGESTIONS */}
      <form onSubmit={handleSearchSubmit} className="search-form-v2" ref={autocompleteRef}>
        <div style={{ position: "relative", flex: 1 }}>
          <input
            type="text"
            placeholder="Search event name, organizer, tags..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ width: "100%", padding: "12px 16px", borderRadius: 8, background: "var(--surface)", border: "1px solid var(--border)", color: "#fff" }}
          />
          {suggestions.length > 0 && (
            <div className="autocomplete-suggestions">
              {suggestions.map((item) => (
                <div
                  key={item._id}
                  className="suggestion-item"
                  onClick={() => {
                    setSearchQuery(item.title);
                    setSuggestions([]);
                    navigate(`/events/${item._id}`);
                  }}
                >
                  <img src={item.bannerImage || "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=100"} alt="" />
                  <div>
                    <div style={{ fontWeight: "600" }}>{item.title}</div>
                    <div style={{ fontSize: 11, color: "var(--text-dim)" }}>{item.category} in {item.city}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        <button type="submit" className="btn btn-primary" style={{ height: "46px" }}>Search</button>
        <button
          type="button"
          onClick={() => setShowFilters(!showFilters)}
          className={`btn ${showFilters ? "btn-primary" : "btn-outline"}`}
          style={{ height: "46px" }}
        >
          ⚙️ Filters
        </button>
      </form>

      {/* RECENT SEARCHES */}
      {recentSearches.length > 0 && (
        <div style={{ display: "flex", gap: "8px", alignItems: "center", margin: "12px 0 20px 0", flexWrap: "wrap" }}>
          <span style={{ fontSize: "12px", color: "var(--text-dim)" }}>Recent Searches:</span>
          {recentSearches.map((s, idx) => (
            <span
              key={idx}
              className="recent-search-tag"
              onClick={() => {
                setSearchQuery(s);
                setPage(1);
                loadEvents();
              }}
            >
              {s}
            </span>
          ))}
          <span
            style={{ fontSize: "11px", color: "var(--pink)", cursor: "pointer", marginLeft: "10px" }}
            onClick={() => {
              setRecentSearches([]);
              localStorage.removeItem("recent_searches");
            }}
          >
            Clear
          </span>
        </div>
      )}

      {/* COLLAPSIBLE FILTERS PANEL */}
      {showFilters && (
        <div className="card-panel filters-drawer-v2" style={{ marginTop: "-10px", marginBottom: "20px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "15px" }}>
            <h3 style={{ margin: 0 }}>Advanced Filters</h3>
            <button onClick={handleSaveFilter} className="btn btn-sm btn-outline">💾 Save Filter</button>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Category</label>
              <select value={category} onChange={(e) => setCategory(e.target.value)}>
                <option value="All">All Categories</option>
                {categories.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>City</label>
              <select value={city} onChange={(e) => setCity(e.target.value)}>
                <option value="All">All Cities</option>
                {metaFilters.cities.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Exclusivity</label>
              <select value={exclusive} onChange={(e) => setExclusive(e.target.value)}>
                <option value="All">All</option>
                <option value="Exclusive">Invite-Only Exclusive</option>
                <option value="Public">Public Listings</option>
              </select>
            </div>
            <div className="form-group">
              <label>Event Status</label>
              <select value={eventStatus} onChange={(e) => setEventStatus(e.target.value)}>
                <option value="All">All Statuses</option>
                <option value="Upcoming">Upcoming</option>
                <option value="Ongoing">Ongoing</option>
                <option value="Completed">Completed</option>
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Price Cap</label>
              <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                <input
                  type="number"
                  placeholder="Min (₹)"
                  value={priceMin}
                  onChange={(e) => setPriceMin(e.target.value)}
                  style={{ flex: 1 }}
                />
                <span style={{ color: "var(--text-dim)" }}>to</span>
                <input
                  type="number"
                  placeholder="Max (₹)"
                  value={priceMax}
                  onChange={(e) => setPriceMax(e.target.value)}
                  style={{ flex: 1 }}
                />
              </div>
            </div>
            <div className="form-group" style={{ display: "flex", alignItems: "center", gap: "10px", marginTop: "24px" }}>
              <input
                type="checkbox"
                id="freeOnly"
                checked={freeOnly}
                onChange={(e) => setFreeOnly(e.target.checked)}
              />
              <label htmlFor="freeOnly" style={{ cursor: "pointer", margin: 0 }}>Show Free Events Only</label>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Location Radius (using GPS)</label>
              <select value={radius} onChange={(e) => setRadius(e.target.value)}>
                <option value="">Any distance</option>
                <option value="10">Within 10 km</option>
                <option value="25">Within 25 km</option>
                <option value="50">Within 50 km</option>
                <option value="100">Within 100 km</option>
              </select>
            </div>
            <div className="form-group">
              <label>Sorting</label>
              <select value={sort} onChange={(e) => setSort(e.target.value)}>
                <option value="newest">Newest Added</option>
                <option value="oldest">Oldest Added</option>
                <option value="priceAsc">Price: Low to High</option>
                <option value="priceDesc">Price: High to Low</option>
                <option value="popular">Most Popular</option>
                <option value="rated">Highest Rated</option>
                {gpsCoords && <option value="nearest">Nearest to Me</option>}
              </select>
            </div>
          </div>
        </div>
      )}

      {/* SAVED FILTERS TABS */}
      {savedFilters.length > 0 && (
        <div style={{ display: "flex", gap: "8px", alignItems: "center", marginBottom: "20px", flexWrap: "wrap" }}>
          <span style={{ fontSize: "12px", color: "var(--text-dim)" }}>Saved Filters:</span>
          {savedFilters.map((sf) => (
            <span
              key={sf._id}
              className="recent-search-tag"
              style={{ borderColor: "var(--purple)", color: "var(--purple)" }}
              onClick={() => handleApplySavedFilter(sf.query)}
            >
              💼 {sf.name}
            </span>
          ))}
        </div>
      )}

      {/* RESULTS LISTING */}
      {loading ? (
        <div className="event-grid">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="skeleton-card skeleton-shimmer">
              <div className="skeleton-img" />
              <div className="skeleton-text" />
              <div className="skeleton-text short" />
            </div>
          ))}
        </div>
      ) : events.length === 0 ? (
        <div className="empty-state">No events match your criteria. Try adjusting your filters.</div>
      ) : (
        <>
          <div className="event-grid">
            {events.map((ev) => (
              <EventCard key={ev._id} event={ev} />
            ))}
          </div>

          {/* PAGINATION CONTROLS */}
          {totalPages > 1 && (
            <div style={{ display: "flex", justifyContent: "center", gap: "10px", marginTop: "32px", alignItems: "center" }}>
              <button
                className="btn btn-outline btn-sm"
                disabled={page === 1}
                onClick={() => setPage(p => Math.max(1, p - 1))}
              >
                Previous
              </button>
              <span style={{ color: "var(--text-dim)", fontSize: "14px" }}>Page {page} of {totalPages}</span>
              <button
                className="btn btn-outline btn-sm"
                disabled={page === totalPages}
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default EventsList;
