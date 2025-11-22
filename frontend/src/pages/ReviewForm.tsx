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
    if (!jobId || !workerId) { setMsg("Job ID and Worker ID are required"); return; }
    setBusy(true);
    try {
      await api.post(`/jobs/${jobId}/review`, { workerId, rating, comment });
      setMsg("Review submitted successfully!");
      setJobId(""); setWorkerId(""); setRating(5); setComment("");
    } catch (err: any) {
      setMsg(err?.response?.data?.message || "Failed to submit review");
    } finally { setBusy(false); }
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
      <div className="mb-6">
        <h3 className="text-xl font-bold text-gray-900">Submit Review</h3>
        <p className="text-gray-600 mt-1">Share your experience working with this professional</p>
      </div>

      <form onSubmit={submit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Job ID</label>
            <input 
              placeholder="Enter Job ID" 
              value={jobId} 
              onChange={e => setJobId(e.target.value)} 
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Worker ID</label>
            <input 
              placeholder="Enter Worker ID" 
              value={workerId} 
              onChange={e => setWorkerId(e.target.value)} 
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">Rating</label>
          <div className="flex items-center gap-4">
            <select 
              value={rating} 
              onChange={e => setRating(Number(e.target.value))} 
              className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            >
              {[5,4,3,2,1].map(n => (
                <option key={n} value={n}>
                  {Array(n).fill('★').join('')} ({n} Star{n !== 1 ? 's' : ''})
                </option>
              ))}
            </select>
            <div className="flex text-2xl text-yellow-400">
              {Array.from({ length: 5 }, (_, i) => (
                <span key={i}>{i < rating ? '★' : '☆'}</span>
              ))}
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Comment</label>
          <textarea 
            placeholder="Share your experience working with this professional..." 
            value={comment} 
            onChange={e => setComment(e.target.value)} 
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors h-32 resize-none"
          />
        </div>

        <div className="flex items-center justify-between pt-4">
          <button 
            className="inline-flex items-center px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed" 
            type="submit" 
            disabled={busy}
          >
            {busy ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Submitting Review...
              </>
            ) : (
              <>
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Submit Review
              </>
            )}
          </button>
          
          {msg && (
            <div className={`px-4 py-3 rounded-lg border ${
              msg.includes("successfully") 
                ? "bg-green-50 border-green-200 text-green-800" 
                : "bg-red-50 border-red-200 text-red-800"
            }`}>
              {msg}
            </div>
          )}
        </div>
      </form>
    </div>
  );
}