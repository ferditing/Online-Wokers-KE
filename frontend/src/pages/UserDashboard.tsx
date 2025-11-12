import React, { useEffect, useMemo, useState } from "react";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import { Link } from "react-router-dom";

/**
 * UserDashboard.tsx
 * - Employer: shows jobs (employer's) and per-job applicants (fetched on demand).
 * - Worker: shows suggested jobs + own applications.
 *
 * Server endpoints expected:
 * GET  /jobs?employer=<id>&limit=50                 -> { jobs: Job[] } OR Job[]
 * GET  /jobs?limit=50                                -> { jobs: Job[] } OR Job[]
 * GET  /applications?worker=<id>                     -> { applications: Application[] } OR Application[]
 * GET  /jobs/:id/applications                        -> { applications: Application[] }
 * PATCH /applications/:id/accept                      -> { ok: true, application }
 * PATCH /applications/:id/reject                      -> { ok: true, application }
 */

type Job = {
  _id: string;
  title: string;
  description?: string;
  status?: string;
  budget?: number;
  currency?: string;
  requiredSkills?: string[];
  assignedWorker?: any | string;
  createdAt?: string;
};

type Application = {
  _id: string;
  job: Job | string;
  worker?: any; // populated worker object: { _id, name, email, skills: string[] }
  coverMessage?: string;
  proposedPrice?: number;
  status?: string; // pending, accepted, rejected
  createdAt?: string;
};

