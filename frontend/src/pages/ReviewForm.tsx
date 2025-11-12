// src/components/ReviewForm.tsx
import React, { useState } from "react";
import api from "../services/api";

export default function ReviewForm() {
  const [jobId, setJobId] = useState("");
  const [workerId, setWorkerId] = useState("");
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!jobId || !workerId) { setMsg("jobId and workerId required"); return; }
    setBusy(true);
    try {
      await api.post(`/jobs/${jobId}/review`, { workerId, rating, comment });
      setMsg("Review submitted");
      setJobId(""); setWorkerId(""); setRating(5); setComment("");
    } catch (err: any) {
      setMsg(err?.response?.data?.message || "Failed to submit review");
    } finally { setBusy(false); }
  }

  return (
    <form onSubmit={submit} className="mt-3 grid gap-3 max-w-xl">
      <input placeholder="Job ID" value={jobId} onChange={e => setJobId(e.target.value)} className="input" />
      <input placeholder="Worker ID" value={workerId} onChange={e => setWorkerId(e.target.value)} className="input" />
      <div className="flex items-center gap-3">
        <label className="text-sm">Rating</label>
        <select value={rating} onChange={e => setRating(Number(e.target.value))} className="input w-28">
          {[5,4,3,2,1].map(n => <option key={n} value={n}>{n} ★</option>)}
        </select>
      </div>
      <textarea placeholder="Short comment" value={comment} onChange={e => setComment(e.target.value)} className="input h-24" />
      <div className="flex items-center gap-3">
        <button className="btn btn-primary" type="submit" disabled={busy}>{busy ? "Submitting..." : "Submit review"}</button>
        {msg && <div className="text-sm text-gray-600">{msg}</div>}
      </div>
    </form>
  );
}
