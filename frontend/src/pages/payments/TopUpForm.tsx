import React, { useEffect, useRef, useState } from "react";
import api from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import Card from "../../components/ui/Card";

export default function TopUpForm() {
  const { user } = useAuth() as any;
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
    // When checkoutId is set, start polling STK query endpoint
    if (!checkoutId) return;
    setStatus("processing");
    setMessage("Waiting for M-Pesa confirmation. Approve the payment on your phone...");

    const doQuery = async () => {
      try {
        const res = await api.get(`/payments/mpesa/query-stk/${encodeURIComponent(checkoutId)}`);
        const data = res.data ?? res.data?.data ?? {};
        // Many implementations return a structure; we try to detect success
        // Adjust depending on your backend's response shape.
        const resultCode =
          data.Result?.ResultCode ??
          data.ResultCode ??
          data.resultCode ??
          data?.result?.ResultCode ??
          null;

        if (resultCode !== null) {
          if (Number(resultCode) === 0) {
            setStatus("paid");
            setMessage("Top-up successful — balance updated.");
            clearIntervalIfNeeded();
            // refresh payments list or balance in parent app if needed
          } else {
            setStatus("failed");
            setMessage("Payment failed or cancelled. Please try again.");
            clearIntervalIfNeeded();
          }
        }
      } catch (err) {
        // don't spam errors to user; keep polling
        console.debug("STK query error (ignoring):", err);
      }
    };

    // initial immediate query + interval
    doQuery();
    pollRef.current = window.setInterval(doQuery, 5000);

    return () => clearIntervalIfNeeded();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

      // backend returns checkoutRequestID and paymentId
      const payload = res.data ?? res.data?.data ?? {};
      const checkoutRequestID = payload.checkoutRequestID ?? payload.CheckoutRequestID ?? payload.checkoutRequestId ?? null;
      const returnedPaymentId = payload.paymentId ?? payload.payment?._id ?? null;

      if (payload.message) setMessage(payload.message);
      else setMessage("M-Pesa payment initiated. Please complete the payment on your phone.");

      if (checkoutRequestID) setCheckoutId(checkoutRequestID);
      if (returnedPaymentId) setPaymentId(returnedPaymentId);

      // clear form but keep polling if we have checkout id
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
    <div className="container mx-auto py-8">
      <Card>
        <h2 className="text-xl font-semibold mb-2">Top up escrow (Employer)</h2>
        <p className="text-sm text-slate-500 mb-4">Add funds to cover job payments. Funds will be held in escrow until release.</p>

        <form onSubmit={handleTopUp} className="space-y-4">
          <div>
            <label className="block text-sm">Amount (KES)</label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value === "" ? "" : Number(e.target.value))}
              className="input mt-1 w-48"
              min={50}
              step={50}
              placeholder="e.g. 1000"
            />
          </div>

          <div>
            <label className="block text-sm">Phone Number</label>
            <input
              type="tel"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              className="input mt-1 w-48"
              placeholder="e.g. 0712345678 or 254712345678"
            />
          </div>

          <div className="flex items-center gap-2">
            <button type="submit" disabled={busy || status === "processing"} className="px-4 py-2 bg-violet-600 text-white rounded">
              {busy ? "Processing…" : status === "processing" ? "Waiting for confirmation…" : "Top up via M-Pesa"}
            </button>
            <button type="button" onClick={() => navigate("/payments")} className="px-4 py-2 border rounded">Payments</button>
          </div>

          {message && <div className={`text-sm text-slate-600 mt-2 ${status === "paid" ? "text-green-700" : status === "failed" ? "text-red-700" : ""}`}>{message}</div>}
          {checkoutId && <div className="text-xs text-slate-500 mt-1">Checkout ID: <code>{checkoutId}</code></div>}
        </form>
      </Card>
    </div>
  );
}
