// frontend/src/components/VerificationUpload.tsx
import React, { useState } from 'react';
import api from '../services/api';

export default function VerificationUpload() {
  const [file, setFile] = useState<File | null>(null);
  const [type, setType] = useState<'id'|'qualification'>('id');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) { setMsg('Choose a file'); return; }
    const fd = new FormData();
    fd.append('file', file);
    fd.append('type', type);

    setBusy(true); setMsg(null);
    try {
      const res = await api.post('/verification/request', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setMsg('Uploaded — verification pending');
    } catch (err: any) {
      setMsg(err?.response?.data?.message || 'Upload failed');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="card max-w-md">
      <h4 className="font-medium">Upload verification document</h4>
      <form onSubmit={submit} className="mt-3 space-y-3">
        <div>
          <label className="block text-sm mb-1">Type</label>
          <select value={type} onChange={e => setType(e.target.value as any)} className="input">
            <option value="id">ID / Passport</option>
            <option value="qualification">Qualification / Certificate</option>
          </select>
        </div>

        <div>
          <input type="file" accept="image/*,application/pdf" onChange={e => setFile(e.target.files?.[0] || null)} />
        </div>

        <div className="flex items-center gap-3">
          <button className="btn btn-primary" disabled={busy} type="submit">{busy ? 'Uploading...' : 'Upload'}</button>
          {msg && <div className="small text-gray-600">{msg}</div>}
        </div>
      </form>
    </div>
  );
}