export default function UserDashboard() {
  const { user } = useAuth() as any;

  // shared state
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // employer state
  const [jobs, setJobs] = useState<Job[]>([]);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [applicantsMap, setApplicantsMap] = useState<Record<string, Application[]>>({});
  const [applicantsLoading, setApplicantsLoading] = useState<Record<string, boolean>>({});

  // applicant filter state (employer)
  const [applicantSkillQuery, setApplicantSkillQuery] = useState<string>("");

  // worker state
  const [applications, setApplications] = useState<Application[]>([]);
  const [suggestedJobs, setSuggestedJobs] = useState<Job[]>([]);

  // fetch role-specific data
  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        if (!user) return;

        if (user.role === "employer") {
          // fetch only this employer's jobs
          const res = await api.get(`/jobs?employer=${user.id}&limit=50`);
          const jobsData = res.data?.jobs ?? res.data ?? [];
          if (!mounted) return;
          setJobs(jobsData);
        } else {
          // worker: fetch suggested jobs and the worker's applications
          const [jobsRes, appsRes] = await Promise.all([
            api.get(`/jobs?limit=50`),
            api.get(`/applications?worker=${user.id}`)
          ]);
          const jobsData = jobsRes.data?.jobs ?? jobsRes.data ?? [];
          const appsData = appsRes.data?.applications ?? appsRes.data ?? [];
          if (!mounted) {
            return;
          }
          // suggested: we can sort by matching skills client-side for now
          setSuggestedJobs(jobsData);
          setApplications(appsData);
        }
      } catch (err: any) {
        console.error(err);
        if (mounted) setError(err?.response?.data?.message || "Failed to load dashboard data");
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => { mounted = false; };
  }, [user]);

  // helper to fetch applicants for a job on demand (employer)
  async function fetchApplicantsForJob(jobId: string) {
    // already fetched?
    if (applicantsMap[jobId]) {
      setSelectedJobId(jobId);
      return;
    }
    setApplicantsLoading(prev => ({ ...prev, [jobId]: true }));
    try {
      const res = await api.get(`/jobs/${jobId}/applications`);
      const apps = res.data?.applications ?? res.data ?? [];
      setApplicantsMap(prev => ({ ...prev, [jobId]: apps }));
      setSelectedJobId(jobId);
    } catch (err) {
      console.error(err);
      setError("Could not fetch applicants");
    } finally {
      setApplicantsLoading(prev => ({ ...prev, [jobId]: false }));
    }
  }

  // accept/reject application (employer)
  async function updateApplicationStatus(appId: string, newStatus: "accepted" | "rejected") {
    try {
      // Optimistic UI: update applicantsMap immediately
      const updatedMap = { ...applicantsMap };
      for (const jobId of Object.keys(updatedMap)) {
        updatedMap[jobId] = updatedMap[jobId].map(a => a._id === appId ? { ...a, status: newStatus } : a);
      }
      setApplicantsMap(updatedMap);

      await api.patch(`/applications/${appId}`, { status: newStatus });
      // backend should handle job assignment when accepting
    } catch (err) {
      console.error(err);
      setError("Could not update application status");
      // Ideally re-fetch the applicant list for consistency
    }
  }

  // filter applicants by skill (case-insensitive substring match on skills)
  function filterApplicantsBySkill(apps: Application[], q: string) {
    if (!q || q.trim() === "") return apps;
    const qLower = q.trim().toLowerCase();
    return apps.filter(a => {
      const skills: string[] = (a.worker && a.worker.skills) || [];
      return skills.some(s => s.toLowerCase().includes(qLower));
    });
  }

  // For workers: compute match score (overlap) between job.requiredSkills and user.skills
  function jobMatchScore(job: Job) {
    const userSkills: string[] = user?.skills ?? [];
    const required: string[] = job.requiredSkills ?? [];
    if (required.length === 0) return 0;
    const overlap = required.filter(r => userSkills.includes(r)).length;
    return Math.round((overlap / required.length) * 100); // percent match
  }

  // UI: quick components
  function JobCard({ job, onViewApplicants }: { job: Job; onViewApplicants?: (id: string) => void }) {
    const match = user?.role !== "employer" ? jobMatchScore(job) : undefined;
    return (
      <div className="card p-3 flex items-start justify-between">
        <div>
          <div className="font-medium">{job.title}</div>
          <div className="text-xs text-gray-500 mt-1">{job.requiredSkills?.slice(0,3).join(", ") || "No skills listed"}</div>
          <div className="text-xs text-gray-400 mt-2">{job.description ? job.description.slice(0,120) : ""}</div>
        </div>

        <div className="text-right flex flex-col items-end gap-2">
          <div className="text-sm font-semibold">{job.currency || "KES"} {job.budget ?? "—"}</div>
          {user?.role === "employer" ? (
            <div className="flex gap-2">
              <button className="text-sm text-blue-600" onClick={() => onViewApplicants && onViewApplicants(job._id)}>
                View applicants
              </button>
              <Link to={`/jobs/${job._id}`} className="text-sm text-gray-600">Details</Link>
            </div>
          ) : (
            <div className="text-xs">
              <div className={`inline-block px-2 py-1 rounded text-xs ${match! >= 70 ? "bg-green-100 text-green-800" : match! >= 40 ? "bg-yellow-100 text-yellow-800" : "bg-gray-100 text-gray-700"}`}>
                {match}% match
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  function ApplicantRow({ a }: { a: Application }) {
    const skills = (a.worker && a.worker.skills) || [];
    return (
      <div className="border rounded p-3 flex items-start justify-between bg-white">
        <div>
          <div className="font-medium">{a.worker?.name ?? "Worker"}</div>
          <div className="text-xs text-gray-500">{a.worker?.email}</div>
          <div className="text-xs text-gray-500 mt-2">{a.coverMessage}</div>
          <div className="text-xs text-gray-400 mt-2">Skills: {skills.slice(0,6).join(", ") || "—"}</div>
        </div>
        <div className="flex flex-col items-end gap-2">
          <div className="text-sm font-semibold">{a.proposedPrice ?? "—"}</div>
          <div className="flex gap-2">
            {a.status !== "accepted" && <button className="px-2 py-1 rounded bg-green-100 text-green-800 text-sm" onClick={() => updateApplicationStatus(a._id, "accepted")}>Accept</button>}
            {a.status !== "rejected" && <button className="px-2 py-1 rounded bg-red-100 text-red-800 text-sm" onClick={() => updateApplicationStatus(a._id, "rejected")}>Reject</button>}
            <Link to={`/profile/${a.worker?._id}`} className="text-sm text-blue-600">View profile</Link>
          </div>
        </div>
      </div>
    );
  }

  // computed UI states
  const selectedApplicants = selectedJobId ? (applicantsMap[selectedJobId] ?? []) : [];

  if (!user) return <div className="container py-8">Please sign in</div>;
  if (loading) return <div className="container py-8">Loading...</div>;

  return (
    <div className="container py-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-semibold">Welcome back, {user.name}</h1>
          <p className="text-sm text-gray-500">{user.role === "employer" ? "Manage your job posts and applicants" : "Browse jobs and track your applications"}</p>
        </div>
        <div>
          {user.role === "employer" ? <Link to="/post-job" className="btn btn-primary">Post new job</Link> : <Link to="/jobs" className="btn btn-primary">Find jobs</Link>}
        </div>
      </div>

      {user.role === "employer" ? (
        <>
          <h2 className="text-lg font-medium mb-3">Your jobs</h2>
          <div className="grid gap-3">
            {jobs.length === 0 ? <div className="card">No jobs posted yet</div> : jobs.map(j => (
              <div key={j._id} className="card flex items-center justify-between">
                <div>
                  <div className="font-medium">{j.title}</div>
                  <div className="text-xs text-gray-500">{j.requiredSkills?.join(", ")}</div>
                </div>
                <div className="flex items-center gap-3">
                  <button className="text-sm text-blue-600" onClick={() => fetchApplicantsForJob(j._id)}>
                    {applicantsLoading[j._id] ? "Loading..." : "View applicants"}
                  </button>
                  <Link to={`/jobs/${j._id}`} className="text-sm text-gray-600">Details</Link>
                </div>
              </div>
            ))}
          </div>

          {/* applicants panel */}
          <div className="mt-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-medium">Applicants</h3>
              <div className="flex items-center gap-2">
                <input placeholder="Filter by skill (e.g. Python)" value={applicantSkillQuery} onChange={e => setApplicantSkillQuery(e.target.value)} className="input" />
                <button className="text-sm text-gray-500" onClick={() => { setApplicantSkillQuery(""); }}>Clear</button>
                <button className="text-sm text-gray-500" onClick={() => setSelectedJobId(null)}>Close</button>
              </div>
            </div>

            {!selectedJobId ? (
              <div className="text-sm text-gray-500">Select a job to view applicants</div>
            ) : (
              <div>
                {(selectedApplicants.length === 0) ? (
                  <div className="card">No applicants yet for this job</div>
                ) : (
                  <div className="space-y-3">
                    {filterApplicantsBySkill(selectedApplicants, applicantSkillQuery).map(a => <ApplicantRow key={a._id} a={a} />)}
                  </div>
                )}
              </div>
            )}
          </div>
        </>
      ) : (
        <>
          <h2 className="text-lg font-medium mb-3">Suggested jobs for you</h2>
          <div className="grid sm:grid-cols-2 gap-3">
            {suggestedJobs.length === 0 ? <div className="card">No jobs available</div> : suggestedJobs.map(j => <JobCard key={j._id} job={j} />)}
          </div>

          <h3 className="text-lg font-medium mt-6 mb-3">Your applications</h3>
          <div className="space-y-3">
            {applications.length === 0 ? <div className="card">You haven't applied to any jobs yet</div> : applications.map(a => (
              <div key={a._id} className="card flex items-center justify-between">
                <div>
                  <div className="font-medium">{typeof a.job === "object" ? (a.job as Job).title : String(a.job)}</div>
                  <div className="text-xs text-gray-500">{a.coverMessage}</div>
                </div>
                <div className="text-sm text-gray-500">{a.status}</div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
