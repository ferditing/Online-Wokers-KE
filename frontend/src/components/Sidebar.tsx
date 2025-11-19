import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import BalanceBadge from "./BalanceBadge";

/**
 * Sidebar with Payments area and balance badge
 */
export default function Sidebar({ open, setOpen }: any) {
  const { user, loading } = useAuth();
  const width = "w-64";

  function close() { if (typeof setOpen === "function") setOpen(false); }

  return (
    <aside className={`fixed inset-y-0 left-0 z-30 transform bg-white border-r shadow-sm transition-transform md:static ${open ? "translate-x-0" : "-translate-x-full"} md:translate-x-0 ${width}`}>
      <div className="p-4 space-y-3">
        <Link to="/" onClick={close} className="block text-violet-600 font-semibold">Home</Link>
        <Link to="/jobs" onClick={close} className="block text-slate-700">Jobs</Link>

        {!loading && user?.role === "employer" && (
          <Link to="/post-job" onClick={close} className="block text-slate-700">Post Job</Link>
        )}

        {!loading && user && (
          <>
            <Link to="/profile" onClick={close} className="block text-slate-700">Profile</Link>

            <div className="mt-2 border-t pt-2">
              <div className="flex items-center justify-between">
                <div className="text-xs text-slate-500">Balance</div>
                <BalanceBadge />
              </div>

              <div className="mt-3 space-y-2">
                {user.role === "employer" ? (
                  <>
                    <Link to="/payments/topup" onClick={close} className="block text-slate-700">Top-up escrow</Link>
                    <Link to="/payments" onClick={close} className="block text-slate-700">Payments</Link>
                  </>
                ) : (
                  <>
                    <Link to="/payments/request-payout" onClick={close} className="block text-slate-700">Request payout</Link>
                    <Link to="/payments" onClick={close} className="block text-slate-700">Payments</Link>
                  </>
                )}
              </div>
            </div>
          </>
        )}

        {!loading && user?.role === "admin" && (
          <>
            <div className="mt-2 border-t pt-2" />
            <Link to="/admin/verifications" onClick={close} className="block text-slate-700">Admin verifications</Link>
            <Link to="/admin/payments" onClick={close} className="block text-slate-700">Admin payments</Link>
          </>
        )}
      </div>
    </aside>
  );
}
