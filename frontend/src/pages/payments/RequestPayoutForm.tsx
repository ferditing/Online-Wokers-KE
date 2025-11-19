import React, { useState } from "react";
import api from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import Card from "../../components/ui/Card";

export default function RequestPayoutForm() {
  const { user } = useAuth() as any;
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
      if (method === "mpesa") payload.accountInfo = accountInfo || ""; // phone number
      else payload.accountInfo = accountInfo; // bank details (JSON/string)

      const res = await api.post("/payments/request-payout", payload);
      setMessage("Payout request submitted. Status: pending approval.");

      // optionally clear
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
    <div className="container mx-auto py-8">
      <Card>
        <h2 className="text-xl font-semibold mb-2">Request payout (Worker)</h2>
        <p className="text-sm text-slate-500 mb-4">Request a withdrawal from your available balance. Admin will approve and process the payment.</p>

        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="block text-sm">Amount (KES)</label>
            <input type="number" value={amount} onChange={e => setAmount(e.target.value === "" ? "" : Number(e.target.value))} className="input mt-1 w-48" />
          </div>

          <div>
            <label className="block text-sm">Method</label>
            <select value={method} onChange={e => setMethod(e.target.value as any)} className="input mt-1 w-48">
              <option value="mpesa">M-Pesa</option>
              <option value="bank">Bank Transfer</option>
            </select>
          </div>

          <div>
            <label className="block text-sm">{method === "mpesa" ? "M-Pesa phone number" : "Bank details"}</label>
            <input className="input mt-1 w-full" value={accountInfo} onChange={e => setAccountInfo(e.target.value)} placeholder={method === "mpesa" ? "07XXXXXXXX" : "Bank name / account no / branch"} />
          </div>

          <div>
            <button className="px-4 py-2 bg-cyan-600 text-white rounded" disabled={busy}>{busy ? "Sending…" : "Request payout"}</button>
          </div>

          {message && <div className="text-sm text-slate-600 mt-2">{message}</div>}
        </form>
      </Card>
    </div>
  );
}
