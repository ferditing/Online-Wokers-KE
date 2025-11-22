import React, { useState, useEffect } from "react";
import api from "../services/api";
import Button from "../components/ui/Button";
import { useAuth } from "../context/AuthContext";
import Card from "../components/ui/Card";

export default function VerifyProfile() {
  const [idFile, setIdFile] = useState<File | null>(null);
  const [certFile, setCertFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [uploads, setUploads] = useState<any[]>([]);
  const { user } = useAuth() as any;

  useEffect(() => {
    // Load user's existing verification requests
    api.get("/verification").then(res => {
      const items = res.data?.items ?? res.data ?? [];
      setUploads(items);
    }).catch(() => {});
  }, []);

  async function uploadSingle(type: string, file: File | null) {
    if (!file) return alert("Select a file");
    const fd = new FormData();
    fd.append("file", file);
    fd.append("type", type);
    try {
      setBusy(true);
      await api.post("/verification/request", fd, { headers: { "Content-Type": "multipart/form-data" }});
      alert(`${type === 'id' ? 'National ID' : 'Certificate'} uploaded — pending review`);
      // Refresh list
      const res = await api.get("/verification");
      setUploads(res.data?.items ?? res.data ?? []);
      // Clear file input
      if (type === 'id') setIdFile(null);
      else setCertFile(null);
    } catch (err: any) {
      alert(err?.response?.data?.message || "Upload failed");
    } finally { 
      setBusy(false); 
    }
  }

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'approved':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'rejected':
        return 'bg-rose-100 text-rose-800 border-rose-200';
      case 'pending':
      default:
        return 'bg-amber-100 text-amber-800 border-amber-200';
    }
  };

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
        return 'Qualification Certificate';
      default:
        return type;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="w-20 h-20 bg-gradient-to-r from-violet-600 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <span className="text-white text-2xl">🛡️</span>
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent mb-4">
            Verify Your Profile
          </h1>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Upload your National ID and qualifications to get verified. 
            Verified profiles get more job opportunities and build trust with employers.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* National ID Upload */}
            <Card className="p-6">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center">
                  <span className="text-white text-xl">🆔</span>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-800">National ID Verification</h3>
                  <p className="text-slate-600">Upload a clear photo of your National ID card</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="border-2 border-dashed border-slate-300 rounded-2xl p-6 text-center hover:border-violet-400 transition-colors duration-200">
                  <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl text-slate-400">📷</span>
                  </div>
                  <input
                    type="file"
                    accept="image/*,application/pdf"
                    onChange={e => setIdFile(e.target.files?.[0] ?? null)}
                    className="hidden"
                    id="id-file"
                  />
                  <label htmlFor="id-file" className="cursor-pointer">
                    <div className="font-medium text-slate-700 mb-2">
                      {idFile ? idFile.name : "Click to select National ID file"}
                    </div>
                    <div className="text-sm text-slate-500">
                      Supports JPG, PNG, PDF (Max 5MB)
                    </div>
                  </label>
                </div>

                {idFile && (
                  <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
                        <span className="text-emerald-600 text-lg">✓</span>
                      </div>
                      <div>
                        <div className="font-medium text-slate-800">{idFile.name}</div>
                        <div className="text-sm text-slate-500">
                          {(idFile.size / 1024 / 1024).toFixed(2)} MB
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => setIdFile(null)}
                      className="text-slate-400 hover:text-rose-500 transition-colors"
                    >
                      ×
                    </button>
                  </div>
                )}

                <Button
                  onClick={() => uploadSingle("id", idFile)}
                  disabled={busy || !idFile}
                  className="w-full bg-gradient-to-r from-blue-500 to-cyan-600"
                >
                  {busy ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Uploading...
                    </div>
                  ) : (
                    "Upload National ID"
                  )}
                </Button>
              </div>
            </Card>

            {/* Certificate Upload */}
            <Card className="p-6">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 bg-gradient-to-r from-emerald-500 to-green-500 rounded-2xl flex items-center justify-center">
                  <span className="text-white text-xl">📜</span>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-800">Qualifications & Certificates</h3>
                  <p className="text-slate-600">Upload your educational or professional certificates</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="border-2 border-dashed border-slate-300 rounded-2xl p-6 text-center hover:border-violet-400 transition-colors duration-200">
                  <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl text-slate-400">🎓</span>
                  </div>
                  <input
                    type="file"
                    accept="image/*,application/pdf"
                    onChange={e => setCertFile(e.target.files?.[0] ?? null)}
                    className="hidden"
                    id="cert-file"
                  />
                  <label htmlFor="cert-file" className="cursor-pointer">
                    <div className="font-medium text-slate-700 mb-2">
                      {certFile ? certFile.name : "Click to select certificate file"}
                    </div>
                    <div className="text-sm text-slate-500">
                      Supports JPG, PNG, PDF (Max 5MB)
                    </div>
                  </label>
                </div>

                {certFile && (
                  <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
                        <span className="text-emerald-600 text-lg">✓</span>
                      </div>
                      <div>
                        <div className="font-medium text-slate-800">{certFile.name}</div>
                        <div className="text-sm text-slate-500">
                          {(certFile.size / 1024 / 1024).toFixed(2)} MB
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => setCertFile(null)}
                      className="text-slate-400 hover:text-rose-500 transition-colors"
                    >
                      ×
                    </button>
                  </div>
                )}

                <Button
                  onClick={() => uploadSingle("qualification", certFile)}
                  disabled={busy || !certFile}
                  className="w-full bg-gradient-to-r from-emerald-500 to-green-600"
                >
                  {busy ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Uploading...
                    </div>
                  ) : (
                    "Upload Certificate"
                  )}
                </Button>
              </div>
            </Card>

            {/* Upload History */}
            <Card className="p-6">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 bg-gradient-to-r from-slate-600 to-slate-700 rounded-2xl flex items-center justify-center">
                  <span className="text-white text-xl">📋</span>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-800">Verification History</h3>
                  <p className="text-slate-600">Track your verification requests and their status</p>
                </div>
              </div>

              <div className="space-y-4">
                {uploads.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-24 h-24 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <span className="text-3xl text-slate-400">📄</span>
                    </div>
                    <p className="text-slate-600 font-medium mb-2">No verification requests yet</p>
                    <p className="text-sm text-slate-500">
                      Upload your documents above to get started
                    </p>
                  </div>
                ) : (
                  uploads.map((upload) => (
                    <div key={upload._id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-200">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-gradient-to-r from-violet-100 to-purple-100 rounded-2xl flex items-center justify-center">
                          <span className="text-xl">{getTypeIcon(upload.type)}</span>
                        </div>
                        <div>
                          <div className="font-semibold text-slate-800">
                            {getTypeLabel(upload.type)}
                          </div>
                          <div className="text-sm text-slate-500">
                            Uploaded {new Date(upload.createdAt).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4">
                        <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(upload.status)}`}>
                          <div className={`w-2 h-2 rounded-full ${
                            upload.status === 'approved' ? 'bg-emerald-500' :
                            upload.status === 'rejected' ? 'bg-rose-500' :
                            'bg-amber-500'
                          }`}></div>
                          {upload.status?.charAt(0).toUpperCase() + upload.status?.slice(1) || 'Pending'}
                        </span>
                        
                        <a 
                          href={upload.fileUrl} 
                          target="_blank" 
                          rel="noreferrer" 
                          className="px-3 py-2 bg-white text-slate-700 font-medium rounded-lg border border-slate-300 hover:border-violet-400 hover:text-violet-700 transition-all duration-200"
                        >
                          View
                        </a>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Verification Status */}
            <Card className="p-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-r from-violet-600 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <span className="text-white text-2xl">🛡️</span>
                </div>
                <h4 className="font-bold text-slate-800 mb-2">Verification Status</h4>
                {user.verified ? (
                  <div className="space-y-3">
                    <div className="text-emerald-600 bg-emerald-50 px-4 py-3 rounded-xl font-semibold border border-emerald-200">
                      ✓ Fully Verified
                    </div>
                    <p className="text-sm text-slate-600">
                      Your profile is verified and you can apply to all jobs
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="text-amber-600 bg-amber-50 px-4 py-3 rounded-xl font-semibold border border-amber-200">
                      ⚠️ Not Verified
                    </div>
                    <p className="text-sm text-slate-600">
                      Complete verification to unlock all features
                    </p>
                  </div>
                )}
              </div>
            </Card>

            {/* Benefits Card */}
            <Card className="p-6">
              <h4 className="font-bold text-slate-800 mb-4">Benefits of Verification</h4>
              <div className="space-y-3">
                {[
                  { icon: "✅", text: "Apply to all jobs" },
                  { icon: "🌟", text: "Build trust with employers" },
                  { icon: "💼", text: "Get more job offers" },
                  { icon: "⚡", text: "Faster application approval" },
                  { icon: "🛡️", text: "Verified profile badge" }
                ].map((benefit, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center">
                      <span className="text-emerald-600">{benefit.icon}</span>
                    </div>
                    <span className="text-sm text-slate-700">{benefit.text}</span>
                  </div>
                ))}
              </div>
            </Card>

            {/* Guidelines Card */}
            <Card className="p-6">
              <h4 className="font-bold text-slate-800 mb-4">Upload Guidelines</h4>
              <div className="space-y-3 text-sm text-slate-600">
                <div className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 bg-slate-400 rounded-full mt-2 flex-shrink-0"></div>
                  <span>Ensure documents are clear and readable</span>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 bg-slate-400 rounded-full mt-2 flex-shrink-0"></div>
                  <span>Supported formats: JPG, PNG, PDF</span>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 bg-slate-400 rounded-full mt-2 flex-shrink-0"></div>
                  <span>Maximum file size: 5MB per document</span>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 bg-slate-400 rounded-full mt-2 flex-shrink-0"></div>
                  <span>Review typically takes 24-48 hours</span>
                </div>
              </div>
            </Card>

            {/* Support Card */}
            <Card className="p-6 bg-gradient-to-br from-blue-50 to-cyan-50 border border-blue-200">
              <div className="text-center">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center mx-auto mb-3">
                  <span className="text-white text-lg">💬</span>
                </div>
                <h4 className="font-bold text-slate-800 mb-2">Need Help?</h4>
                <p className="text-sm text-slate-600 mb-4">
                  Having trouble with verification?
                </p>
                <button className="w-full px-4 py-2 bg-white text-blue-600 font-semibold rounded-xl border border-blue-300 hover:bg-blue-50 transition-colors">
                  Contact Support
                </button>
              </div>
            </Card>
          </div>
        </div>

        {/* Progress Bar */}
        {!user.verified && uploads.length > 0 && (
          <Card className="mt-8 p-6 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-bold text-slate-800">Verification Progress</h4>
              <span className="text-sm font-medium text-amber-700">
                {uploads.filter(u => u.status === 'approved').length} of 2 approved
              </span>
            </div>
            <div className="w-full bg-amber-200 rounded-full h-3">
              <div 
                className="bg-gradient-to-r from-amber-500 to-orange-600 h-3 rounded-full transition-all duration-500"
                style={{ width: `${(uploads.filter(u => u.status === 'approved').length / 2) * 100}%` }}
              ></div>
            </div>
            <p className="text-sm text-amber-700 mt-2">
              {uploads.filter(u => u.status === 'approved').length === 2 
                ? "All documents approved! Your verification is complete."
                : "Upload both documents to complete verification."
              }
            </p>
          </Card>
        )}
      </div>
    </div>
  );
}