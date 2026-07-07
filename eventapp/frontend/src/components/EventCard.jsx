import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../api/axios";

const formatDate = (dateStr) => {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-IN", { weekday: "short", month: "short", day: "numeric" });
};

const EventCard = ({ event, onFavoriteToggle }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isFavorite, setIsFavorite] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);

  useEffect(() => {
    if (user && user.favorites) {
      setIsFavorite(user.favorites.includes(event._id));
    }
  }, [user, event._id]);

  const handleFavoriteClick = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      navigate("/login");
      return;
    }
    try {
      const { data } = await api.post("/enterprise/favorites/toggle", { eventId: event._id });
      setIsFavorite(data.isFavorite);
      if (onFavoriteToggle) onFavoriteToggle(event._id, data.isFavorite);
    } catch (err) {
      console.error("Favorite toggle failed", err);
    }
  };

  const handleShareClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setShowShareMenu(!showShareMenu);
  };

  const handleShareOption = async (platform) => {
    setShowShareMenu(false);
    const eventUrl = `${window.location.origin}/events/${event._id}`;
    
    // Log campaign share click metrics
    try {
      await api.post("/enterprise/marketing/click", { eventId: event._id, source: platform });
    } catch (err) {
      console.error(err);
    }

    if (platform === "copy") {
      navigator.clipboard.writeText(eventUrl);
      alert("Event link copied to clipboard!");
      return;
    }

    let url = "";
    if (platform === "whatsapp") {
      url = `https://api.whatsapp.com/send?text=Check out this amazing event: ${event.title} - ${eventUrl}`;
    } else if (platform === "facebook") {
      url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(eventUrl)}`;
    } else if (platform === "twitter") {
      url = `https://twitter.com/intent/tweet?text=Check out this amazing event: ${event.title}&url=${encodeURIComponent(eventUrl)}`;
    } else if (platform === "telegram") {
      url = `https://t.me/share/url?url=${encodeURIComponent(eventUrl)}&text=Check out this amazing event: ${event.title}`;
    }

    if (url) {
      window.open(url, "_blank");
    }
  };

  const handleBookNow = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      navigate("/login");
    } else {
      navigate(`/checkout/${event._id}`);
    }
  };

  const soldOut = event.availableSeats <= 0;

  return (
    <div className="event-card-v2" onClick={() => navigate(`/events/${event._id}`)}>
      <div className="thumb-container">
        <img
          className="thumb"
          src={event.bannerImage || "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=600"}
          alt={event.title}
        />
        <span className="badge-category">{event.category}</span>
        <button 
          onClick={handleFavoriteClick} 
          className={`fav-btn ${isFavorite ? "active" : ""}`}
          title="Add to Wishlist"
        >
          ❤️
        </button>
      </div>

      <div className="body">
        <div className="organiser-row">
          👤 {event.organiser?.companyName || event.organiser?.name || "Host"}
        </div>
        <h3 className="title">{event.title}</h3>
        
        <div className="details-row">
          <span>📅 {formatDate(event.date)} at {event.time}</span>
          <span>📍 {event.venue}, {event.city}</span>
          {event.distance !== undefined && (
            <span style={{ color: "var(--pink)", fontWeight: "600" }}>📍 {event.distance} km away</span>
          )}
        </div>

        <div className="status-row">
          <span>🎟️ {event.availableSeats} left</span>
          <span className={`status-tag ${soldOut ? "sold-out" : "available"}`}>
            {soldOut ? "SOLD OUT" : "AVAILABLE"}
          </span>
        </div>

        <div className="price-row">
          <span className="price-label">Tickets from</span>
          <span className="price-value">₹{event.price}</span>
        </div>

        <div className="actions-row">
          <button className="share-btn-v2" onClick={handleShareClick} title="Share Link">
            🔗 Share
          </button>
          <button 
            className="book-btn-v2" 
            onClick={handleBookNow} 
            disabled={soldOut}
          >
            {soldOut ? "Sold Out" : "Book Now"}
          </button>

          {showShareMenu && (
            <div className="share-dropdown-v2" onClick={(e) => e.stopPropagation()}>
              <button onClick={() => handleShareOption("copy")}>📋 Copy Link</button>
              <button onClick={() => handleShareOption("whatsapp")}>🟢 WhatsApp</button>
              <button onClick={() => handleShareOption("facebook")}>🔵 Facebook</button>
              <button onClick={() => handleShareOption("twitter")}>🐦 Twitter/X</button>
              <button onClick={() => handleShareOption("telegram")}>✈️ Telegram</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EventCard;
