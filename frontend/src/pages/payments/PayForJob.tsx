import React, { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";

export default function PayForJob() {
  const { jobId } = useParams<{ jobId: string }>();
  const { user } = useAuth() as any;
  const navigate = useNavigate();

  const [amount, setAmount] = useState<number | "">("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'processing' | 'success' | 'failed'>('idle');
  const [checkoutId, setCheckoutId] = useState<string | null>(null);
  const pollRef = useRef<number | null>(null);
  const [paymentId, setPaymentId] = useState<string | null>(null);

  useEffect(() => {
    if (!checkoutId) return;

    setPaymentStatus('processing');
    setMessage("Waiting for M-Pesa confirmation... Enter PIN on your phone.");

    const doQuery = async () => {
      try {
        const res = await api.get(`/payments/mpesa/query-stk/${encodeURIComponent(checkoutId)}`);
        const data = res.data ?? res.data?.data ?? {};
        const resultCode = data.Result?.ResultCode ?? data.ResultCode ?? data.resultCode ?? null;

        if (resultCode !== null) {
          if (Number(resultCode) === 0) {
            setPaymentStatus('success');
            setMessage("Payment successful — funds are in escrow.");
            clearPolling();
          } else {
            setPaymentStatus('failed');
            setMessage("Payment failed or cancelled.");
            clearPolling();
          }
        }
      } catch (err) {
        console.debug("query error:", err);
      }
    };

    doQuery();
    pollRef.current = window.setInterval(doQuery, 5000);
    return () => clearPolling();
  }, [checkoutId]);

  const clearPolling = () => {
    if (pollRef.current) {
      window.clearInterval(pollRef.current);
      pollRef.current = null;
    }
  };

  async function handlePayment(e: React.FormEvent) {
    e.preventDefault();
    if (!amount || Number(amount) <= 0) return setMessage("Enter a valid amount");
    if (!phoneNumber) return setMessage("Enter your M-Pesa phone number");

    setBusy(true);
    setMessage(null);

    try {
      const endpoint = user.role === 'employer' ? "/payments/mpesa/verify-job" : "/payments/mpesa/pay-job";
      const res = await api.post(endpoint, {
        jobId,
        phoneNumber,
        amount: Number(amount),
      });

      const payload = res.data ?? res.data?.data ?? {};
      const checkoutRequestId = payload.checkoutRequestId ?? payload.checkoutRequestID ?? payload.mpesa?.checkoutRequestId ?? payload.mpesa?.checkoutRequestID ?? null;
      const returnedPaymentId = payload.payment?._id ?? payload.paymentId ?? null;

      if (payload.message) setMessage(payload.message);
      else setMessage("M-Pesa payment initiated. Please complete the payment on your phone.");

      if (checkoutRequestId) setCheckoutId(checkoutRequestId);
      if (returnedPaymentId) setPaymentId(returnedPaymentId);

      setPaymentStatus('processing');
    } catch (err: any) {
      console.error(err);
      setPaymentStatus('failed');
      setMessage(err?.response?.data?.message || "Payment failed. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => () => clearPolling(), []);

  const isEmployer = user?.role === 'employer';

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto">
        <Card className="space-y-6">
          <div className="text-center space-y-3">
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto ${
              isEmployer 
                ? "bg-gradient-to-r from-blue-500 to-cyan-600" 
                : "bg-gradient-to-r from-violet-600 to-purple-600"
            }`}>
              <span className="text-white text-2xl">
                {isEmployer ? "✓" : "💰"}
              </span>
            </div>
            <h2 className="text-2xl font-bold text-slate-800">
              {isEmployer ? 'Verify Job' : 'Pay for Job'}
            </h2>
            <p className="text-slate-600">
              {isEmployer
                ? 'Pay a small fee to verify your job and get more visibility'
                : 'Complete payment for this job via M-Pesa'}
            </p>
          </div>

          <form onSubmit={handlePayment} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Amount (KES)</label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value === "" ? "" : Number(e.target.value))}
                className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:border-violet-500 focus:ring-2 focus:ring-violet-200 transition-all duration-200"
                min={isEmployer ? 100 : 50}
                step={50}
                placeholder={isEmployer ? "100" : "e.g. 1000"}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">M-Pesa Phone Number</label>
              <input
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:border-violet-500 focus:ring-2 focus:ring-violet-200 transition-all duration-200"
                placeholder="07XXXXXXXX or 254XXXXXXXXX"
                required
              />
              <p className="text-xs text-slate-500 mt-2">
                Enter the phone number registered with M-Pesa
              </p>
            </div>

            <div className="bg-gradient-to-r from-blue-50 to-cyan-50 p-4 rounded-xl border border-blue-200">
              <p className="font-semibold text-blue-800 mb-2">Payment Flow:</p>
              <ol className="text-blue-700 space-y-2">
                {isEmployer ? (
                  <>
                    <li className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      Pay verification fee
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      Job gets verified badge
                    </li>
                  </>
                ) : (
                  <>
                    <li className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      Click "Pay Now" to initiate STK Push
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      Complete payment on your phone
                    </li>
                  </>
                )}
              </ol>
            </div>

            <div className="flex gap-3">
              <Button
                type="submit"
                disabled={busy || paymentStatus === 'processing'}
                className="flex-1"
                variant={
                  paymentStatus === 'success' ? 'success' : 
                  paymentStatus === 'failed' ? 'danger' : 'primary'
                }
              >
                {busy ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Processing...
                  </div>
                ) : paymentStatus === 'success' ? (
                  "Payment Successful ✓"
                ) : paymentStatus === 'processing' ? (
                  "Waiting for Confirmation..."
                ) : (
                  "Pay Now via M-Pesa"
                )}
              </Button>
              
              <Button
                type="button"
                onClick={() => navigate(-1)}
                variant="secondary"
                className="flex-shrink-0"
              >
                Cancel
              </Button>
            </div>

            {message && (
              <div className={`p-4 rounded-xl text-sm font-medium ${
                paymentStatus === 'success' 
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                  : paymentStatus === 'failed' 
                  ? 'bg-rose-50 text-rose-700 border border-rose-200'
                  : 'bg-blue-50 text-blue-700 border border-blue-200'
              }`}>
                {message}
              </div>
            )}

            {checkoutId && (
              <div className="text-xs text-slate-500 p-3 bg-slate-50 rounded-lg">
                Transaction ID: <code className="bg-slate-100 px-2 py-1 rounded">{checkoutId}</code>
              </div>
            )}
          </form>
        </Card>
      </div>
    </div>
  );
}