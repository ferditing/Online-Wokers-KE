import { useState } from "react";
import { Link } from "react-router-dom";

/** Props: compact true = small inline UI, false/undefined = full UI */
type QuickPaymentActionsProps = {
  compact?: boolean;
};

export default function QuickPaymentActions({ compact }: QuickPaymentActionsProps) {
  const [open, setOpen] = useState(false);

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <Link 
          to="/payments/topup" 
          className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-green-600 text-white text-sm font-medium rounded-lg hover:shadow-lg transition-all duration-200 hover:scale-105"
        >
          Top up
        </Link>
        <Link 
          to="/payments/request-payout" 
          className="px-4 py-2 bg-gradient-to-r from-blue-500 to-cyan-600 text-white text-sm font-medium rounded-lg hover:shadow-lg transition-all duration-200 hover:scale-105"
        >
          Withdraw
        </Link>
      </div>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(v => !v)}
        className="px-4 py-2 bg-gradient-to-r from-violet-600 to-purple-600 text-white text-sm font-medium rounded-lg hover:shadow-lg transition-all duration-200 flex items-center gap-2"
        aria-expanded={open}
      >
        Payments
        <span className={`transform transition-transform ${open ? 'rotate-180' : ''}`}>
          ▼
        </span>
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-2xl border border-slate-200 p-2 z-20 space-y-1">
          <Link 
            to="/payments/topup" 
            className="flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium text-slate-700 hover:bg-violet-50 hover:text-violet-700 transition-colors group"
          >
            <div className="w-8 h-8 bg-gradient-to-r from-emerald-500 to-green-500 rounded-lg flex items-center justify-center">
              <span className="text-white text-sm">💰</span>
            </div>
            <span>Top up escrow</span>
          </Link>
          <Link 
            to="/payments/request-payout" 
            className="flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium text-slate-700 hover:bg-violet-50 hover:text-violet-700 transition-colors group"
          >
            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center">
              <span className="text-white text-sm">💸</span>
            </div>
            <span>Request payout</span>
          </Link>
          <Link 
            to="/payments" 
            className="flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium text-slate-700 hover:bg-violet-50 hover:text-violet-700 transition-colors group"
          >
            <div className="w-8 h-8 bg-gradient-to-r from-slate-500 to-slate-600 rounded-lg flex items-center justify-center">
              <span className="text-white text-sm">📊</span>
            </div>
            <span>Payments history</span>
          </Link>
        </div>
      )}
    </div>
  );
}