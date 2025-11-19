// frontend/src/components/VerificationUpload.tsx
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
      if (fileRef.current) fileRef.current.value = ""; // clear input

      // optional: refresh the logged-in user profile (no automatic verification until admin approves)
      try { await refreshUser(); } catch (err) { /* ignore */ }
    } catch (err: any) {
      setMsg(err?.response?.data?.message || "Upload failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="card p-4">
      <h4 className="font-medium">Upload verification</h4>
      <p className="text-sm text-gray-500">Upload National ID or qualification document to get verified.</p>

      <form onSubmit={submit} className="mt-3 space-y-3">
        <select value={type} onChange={e => setType(e.target.value)} className="input w-full">
          <option value="id">National ID</option>
          <option value="qualification">Qualification / Certificate</option>
        </select>

        <input
          ref={fileRef}
          type="file"
          accept="image/*,application/pdf"
          onChange={e => setFile(e.target.files?.[0] ?? null)}
          className="block"
          disabled={!user || busy}
        />

        <div className="flex items-center gap-3">
          <button type="submit" className="inline-flex items-center px-4 py-2 rounded bg-violet-600 text-white" disabled={!user || busy}>
            {busy ? "Uploading..." : "Upload"}
          </button>

          <div className="text-sm text-gray-600">{msg}</div>
        </div>
      </form>

      <div className="mt-3 text-xs text-gray-500">
        Your upload will be reviewed by an admin. Do not post sensitive info in public fields.
      </div>
    </div>
  );
}
