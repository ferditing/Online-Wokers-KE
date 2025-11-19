import React, { useEffect, useState } from "react";
import api from "../services/api";
import Button from "../components/ui/Button";

export default function AdminVerifications(){
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const res = await api.get("/admin/verification?status=pending&limit=200");
      const arr = res.data?.items ?? res.data ?? [];
      setItems(arr);
    } catch (err) {
      console.error(err);
    } finally { setLoading(false); }
  }

  useEffect(()=>{ load(); }, []);

  async function patch(id: string, status: "approved"|"rejected") {
    try {
      await api.patch(`/admin/verification/${id}`, { status });
      setItems(prev => prev.filter(i => i._id !== id));
    } catch (err: any) {
      alert(err?.response?.data?.message || "Action failed");
    }
  }

  return (
    <div className="container mx-auto py-6">
      <h2 className="text-2xl font-semibold mb-4">Verification requests</h2>
      {loading ? <div>Loading...</div> : items.length === 0 ? <div className="text-sm text-slate-500">No pending requests</div> : (
        <div className="space-y-3">
          {items.map(i => (
            <div key={i._id} className="bg-white rounded shadow p-4 flex items-start justify-between">
              <div>
                <div className="font-medium">{i.userId?.name ?? "User"}</div>
                <div className="text-xs text-slate-500">Type: {i.type} • {new Date(i.createdAt).toLocaleString()}</div>
                <div className="mt-2"><a href={i.fileUrl} target="_blank" rel="noreferrer" className="text-violet-600">View document</a></div>
              </div>
              <div className="flex flex-col gap-2">
                <Button className="bg-cyan-600 text-white" onClick={()=>patch(i._id, "approved")}>Approve</Button>
                <Button className="bg-rose-100 text-rose-700" onClick={()=>patch(i._1d, "rejected")}>Reject</Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
