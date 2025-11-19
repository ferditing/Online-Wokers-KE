// frontend/src/components/QuickPaymentActions.tsx
import { useState } from "react";
import { Link } from "react-router-dom";

/** Props: compact true = small inline UI, false/undefined = full UI */
type QuickPaymentActionsProps = {
  compact?: boolean;
};

export default function QuickPaymentActions({ compact }: QuickPaymentActionsProps) {
  const [open, setOpen] = useState(false);

  if (compact) {
    // small compact icon/buttons for desktop navbar
    return (
      <div className="flex items-center gap-2">
        <Link to="/payments/topup" className="text-sm px-3 py-1 border rounded hover:bg-violet-50">Top up</Link>
        <Link to="/payments/request-payout" className="text-sm px-3 py-1 border rounded hover:bg-violet-50">Withdraw</Link>
      </div>
    );
  }

  // full UI (e.g., used in a sidebar or expanded header)
  return (
    <div className="relative">
      <button
        onClick={() => setOpen(v => !v)}
        className="px-3 py-1 border rounded bg-white hover:bg-gray-50"
        aria-expanded={open}
      >
        Payments
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-48 bg-white border rounded shadow p-2 z-20">
          <Link to="/payments/topup" className="block py-1 px-2 hover:bg-slate-50">Top up</Link>
          <Link to="/payments/request-payout" className="block py-1 px-2 hover:bg-slate-50">Request payout</Link>
          <Link to="/payments" className="block py-1 px-2 hover:bg-slate-50">Payments</Link>
        </div>
      )}
    </div>
  );
}
