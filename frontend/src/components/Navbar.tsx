// frontend/src/components/Navbar.tsx
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Bars3Icon } from "@heroicons/react/24/outline";
import QuickPaymentActions from "./QuickPaymentActions";

type NavbarProps = {
  onToggle?: () => void;
};

export default function Navbar({ onToggle }: NavbarProps) {
  const { user, logout, loading } = useAuth();

  return (
    <header className="border-b bg-white">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            className="md:hidden p-2 rounded text-violet-600"
            onClick={onToggle}
            aria-label="Open menu"
          >
            <Bars3Icon className="h-6 w-6" />
          </button>

          <Link to="/" className="text-2xl font-bold text-violet-600">OnlineWorkersKE</Link>
        </div>

        <nav className="hidden md:flex gap-4 items-center">
          <Link to="/jobs" className="text-sm text-slate-700 hover:text-violet-600">Jobs</Link>

          {!loading && user?.role === "employer" && (
            <Link to="/post-job" className="text-sm text-slate-700 hover:text-violet-600">Post Job</Link>
          )}

          {!loading && user && (
            <Link to="/dashboard" className="text-sm text-slate-700 hover:text-violet-600">Dashboard</Link>
          )}

          {!loading && user?.role === "admin" && (
            <Link to="/admin/verifications" className="text-sm text-slate-700 hover:text-violet-600">Admin</Link>
          )}

          {!loading && user && <QuickPaymentActions compact />}

          {!loading && user ? (
            <>
              <Link to="/profile" className="text-sm text-slate-700 hover:text-violet-600">{user.name}</Link>
              <button onClick={() => logout()} className="text-sm text-rose-600">Logout</button>
            </>
          ) : (
            <Link to="/login" className="text-sm text-violet-600 font-medium">Login</Link>
          )}
        </nav>
      </div>
    </header>
  );
}
