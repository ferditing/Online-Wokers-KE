import React, { useRef, useState } from "react";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";

export default function VerificationUpload() {
  const { user, refreshUser } = useAuth() as any;
  const [file, setFile] = useState<File | null>(null);
  const [type, setType] = useState("id");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) { setMsg("You must be signed in to upload"); return; }
    if (!file) { setMsg("Select a file"); return; }

    setBusy(true);
    setMsg(null);
    try {
      const form = new FormData();
      form.append("file", file);
      form.append("type", type);

      await api.post("/verification/request", form, {
        headers: { "Content-Type": "multipart/form-data" }
      });

      setMsg("Upload successful — pending admin review");
      setFile(null);
      if (fileRef.current) fileRef.current.value = "";

      try { await refreshUser(); } catch (err) { /* ignore */ }
    } catch (err: any) {
      setMsg(err?.response?.data?.message || "Upload failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
      <div className="space-y-2">
        <h4 className="text-lg font-bold text-slate-800">Upload verification</h4>
        <p className="text-slate-600">Upload National ID or qualification document to get verified.</p>
      </div>

      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Document Type</label>
          <select 
            value={type} 
            onChange={e => setType(e.target.value)} 
            className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:border-violet-500 focus:ring-2 focus:ring-violet-200 transition-all duration-200"
          >
            <option value="id">National ID</option>
            <option value="qualification">Qualification / Certificate</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Upload File</label>
          <input
            ref={fileRef}
            type="file"
            accept="image/*,application/pdf"
            onChange={e => setFile(e.target.files?.[0] ?? null)}
            className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-violet-50 file:text-violet-700 hover:file:bg-violet-100"
            disabled={!user || busy}
          />
        </div>

        <div className="flex items-center gap-4">
          <button 
            type="submit" 
            className="px-6 py-3 bg-gradient-to-r from-violet-600 to-purple-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none" 
            disabled={!user || busy}
          >
            {busy ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Uploading...
              </div>
            ) : (
              "Upload Document"
            )}
          </button>

          {msg && (
            <div className="text-sm font-medium px-4 py-2 rounded-lg bg-slate-100 text-slate-700">
              {msg}
            </div>
          )}
        </div>
      </form>

      <div className="text-xs text-slate-500 p-3 bg-slate-50 rounded-lg">
        Your upload will be reviewed by an admin. Do not post sensitive info in public fields.
      </div>
    </div>
  );
}