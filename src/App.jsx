import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/Login";
import DashboardPage from "./pages/DashboardPage";
import PlotsPage from "./pages/PlotsPage";
import CustomersPage from "./pages/CustomersPage";
import PaymentsPage from "./pages/PaymentsPage";
import NotFoundPage from "./pages/NotFoundPage";
import ComingSoonPage from "./pages/ComingSoonPage";
import AdminLayout from "./layouts/AdminLayout";
export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/admin" element={<AdminLayout />}>
        <Route index element={<DashboardPage />} />
        <Route path="plots" element={<PlotsPage />} />
        <Route path="customers" element={<CustomersPage />} />
        <Route path="payments" element={<PaymentsPage />} />
        <Route path="layout" element={<ComingSoonPage />} />
        <Route path="installments" element={<ComingSoonPage />} />
        <Route path="reminders" element={<ComingSoonPage />} />
      </Route>
      <Route path="/dashboard" element={<Navigate to="/admin" replace />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
