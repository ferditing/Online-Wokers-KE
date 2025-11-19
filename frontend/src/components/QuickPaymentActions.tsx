// src/components/QuickPaymentActions.tsx
import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function QuickPaymentActions({ compact }: { compact?: boolean }) {
  const { user } = useAuth() as any;

  if (!user) return null;

  return (
    <div className={`flex ${compact ? "flex-row gap-2 items-center" : "flex-col gap-2"}`}>
      {user.role === "employer" ? (
        <>
          <Link to="/payments/topup" className={`text-sm ${compact ? "px-2 py-1" : "px-3 py-2"} bg-violet-600 text-white rounded-md`}>Top-up escrow</Link>
          <Link to="/payments" className={`${compact ? "text-xs" : "text-sm"} text-slate-700 hover:underline`}>Payments</Link>
        </>
      ) : (
        <>
          <Link to="/payments/request-payout" className={`text-sm ${compact ? "px-2 py-1" : "px-3 py-2"} bg-cyan-600 text-white rounded-md`}>Request payout</Link>
          <Link to="/payments" className={`${compact ? "text-xs" : "text-sm"} text-slate-700 hover:underline`}>Payments</Link>
        </>
      )}
    </div>
  );
}
