import React, { useState, useEffect } from "react";
import api from "../services/api";
import Button from "../components/ui/Button";
import { useAuth } from "../context/AuthContext";

export default function VerifyProfile(){
  const [idFile, setIdFile] = useState<File | null>(null);
  const [certFile, setCertFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [uploads, setUploads] = useState<any[]>([]);
  const { user } = useAuth() as any;

  useEffect(() => {
    // load user's existing verification requests
    api.get("/verification").then(res => {
      const items = res.data?.items ?? res.data ?? [];
      setUploads(items);
    }).catch(()=>{});
  }, []);

  async function uploadSingle(type: string, file: File | null) {
    if (!file) return alert("Select a file");
    const fd = new FormData();
    fd.append("file", file);
    fd.append("type", type);
    try {
      setBusy(true);
      await api.post("/verification/request", fd, { headers: { "Content-Type": "multipart/form-data" }});
      alert(`${type} uploaded — pending review`);
      // refresh list
      const res = await api.get("/verification");
      setUploads(res.data?.items ?? res.data ?? []);
    } catch (err: any) {
      alert(err?.response?.data?.message || "Upload failed");
    } finally { setBusy(false); }
  }

  return (
    <div className="container mx-auto max-w-2xl py-6">
      <h2 className="text-2xl font-semibold mb-4">Verify your profile</h2>
      <p className="text-sm text-slate-600 mb-4">Upload national ID and any qualifications. Admin will review and approve.</p>

      <div className="grid gap-4">
        <div className="p-4 bg-white rounded shadow">
          <label className="block text-sm font-medium">National ID</label>
          <input type="file" accept="image/*,application/pdf" onChange={e=>setIdFile(e.target.files?.[0] ?? null)} className="mt-2" />
          <div className="mt-3">
            <Button className="bg-violet-600 text-white" onClick={()=>uploadSingle("id", idFile)} disabled={busy}>{busy ? "Uploading..." : "Upload ID"}</Button>
          </div>
        </div>

        <div className="p-4 bg-white rounded shadow">
          <label className="block text-sm font-medium">Qualification / Certificate</label>
          <input type="file" accept="image/*,application/pdf" onChange={e=>setCertFile(e.target.files?.[0] ?? null)} className="mt-2" />
          <div className="mt-3">
            <Button className="bg-violet-600 text-white" onClick={()=>uploadSingle("qualification", certFile)} disabled={busy}>{busy ? "Uploading..." : "Upload Certificate"}</Button>
          </div>
        </div>

        <div className="p-4 bg-white rounded shadow">
          <h4 className="text-sm font-medium">Your verification requests</h4>
          <div className="mt-2 space-y-2">
            {uploads.length === 0 ? <div className="text-sm text-slate-500">No uploads yet</div> : uploads.map(u => (
              <div key={u._id} className="flex items-center justify-between border rounded p-2">
                <div>
                  <div className="text-sm font-medium">{u.type}</div>
                  <div className="text-xs text-slate-500">{u.status} • {new Date(u.createdAt).toLocaleString()}</div>
                </div>
                <div>
                  <a href={u.fileUrl} target="_blank" rel="noreferrer" className="text-sm text-violet-600">View</a>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
