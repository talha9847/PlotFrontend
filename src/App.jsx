import { Navigate, Route, Routes } from "react-router-dom";

import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/Login";
import DashboardPage from "./pages/DashboardPage";
import Plots from "./pages/Plots";
import Customers from "./pages/Customers";
import PaymentsPage from "./pages/PaymentsPage";
import NotFoundPage from "./pages/NotFoundPage";
import ComingSoonPage from "./pages/ComingSoonPage";

import AdminLayout from "./layouts/AdminLayout";
import { AuthProvider } from "./context/authContext";
import ProtectedRoute from "./components/common/ProtectedRoute";
import Projects from "./pages/Projects";
import Leads from "./pages/Leads";
import Brokers from "./pages/Brokers";
import Unauthorized from "./pages/Unauthorized";
import Bookings from "./pages/Bookings";
import CustomerProfile from "./pages/CustomerProfile";
import Installments from "./pages/Installments";

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/unauthorized" element={<Unauthorized />} />

        {/* Protected admin routes */}
        <Route element={<ProtectedRoute allowedRoles={["admin"]} />}>
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="projects" element={<Projects />} />
            <Route path="leads" element={<Leads />} />
            <Route path="brokers" element={<Brokers />} />
            <Route path="plots" element={<Plots />} />
            <Route path="bookings" element={<Bookings />} />
            <Route path="customers" element={<Customers />} />
            <Route path="payments" element={<PaymentsPage />} />
            <Route path="layout" element={<ComingSoonPage />} />
            <Route path="installments" element={<Installments />} />
            <Route path="reminders" element={<ComingSoonPage />} />
          </Route>
        </Route>

        <Route element={<ProtectedRoute allowedRoles={["admin"]} />}>
          <Route path="/customer" element={<AdminLayout />}>
            <Route path="profile" element={<CustomerProfile />} />
          </Route>
        </Route>

        {/* Fallback route */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </AuthProvider>
  );
}
