// src/components/Navbar.tsx
import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Bars3Icon } from "@heroicons/react/24/outline";
import QuickPaymentActions from "./QuickPaymentActions";

/**
 * Navbar: hides any role-specific links until `loading` is false.
 * Admin links only render when user.role === 'admin' AND loading is false.
 */
export default function Navbar({ onToggle }: any) {
  const { user, logout, loading } = useAuth();

  return (
    <header className="border-b bg-white">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button className="md:hidden p-2 rounded text-violet-600" onClick={onToggle}><Bars3Icon className="h-6 w-6" /></button>
          <Link to="/" className="text-2xl font-bold text-violet-600">OnlineWorkersKE</Link>
        </div>

        <nav className="hidden md:flex gap-4 items-center">
          <Link to="/jobs" className="text-sm text-slate-700 hover:text-violet-600">Jobs</Link>

          {/* Only show Post Job if auth finished and user is employer */}
          {!loading && user?.role === "employer" && (
            <Link to="/post-job" className="text-sm text-slate-700 hover:text-violet-600">Post Job</Link>
          )}

          {/* Dashboard visible if authenticated (no flash because we guard on loading) */}
          {!loading && user && (
            <Link to="/dashboard" className="text-sm text-slate-700 hover:text-violet-600">Dashboard</Link>
          )}

          {/* Admin link: show ONLY when auth finished AND role === admin */}
          {!loading && user?.role === "admin" && (
            <Link to="/admin/verifications" className="text-sm text-slate-700 hover:text-violet-600">Admin</Link>
          )}

          {/* Compact quick payment actions (desktop) */}
          {!loading && user && <QuickPaymentActions compact />}

          {/* Right side auth controls */}
          {!loading && user ? (
            <>
              <Link to="/profile" className="text-sm text-slate-700 hover:text-violet-600">{user.name}</Link>
              <button onClick={() => logout()} className="text-sm text-rose-600">Logout</button>
            </>
          ) : (
            // Guest view
            <Link to="/login" className="text-sm text-violet-600 font-medium">Login</Link>
          )}
        </nav>
      </div>
    </header>
  );
}
