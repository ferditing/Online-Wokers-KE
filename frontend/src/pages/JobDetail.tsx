import React, { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import { useForm } from "react-hook-form";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";

/**
 * JobDetail page
 * - Shows employer
 * - Shows required skills + match indicator
 * - Workers: apply (requires verification + >=3 skills) and submit deliverable
 * - Employers: see a link to view applicants (handled elsewhere)
 */

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
        // backend may return the job directly or under res.data.job
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

  // match calculation (worker)
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

  // inside JobDetail.tsx
// keep using react-hook-form register/handleSubmit

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
    // optionally refresh applications / dashboard
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

    // files expected as comma-separated URLs -> convert to array
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

  if (loading) return <div className="container py-8">Loading job…</div>;
  if (!job) return <div className="container py-8 text-red-600">{error ?? "Job not found"}</div>;

  const employerName = typeof job.employer === "string" ? job.employer : job.employer?.name ?? "—";

  return (
    <div className="container mx-auto py-6">
      <Card>
        <div className="flex items-start gap-6">
          <div className="flex-1">
            <h1 className="text-2xl font-semibold">{job.title}</h1>
            <div className="text-sm text-slate-500 mt-1">Posted by: <span className="font-medium">{employerName}</span></div>
            <div className="mt-4 text-slate-700">{job.description}</div>

            <div className="mt-4">
              <div className="text-sm text-slate-500">Required skills</div>
              <div className="mt-2 flex gap-2 flex-wrap">
                {(job.requiredSkills ?? []).map((s: string) => (
                  <span key={s} className="text-xs px-2 py-1 bg-gray-100 rounded">{s}</span>
                ))}
              </div>

              <div className="mt-3 flex items-center gap-3">
                <div className="text-sm">Match</div>
                <div className="px-2 py-1 text-xs rounded bg-gray-100">{match.overlap}/{match.required.length}</div>
                <div className="text-xs text-slate-500">({match.pct}% match)</div>
              </div>
            </div>
          </div>

          <aside className="w-48">
            <div className="bg-white border rounded p-3 text-center">
              <div className="text-sm text-slate-500">Budget</div>
              <div className="text-lg font-semibold mt-1">{job.currency ?? "KES"} {job.budget ?? "—"}</div>
              <div className="mt-2 text-xs text-slate-500">Status: {job.status ?? "open"}</div>
              {user && user.role === 'employer' && (job.employer as any)?._id === user._id && !job.verified && (
                <div className="mt-3">
                  <button
                    onClick={() => window.location.href = `/pay-job/${job._id}`}
                    className="w-full bg-green-600 hover:bg-green-700 text-white text-sm px-3 py-2 rounded"
                  >
                    Pay to Verify Job
                  </button>
                  <div className="text-xs text-slate-500 mt-1">Get more workers by verifying your job</div>
                </div>
              )}
              {job.verified && (
                <div className="mt-3 text-xs text-green-600 font-medium">✓ Verified Job</div>
              )}
            </div>
          </aside>
        </div>

        {/* Worker apply + deliverable */}
        <div className="mt-6 grid md:grid-cols-2 gap-4">
          {/* Apply card (workers only) */}
          <div className="bg-white border rounded p-4">
            <h4 className="font-medium">Apply to this job</h4>
            <div className="text-sm text-slate-500 mt-1">Make sure your profile is verified and has at least 3 skills.</div>

            <form className="mt-3 space-y-3" onSubmit={applyForm.handleSubmit(onApply)}>
              <textarea {...applyForm.register("coverMessage")} placeholder="Cover message" className="input" />
              <input type="number" {...applyForm.register("proposedPrice")} placeholder="Proposed price (optional)" className="input" />
              <div className="flex items-center justify-between">
                <div className="text-xs text-slate-500">
                  {user ? (
                    user.role === "worker" ? (
                      user.verified ? (Array.isArray(user.skills) && user.skills.length >= 3 ? null : "Add 3+ skills") : "Complete verification"
                    ) : "Only workers can apply"
                  ) : "Sign in to apply"}
                </div>
                <Button disabled={applying || !canWorkerApply().ok} type="submit">{applying ? "Applying…" : "Apply"}</Button>
              </div>
            </form>
          </div>

          {/* Submit deliverable (workers only) */}
          <div className="bg-white border rounded p-4">
            <h4 className="font-medium">Submit deliverable</h4>
            <div className="text-sm text-slate-500 mt-1">Provide one or more file URLs (comma separated)</div>
            <form className="mt-3 space-y-3" onSubmit={deliverForm.handleSubmit(handleSubmitDeliverable)}>
              <input {...deliverForm.register("files")} placeholder="https://..., https://..." className="input" />
              <textarea {...deliverForm.register("notes")} placeholder="Notes (optional)" className="input" />
              <div className="flex justify-end">
                <Button onClick={() => deliverForm.reset()} type="button" className="mr-2">Reset</Button>
                <Button disabled={submitting} type="submit">{submitting ? "Submitting…" : "Submit deliverable"}</Button>
              </div>
            </form>
          </div>

          {/* Pay for Job (workers only) */}
          {user && user.role === 'worker' && job.status === 'in_progress' && (
            <div className="bg-white border rounded p-4 md:col-span-2">
              <h4 className="font-medium text-green-700">💰 Pay for Job Completion</h4>
              <div className="text-sm text-slate-500 mt-1">
                Complete payment for this job via M-Pesa. Funds will be held in escrow until the employer releases them.
              </div>
              <div className="mt-3">
                <Button
                  onClick={() => window.location.href = `/pay-job/${job._id}`}
                  className="bg-green-600 hover:bg-green-700"
                >
                  Pay Now via M-Pesa
                </Button>
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
