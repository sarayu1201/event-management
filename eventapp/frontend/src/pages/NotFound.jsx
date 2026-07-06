import { Link } from "react-router-dom";

const NotFound = () => (
  <div className="section empty-state">
    <h2>404 — Page Not Found</h2>
    <p>The page you're looking for doesn't exist.</p>
    <Link to="/" className="btn btn-primary" style={{ marginTop: 16, display: "inline-flex" }}>
      Go Home
    </Link>
  </div>
);

export default NotFound;
