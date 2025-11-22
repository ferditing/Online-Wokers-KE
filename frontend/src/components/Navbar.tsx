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
    <header className="bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-4">
            <button
              className="md:hidden p-2 rounded-xl text-violet-600 hover:bg-violet-50 transition-colors"
              onClick={onToggle}
              aria-label="Open menu"
            >
              <Bars3Icon className="h-6 w-6" />
            </button>

            <Link to="/" className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-r from-violet-600 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">OW</span>
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
                OnlineWorkersKE
              </span>
            </Link>
          </div>

          <nav className="hidden md:flex gap-6 items-center">
            <Link to="/jobs" className="text-sm font-medium text-slate-600 hover:text-violet-600 transition-colors">
              Jobs
            </Link>

            {!loading && user?.role === "employer" && (
              <Link to="/post-job" className="text-sm font-medium text-slate-600 hover:text-violet-600 transition-colors">
                Post Job
              </Link>
            )}

            {!loading && user && (
              <Link to="/dashboard" className="text-sm font-medium text-slate-600 hover:text-violet-600 transition-colors">
                Dashboard
              </Link>
            )}

            {!loading && user?.role === "admin" && (
              <Link to="/admin/verifications" className="text-sm font-medium text-slate-600 hover:text-violet-600 transition-colors">
                Admin
              </Link>
            )}

            {!loading && user && <QuickPaymentActions compact />}

            {!loading && user ? (
              <>
                <Link to="/profile" className="text-sm font-medium text-slate-700 hover:text-violet-600 transition-colors">
                  {user.name}
                </Link>
                <button 
                  onClick={() => logout()} 
                  className="text-sm font-medium text-rose-600 hover:text-rose-700 hover:bg-rose-50 px-3 py-1 rounded-lg transition-colors"
                >
                  Logout
                </button>
              </>
            ) : (
              <Link to="/login" className="text-sm font-medium text-violet-600 hover:text-violet-700">
                Login
              </Link>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
}