// src/pages/DashboardEntry.tsx
import React from "react";
import { useAuth } from "../context/AuthContext";
import AdminDashboard from "./Dashboard"; // admin page
import UserDashboard from "./UserDashboard";

export default function DashboardEntry() {
  const { user } = useAuth() as any;

  if (!user) return <div className="container py-8">Loading...</div>;

  if (user.role === "admin") return <AdminDashboard />;
  // employer or worker use the same UserDashboard component which renders role-specific view
  return <UserDashboard />;
}
