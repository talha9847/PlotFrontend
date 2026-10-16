import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../../context/authContext";
import { PageLoader } from "./Loader";

export default function ProtectedRoute({ allowedRoles }) {
  const { isAuthenticated, authLoading, user } = useAuth();
  const location = useLocation();

  if (authLoading) {
    return <PageLoader label="Verifying your session..." />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <Outlet />;
}
