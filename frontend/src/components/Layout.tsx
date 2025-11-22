import React, { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Bars3Icon, XMarkIcon } from "@heroicons/react/24/outline";
import NotificationDropdown from "./NotificationDropdown";

export default function Layout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth() as any;
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isLarge, setIsLarge] = useState(typeof window !== "undefined" ? window.innerWidth >= 768 : true);
  const location = useLocation();

  const SIDEBAR_WIDTH_CLASS = "md:w-64";
  const MAIN_MARGIN_CLASS = "md:ml-64";

  useEffect(() => {
    function onResize() {
      const lg = window.innerWidth >= 768;
      setIsLarge(lg);
      setSidebarOpen(lg);
    }
    window.addEventListener("resize", onResize);
    onResize();
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    if (!isLarge) setSidebarOpen(false);
  }, [location.pathname, isLarge]);

  const closeSidebar = () => {
    if (!isLarge) setSidebarOpen(false);
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-lg border-b border-slate-200 shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSidebarOpen((v) => !v)}
                className="md:hidden p-2 rounded-xl text-violet-600 hover:bg-violet-50 transition-colors"
              >
                {sidebarOpen ? <XMarkIcon className="h-6 w-6" /> : <Bars3Icon className="h-6 w-6" />}
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
              {user ? (
                <div className="flex items-center gap-4">
                  <NotificationDropdown />
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div className="w-10 h-10 bg-gradient-to-r from-violet-600 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-lg">
                        {user.name?.charAt(0).toUpperCase()}
                      </div>
                      <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white shadow-sm"></div>
                    </div>
                    <span className="text-sm font-medium text-slate-700">{user.name}</span>
                  </div>
                  <button
                    onClick={() => logout()}
                    className="px-4 py-2 bg-gradient-to-r from-rose-600 to-pink-600 text-white text-sm font-medium rounded-lg hover:shadow-lg transition-all duration-200"
                  >
                    Logout
                  </button>
                </div>
              ) : (
                <>
                  <Link to="/jobs" className="text-sm font-medium text-slate-600 hover:text-violet-600 transition-colors">
                    Jobs
                  </Link>
                  <Link to="/" className="text-sm font-medium text-slate-600 hover:text-violet-600 transition-colors">
                    Home
                  </Link>
                  <Link to="/login" className="text-sm font-medium text-violet-600 hover:text-violet-700">
                    Login
                  </Link>
                </>
              )}
            </nav>
          </div>
        </div>
      </header>

      <div className="flex-1 flex">
        {/* Mobile overlay */}
        {sidebarOpen && !isLarge && (
          <div
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 z-30 bg-black/20 md:hidden backdrop-blur-sm"
            aria-hidden
          />
        )}

        {/* Sidebar */}
        <aside
          className={`fixed inset-y-0 left-0 z-30 transform transition-all duration-300 bg-gradient-to-b from-slate-900 to-slate-800 text-white shadow-2xl
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} md:translate-x-0 ${SIDEBAR_WIDTH_CLASS}`}
        >
          <div className="h-full flex flex-col">
            <div className="px-6 py-8 border-b border-slate-700/50">
              <Link to="/" onClick={closeSidebar} className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-r from-violet-500 to-purple-500 rounded-xl flex items-center justify-center shadow-lg">
                  <span className="text-white font-bold text-lg">OW</span>
                </div>
                <span className="text-xl font-bold text-white">OnlineWorkersKE</span>
              </Link>
            </div>

            <nav className="p-6 flex-1 space-y-2 overflow-auto">
              {user ? (
                <>
                  <SidebarLink to="/" close={closeSidebar} icon="🏠">Dashboard</SidebarLink>
                  <SidebarLink to="/jobs" close={closeSidebar} icon="💼">Jobs</SidebarLink>
                  {user?.role === "employer" && <SidebarLink to="/post-job" close={closeSidebar} icon="📝">Post Job</SidebarLink>}
                  <SidebarLink to="/profile" close={closeSidebar} icon="👤">Profile</SidebarLink>

                  <div className="mt-8 pt-6 border-t border-slate-700/50">
                    <div className="px-3 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">
                      Payments
                    </div>
                    <div className="space-y-2">
                      {user?.role === "employer" ? (
                        <>
                          <SidebarLink to="/payments/topup" close={closeSidebar} icon="💰">Top-up escrow</SidebarLink>
                          <SidebarLink to="/payments" close={closeSidebar} icon="📊">Payments</SidebarLink>
                        </>
                      ) : (
                        <>
                          <SidebarLink to="/payments/request-payout" close={closeSidebar} icon="💸">Request payout</SidebarLink>
                          <SidebarLink to="/payments" close={closeSidebar} icon="📊">Payments</SidebarLink>
                        </>
                      )}
                    </div>
                  </div>

                  {user?.role === "admin" && (
                    <div className="mt-8 pt-6 border-t border-slate-700/50">
                      <div className="px-3 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">
                        Admin
                      </div>
                      <SidebarLink to="/admin/verifications" close={closeSidebar} icon="🛡️">Verifications</SidebarLink>
                      <SidebarLink to="/admin/payments" close={closeSidebar} icon="💳">Payments</SidebarLink>
                    </div>
                  )}
                </>
              ) : (
                <>
                  <SidebarLink to="/" close={closeSidebar} icon="🏠">Home</SidebarLink>
                  <SidebarLink to="/jobs" close={closeSidebar} icon="💼">Jobs</SidebarLink>
                </>
              )}
            </nav>
          </div>
        </aside>

        {/* Main content */}
        <main className={`flex-1 p-6 transition-all duration-300 ${MAIN_MARGIN_CLASS}`}>
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>

      <footer className="bg-white/50 backdrop-blur-sm border-t border-slate-200 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <p className="text-sm text-slate-500 text-center">
            Built for Kenyan youth — <span className="font-semibold text-slate-700">OnlineWorkersKE</span>
          </p>
        </div>
      </footer>
    </div>
  );
}

function SidebarLink({ to, children, close, icon }: { to: string; children: React.ReactNode; close: () => void; icon?: string }) {
  const location = useLocation();
  const active = location.pathname === to;
  return (
    <Link
      to={to}
      onClick={close}
      className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 group
        ${active 
          ? "bg-gradient-to-r from-violet-600 to-purple-600 text-white shadow-lg" 
          : "text-slate-300 hover:bg-slate-800 hover:text-white"
        }`}
    >
      <span className="text-lg">{icon}</span>
      <span>{children}</span>
      <span className={`ml-auto transform transition-transform ${
        active ? "translate-x-0" : "translate-x-1 group-hover:translate-x-0"
      }`}>
        →
      </span>
    </Link>
  );
}