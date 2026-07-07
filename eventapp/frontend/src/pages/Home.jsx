import { useEffect, useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api/axios";
import EventCard from "../components/EventCard";
import { useAuth } from "../context/AuthContext";

const categories = [
  { name: "Concerts", icon: "🎤" },
  { name: "Movies", icon: "🎬" },
  { name: "Comedy", icon: "🎭" },
  { name: "Sports", icon: "⚽" },
  { name: "Workshops", icon: "🧠" },
  { name: "Festivals", icon: "🎪" },
  { name: "Plays", icon: "📖" },
  { name: "Other", icon: "✨" }
];

const Home = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Carousel States
  const [featuredEvents, setFeaturedEvents] = useState([]);
  const [carouselIndex, setCarouselIndex] = useState(0);

  // Sections States
  const [nearbyEvents, setNearbyEvents] = useState([]);
  const [recommendedEvents, setRecommendedEvents] = useState([]);
  const [exclusiveEvents, setExclusiveEvents] = useState([]);
  const [recentlyViewed, setRecentlyViewed] = useState([]);

  // Infinite Scroll State (All Events)
  const [allEvents, setAllEvents] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [allLoading, setAllLoading] = useState(false);

  const [loading, setLoading] = useState(true);
  const [coords, setCoords] = useState(null);
  const observerTarget = useRef(null);

  // Fetch Carousel & Core Sections
  useEffect(() => {
    const fetchCoreSections = async () => {
      try {
        // 1. Featured Events (used for carousel)
        const featRes = await api.get("/events?isFeatured=true");
        setFeaturedEvents(featRes.data.slice(0, 5));

        // 2. Exclusive Events
        const exclRes = await api.get("/enterprise/events/search?exclusive=true&limit=4");
        setExclusiveEvents(exclRes.data.events);

        // 3. Recommended
        if (user) {
          const recRes = await api.get("/enterprise/recommendations");
          setRecommendedEvents(recRes.data);

          const recentRes = await api.get("/enterprise/recently-viewed");
          setRecentlyViewed(recentRes.data);
        } else {
          // Fallback trending recommendation
          const trendRes = await api.get("/enterprise/events/search?sort=popular&limit=4");
          setRecommendedEvents(trendRes.data.events);
        }
      } catch (err) {
        console.error("Could not load home page sections", err);
      } finally {
        setLoading(false);
      }
    };

    fetchCoreSections();
  }, [user]);

  // Request user GPS location for nearby events
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          setCoords({ latitude, longitude });
          try {
            const { data } = await api.get(
              `/enterprise/events/search?lat=${latitude}&lng=${longitude}&radius=100&sort=nearest&limit=4`
            );
            setNearbyEvents(data.events);
          } catch (err) {
            console.error("Nearby load failed", err);
          }
        },
        (error) => {
          console.log("GPS access denied or unavailable", error);
        }
      );
    }
  }, []);

  // Infinite Scroll fetch (All Events)
  const fetchAllEvents = async () => {
    if (allLoading || !hasMore) return;
    setAllLoading(true);
    try {
      const { data } = await api.get(`/enterprise/events/search?page=${page}&limit=6`);
      if (data.events.length === 0) {
        setHasMore(false);
      } else {
        setAllEvents((prev) => {
          const existingIds = new Set(prev.map(e => e._id));
          const newEvents = data.events.filter(e => !existingIds.has(e._id));
          return [...prev, ...newEvents];
        });
        setPage((p) => p + 1);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setAllLoading(false);
    }
  };

  // IntersectionObserver for Infinite Scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore) {
          fetchAllEvents();
        }
      },
      { threshold: 1.0 }
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => {
      if (observerTarget.current) observer.disconnect();
    };
  }, [observerTarget, page, hasMore, allLoading]);

  // Automatic Carousel slide rotation
  useEffect(() => {
    if (featuredEvents.length <= 1) return;
    const interval = setInterval(() => {
      setCarouselIndex((prev) => (prev + 1) % featuredEvents.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [featuredEvents]);

  const SkeletonLoader = () => (
    <div className="event-grid">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="skeleton-card skeleton-shimmer">
          <div className="skeleton-img" />
          <div className="skeleton-text" />
          <div className="skeleton-text short" />
        </div>
      ))}
    </div>
  );

  return (
    <div className="home-container">
      {/* 1. HERO CAROUSEL / BANNER */}
      {featuredEvents.length > 0 ? (
        <div className="carousel-section">
          {featuredEvents.map((ev, index) => (
            <div
              key={ev._id}
              className={`carousel-slide ${index === carouselIndex ? "active" : ""}`}
              style={{
                backgroundImage: `linear-gradient(rgba(0,0,0,0.3), rgba(0,0,0,0.8)), url(${ev.bannerImage || "https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=1000"})`
              }}
            >
              <div className="carousel-content">
                <span className="carousel-badge">FEATURED</span>
                <h1>{ev.title}</h1>
                <p>📍 {ev.venue}, {ev.city} | 📅 {new Date(ev.date).toDateString()}</p>
                <div style={{ display: "flex", gap: "10px", marginTop: "16px" }}>
                  <Link to={`/events/${ev._id}`} className="btn btn-primary">View Event</Link>
                  <Link to={`/checkout/${ev._id}`} className="btn btn-white">Book Tickets</Link>
                </div>
              </div>
            </div>
          ))}
          {featuredEvents.length > 1 && (
            <div className="carousel-indicators">
              {featuredEvents.map((_, i) => (
                <span
                  key={i}
                  className={`dot ${i === carouselIndex ? "active" : ""}`}
                  onClick={() => setCarouselIndex(i)}
                />
              ))}
            </div>
          )}
        </div>
      ) : (
        <section className="hero">
          <div>
            <h1>
              Discover
              <br />
              <span className="accent">Premium Events</span>
              <br />
              In India
            </h1>
            <Link to="/events" className="btn btn-white">
              Explore All Events!
            </Link>
          </div>
          <div
            className="hero-visual"
            style={{
              backgroundImage: "url(https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=600)",
            }}
          />
        </section>
      )}

      {/* 2. POPULAR CATEGORIES */}
      <section className="section categories-section">
        <h2 className="section-title">Popular Categories</h2>
        <div className="categories-grid">
          {categories.map((cat) => (
            <div
              key={cat.name}
              className="category-icon-card"
              onClick={() => navigate(`/events?category=${cat.name}`)}
            >
              <div className="icon-circle">{cat.icon}</div>
              <span>{cat.name}</span>
            </div>
          ))}
        </div>
      </section>

      {/* 3. RECENTLY VIEWED EVENTS */}
      {recentlyViewed.length > 0 && (
        <section className="section">
          <h2 className="section-title">Recently Viewed Events</h2>
          <div className="event-grid">
            {recentlyViewed.map((ev) => (
              <EventCard key={ev._id} event={ev} />
            ))}
          </div>
        </section>
      )}

      {/* 4. RECOMMENDED EVENTS */}
      <section className="section">
        <h2 className="section-title">Recommended For You</h2>
        {loading ? (
          <SkeletonLoader />
        ) : recommendedEvents.length === 0 ? (
          <div className="empty-state">No recommendations available at this time.</div>
        ) : (
          <div className="event-grid">
            {recommendedEvents.map((ev) => (
              <EventCard key={ev._id} event={ev} />
            ))}
          </div>
        )}
      </section>

      {/* 5. NEARBY EVENTS (GPS) */}
      {coords && nearbyEvents.length > 0 && (
        <section className="section" style={{ background: "rgba(255,255,255,0.01)", borderTop: "1px solid var(--border)", borderBottom: "1px solid var(--border)" }}>
          <h2 className="section-title">📍 Nearby Events (Within 100 km)</h2>
          <div className="event-grid">
            {nearbyEvents.map((ev) => (
              <EventCard key={ev._id} event={ev} />
            ))}
          </div>
        </section>
      )}

      {/* 6. EXCLUSIVE EVENTS */}
      {exclusiveEvents.length > 0 && (
        <section className="section">
          <h2 className="section-title" style={{ color: "var(--pink)" }}>🌟 Exclusive Invite-Only Listings</h2>
          <div className="event-grid">
            {exclusiveEvents.map((ev) => (
              <EventCard key={ev._id} event={ev} />
            ))}
          </div>
        </section>
      )}

      {/* 7. ALL EVENTS (INFINITE SCROLL) */}
      <section className="section" id="all-events">
        <h2 className="section-title">All Upcoming Events</h2>
        {allEvents.length === 0 && !allLoading ? (
          <div className="empty-state">No events available. Check back later!</div>
        ) : (
          <div className="event-grid">
            {allEvents.map((ev) => (
              <EventCard key={ev._id} event={ev} />
            ))}
          </div>
        )}
        
        {/* Infinite Scroll target observer */}
        <div ref={observerTarget} style={{ height: "40px", display: "flex", justifyContent: "center", alignItems: "center", marginTop: "20px" }}>
          {allLoading && <div className="spinner" style={{ width: "24px", height: "24px" }} />}
        </div>
      </section>
    </div>
  );
};

export default Home;
