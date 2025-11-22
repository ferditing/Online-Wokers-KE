import { useEffect, useState } from "react";
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
    const interval = window.setInterval(fetchPayments, 10000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [user, refreshToggle]);

  if (loading) return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 border-4 border-violet-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-slate-600 font-medium">Loading payments...</p>
        </div>
      </div>
    </div>
  );

  if (error) return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="p-6 bg-rose-50 border border-rose-200 rounded-2xl text-rose-700 text-center">
          <p className="font-semibold">{error}</p>
        </div>
      </div>
    </div>
  );

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'paid':
      case 'completed':
      case 'success':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'failed':
      case 'cancelled':
      case 'rejected':
        return 'bg-rose-100 text-rose-800 border-rose-200';
      case 'pending':
      case 'processing':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'topup':
        return '💰';
      case 'payout':
        return '💸';
      case 'release':
        return '🎉';
      case 'escrow':
        return '🔒';
      case 'job_verification':
        return '✓';
      default:
        return '💳';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <Card className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h2 className="text-2xl font-bold text-slate-800">Payments History</h2>
              <p className="text-slate-600">Track all your payment transactions</p>
            </div>
            
            <div className="flex items-center gap-4">
              <Link 
                to="/payments" 
                className="px-4 py-2 text-slate-600 hover:text-violet-600 font-medium transition-colors"
              >
                Payments Home
              </Link>
              <button 
                onClick={() => setRefreshToggle(t => !t)} 
                className="px-4 py-2 bg-gradient-to-r from-violet-600 to-purple-600 text-white font-medium rounded-xl hover:shadow-lg transition-all duration-200"
              >
                Refresh
              </button>
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl border border-slate-200">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-slate-50 to-slate-100 border-b border-slate-200">
                <tr>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-slate-700">Type</th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-slate-700">Amount</th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-slate-700">Status</th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-slate-700">Date</th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-slate-700">Details</th>
                </tr>
              </thead>
              
              <tbody className="divide-y divide-slate-100">
                {payments.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center">
                      <div className="space-y-3">
                        <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto">
                          <span className="text-2xl text-slate-400">💳</span>
                        </div>
                        <p className="text-slate-500 font-medium">No payments yet</p>
                        <p className="text-sm text-slate-400">Your payment history will appear here</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  payments.map(payment => (
                    <tr key={payment._id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center">
                            <span className="text-lg">{getTypeIcon(payment.type || '')}</span>
                          </div>
                          <div>
                            <div className="font-medium text-slate-800 capitalize">
                              {payment.type?.replace('_', ' ') || 'Payment'}
                            </div>
                          </div>
                        </div>
                      </td>
                      
                      <td className="px-6 py-4">
                        <div className="text-lg font-bold text-slate-800">
                          {payment.currency || 'KES'} {payment.amount?.toLocaleString()}
                        </div>
                      </td>
                      
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(payment.status || '')}`}>
                          {payment.status || 'Unknown'}
                        </span>
                      </td>
                      
                      <td className="px-6 py-4 text-slate-600">
                        {payment.createdAt ? new Date(payment.createdAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        }) : '—'}
                      </td>
                      
                      <td className="px-6 py-4 text-slate-600">
                        {payment.meta?.note || payment.meta?.phone || '—'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {payments.length > 0 && (
            <div className="flex items-center justify-between text-sm text-slate-500">
              <p>Showing {payments.length} transactions</p>
              <p>Auto-refreshing every 10 seconds</p>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}