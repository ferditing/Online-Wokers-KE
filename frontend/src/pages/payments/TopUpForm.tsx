import React, { useEffect, useRef, useState } from "react";
import api from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import Card from "../../components/ui/Card";

export default function TopUpForm() {
  useAuth() as any;
  const [amount, setAmount] = useState<number | "">("");
  const [phoneNumber, setPhoneNumber] = useState<string>("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [checkoutId, setCheckoutId] = useState<string | null>(null);
  const [paymentId, setPaymentId] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "processing" | "paid" | "failed">("idle");
  const navigate = useNavigate();
  const pollRef = useRef<number | null>(null);

  useEffect(() => {
    if (!checkoutId) return;
    setStatus("processing");
    setMessage("Waiting for M-Pesa confirmation. Approve the payment on your phone...");

    const doQuery = async () => {
      try {
        const res = await api.get(`/payments/mpesa/query-stk/${encodeURIComponent(checkoutId)}`);
        const data = res.data ?? res.data?.data ?? {};
        const resultCode = data.Result?.ResultCode ?? data.ResultCode ?? data.resultCode ?? data?.result?.ResultCode ?? null;

        if (resultCode !== null) {
          if (Number(resultCode) === 0) {
            setStatus("paid");
            setMessage("Top-up successful — balance updated.");
            clearIntervalIfNeeded();
          } else {
            setStatus("failed");
            setMessage("Payment failed or cancelled. Please try again.");
            clearIntervalIfNeeded();
          }
        }
      } catch (err) {
        console.debug("STK query error (ignoring):", err);
      }
    };

    doQuery();
    pollRef.current = window.setInterval(doQuery, 5000);

    return () => clearIntervalIfNeeded();
  }, [checkoutId]);

  const clearIntervalIfNeeded = () => {
    if (pollRef.current) {
      window.clearInterval(pollRef.current);
      pollRef.current = null;
    }
  };

  async function handleTopUp(e: React.FormEvent) {
    e.preventDefault();
    if (!amount || Number(amount) <= 0) return setMessage("Enter a valid amount");
    if (!phoneNumber.trim()) return setMessage("Enter your phone number");

    setBusy(true);
    setMessage(null);
    setStatus("idle");
    setCheckoutId(null);
    setPaymentId(null);

    try {
      const res = await api.post("/payments/topup", {
        amount: Number(amount),
        currency: "KES",
        phoneNumber: phoneNumber.trim()
      });

      const payload = res.data ?? res.data?.data ?? {};
      const checkoutRequestID = payload.checkoutRequestID ?? payload.CheckoutRequestID ?? payload.checkoutRequestId ?? null;
      const returnedPaymentId = payload.paymentId ?? payload.payment?._id ?? null;

      if (payload.message) setMessage(payload.message);
      else setMessage("M-Pesa payment initiated. Please complete the payment on your phone.");

      if (checkoutRequestID) setCheckoutId(checkoutRequestID);
      if (returnedPaymentId) setPaymentId(returnedPaymentId);

      setAmount("");
      setPhoneNumber("");
    } catch (err: any) {
      console.error(err);
      setMessage(err?.response?.data?.message || "Could not initiate top-up");
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    return () => clearIntervalIfNeeded();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-lg mx-auto">
        <Card className="space-y-6">
          <div className="text-center space-y-2">
            <div className="w-16 h-16 bg-gradient-to-r from-violet-600 to-purple-600 rounded-2xl flex items-center justify-center mx-auto">
              <span className="text-white text-2xl">💰</span>
            </div>
            <h2 className="text-2xl font-bold text-slate-800">Top Up Escrow</h2>
            <p className="text-slate-600">Add funds to cover job payments</p>
          </div>

          <form onSubmit={handleTopUp} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Amount (KES)</label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value === "" ? "" : Number(e.target.value))}
                className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:border-violet-500 focus:ring-2 focus:ring-violet-200 transition-all duration-200"
                min={50}
                step={50}
                placeholder="e.g. 1000"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Phone Number</label>
              <input
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:border-violet-500 focus:ring-2 focus:ring-violet-200 transition-all duration-200"
                placeholder="e.g. 0712345678 or 254712345678"
              />
            </div>

            <div className="flex items-center gap-3">
              <button 
                type="submit" 
                disabled={busy || status === "processing"}
                className="flex-1 py-3 px-4 bg-gradient-to-r from-violet-600 to-purple-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {busy ? "Processing..." : status === "processing" ? "Waiting for confirmation..." : "Top up via M-Pesa"}
              </button>
              
              <button 
                type="button" 
                onClick={() => navigate("/payments")} 
                className="px-6 py-3 bg-slate-100 text-slate-700 font-semibold rounded-xl border border-slate-200 hover:bg-slate-200 transition-colors"
              >
                Payments
              </button>
            </div>

            {message && (
              <div className={`p-4 rounded-xl text-sm font-medium ${
                status === "paid" 
                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200" 
                  : status === "failed" 
                  ? "bg-rose-50 text-rose-700 border border-rose-200"
                  : "bg-blue-50 text-blue-700 border border-blue-200"
              }`}>
                {message}
              </div>
            )}

            {checkoutId && (
              <div className="text-xs text-slate-500 p-3 bg-slate-50 rounded-lg">
                Checkout ID: <code className="bg-slate-100 px-2 py-1 rounded">{checkoutId}</code>
              </div>
            )}
          </form>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
            <p className="text-sm text-slate-600 text-center">
              Funds will be held in escrow until job completion
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}