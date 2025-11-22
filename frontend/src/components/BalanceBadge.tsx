import { useEffect, useState } from "react";
import api from "../services/api";

export default function BalanceBadge() {
  const [balance, setBalance] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      try {
        const res = await api.get("/payments/balance");
        const data = res.data?.balance ?? res.data ?? null;
        if (!mounted) return;
        setBalance(Number(data) || 0);
      } catch (e: any) {
        console.warn("balance failed", e);
        if (mounted) setErr("—");
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => { mounted = false; };
  }, []);

  if (loading) return (
    <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gradient-to-r from-slate-100 to-slate-50 border border-slate-200">
      <div className="w-4 h-4 bg-slate-300 rounded-full animate-pulse"></div>
      <span className="text-sm font-medium text-slate-500">Loading...</span>
    </div>
  );

  if (err) return (
    <div className="px-3 py-2 rounded-lg bg-slate-50 border border-slate-200">
      <span className="text-sm font-medium text-slate-500">Balance —</span>
    </div>
  );

  return (
    <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-green-600 shadow-lg shadow-emerald-200">
      <div className="w-2 h-2 bg-white rounded-full opacity-80"></div>
      <span className="text-white font-bold text-sm">
        KES {balance?.toLocaleString()}
      </span>
    </div>
  );
}