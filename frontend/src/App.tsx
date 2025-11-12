// src/App.tsx
import { Routes, Route, Navigate } from "react-router-dom";
import Layout from "./components/Layout";
import Home from "./pages/Home";
import Profile from "./pages/Profile";
import Jobs from "./pages/Jobs";
import JobDetail from "./pages/JobDetail";
import DashboardEntry from "./pages/DashboardEntry";
import Login from "./pages/Auth/Login";
import Register from "./pages/Auth/Register";
import PostJob from "./pages/PostJob";
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
        <Route path="/post-job" element={<ProtectedRoute><PostJob /></ProtectedRoute>} />

        {/* single dashboard entry — chooses admin / employer / worker */}
        <Route path="/dashboard" element={<ProtectedRoute><DashboardEntry /></ProtectedRoute>} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  );
}
