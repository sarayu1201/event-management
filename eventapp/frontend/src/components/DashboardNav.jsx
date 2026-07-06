import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const DashboardNav = ({ role }) => {
  const location = useLocation();
  const { user, logout } = useAuth();

  const organiserLinks = [
    { to: "/organiser/dashboard", label: "Home" },
    { to: "/organiser/events", label: "Events" },
    { to: "/organiser/create-event", label: "Create Event" },
  ];

  const promoterLinks = [
    { to: "/promoter/dashboard", label: "Home" },
    { to: "/promoter/events", label: "My Events" },
  ];

  const adminLinks = [
    { to: "/admin/dashboard", label: "Super Admin Portal" },
  ];

  const links = role === "organiser" ? organiserLinks : role === "promoter" ? promoterLinks : adminLinks;

  return (
    <div className="dash-nav">
      <Link to="/" className="logo">
        Event<span style={{ color: role === "admin" ? "#8b5cf6" : "#ec1e79" }}>Hub</span>
      </Link>
      <div className="links">
        {links.map((l) => (
          <Link key={l.to} to={l.to} className={location.pathname === l.to ? "active" : ""}>
            {l.label}
          </Link>
        ))}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <span style={{ fontSize: 14, color: "var(--text-dim)" }}>
          {user?.name} <span className="badge">{role}</span>
        </span>
        <button className="btn btn-outline btn-sm" onClick={logout}>
          Logout
        </button>
      </div>
    </div>
  );
};

export default DashboardNav;
