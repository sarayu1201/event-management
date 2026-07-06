import { Link } from "react-router-dom";

const formatDate = (dateStr) => {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-IN", { weekday: "short", month: "short", day: "numeric" });
};

const EventCard = ({ event }) => {
  return (
    <Link to={`/events/${event._id}`} className="event-card">
      <img
        className="thumb"
        src={event.bannerImage || "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=600"}
        alt={event.title}
      />
      <div className="body">
        <div className="date">{formatDate(event.date)}</div>
        <div className="title">{event.title}</div>
        <div className="venue">
          {event.venue}, {event.city}
        </div>
        <div className="price">From ₹{event.price}</div>
      </div>
    </Link>
  );
};

export default EventCard;
