import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";

/**
 * UserDashboard
 * - Employer: lists jobs posted by them and allows fetching applicants per job
 * - Worker: lists their applications and suggested jobs (with match visible)
 * - Robustly waits for auth before making requests (avoids worker=undefined)
 */

type Job = any;
type Application = any;

export default function UserDashboard() {
  const { user, loading: authLoading, refreshUser } = useAuth() as any;
  const [loading, setLoading] = useState<boolean>(true);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [applicantsMap, setApplicantsMap] = useState<Record<string, Application[]>>({});
  const [applicantsLoading, setApplicantsLoading] = useState<Record<string, boolean>>({});
  const [submissionsMap, setSubmissionsMap] = useState<Record<string, Application[]>>({});
  const [submissionsLoading, setSubmissionsLoading] = useState<Record<string, boolean>>({});
  const [error, setError] = useState<string | null>(null);

  // load once user is available
  useEffect(() => {
    let mounted = true;
    async function load() {
      // wait for auth to finish
      if (authLoading) return;
      if (!user) { // not signed in
        setJobs([]); setApplications([]); setLoading(false); return;
      }

      setLoading(true);
      setError(null);
      try {
        const uid = user.id || user._id || user._idStr || user._id?.toString();
        if (user.role === "employer") {
          // fetch jobs filtered by employer
          const res = await api.get(`/jobs?employer=${uid}&limit=50`).catch(() => ({ data: [] }));
          const jobsData = res.data?.jobs ?? (Array.isArray(res.data) ? res.data : []);
          if (!mounted) return;
          setJobs(jobsData);
        } else {
          // worker: fetch own applications and suggested jobs
          const [appsRes, jobsRes] = await Promise.all([
            api.get(`/applications?worker=${uid}`).catch((err) => {
              if (err?.response?.status === 404) return { data: [] };
              throw err;
            }),
            api.get(`/jobs?limit=50`).catch(() => ({ data: [] }))
          ]);

          const appsData = appsRes.data?.applications ?? (Array.isArray(appsRes.data) ? appsRes.data : []);
          const jobsData = jobsRes.data?.jobs ?? (Array.isArray(jobsRes.data) ? jobsRes.data : []);
          if (!mounted) return;
          setApplications(appsData);
          // optionally compute match score on client; backend can also return it
          setJobs(jobsData.slice(0, 20));
        }
      } catch (err: any) {
        console.error("dashboard load error", err);
        if (mounted) setError(err?.response?.data?.message || "Failed to load dashboard");
      } finally {
        if (mounted) setLoading(false);
      }
    }

    load();
    return () => { mounted = false; };
  }, [authLoading, user]);

  // fetch applicants for a job (employer view)
  async function fetchApplicants(jobId: string) {
    if (applicantsMap[jobId]) return; // cached
    setApplicantsLoading(prev => ({ ...prev, [jobId]: true }));
    try {
      const res = await api.get(`/jobs/${jobId}/applications`);
      const apps = res.data?.applications ?? res.data ?? [];
      setApplicantsMap(prev => ({ ...prev, [jobId]: apps }));
    } catch (err: any) {
      console.error("fetchApplicants", err);
      setError(err?.response?.data?.message || "Could not fetch applicants");
    } finally {
      setApplicantsLoading(prev => ({ ...prev, [jobId]: false }));
    }
  }

  // fetch submissions for a job (employer view)
  async function fetchSubmissions(jobId: string) {
    if (submissionsMap[jobId]) return; // cached
    setSubmissionsLoading(prev => ({ ...prev, [jobId]: true }));
    try {
      const res = await api.get(`/applications?jobId=${jobId}&status=accepted`);
      const apps = res.data?.applications ?? res.data ?? [];
      setSubmissionsMap(prev => ({ ...prev, [jobId]: apps }));
    } catch (err: any) {
      console.error("fetchSubmissions", err);
      setError(err?.response?.data?.message || "Could not fetch submissions");
    } finally {
      setSubmissionsLoading(prev => ({ ...prev, [jobId]: false }));
    }
  }

  async function changeApplicationStatus(appId: string, status: "accepted" | "rejected") {
    try {
      await api.patch(`/applications/${appId}`, { status });
      // update local map
      setApplicantsMap(prev => {
        const newMap = { ...prev };
        for (const jobId in newMap) {
          newMap[jobId] = newMap[jobId].map((a: any) => a._id === appId ? { ...a, status } : a);
        }
        return newMap;
      });
      // if accepted -> refresh user (in case that toggles verified/assignments)
      if (status === "accepted") {
        await refreshUser().catch(() => {});
      }
    } catch (err) {
      console.error("changeApplicationStatus", err);
      setError("Could not update application");
    }
  }

  async function approveSubmission(appId: string) {
    try {
      await api.patch(`/applications/${appId}/approve-submission`, {});
      // update local submissions map
      setSubmissionsMap(prev => {
        const newMap = { ...prev };
        for (const jobId in newMap) {
          newMap[jobId] = newMap[jobId].map((a: any) => a._id === appId ? { ...a, submission: { ...a.submission, approvedAt: new Date().toISOString() } } : a);
        }
        return newMap;
      });
    } catch (err) {
      console.error("approveSubmission", err);
      setError("Could not approve submission");
    }
  }

  const stats = useMemo(() => {
    if (!user) return {};
    if (user.role === "employer") {
      return { posted: jobs.length, applicantsWaiting: Object.values(applicantsMap).flat().filter(a => a.status === "pending").length };
    }
    return { applied: applications.length, openJobs: jobs.filter(j => j.status === "open").length };
  }, [user, jobs, applications, applicantsMap]);

  if (authLoading || loading) return <div className="container py-8">Loading dashboard…</div>;
  if (!user) return <div className="container py-8">Please sign in to view your dashboard</div>;
  if (error) return <div className="container py-8 text-red-600">{error}</div>;

  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-semibold">Welcome back, {user.name}</h2>
          <p className="text-sm text-slate-500 mt-1">{user.role === "employer" ? "Manage your jobs & applicants" : "Track your applications & discover jobs"}</p>
        </div>
        <div className="flex gap-3">
          {user.role === "employer" ? <Link to="/post-job" className="px-3 py-2 bg-violet-600 text-white rounded-md">Post job</Link> : <Link to="/jobs" className="px-3 py-2 border rounded-md">Browse jobs</Link>}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <Card>
          <div className="text-sm text-slate-500">Primary</div>
          <div className="text-2xl font-semibold mt-2">{user.role === "employer" ? stats.posted : stats.applied}</div>
        </Card>

        <Card>
          <div className="text-sm text-slate-500">Secondary</div>
          <div className="text-2xl font-semibold mt-2">{user.role === "employer" ? stats.applicantsWaiting : stats.openJobs}</div>
        </Card>

        <Card>
          <div className="text-sm text-slate-500">Profile</div>
          <div className="mt-2">
            <div className={`inline-block px-2 py-1 rounded text-sm ${user.verified ? "bg-cyan-100 text-cyan-700" : "bg-amber-100 text-amber-700"}`}>
              {user.verified ? "Verified" : "Not verified"}
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <h3 className="text-lg font-medium mb-3">{user.role === "employer" ? "Your jobs" : "Suggested jobs"}</h3>

            {user.role === "employer" ? (
              <>
                {jobs.length === 0 ? <div className="text-sm text-slate-500">You have not posted jobs yet</div> : (
                  <div className="space-y-3">
                    {jobs.map((j: Job) => (
                      <div key={j._id} className="flex items-center justify-between p-3 border rounded bg-white">
                        <div>
                          <div className="font-medium">{j.title}</div>
                          <div className="text-xs text-slate-500">{(j.requiredSkills || []).slice(0,5).join(", ")}</div>
                        </div>

                        <div className="flex items-center gap-2">
                          <Button onClick={() => fetchApplicants(j._id)} className="text-sm">
                            {applicantsLoading[j._id] ? "Loading..." : "View applicants"}
                          </Button>
                          {j.status === "in_progress" && (
                            <Button onClick={() => fetchSubmissions(j._id)} className="text-sm">
                              {submissionsLoading[j._id] ? "Loading..." : "View submissions"}
                            </Button>
                          )}
                          <Link to={`/jobs/${j._id}`} className="text-sm text-slate-600">Details</Link>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <>
                {jobs.length === 0 ? <div className="text-sm text-slate-500">No jobs found</div> : (
                  <div className="space-y-3">
                    {jobs.map((j: Job) => {
                      // compute a simple match score for display (client-side)
                      const required = Array.isArray(j.requiredSkills) ? j.requiredSkills : [];
                      const userSkills = Array.isArray(user.skills) ? user.skills : [];
                      const overlap = required.filter((r: string) => userSkills.includes(r)).length;
                      return (
                        <div key={j._id} className="flex items-center justify-between p-3 border rounded bg-white">
                          <div>
                            <div className="font-medium">{j.title}</div>
                            <div className="text-xs text-slate-500">{required.slice(0,5).join(", ")}</div>
                            <div className="text-xs text-slate-400 mt-1">{overlap}/{required.length} match</div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-semibold">{j.currency || "KES"} {j.budget ?? "—"}</div>
                            <Link to={`/jobs/${j._id}`} className="text-sm text-slate-600">View / Apply</Link>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            )}
          </Card>

          {/* applicants lists for employer (render one card per job that has applicants loaded) */}
          {Object.entries(applicantsMap).map(([jobId, apps]) => (
            <Card key={jobId}>
              <div className="flex items-center justify-between mb-3">
                <div className="font-medium">Applicants</div>
                <div className="text-xs text-slate-500">Job ID: {jobId}</div>
              </div>

              <div className="space-y-3">
                {apps.length === 0 ? <div className="text-sm text-slate-500">No applicants yet</div> : apps.map((a: any) => (
                  <div key={a._id} className="flex items-start justify-between p-3 border rounded bg-white">
                    <div>
                      <div className="font-medium">{a.worker?.name ?? "Worker"}</div>
                      <div className="text-xs text-slate-500">{a.coverMessage}</div>
                      <div className="text-xs text-slate-500 mt-1">Skills: {(a.worker?.skills || []).slice(0,5).join(", ")}</div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <div className="text-sm">{a.proposedPrice ?? "—"}</div>
                      <div className="flex gap-2">
                        {a.status !== "accepted" && <Button onClick={() => changeApplicationStatus(a._id, "accepted")} className="bg-cyan-600 text-white px-3 py-1 rounded">Accept</Button>}
                        {a.status !== "rejected" && <Button onClick={() => changeApplicationStatus(a._id, "rejected")} className="bg-rose-100 text-rose-700 px-3 py-1 rounded">Reject</Button>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          ))}

          {/* submissions lists for employer (render one card per job that has submissions loaded) */}
          {Object.entries(submissionsMap).map(([jobId, apps]) => (
            <Card key={`submissions-${jobId}`}>
              <div className="flex items-center justify-between mb-3">
                <div className="font-medium">Submissions</div>
                <div className="text-xs text-slate-500">Job ID: {jobId}</div>
              </div>

              <div className="space-y-3">
                {apps.length === 0 ? <div className="text-sm text-slate-500">No submissions yet</div> : apps.map((a: any) => (
                  <div key={a._id} className="flex items-start justify-between p-3 border rounded bg-white">
                    <div>
                      <div className="font-medium">{a.worker?.name ?? "Worker"}</div>
                      <div className="text-xs text-slate-500">Submitted: {a.submission?.submittedAt ? new Date(a.submission.submittedAt).toLocaleDateString() : "N/A"}</div>
                      <div className="text-xs text-slate-500 mt-1">Notes: {a.submission?.notes || "No notes"}</div>
                      <div className="text-xs text-slate-500 mt-1">Files: {Array.isArray(a.submission?.files) ? a.submission.files.length : 0} files</div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <div className="text-sm">Status: {a.submission?.approvedAt ? "Approved" : "Pending"}</div>
                      {!a.submission?.approvedAt && (
                        <Button onClick={() => approveSubmission(a._id)} className="bg-green-600 text-white px-3 py-1 rounded">Approve</Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          ))}
        </div>

        <aside className="space-y-4">
          <Card>
            <h4 className="text-sm text-slate-500">Profile</h4>
            <div className="mt-3">
              <div className="font-medium">{user.name}</div>
              <div className="text-xs text-slate-500">{user.email}</div>
              <div className="mt-2 text-xs text-slate-500">Role: {user.role}</div>
              <div className="mt-2 text-xs">Skills: {(user.skills || []).slice(0,6).join(", ") || "—"}</div>
              <div className="mt-3">
                <Link to="/profile" className="text-sm text-violet-600">Edit profile</Link>
              </div>
            </div>
          </Card>

          <Card>
            <h4 className="text-sm text-slate-500">Quick actions</h4>
            <div className="mt-3 flex flex-col gap-2">
              {user.role === "employer" ? (
                <>
                  <Link to="/post-job" className="text-sm text-violet-600">Post a new job</Link>
                  <Link to="/admin/verifications" className="text-sm text-violet-600">Review verifications</Link>
                </>
              ) : (
                <>
                  <Link to="/jobs" className="text-sm text-violet-600">Browse jobs</Link>
                  <Link to="/profile" className="text-sm text-violet-600">Upload verification</Link>
                </>
              )}
            </div>
          </Card>
        </aside>
      </div>
    </div>
  );
}
