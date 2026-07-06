import { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const Navbar = () => {
  const [open, setOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const ref = useRef(null);

  useEffect(() => {
    const onClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    setOpen(false);
    navigate("/");
  };

  const dashboardPath =
    user?.role === "admin"
      ? "/admin/dashboard"
      : user?.role === "organiser"
      ? "/organiser/dashboard"
      : user?.role === "promoter"
      ? "/promoter/dashboard"
      : "/my-bookings";

  return (
    <nav className="navbar">
      <Link to="/" className="logo">
        Event<span>Hub</span>
      </Link>

      <div className="nav-links">
        <Link to="/">Home</Link>
        <Link to="/events">Events</Link>
        <Link to="/organiser/login">List Your Event</Link>
      </div>

      <div className="nav-right" ref={ref}>
        <button className="avatar-btn" onClick={() => setOpen((o) => !o)}>
          <span className="avatar-circle">{user ? user.name.charAt(0).toUpperCase() : "👤"}</span>
          <span>▾</span>
        </button>

        {open && (
          <div className="dropdown-menu">
            {user ? (
              <>
                <div className="dropdown-user-info">
                  <div className="name">{user.name}</div>
                  <span className="role-badge">{user.role}</span>
                </div>
                <Link to={dashboardPath} className="dropdown-item" onClick={() => setOpen(false)}>
                  {user.role === "user" ? "My Bookings" : "Dashboard"}
                </Link>
                <div className="dropdown-divider" />
                <button className="dropdown-item" style={{ width: "100%", textAlign: "left", background: "none", border: "none" }} onClick={handleLogout}>
                  Logout
                </button>
              </>
            ) : (
              <>
                <div className="dropdown-section-label">For Users</div>
                <Link to="/login" className="dropdown-item" onClick={() => setOpen(false)}>
                  Login
                </Link>
                <Link to="/signup" className="dropdown-item" onClick={() => setOpen(false)}>
                  Signup
                </Link>

                <div className="dropdown-divider" />
                <div className="dropdown-section-label">For Event Organisers</div>
                <Link to="/organiser/login" className="dropdown-item" onClick={() => setOpen(false)}>
                  Login
                </Link>
                <Link to="/organiser/signup" className="dropdown-item" onClick={() => setOpen(false)}>
                  Signup
                </Link>

                <div className="dropdown-divider" />
                <div className="dropdown-section-label">For Promoters</div>
                <Link to="/promoter/login" className="dropdown-item" onClick={() => setOpen(false)}>
                  Login
                </Link>

                <div className="dropdown-divider" />
                <div className="dropdown-section-label">For Admins</div>
                <Link to="/admin/login" className="dropdown-item" onClick={() => setOpen(false)}>
                  Admin Login
                </Link>
              </>
            )}
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
