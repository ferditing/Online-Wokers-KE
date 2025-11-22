import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";

export default function UserDashboard() {
  const { user, loading: authLoading, refreshUser } = useAuth() as any;
  const [loading, setLoading] = useState<boolean>(true);
  const [jobs, setJobs] = useState<any[]>([]);
  const [applications, setApplications] = useState<any[]>([]);
  const [applicantsMap, setApplicantsMap] = useState<Record<string, any[]>>({});
  const [applicantsLoading, setApplicantsLoading] = useState<Record<string, boolean>>({});
  const [submissionsMap, setSubmissionsMap] = useState<Record<string, any[]>>({});
  const [submissionsLoading, setSubmissionsLoading] = useState<Record<string, boolean>>({});
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    async function load() {
      if (authLoading) return;
      if (!user) {
        setJobs([]);
        setApplications([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);
      try {
        const uid = user.id || user._id || user._idStr || user._id?.toString();
        if (user.role === "employer") {
          const res = await api.get(`/jobs?employer=${uid}&limit=50`).catch(() => ({ data: [] }));
          const jobsData = res.data?.jobs ?? (Array.isArray(res.data) ? res.data : []);
          if (!mounted) return;
          setJobs(jobsData);
        } else {
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

  async function fetchApplicants(jobId: string) {
    if (applicantsMap[jobId]) return;
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

  async function fetchSubmissions(jobId: string) {
    if (submissionsMap[jobId]) return;
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
      setApplicantsMap(prev => {
        const newMap = { ...prev };
        for (const jobId in newMap) {
          newMap[jobId] = newMap[jobId].map((a: any) => a._id === appId ? { ...a, status } : a);
        }
        return newMap;
      });
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
      const pendingApplicants = Object.values(applicantsMap).flat().filter(a => a.status === "pending").length;
      const totalSubmissions = Object.values(submissionsMap).flat().length;
      return { 
        posted: jobs.length, 
        applicantsWaiting: pendingApplicants,
        submissions: totalSubmissions
      };
    }
    const appliedJobs = applications.length;
    const acceptedJobs = applications.filter(a => a.status === "accepted").length;
    const completedJobs = applications.filter(a => a.status === "completed").length;
    return { 
      applied: appliedJobs, 
      accepted: acceptedJobs,
      completed: completedJobs,
      openJobs: jobs.filter(j => j.status === "open").length 
    };
  }, [user, jobs, applications, applicantsMap, submissionsMap]);

  if (authLoading || loading) return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 border-4 border-violet-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-slate-600 font-medium">Loading your dashboard...</p>
        </div>
      </div>
    </div>
  );

  if (!user) return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <p className="text-slate-600">Please sign in to view your dashboard</p>
      </div>
    </div>
  );

  if (error) return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="p-6 bg-rose-50 border border-rose-200 rounded-2xl text-rose-700 text-center">
          <p className="font-semibold">{error}</p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8">
          <div className="space-y-3">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
              Welcome back, {user.name}!
            </h1>
            <p className="text-slate-600 text-lg">
              {user.role === "employer" 
                ? "Manage your jobs and review applicants" 
                : "Track your applications and discover new opportunities"}
            </p>
          </div>
          <div className="flex gap-3 mt-4 lg:mt-0">
            {user.role === "employer" ? (
              <Link 
                to="/post-job" 
                className="px-6 py-3 bg-gradient-to-r from-violet-600 to-purple-600 text-white font-semibold rounded-xl hover:shadow-lg transition-all duration-200"
              >
                Post New Job
              </Link>
            ) : (
              <Link 
                to="/jobs" 
                className="px-6 py-3 bg-white text-slate-700 font-semibold rounded-xl border border-slate-300 hover:shadow-lg transition-all duration-200"
              >
                Browse Jobs
              </Link>
            )}
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {user.role === "employer" ? (
            <>
              <Card className="text-center p-6">
                <div className="w-12 h-12 bg-gradient-to-r from-violet-500 to-purple-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <span className="text-white text-xl">📋</span>
                </div>
                <div className="text-sm text-slate-500 font-medium">Jobs Posted</div>
                <div className="text-3xl font-bold text-slate-800 mt-2">{stats.posted}</div>
              </Card>

              <Card className="text-center p-6">
                <div className="w-12 h-12 bg-gradient-to-r from-amber-500 to-orange-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <span className="text-white text-xl">👥</span>
                </div>
                <div className="text-sm text-slate-500 font-medium">Pending Applicants</div>
                <div className="text-3xl font-bold text-slate-800 mt-2">{stats.applicantsWaiting}</div>
              </Card>

              <Card className="text-center p-6">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <span className="text-white text-xl">📤</span>
                </div>
                <div className="text-sm text-slate-500 font-medium">Submissions</div>
                <div className="text-3xl font-bold text-slate-800 mt-2">{stats.submissions}</div>
              </Card>

              <Card className="text-center p-6">
                <div className="w-12 h-12 bg-gradient-to-r from-emerald-500 to-green-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <span className="text-white text-xl">🛡️</span>
                </div>
                <div className="text-sm text-slate-500 font-medium">Status</div>
                <div className={`text-lg font-bold mt-2 ${user.verified ? 'text-emerald-600' : 'text-amber-600'}`}>
                  {user.verified ? 'Verified' : 'Not Verified'}
                </div>
              </Card>
            </>
          ) : (
            <>
              <Card className="text-center p-6">
                <div className="w-12 h-12 bg-gradient-to-r from-violet-500 to-purple-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <span className="text-white text-xl">📝</span>
                </div>
                <div className="text-sm text-slate-500 font-medium">Applied Jobs</div>
                <div className="text-3xl font-bold text-slate-800 mt-2">{stats.applied}</div>
              </Card>

              <Card className="text-center p-6">
                <div className="w-12 h-12 bg-gradient-to-r from-emerald-500 to-green-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <span className="text-white text-xl">✅</span>
                </div>
                <div className="text-sm text-slate-500 font-medium">Accepted</div>
                <div className="text-3xl font-bold text-slate-800 mt-2">{stats.accepted}</div>
              </Card>

              <Card className="text-center p-6">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <span className="text-white text-xl">🎉</span>
                </div>
                <div className="text-sm text-slate-500 font-medium">Completed</div>
                <div className="text-3xl font-bold text-slate-800 mt-2">{stats.completed}</div>
              </Card>

              <Card className="text-center p-6">
                <div className="w-12 h-12 bg-gradient-to-r from-amber-500 to-orange-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <span className="text-white text-xl">🔍</span>
                </div>
                <div className="text-sm text-slate-500 font-medium">Open Jobs</div>
                <div className="text-3xl font-bold text-slate-800 mt-2">{stats.openJobs}</div>
              </Card>
            </>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-3 space-y-6">
            {/* Jobs Section */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-slate-800">
                  {user.role === "employer" ? "Your Jobs" : "Recommended Jobs"}
                </h3>
                <div className="text-sm text-slate-500">
                  {jobs.length} {jobs.length === 1 ? 'job' : 'jobs'}
                </div>
              </div>

              {user.role === "employer" ? (
                <>
                  {jobs.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="w-24 h-24 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <span className="text-3xl text-slate-400">📋</span>
                      </div>
                      <p className="text-slate-600 font-medium mb-4">No jobs posted yet</p>
                      <Link 
                        to="/post-job" 
                        className="inline-block px-6 py-3 bg-gradient-to-r from-violet-600 to-purple-600 text-white font-semibold rounded-xl hover:shadow-lg transition-all duration-200"
                      >
                        Post Your First Job
                      </Link>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {jobs.map((job) => (
                        <div key={job._id} className="flex items-center justify-between p-4 bg-white border border-slate-200 rounded-2xl hover:shadow-md transition-all duration-200">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h4 className="font-semibold text-slate-800">{job.title}</h4>
                              {job.verified && (
                                <span className="inline-flex items-center gap-1 px-2 py-1 bg-emerald-100 text-emerald-800 rounded-full text-xs font-medium">
                                  <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></div>
                                  Verified
                                </span>
                              )}
                            </div>
                            <div className="text-sm text-slate-600">
                              {(job.requiredSkills || []).slice(0, 3).join(", ")}
                              {job.requiredSkills && job.requiredSkills.length > 3 && "..."}
                            </div>
                            <div className="text-xs text-slate-500 mt-1">
                              Status: <span className="font-medium capitalize">{job.status || "open"}</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-3">
                            <Button 
                              onClick={() => fetchApplicants(job._id)} 
                              variant="secondary"
                              size="sm"
                            >
                              {applicantsLoading[job._id] ? (
                                <div className="w-4 h-4 border-2 border-violet-600 border-t-transparent rounded-full animate-spin"></div>
                              ) : (
                                "View Applicants"
                              )}
                            </Button>
                            {job.status === "in_progress" && (
                              <Button 
                                onClick={() => fetchSubmissions(job._id)} 
                                variant="secondary"
                                size="sm"
                              >
                                {submissionsLoading[job._id] ? (
                                  <div className="w-4 h-4 border-2 border-violet-600 border-t-transparent rounded-full animate-spin"></div>
                                ) : (
                                  "Submissions"
                                )}
                              </Button>
                            )}
                            <Link 
                              to={`/jobs/${job._id}`} 
                              className="text-sm font-medium text-violet-600 hover:text-violet-700 transition-colors"
                            >
                              Details
                            </Link>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <>
                  {jobs.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="w-24 h-24 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <span className="text-3xl text-slate-400">💼</span>
                      </div>
                      <p className="text-slate-600 font-medium">No jobs available</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {jobs.map((job) => {
                        const required = Array.isArray(job.requiredSkills) ? job.requiredSkills : [];
                        const userSkills = Array.isArray(user.skills) ? user.skills : [];
                        const overlap = required.filter((r: string) => userSkills.includes(r)).length;
                        const matchPercentage = required.length === 0 ? 0 : Math.round((overlap / required.length) * 100);
                        
                        return (
                          <div key={job._id} className="p-4 bg-white border border-slate-200 rounded-2xl hover:shadow-md transition-all duration-200">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                  <h4 className="font-semibold text-slate-800">{job.title}</h4>
                                  {job.verified && (
                                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-emerald-100 text-emerald-800 rounded-full text-xs font-medium">
                                      <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></div>
                                      Verified
                                    </span>
                                  )}
                                </div>
                                <div className="text-sm text-slate-600 mb-3">
                                  {required.slice(0, 3).join(", ")}
                                  {required.length > 3 && "..."}
                                </div>
                                <div className="flex items-center gap-4">
                                  <div className="flex items-center gap-2">
                                    <div className="text-sm text-slate-600">Match:</div>
                                    <div className="flex items-center gap-1">
                                      <div className="w-16 bg-slate-200 rounded-full h-2">
                                        <div 
                                          className="bg-gradient-to-r from-emerald-500 to-green-600 h-2 rounded-full transition-all duration-500"
                                          style={{ width: `${matchPercentage}%` }}
                                        ></div>
                                      </div>
                                      <span className="text-sm font-medium text-slate-700">{matchPercentage}%</span>
                                    </div>
                                  </div>
                                  <div className="text-sm text-slate-500">
                                    {overlap}/{required.length} skills
                                  </div>
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="text-lg font-bold text-slate-800 mb-2">
                                  {job.currency || "KES"} {job.budget?.toLocaleString() ?? "—"}
                                </div>
                                <Link 
                                  to={`/jobs/${job._id}`} 
                                  className="text-sm font-medium text-violet-600 hover:text-violet-700 transition-colors"
                                >
                                  View & Apply
                                </Link>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </>
              )}
            </Card>

            {/* Applicants Lists */}
            {Object.entries(applicantsMap).map(([jobId, apps]) => (
              <Card key={jobId} className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h4 className="text-lg font-bold text-slate-800">Applicants</h4>
                  <div className="text-sm text-slate-500">
                    {apps.length} applicant{apps.length !== 1 ? 's' : ''}
                  </div>
                </div>

                <div className="space-y-4">
                  {apps.length === 0 ? (
                    <div className="text-center py-8 text-slate-500">
                      No applicants for this job
                    </div>
                  ) : apps.map((application) => (
                    <div key={application._id} className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <div className="w-10 h-10 bg-gradient-to-r from-violet-500 to-purple-500 rounded-xl flex items-center justify-center text-white font-bold">
                              {application.worker?.name?.charAt(0).toUpperCase() || "W"}
                            </div>
                            <div>
                              <div className="font-semibold text-slate-800">
                                {application.worker?.name || "Worker"}
                              </div>
                              <div className="text-sm text-slate-500">
                                Skills: {(application.worker?.skills || []).slice(0, 3).join(", ")}
                                {application.worker?.skills && application.worker.skills.length > 3 && "..."}
                              </div>
                            </div>
                          </div>
                          {application.coverMessage && (
                            <p className="text-sm text-slate-600 mt-2">{application.coverMessage}</p>
                          )}
                        </div>
                        <div className="text-right space-y-3">
                          {application.proposedPrice && (
                            <div className="text-lg font-bold text-slate-800">
                              {application.currency || "KES"} {application.proposedPrice}
                            </div>
                          )}
                          <div className="flex gap-2">
                            {application.status !== "accepted" && (
                              <Button 
                                onClick={() => changeApplicationStatus(application._id, "accepted")}
                                size="sm"
                                className="bg-gradient-to-r from-emerald-500 to-green-600"
                              >
                                Accept
                              </Button>
                            )}
                            {application.status !== "rejected" && (
                              <Button 
                                onClick={() => changeApplicationStatus(application._id, "rejected")}
                                variant="secondary"
                                size="sm"
                              >
                                Reject
                              </Button>
                            )}
                          </div>
                          {application.status && (
                            <div className={`text-xs font-medium px-2 py-1 rounded-full ${
                              application.status === "accepted" 
                                ? "bg-emerald-100 text-emerald-800" 
                                : application.status === "rejected"
                                ? "bg-rose-100 text-rose-800"
                                : "bg-amber-100 text-amber-800"
                            }`}>
                              {application.status}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            ))}

            {/* Submissions Lists */}
            {Object.entries(submissionsMap).map(([jobId, apps]) => (
              <Card key={`submissions-${jobId}`} className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h4 className="text-lg font-bold text-slate-800">Submissions</h4>
                  <div className="text-sm text-slate-500">
                    {apps.length} submission{apps.length !== 1 ? 's' : ''}
                  </div>
                </div>

                <div className="space-y-4">
                  {apps.length === 0 ? (
                    <div className="text-center py-8 text-slate-500">
                      No submissions for this job
                    </div>
                  ) : apps.map((application) => (
                    <div key={application._id} className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-3">
                            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center text-white font-bold">
                              {application.worker?.name?.charAt(0).toUpperCase() || "W"}
                            </div>
                            <div>
                              <div className="font-semibold text-slate-800">
                                {application.worker?.name || "Worker"}
                              </div>
                              <div className="text-sm text-slate-500">
                                Submitted: {application.submission?.submittedAt 
                                  ? new Date(application.submission.submittedAt).toLocaleDateString() 
                                  : "N/A"}
                              </div>
                            </div>
                          </div>
                          
                          <div className="space-y-2 text-sm text-slate-600">
                            <div>
                              <strong>Notes:</strong> {application.submission?.notes || "No notes provided"}
                            </div>
                            <div>
                              <strong>Files:</strong> {Array.isArray(application.submission?.files) 
                                ? `${application.submission.files.length} file${application.submission.files.length !== 1 ? 's' : ''}` 
                                : "No files"}
                            </div>
                          </div>
                        </div>
                        <div className="text-right space-y-3">
                          <div className={`text-sm font-semibold ${
                            application.submission?.approvedAt 
                              ? "text-emerald-600" 
                              : "text-amber-600"
                          }`}>
                            {application.submission?.approvedAt ? "Approved" : "Pending Approval"}
                          </div>
                          {!application.submission?.approvedAt && (
                            <Button 
                              onClick={() => approveSubmission(application._id)}
                              className="bg-gradient-to-r from-emerald-500 to-green-600"
                              size="sm"
                            >
                              Approve
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            ))}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Profile Card */}
            <Card className="p-6">
              <div className="text-center mb-4">
                <div className="w-16 h-16 bg-gradient-to-r from-violet-600 to-purple-600 rounded-2xl flex items-center justify-center text-white font-bold text-2xl mx-auto mb-3">
                  {user.name?.charAt(0).toUpperCase()}
                </div>
                <h4 className="font-bold text-slate-800">{user.name}</h4>
                <div className="text-sm text-slate-500">{user.email}</div>
              </div>
              
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-600">Role:</span>
                  <span className="font-medium text-slate-800 capitalize">{user.role}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Status:</span>
                  <span className={`font-medium ${user.verified ? 'text-emerald-600' : 'text-amber-600'}`}>
                    {user.verified ? 'Verified' : 'Not Verified'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Skills:</span>
                  <span className="font-medium text-slate-800">
                    {Array.isArray(user.skills) ? user.skills.length : 0}
                  </span>
                </div>
              </div>
              
              <div className="mt-4 pt-4 border-t border-slate-200">
                <Link 
                  to="/profile" 
                  className="block w-full text-center px-4 py-2 bg-gradient-to-r from-violet-600 to-purple-600 text-white font-semibold rounded-xl hover:shadow-lg transition-all duration-200"
                >
                  Edit Profile
                </Link>
              </div>
            </Card>

            {/* Quick Actions */}
            <Card className="p-6">
              <h4 className="font-bold text-slate-800 mb-4">Quick Actions</h4>
              <div className="space-y-3">
                {user.role === "employer" ? (
                  <>
                    <Link 
                      to="/post-job" 
                      className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors group"
                    >
                      <div className="w-8 h-8 bg-gradient-to-r from-violet-500 to-purple-500 rounded-lg flex items-center justify-center">
                        <span className="text-white text-sm">📝</span>
                      </div>
                      <span className="font-medium text-slate-700 group-hover:text-violet-700 transition-colors">
                        Post New Job
                      </span>
                    </Link>
                    <Link 
                      to="/admin/verifications" 
                      className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors group"
                    >
                      <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center">
                        <span className="text-white text-sm">🛡️</span>
                      </div>
                      <span className="font-medium text-slate-700 group-hover:text-blue-700 transition-colors">
                        Review Verifications
                      </span>
                    </Link>
                  </>
                ) : (
                  <>
                    <Link 
                      to="/jobs" 
                      className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors group"
                    >
                      <div className="w-8 h-8 bg-gradient-to-r from-violet-500 to-purple-500 rounded-lg flex items-center justify-center">
                        <span className="text-white text-sm">🔍</span>
                      </div>
                      <span className="font-medium text-slate-700 group-hover:text-violet-700 transition-colors">
                        Browse Jobs
                      </span>
                    </Link>
                    <Link 
                      to="/profile/verify" 
                      className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors group"
                    >
                      <div className="w-8 h-8 bg-gradient-to-r from-amber-500 to-orange-500 rounded-lg flex items-center justify-center">
                        <span className="text-white text-sm">📄</span>
                      </div>
                      <span className="font-medium text-slate-700 group-hover:text-amber-700 transition-colors">
                        Upload Verification
                      </span>
                    </Link>
                  </>
                )}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}