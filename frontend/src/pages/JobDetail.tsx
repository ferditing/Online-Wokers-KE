import React, { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import { useForm } from "react-hook-form";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";

type Job = {
  _id: string;
  title: string;
  description?: string;
  requiredSkills?: string[];
  budget?: number;
  currency?: string;
  status?: string;
  verified?: boolean;
  employer?: { _id?: string; name?: string; email?: string } | string;
};

export default function JobDetail() {
  const { id } = useParams<{ id: string }>();
  const { user, loading: authLoading } = useAuth() as any;
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState(false);
  const [applying, setApplying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const applyForm = useForm<{ coverMessage?: string; proposedPrice?: number }>();
  const deliverForm = useForm<{ files?: string; notes?: string }>();

  useEffect(() => {
    if (!id) return;
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        const res = await api.get(`/jobs/${id}`);
        const j = res.data?.job ?? res.data;
        if (mounted) setJob(j);
      } catch (err: any) {
        console.error("JobDetail load error", err);
        if (mounted) setError(err?.response?.data?.message || "Could not load job");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [id]);

  const match = useMemo(() => {
    const required: string[] = job?.requiredSkills ?? [];
    const userSkills: string[] = Array.isArray(user?.skills) ? user.skills : [];
    const overlap = required.filter(r => userSkills.includes(r)).length;
    const pct = required.length === 0 ? 0 : Math.round((overlap / required.length) * 100);
    return { required, overlap, pct };
  }, [job, user]);

  function canWorkerApply() {
    if (authLoading) return { ok: false, msg: "Checking credentials…" };
    if (!user) return { ok: false, msg: "Sign in to apply" };
    if (user.role !== "worker") return { ok: false, msg: "Only workers can apply" };
    if (!user.verified) return { ok: false, msg: "Complete verification to apply" };
    if (!Array.isArray(user.skills) || user.skills.length < 3) return { ok: false, msg: "Add at least 3 skills to apply" };
    if (job?.status && job.status !== "open") return { ok: false, msg: "Job is not open" };
    return { ok: true, msg: null };
  }

  async function onApply(data: { coverMessage?: string; proposedPrice?: number }) {
    if (!user) { alert('Sign in first'); return; }
    if (!user.verified) { alert('You must be verified to apply'); return; }
    const userSkills = user?.skills || [];
    if (userSkills.length < 3) {
      if (!confirm('You have fewer than 3 skills — continue?')) return;
    }

    try {
      setApplying(true);
      const payload = {
        coverMessage: data.coverMessage ?? '',
        proposedPrice: data.proposedPrice ? Number(data.proposedPrice) : undefined
      };
      const res = await api.post(`/applications/${id}/apply`, payload);
      alert('Applied successfully');
    } catch (err: any) {
      console.error('apply error', err);
      const serverMsg = err?.response?.data?.message;
      const detail = err?.response?.data?.detail;
      alert(`Apply failed: ${serverMsg || err?.message || 'Unknown error'}${detail ? ' — ' + detail : ''}`);
    } finally {
      setApplying(false);
    }
  }

  async function handleSubmitDeliverable(values: { files?: string; notes?: string }) {
    if (!id) return;
    if (!user) { alert("Sign in to submit deliverable"); return; }

    const files = typeof values.files === "string" && values.files.trim().length
      ? values.files.split(",").map(s => s.trim()).filter(Boolean)
      : [];

    if (files.length === 0) {
      alert("Provide at least one file URL (comma separated)");
      return;
    }

    try {
      setSubmitting(true);
      await api.post(`/jobs/${id}/submit`, { files, notes: values.notes ?? "" });
      alert("Deliverable submitted");
      deliverForm.reset();
    } catch (err: any) {
      console.error("submit deliverable error", err);
      alert(err?.response?.data?.message || "Failed to submit deliverable");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 border-4 border-violet-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-slate-600 font-medium">Loading job details...</p>
        </div>
      </div>
    </div>
  );

  if (!job) return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="p-6 bg-rose-50 border border-rose-200 rounded-2xl text-rose-700 text-center">
          <p className="font-semibold">{error ?? "Job not found"}</p>
        </div>
      </div>
    </div>
  );

  const employerName = typeof job.employer === "string" ? job.employer : job.employer?.name ?? "—";
  const canApply = canWorkerApply();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <Card className="p-8">
          <div className="flex flex-col lg:flex-row gap-8">
            <div className="flex-1 space-y-6">
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <div className="space-y-3">
                    <h1 className="text-3xl font-bold text-slate-800">{job.title}</h1>
                    <div className="flex items-center gap-4 text-sm text-slate-600">
                      <span>Posted by: <span className="font-semibold text-slate-800">{employerName}</span></span>
                      {job.verified && (
                        <span className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full text-xs font-medium">
                          <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></div>
                          Verified Job
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <div className="text-right space-y-2">
                    <div className="text-2xl font-bold text-slate-800">
                      {job.currency ?? "KES"} {job.budget?.toLocaleString() ?? "—"}
                    </div>
                    <div className="text-sm text-slate-500">Status: <span className="font-medium capitalize">{job.status ?? "open"}</span></div>
                  </div>
                </div>

                <div className="prose prose-slate max-w-none">
                  <p className="text-slate-700 leading-relaxed">{job.description}</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold text-slate-800 mb-3">Required Skills</h3>
                  <div className="flex flex-wrap gap-2">
                    {(job.requiredSkills ?? []).map((s: string) => (
                      <span key={s} className="px-4 py-2 bg-gradient-to-r from-violet-100 to-purple-100 border border-violet-200 text-violet-700 rounded-xl font-medium">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-r from-violet-600 to-purple-600 rounded-2xl flex items-center justify-center">
                      <span className="text-white text-lg">🎯</span>
                    </div>
                    <div>
                      <div className="font-semibold text-slate-800">Skill Match</div>
                      <div className="text-sm text-slate-600">{match.overlap} out of {match.required.length} skills</div>
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="w-full bg-slate-200 rounded-full h-3">
                      <div 
                        className="bg-gradient-to-r from-emerald-500 to-green-600 h-3 rounded-full transition-all duration-500"
                        style={{ width: `${match.pct}%` }}
                      ></div>
                    </div>
                  </div>
                  <div className="text-lg font-bold text-slate-800">{match.pct}%</div>
                </div>
              </div>
            </div>

            <div className="lg:w-80 space-y-6">
              {/* Quick Actions Card */}
              <Card className="p-6 text-center">
                <div className="w-16 h-16 bg-gradient-to-r from-violet-600 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <span className="text-white text-2xl">💰</span>
                </div>
                <div className="text-xl font-bold text-slate-800 mb-2">KES {job.budget?.toLocaleString() ?? "—"}</div>
                <div className="text-sm text-slate-500 mb-4">Fixed Price</div>
                
                {user && user.role === 'employer' && (job.employer as any)?._id === user._id && !job.verified && (
                  <div className="space-y-3">
                    <Button
                      onClick={() => window.location.href = `/pay-job/${job._id}`}
                      className="w-full bg-gradient-to-r from-emerald-500 to-green-600"
                    >
                      Verify Job
                    </Button>
                    <div className="text-xs text-slate-500">Get more visibility by verifying your job</div>
                  </div>
                )}
              </Card>

              {/* Status Card */}
              <Card className="p-6">
                <h4 className="font-semibold text-slate-800 mb-3">Job Status</h4>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-slate-600">Status:</span>
                    <span className={`font-medium capitalize ${
                      job.status === 'open' ? 'text-emerald-600' : 
                      job.status === 'in_progress' ? 'text-amber-600' : 
                      'text-slate-600'
                    }`}>
                      {job.status ?? "open"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Verified:</span>
                    <span className={job.verified ? "text-emerald-600 font-medium" : "text-slate-600"}>
                      {job.verified ? "Yes" : "No"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Category:</span>
                    <span className="text-slate-800 font-medium">General</span>
                  </div>
                </div>
              </Card>
            </div>
          </div>

          {/* Action Cards */}
          <div className="mt-8 grid md:grid-cols-2 gap-6">
            {/* Apply Card */}
            <Card className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center">
                  <span className="text-white text-lg">✍️</span>
                </div>
                <div>
                  <h4 className="font-semibold text-slate-800">Apply to this job</h4>
                  <p className="text-sm text-slate-600">Make sure your profile is verified and has at least 3 skills</p>
                </div>
              </div>

              <form className="space-y-4" onSubmit={applyForm.handleSubmit(onApply)}>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Cover Message</label>
                  <textarea 
                    {...applyForm.register("coverMessage")} 
                    placeholder="Tell the employer why you're the right fit for this job..."
                    className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:border-violet-500 focus:ring-2 focus:ring-violet-200 transition-all duration-200 h-24"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Proposed Price (Optional)</label>
                  <input 
                    type="number" 
                    {...applyForm.register("proposedPrice")} 
                    placeholder="Your proposed price..."
                    className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:border-violet-500 focus:ring-2 focus:ring-violet-200 transition-all duration-200"
                  />
                </div>

                <div className="flex items-center justify-between pt-4">
                  <div className="text-sm text-slate-600">
                    {!canApply.ok && <span className="text-amber-600">{canApply.msg}</span>}
                  </div>
                  <Button 
                    disabled={applying || !canApply.ok}
                    className="bg-gradient-to-r from-violet-600 to-purple-600"
                  >
                    {applying ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Applying...
                      </div>
                    ) : (
                      "Apply Now"
                    )}
                  </Button>
                </div>
              </form>
            </Card>

            {/* Deliverable Card */}
            <Card className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-gradient-to-r from-emerald-500 to-green-500 rounded-xl flex items-center justify-center">
                  <span className="text-white text-lg">📤</span>
                </div>
                <div>
                  <h4 className="font-semibold text-slate-800">Submit Deliverable</h4>
                  <p className="text-sm text-slate-600">Provide file URLs (comma separated)</p>
                </div>
              </div>

              <form className="space-y-4" onSubmit={deliverForm.handleSubmit(handleSubmitDeliverable)}>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">File URLs</label>
                  <input 
                    {...deliverForm.register("files")} 
                    placeholder="https://example.com/file1.pdf, https://example.com/file2.zip"
                    className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:border-violet-500 focus:ring-2 focus:ring-violet-200 transition-all duration-200"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Notes (Optional)</label>
                  <textarea 
                    {...deliverForm.register("notes")} 
                    placeholder="Any additional notes about your submission..."
                    className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:border-violet-500 focus:ring-2 focus:ring-violet-200 transition-all duration-200 h-24"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <Button 
                    type="button" 
                    onClick={() => deliverForm.reset()} 
                    variant="secondary"
                    className="flex-1"
                  >
                    Reset
                  </Button>
                  <Button 
                    disabled={submitting}
                    className="flex-1 bg-gradient-to-r from-emerald-500 to-green-600"
                  >
                    {submitting ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Submitting...
                      </div>
                    ) : (
                      "Submit Deliverable"
                    )}
                  </Button>
                </div>
              </form>
            </Card>
          </div>

          {/* Payment Card for Workers */}
          {user && user.role === 'worker' && job.status === 'in_progress' && (
            <Card className="mt-6 p-6 bg-gradient-to-r from-emerald-50 to-green-50 border border-emerald-200">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-r from-emerald-500 to-green-500 rounded-2xl flex items-center justify-center">
                  <span className="text-white text-xl">💰</span>
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-emerald-800 text-lg">Complete Payment</h4>
                  <p className="text-emerald-700">
                    Secure your payment via M-Pesa escrow. Funds will be released upon job completion.
                  </p>
                </div>
                <Button
                  onClick={() => window.location.href = `/pay-job/${job._id}`}
                  className="bg-gradient-to-r from-emerald-500 to-green-600"
                >
                  Pay via M-Pesa
                </Button>
              </div>
            </Card>
          )}
        </Card>
      </div>
    </div>
  );
}