import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../../context/authContext";
import Loader from "./Loader";

export default function ProtectedRoute() {
  const { isAuthenticated, authLoading } = useAuth();
  const location = useLocation();

  if (authLoading) {
    return <Loader label="Verifying your session..." />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <Outlet />;
}
