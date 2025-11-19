import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export function ProtectedRoute({ children, requireAdmin=false }: any) {
  const { user, loading } = useAuth();
  if (loading) return <div className="container py-6">Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (requireAdmin && user.role !== "admin") return <Navigate to="/" replace />;
  return children;
}

export function GuestRoute({ children }: any) {
  const { user, loading } = useAuth();
  if (loading) return <div className="container py-6">Loading...</div>;
  if (user) return <Navigate to="/" replace />;
  return children;
}
