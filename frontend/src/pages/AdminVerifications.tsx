import React, { useEffect, useState } from "react";
import api from "../services/api";
import Button from "../components/ui/Button";

export default function AdminVerifications() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);

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

  useEffect(() => { load(); }, []);

  async function patch(id: string, status: "approved" | "rejected") {
    setProcessing(id);
    try {
      await api.patch(`/admin/verification/${id}`, { status });
      setItems(prev => prev.filter(i => i._id !== id));
    } catch (err: any) {
      alert(err?.response?.data?.message || "Action failed");
    } finally {
      setProcessing(null);
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'id':
        return '🆔';
      case 'qualification':
        return '📜';
      default:
        return '📄';
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'id':
        return 'National ID';
      case 'qualification':
        return 'Qualification';
      default:
        return type;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h2 className="text-3xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
                Verification Requests
              </h2>
              <p className="text-slate-600">Review and approve user verification documents</p>
            </div>
            
            <button 
              onClick={load}
              className="px-4 py-2 bg-gradient-to-r from-slate-600 to-slate-700 text-white font-medium rounded-xl hover:shadow-lg transition-all duration-200"
            >
              Refresh
            </button>
          </div>

          {loading ? (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-12 text-center">
              <div className="w-16 h-16 border-4 border-violet-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-slate-600 font-medium">Loading verification requests...</p>
            </div>
          ) : items.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-12 text-center">
              <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl text-slate-400">✅</span>
              </div>
              <p className="text-slate-700 font-semibold text-lg mb-2">All caught up!</p>
              <p className="text-slate-500">No pending verification requests</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {items.map(item => (
                <div key={item._id} className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4 flex-1">
                      <div className="w-12 h-12 bg-gradient-to-r from-blue-100 to-cyan-100 rounded-xl flex items-center justify-center text-xl">
                        {getTypeIcon(item.type)}
                      </div>
                      
                      <div className="space-y-2 flex-1">
                        <div className="flex items-center gap-3">
                          <h3 className="font-semibold text-slate-800 text-lg">
                            {item.userId?.name || "Unknown User"}
                          </h3>
                          <span className="px-2 py-1 bg-slate-100 text-slate-700 text-xs font-medium rounded-full capitalize">
                            {getTypeLabel(item.type)}
                          </span>
                        </div>
                        
                        <p className="text-slate-600 text-sm">
                          Submitted on {new Date(item.createdAt).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                        
                        <div className="flex items-center gap-3">
                          <a 
                            href={item.fileUrl} 
                            target="_blank" 
                            rel="noreferrer" 
                            className="inline-flex items-center gap-2 px-3 py-1.5 bg-violet-50 text-violet-700 text-sm font-medium rounded-lg hover:bg-violet-100 transition-colors"
                          >
                            <span>📎</span>
                            View Document
                          </a>
                          
                          {item.userId?.email && (
                            <span className="text-slate-500 text-sm">
                              {item.userId.email}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2 ml-4">
                      <Button 
                        className="bg-gradient-to-r from-emerald-500 to-green-600 text-white px-4 py-2"
                        onClick={() => patch(item._id, "approved")}
                        disabled={processing === item._id}
                      >
                        {processing === item._id ? (
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            Processing...
                          </div>
                        ) : (
                          "Approve"
                        )}
                      </Button>
                      
                      <Button 
                        className="bg-gradient-to-r from-rose-500 to-pink-600 text-white px-4 py-2"
                        onClick={() => patch(item._id, "rejected")}
                        disabled={processing === item._id}
                      >
                        {processing === item._id ? (
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            Processing...
                          </div>
                        ) : (
                          "Reject"
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {items.length > 0 && (
            <div className="text-center text-slate-500 text-sm">
              Showing {items.length} pending verification requests
            </div>
          )}
        </div>
      </div>
    </div>
  );
}