import React, { useEffect, useState } from "react";
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

  if (loading) return <div className="text-xs text-slate-400">Balance …</div>;
  if (err) return <div className="text-xs text-slate-400">Balance —</div>;

  return <div className="inline-block px-2 py-1 rounded bg-slate-100 text-sm font-medium">KES {balance?.toLocaleString()}</div>;
}
