import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Layout from "./components/Layout";
import Home from "./pages/Home";
import Profile from "./pages/Profile";
import VerifyProfile from "./pages/VerifyProfile";
import Jobs from "./pages/Jobs";
import JobDetail from "./pages/JobDetail";
import DashboardEntry from "./pages/DashboardEntry";
import Login from "./pages/Auth/Login";
import Register from "./pages/Auth/Register";
import PaymentsHistory from "./pages/payments/PaymentsHistory";
import TopUpForm from "./pages/payments/TopUpForm";
import RequestPayoutForm from "./pages/payments/RequestPayoutForm";
import PayForJob from "./pages/payments/PayForJob";
import PostJob from "./pages/PostJob";
import AdminVerifications from "./pages/AdminVerifications";
import AdminPayments from "./pages/AdminPayments";
import { ProtectedRoute, GuestRoute } from "./components/RouteGuards";

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<GuestRoute><Login /></GuestRoute>} />
        <Route path="/register" element={<GuestRoute><Register /></GuestRoute>} />

        <Route path="/jobs" element={<Jobs />} />
        <Route path="/jobs/:id" element={<JobDetail />} />

        <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        <Route path="/profile/verify" element={<ProtectedRoute><VerifyProfile /></ProtectedRoute>} />
        <Route path="/post-job" element={<ProtectedRoute><PostJob /></ProtectedRoute>} />

        {/* single dashboard entry — chooses admin / employer / worker */}
        <Route path="/dashboard" element={<ProtectedRoute><DashboardEntry /></ProtectedRoute>} />

        {/* admin pages */}
        <Route path="/admin/verifications" element={<ProtectedRoute requireAdmin><AdminVerifications /></ProtectedRoute>} />
        <Route path="/admin/payments" element={<ProtectedRoute requireAdmin><AdminPayments /></ProtectedRoute>} />
        <Route path="/payments" element={<ProtectedRoute><PaymentsHistory /></ProtectedRoute>} />
        <Route path="/payments/topup" element={<ProtectedRoute roles={['employer']}><TopUpForm /></ProtectedRoute>} />
        <Route path="/payments/request-payout" element={<ProtectedRoute roles={['worker']}><RequestPayoutForm /></ProtectedRoute>} />
        <Route path="/pay-job/:jobId" element={<ProtectedRoute roles={['worker']}><PayForJob /></ProtectedRoute>} />
        <Route path="/jobs/:jobId/verify" element={<ProtectedRoute roles={['employer']}><PayForJob /></ProtectedRoute>} />
        <Route path="/admin/payments" element={<ProtectedRoute roles={['admin']}><AdminPayments /></ProtectedRoute>} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  );
}
