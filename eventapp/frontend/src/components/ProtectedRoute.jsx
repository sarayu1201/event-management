import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

// Wrap a page element: <ProtectedRoute role="organiser"><Dashboard /></ProtectedRoute>
const ProtectedRoute = ({ children, role }) => {
  const { user, loading } = useAuth();

  if (loading) return <div className="loading-wrap">Loading...</div>;

  if (!user) {
    const redirectMap = {
      organiser: "/organiser/login",
      promoter: "/promoter/login",
      admin: "/admin/login",
      user: "/login",
    };
    return <Navigate to={redirectMap[role] || "/login"} replace />;
  }

  if (role && user.role !== role) {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default ProtectedRoute;
