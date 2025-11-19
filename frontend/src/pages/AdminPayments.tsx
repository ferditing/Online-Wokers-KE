// frontend/src/pages/AdminPayments.tsx
import { useEffect, useState } from "react";
import api from "../services/api";
import Card from "../components/ui/Card";
import { Link } from "react-router-dom";

type Payment = {
  _id: string;
  userId?: string | { _id?: string; name?: string };
  amount: number;
  currency?: string;
  type?: string;
  status?: string;
  createdAt?: string;
  meta?: any;
};

export default function AdminPayments() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState<Record<string, boolean>>({});

  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      try {
        const res = await api.get("/admin/payments?status=pending&limit=100");
        const data = res.data?.payments ?? res.data ?? [];
        if (!mounted) return;
        setPayments(data);
      } catch (err: any) {
        console.error(err);
        setError(err?.response?.data?.message || "Could not load admin payments");
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => { mounted = false; };
  }, []);

  async function handleDecision(id: string, approve: boolean) {
    setProcessing(prev => ({ ...prev, [id]: true }));
    try {
      await api.patch(`/admin/payments/${id}`, { status: approve ? "approved" : "rejected" });
      // remove from local list
      setPayments(prev => prev.filter(p => p._id !== id));
    } catch (err: any) {
      console.error(err);
      alert(err?.response?.data?.message || "Action failed");
    } finally {
      setProcessing(prev => ({ ...prev, [id]: false }));
    }
  }

  if (loading) return <div className="container py-8">Loading payments for admin…</div>;
  if (error) return <div className="container py-8 text-red-600">{error}</div>;

  return (
    <div className="container mx-auto py-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">Admin — Pending payouts & top-ups</h2>
        <Link to="/admin/verifications" className="text-sm text-slate-600">Verifications</Link>
      </div>

      <div className="space-y-3">
        {payments.length === 0 && <Card><div className="text-sm text-slate-500">No pending payments</div></Card>}

        {payments.map(p => {
          const userName = typeof p.userId === "string"
            ? p.userId
            : (p.userId?.name ?? (p.userId?._id ?? "User"));

          return (
            <Card key={p._id}>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-sm font-medium">{p.type} — {userName}</div>
                  <div className="text-xs text-slate-500">{p.currency ?? "KES"} {p.amount}</div>
                  <div className="text-xs text-slate-400 mt-1">{p.meta?.note}</div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    className="px-3 py-1 bg-emerald-600 text-white rounded"
                    onClick={() => handleDecision(p._id, true)}
                    disabled={processing[p._id]}
                  >
                    {processing[p._id] ? "…" : "Approve"}
                  </button>
                  <button
                    className="px-3 py-1 bg-rose-100 text-rose-700 rounded"
                    onClick={() => handleDecision(p._id, false)}
                    disabled={processing[p._id]}
                  >
                    {processing[p._id] ? "…" : "Reject"}
                  </button>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
