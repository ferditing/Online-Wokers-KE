import React from "react";
import { useAuth } from "../context/AuthContext";
import Dashboard from "./Dashboard";
import UserDashboard from "./UserDashboard";

/**
 * DashboardEntry
 * - Shown at /dashboard
 * - Chooses admin vs user dashboard after auth loads
 */
export default function DashboardEntry() {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="container py-8">Loading dashboard…</div>;
  }

  if (!user) {
    return <div className="container py-8">Please sign in to view your dashboard.</div>;
  }

  // Admin users see the admin dashboard; everyone else sees the user dashboard
  if (user.role === "admin") {
    return <Dashboard />;
  }

  return <UserDashboard />;
}
