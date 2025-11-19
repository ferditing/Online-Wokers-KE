import React, { useEffect, useState } from "react";
import api from "../../services/api";
import { Link } from "react-router-dom";
import Card from "../../components/ui/Card";
import { useAuth } from "../../context/AuthContext";

type Payment = {
  _id: string;
  amount: number;
  currency?: string;
  type?: "topup" | "payout" | "release" | "escrow" | "job_verification";
  status?: string;
  createdAt?: string;
  meta?: any;
};

export default function PaymentsHistory() {
  const { user } = useAuth() as any;
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshToggle, setRefreshToggle] = useState(false);

  useEffect(() => {
    let mounted = true;
    const fetchPayments = async () => {
      setLoading(true);
      try {
        // Show payments for the current user
        const res = await api.get(`/payments?userId=${user?.id ?? ""}&limit=50`);
        const data = res.data?.payments ?? res.data ?? [];
        if (!mounted) return;
        setPayments(data);
        setError(null);
      } catch (err: any) {
        console.error(err);
        if (mounted) setError(err?.response?.data?.message || "Could not load payments");
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchPayments();
    const interval = window.setInterval(fetchPayments, 10000); // refresh every 10s
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [user, refreshToggle]);

  if (loading) return <div className="container py-8">Loading payments…</div>;
  if (error) return <div className="container py-8 text-red-600">{error}</div>;

  return (
    <div className="container mx-auto py-8">
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Payments history</h2>
          <div className="flex items-center gap-3">
            <Link to="/payments" className="text-sm text-slate-600">Payments home</Link>
            <button onClick={() => setRefreshToggle(t => !t)} className="text-sm px-2 py-1 border rounded">Refresh</button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full table-auto">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-3 py-2 text-sm">Type</th>
                <th className="text-left px-3 py-2 text-sm">Amount</th>
                <th className="text-left px-3 py-2 text-sm">Status</th>
                <th className="text-left px-3 py-2 text-sm">Date</th>
                <th className="px-3 py-2 text-sm">Details</th>
              </tr>
            </thead>
            <tbody>
              {payments.length === 0 && (
                <tr><td colSpan={5} className="p-6 text-sm text-slate-500 text-center">No payments yet</td></tr>
              )}
              {payments.map(p => (
                <tr key={p._id} className="hover:bg-gray-50">
                  <td className="px-3 py-3 text-sm">{p.type}</td>
                  <td className="px-3 py-3 text-sm font-medium">{p.currency ?? "KES"} {p.amount}</td>
                  <td className="px-3 py-3 text-sm">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      p.status === "paid" ? "bg-green-50 text-green-700" :
                      p.status === "failed" ? "bg-red-50 text-red-700" :
                      "bg-yellow-50 text-yellow-700"
                    }`}>{p.status}</span>
                  </td>
                  <td className="px-3 py-3 text-sm">{new Date(p.createdAt || "").toLocaleString()}</td>
                  <td className="px-3 py-3 text-right text-sm">{p.meta?.note ?? p.meta?.phone ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
