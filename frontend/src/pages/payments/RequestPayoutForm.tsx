import React, { useState } from "react";
import api from "../../services/api";
import Card from "../../components/ui/Card";

export default function RequestPayoutForm() {
  const [amount, setAmount] = useState<number | "">("");
  const [method, setMethod] = useState<"mpesa" | "bank">("mpesa");
  const [accountInfo, setAccountInfo] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!amount || Number(amount) <= 0) return setMessage("Enter a valid amount");

    setBusy(true);
    setMessage(null);

    try {
      const payload: any = { amount: Number(amount), currency: "KES", method };
      if (method === "mpesa") payload.accountInfo = accountInfo || "";
      else payload.accountInfo = accountInfo;

      await api.post("/payments/request-payout", payload);
      setMessage("Payout request submitted. Status: pending approval.");

      setAmount("");
      setAccountInfo("");
    } catch (err: any) {
      console.error(err);
      setMessage(err?.response?.data?.message || "Could not request payout");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-lg mx-auto">
        <Card className="space-y-6">
          <div className="text-center space-y-2">
            <div className="w-16 h-16 bg-gradient-to-r from-emerald-500 to-green-600 rounded-2xl flex items-center justify-center mx-auto">
              <span className="text-white text-2xl">💸</span>
            </div>
            <h2 className="text-2xl font-bold text-slate-800">Request Payout</h2>
            <p className="text-slate-600">Withdraw funds from your available balance</p>
          </div>

          <form onSubmit={submit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Amount (KES)</label>
              <input 
                type="number" 
                value={amount} 
                onChange={e => setAmount(e.target.value === "" ? "" : Number(e.target.value))} 
                className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:border-violet-500 focus:ring-2 focus:ring-violet-200 transition-all duration-200"
                placeholder="Enter amount"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Payment Method</label>
              <select 
                value={method} 
                onChange={e => setMethod(e.target.value as any)} 
                className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:border-violet-500 focus:ring-2 focus:ring-violet-200 transition-all duration-200"
              >
                <option value="mpesa">M-Pesa</option>
                <option value="bank">Bank Transfer</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                {method === "mpesa" ? "M-Pesa Phone Number" : "Bank Account Details"}
              </label>
              <input 
                className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:border-violet-500 focus:ring-2 focus:ring-violet-200 transition-all duration-200"
                value={accountInfo} 
                onChange={e => setAccountInfo(e.target.value)} 
                placeholder={method === "mpesa" ? "07XXXXXXXX" : "Bank name, account number, branch..."}
              />
            </div>

            <button 
              className="w-full py-3 px-4 bg-gradient-to-r from-emerald-500 to-green-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              disabled={busy}
            >
              {busy ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Processing...
                </div>
              ) : (
                "Request Payout"
              )}
            </button>

            {message && (
              <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 text-blue-700 text-sm font-medium">
                {message}
              </div>
            )}
          </form>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
            <p className="text-sm text-slate-600 text-center">
              Payouts are processed within 24-48 hours after admin approval
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}