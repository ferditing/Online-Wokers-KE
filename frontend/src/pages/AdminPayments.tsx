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
      setPayments(prev => prev.filter(p => p._id !== id));
    } catch (err: any) {
      console.error(err);
      alert(err?.response?.data?.message || "Action failed");
    } finally {
      setProcessing(prev => ({ ...prev, [id]: false }));
    }
  }

  if (loading) return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-center py-12">
          <div className="animate-pulse flex space-x-4">
            <div className="rounded-full bg-blue-600 h-12 w-12"></div>
            <div className="flex-1 space-y-4 py-1">
              <div className="h-4 bg-blue-600 rounded w-3/4"></div>
              <div className="space-y-2">
                <div className="h-4 bg-blue-600 rounded"></div>
                <div className="h-4 bg-blue-600 rounded w-5/6"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  if (error) return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <div className="flex items-center">
            <svg className="w-6 h-6 text-red-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="text-red-800 font-semibold">{error}</h3>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Payment Management</h2>
              <p className="text-gray-600 mt-1">Review and manage pending payouts & top-ups</p>
            </div>
            <Link 
              to="/admin/verifications" 
              className="inline-flex items-center px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Verifications
            </Link>
          </div>
        </div>

        <div className="space-y-4">
          {payments.length === 0 && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 text-center">
              <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No pending payments</h3>
              <p className="text-gray-500">All payments have been processed</p>
            </div>
          )}

          {payments.map(p => {
            const userName = typeof p.userId === "string"
              ? p.userId
              : (p.userId?.name ?? (p.userId?._id ?? "User"));

            return (
              <div key={p._id} className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium capitalize">
                        {p.type}
                      </span>
                      <span className="text-lg font-semibold text-gray-900">
                        {p.currency ?? "KES"} {p.amount}
                      </span>
                    </div>
                    <div className="text-sm text-gray-600 mb-1">
                      <span className="font-medium">User:</span> {userName}
                    </div>
                    {p.meta?.note && (
                      <div className="text-sm text-gray-500 bg-gray-50 rounded-lg p-3 mt-2">
                        {p.meta.note}
                      </div>
                    )}
                    {p.createdAt && (
                      <div className="text-xs text-gray-400 mt-2">
                        Created: {new Date(p.createdAt).toLocaleDateString()}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-3 ml-6">
                    <button
                      className="inline-flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      onClick={() => handleDecision(p._id, true)}
                      disabled={processing[p._id]}
                    >
                      {processing[p._id] ? (
                        <>
                          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Processing...
                        </>
                      ) : (
                        <>
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          Approve
                        </>
                      )}
                    </button>
                    <button
                      className="inline-flex items-center px-4 py-2 bg-white border border-red-300 text-red-700 hover:bg-red-50 font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      onClick={() => handleDecision(p._id, false)}
                      disabled={processing[p._id]}
                    >
                      {processing[p._id] ? "..." : "Reject"}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}