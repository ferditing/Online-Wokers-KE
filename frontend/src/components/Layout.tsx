// frontend/src/components/Layout.tsx
import React, { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Bars3Icon, XMarkIcon } from "@heroicons/react/24/outline";
import NotificationDropdown from "./NotificationDropdown";

export default function Layout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth() as any;
  const [open, setOpen] = useState(false);
  const [isLarge, setIsLarge] = useState(typeof window !== "undefined" ? window.innerWidth >= 768 : true);
  const location = useLocation();

  // constants - keep in sync with CSS margin
  const SIDEBAR_WIDTH_PX = 224; // 14rem
  const SIDEBAR_CLASS = "w-56"; // tailwind width to match 14rem
  const MAIN_MARGIN_CLASS = "md:ml-56";

  useEffect(() => {
    function onResize() {
      const lg = window.innerWidth >= 768;
      setIsLarge(lg);
      setOpen(lg);
    }
    window.addEventListener("resize", onResize);
    onResize();
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // close sidebar on navigation (mobile only)
  useEffect(() => {
    if (!isLarge) setOpen(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  const close = () => {
    if (!isLarge) setOpen(false);
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => setOpen((v) => !v)} className="md:hidden p-1 rounded-md text-violet-600 hover:bg-violet-50">
              {open ? <XMarkIcon className="h-6 w-6" /> : <Bars3Icon className="h-6 w-6" />}
            </button>

            <Link to="/" className="text-xl font-bold text-violet-600">
              OnlineWorkersKE
            </Link>
          </div>

          <nav className="hidden md:flex gap-4 items-center">
            {user ? (
              <div className="flex items-center gap-3">
                <NotificationDropdown />
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <div className="w-8 h-8 bg-violet-600 rounded-full flex items-center justify-center text-white font-medium text-sm">
                      {user.name?.charAt(0).toUpperCase()}
                    </div>
                    <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                  </div>
                  <span className="text-sm text-slate-700">{user.name}</span>
                </div>
                <button onClick={() => logout()} className="px-3 py-1.5 bg-rose-600 text-white text-sm rounded-md hover:bg-rose-700 transition">
                  Logout
                </button>
              </div>
            ) : (
              <>
                <Link to="/jobs" className="text-sm text-slate-700 hover:text-violet-600">
                  Jobs
                </Link>
                <Link to="/" className="text-sm text-slate-700 hover:text-violet-600">
                  Home
                </Link>
                <Link to="/login" className="text-sm text-violet-600 font-medium">
                  Login
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>

      <div className="flex-1 flex">
        {/* overlay for mobile when sidebar open */}
        {open && !isLarge && (
          <div
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-20 bg-black/30 md:hidden transition-opacity"
            aria-hidden
          />
        )}

        {/* Sidebar */}
        <aside
          className={`fixed inset-y-0 left-0 z-30 transform transition-transform ${open ? "translate-x-0" : "-translate-x-full"} md:translate-x-0 md:static ${SIDEBAR_CLASS}`}
        >
          <div className="h-full flex flex-col bg-gradient-to-b from-violet-700 to-indigo-800 text-white shadow-lg">
            <div className="px-5 py-6 border-b border-white/10">
              <Link to="/" onClick={close} className="text-lg font-bold">
                OnlineWorkersKE
              </Link>
            </div>

            <nav className="p-4 flex-1 space-y-1 overflow-auto">
              {user ? (
                <>
                  <SidebarLink to="/" close={close}>Home</SidebarLink>
                  <SidebarLink to="/jobs" close={close}>Jobs</SidebarLink>
                  <SidebarLink to="/dashboard" close={close}>Dashboard</SidebarLink>
                  {user?.role === "employer" && <SidebarLink to="/post-job" close={close}>Post Job</SidebarLink>}
                  <SidebarLink to="/profile" close={close}>Profile</SidebarLink>

                  <div className="mt-4 border-t border-white/10 pt-3 text-sm text-violet-100">
                    Payments
                    <div className="mt-2 space-y-1">
                      {user?.role === "employer" ? (
                        <>
                          <SidebarLink to="/payments/topup" close={close}>Top-up escrow</SidebarLink>
                          <SidebarLink to="/payments" close={close}>Payments</SidebarLink>
                        </>
                      ) : (
                        <>
                          <SidebarLink to="/payments/request-payout" close={close}>Request payout</SidebarLink>
                          <SidebarLink to="/payments" close={close}>Payments</SidebarLink>
                        </>
                      )}
                    </div>
                  </div>

                  {user?.role === "admin" && (
                    <>
                      <div className="mt-4 border-t border-white/10 pt-3">
                        <SidebarLink to="/admin/verifications" close={close}>Admin verifications</SidebarLink>
                        <SidebarLink to="/admin/payments" close={close}>Admin payments</SidebarLink>
                      </div>
                    </>
                  )}
                </>
              ) : (
                <>
                  <SidebarLink to="/" close={close}>Home</SidebarLink>
                  <SidebarLink to="/jobs" close={close}>Jobs</SidebarLink>
                </>
              )}
            </nav>


          </div>
        </aside>

        {/* Main content - center children for forms and pages */}
        <main className={`flex-1 p-6 ${MAIN_MARGIN_CLASS}`}>
          <div className="max-w-3xl mx-auto">
            {children}
          </div>
        </main>
      </div>

      <footer className="mt-auto">
        <div className="container mx-auto px-4">
          <div className="border-t pt-6">
            <p className="text-xs text-gray-500 text-center">Built for Kenyan youth — OnlineWorkersKE</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

/* SidebarLink as small local component */
function SidebarLink({ to, children, close }: { to: string; children: React.ReactNode; close: () => void; }) {
  const location = useLocation();
  const active = location.pathname === to;
  return (
    <Link
      to={to}
      onClick={close}
      className={`block px-3 py-2 rounded-md text-sm font-medium transition ${active ? "bg-white/10 text-white" : "text-violet-100 hover:bg-white/5 hover:text-white"}`}
    >
      {children}
    </Link>
  );
}
