import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const BottomNavigation = () => {
  const location = useLocation();
  const { user } = useAuth();

  const isSelected = (path) => {
    return location.pathname === path ? "active" : "";
  };

  const getProfilePath = () => {
    if (!user) return "/login";
    if (user.role === "admin") return "/admin/dashboard";
    if (user.role === "organiser") return "/organiser/dashboard";
    if (user.role === "promoter") return "/promoter/dashboard";
    return "/my-bookings";
  };

  return (
    <div className="bottom-nav">
      <Link to="/" className={`bottom-nav-item ${isSelected("/")}`}>
        <span className="icon">🏠</span>
        <span className="label">Home</span>
      </Link>
      <Link to="/events" className={`bottom-nav-item ${isSelected("/events")}`}>
        <span className="icon">🔍</span>
        <span className="label">Search</span>
      </Link>
      {user?.role === "organiser" && (
        <Link to="/organiser/create-event" className={`bottom-nav-item ${isSelected("/organiser/create-event")}`}>
          <span className="icon">➕</span>
          <span className="label">Add Event</span>
        </Link>
      )}
      {user?.role === "user" && (
        <Link to="/my-bookings" className={`bottom-nav-item ${isSelected("/my-bookings")}`}>
          <span className="icon">🎟️</span>
          <span className="label">Tickets</span>
        </Link>
      )}
      <Link to={getProfilePath()} className={`bottom-nav-item ${location.pathname.includes("dashboard") || location.pathname === "/my-bookings" ? "active" : ""}`}>
        <span className="icon">👤</span>
        <span className="label">Profile</span>
      </Link>
    </div>
  );
};

export default BottomNavigation;
