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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      // try several shapes
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

  return (
    <div className="container mx-auto py-8 max-w-md">
      <Card>
        <h2 className="text-xl font-semibold mb-2">
          {user?.role === 'employer' ? 'Verify Job' : 'Pay for Job'}
        </h2>
        <p className="text-sm text-slate-500 mb-4">
          {user?.role === 'employer'
            ? 'Pay a small fee to verify your job and get more visibility to workers.'
            : 'Complete payment for this job via M-Pesa. Funds will be held in escrow until job completion.'}
        </p>

        <form onSubmit={handlePayment} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Amount (KES)</label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value === "" ? "" : Number(e.target.value))}
              className="input w-full"
              min={user?.role === 'employer' ? 100 : 50}
              step={50}
              placeholder={user?.role === 'employer' ? "100" : "e.g. 1000"}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">M-Pesa Phone Number</label>
            <input
              type="tel"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              className="input w-full"
              placeholder="07XXXXXXXX or 254XXXXXXXXX"
              required
            />
            <p className="text-xs text-slate-500 mt-1">
              Enter the phone number registered with M-Pesa
            </p>
          </div>

          <div className="bg-blue-50 p-3 rounded text-sm">
            <p className="font-medium text-blue-800">Payment Flow:</p>
            <ol className="list-decimal list-inside text-blue-700 mt-1 space-y-1">
              {user?.role === 'employer' ? (
                <>
                  <li>Pay verification fee</li>
                  <li>Job gets verified badge</li>
                </>
              ) : (
                <>
                  <li>Click "Pay Now" to initiate STK Push</li>
                  <li>Complete payment on your phone</li>
                </>
              )}
            </ol>
          </div>

          <div className="flex gap-2">
            <Button
              type="submit"
              disabled={busy || paymentStatus === 'processing'}
              className="flex-1"
              variant={paymentStatus === 'success' ? 'success' : 'primary'}
            >
              {busy ? "Processing..." :
               paymentStatus === 'success' ? "Payment Initiated ✓" :
               "Pay Now via M-Pesa"}
            </Button>
            <Button
              type="button"
              onClick={() => navigate(-1)}
              variant="secondary"
            >
              Cancel
            </Button>
          </div>

          {message && (
            <div className={`text-sm p-3 rounded mt-2 ${
              paymentStatus === 'success' ? 'bg-green-50 text-green-700' :
              paymentStatus === 'failed' ? 'bg-red-50 text-red-700' :
              'bg-blue-50 text-blue-700'
            }`}>
              {message}
            </div>
          )}

          {checkoutId && <div className="text-xs text-slate-500 mt-2">Checkout: <code>{checkoutId}</code></div>}
        </form>
      </Card>
    </div>
  );
}
