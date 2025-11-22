import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import BalanceBadge from "./BalanceBadge";

export default function Sidebar({ open, setOpen }: any) {
  const { user, loading } = useAuth();
  const width = "w-64";

  function close() { if (typeof setOpen === "function") setOpen(false); }

  return (
    <aside className={`fixed inset-y-0 left-0 z-30 transform bg-gradient-to-b from-slate-900 to-slate-800 text-white shadow-2xl transition-all duration-300 md:static ${open ? "translate-x-0" : "-translate-x-full"} md:translate-x-0 ${width}`}>
      <div className="p-6 space-y-2">
        <Link to="/" onClick={close} className="flex items-center gap-3 px-4 py-3 rounded-xl text-white font-semibold hover:bg-slate-800 transition-colors group">
          <span className="text-lg">🏠</span>
          <span>Home</span>
        </Link>
        
        <Link to="/jobs" onClick={close} className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-300 hover:bg-slate-800 hover:text-white transition-colors group">
          <span className="text-lg">💼</span>
          <span>Jobs</span>
        </Link>

        {!loading && user?.role === "employer" && (
          <Link to="/post-job" onClick={close} className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-300 hover:bg-slate-800 hover:text-white transition-colors group">
            <span className="text-lg">📝</span>
            <span>Post Job</span>
          </Link>
        )}

        {!loading && user && (
          <>
            <Link to="/profile" onClick={close} className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-300 hover:bg-slate-800 hover:text-white transition-colors group">
              <span className="text-lg">👤</span>
              <span>Profile</span>
            </Link>

            <div className="mt-8 pt-6 border-t border-slate-700/50 space-y-4">
              <div className="px-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Balance</div>
                  <BalanceBadge />
                </div>

                <div className="space-y-2">
                  {user.role === "employer" ? (
                    <>
                      <Link to="/payments/topup" onClick={close} className="flex items-center gap-3 px-3 py-2 rounded-lg text-slate-300 hover:bg-slate-800 hover:text-white transition-colors group">
                        <span className="text-lg">💰</span>
                        <span className="text-sm">Top-up escrow</span>
                      </Link>
                      <Link to="/payments" onClick={close} className="flex items-center gap-3 px-3 py-2 rounded-lg text-slate-300 hover:bg-slate-800 hover:text-white transition-colors group">
                        <span className="text-lg">📊</span>
                        <span className="text-sm">Payments</span>
                      </Link>
                    </>
                  ) : (
                    <>
                      <Link to="/payments/request-payout" onClick={close} className="flex items-center gap-3 px-3 py-2 rounded-lg text-slate-300 hover:bg-slate-800 hover:text-white transition-colors group">
                        <span className="text-lg">💸</span>
                        <span className="text-sm">Request payout</span>
                      </Link>
                      <Link to="/payments" onClick={close} className="flex items-center gap-3 px-3 py-2 rounded-lg text-slate-300 hover:bg-slate-800 hover:text-white transition-colors group">
                        <span className="text-lg">📊</span>
                        <span className="text-sm">Payments</span>
                      </Link>
                    </>
                  )}
                </div>
              </div>
            </div>
          </>
        )}

        {!loading && user?.role === "admin" && (
          <>
            <div className="mt-8 pt-6 border-t border-slate-700/50">
              <div className="px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
                Admin
              </div>
              <div className="space-y-2">
                <Link to="/admin/verifications" onClick={close} className="flex items-center gap-3 px-3 py-2 rounded-lg text-slate-300 hover:bg-slate-800 hover:text-white transition-colors group">
                  <span className="text-lg">🛡️</span>
                  <span className="text-sm">Verifications</span>
                </Link>
                <Link to="/admin/payments" onClick={close} className="flex items-center gap-3 px-3 py-2 rounded-lg text-slate-300 hover:bg-slate-800 hover:text-white transition-colors group">
                  <span className="text-lg">💳</span>
                  <span className="text-sm">Payments</span>
                </Link>
              </div>
            </div>
          </>
        )}
      </div>
    </aside>
  );
}