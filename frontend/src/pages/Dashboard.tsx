// frontend/src/pages/Dashboard.tsx
import React, { useEffect, useMemo, useState } from "react";
import api from "../services/api";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, BarChart, Bar } from "recharts";
import { useAuth } from "../context/AuthContext";

/**
 * Admin Dashboard
 *
 * - Shows top-level stats
 * - Lists pending verification requests with approve/reject actions
 * - Shows latest users and latest jobs
 * - Small jobs-by-status chart (counts)
 *
 * Endpoints used:
 * GET  /api/admin/verification        -> { items: [...] }
 * PATCH /api/admin/verification/:id   -> updates verification (body: { status, comments })
 * GET  /api/admin/users               -> { users, pagination: {...} } (we request a limited list)
 * GET  /api/jobs                      -> returns jobs array (server supports query)
 *
 * Notes: endpoints must be available and protected (require admin token).
 */

type Skill = { key: string; name: string; category?: string };

type User = {
  _id: string;
  name: string;
  email: string;
  role?: string;
  verified?: boolean;
  skills?: string[];
  createdAt?: string;
};

type VerificationRequest = {
  _id: string;
  userId: User | string;
  type: string;
  fileUrl: string;
  status: 'pending' | 'approved' | 'rejected';
  comments?: string;
  createdAt?: string;
};

type Job = {
  _id: string;
  title: string;
  description?: string;
  requiredSkills?: string[];
  preferredSkills?: string[];
  budget?: number;
  currency?: string;
  status?: string;
  createdAt?: string;
};

export default function Dashboard() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [verifications, setVerifications] = useState<VerificationRequest[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<Record<string, boolean>>({});

  // Admin guard — show message if not admin
  if (!user) {
    return <div className="container py-8">You must be signed in to view this page.</div>;
  }
  if (user.role !== 'admin') {
    return <div className="container py-8">Access denied — admin only.</div>;
  }

  useEffect(() => {
    let mounted = true;
    async function fetchAll() {
      setLoading(true);
      setError(null);
      try {
        // Parallel loads (limited lists)
        const [vRes, uRes, jRes] = await Promise.all([
          api.get('/admin/verification'),
          api.get('/admin/users?limit=10'),
          api.get('/jobs?limit=50')
        ]);

        if (!mounted) return;

        setVerifications((vRes.data && vRes.data.items) ? vRes.data.items : []);
        setUsers((uRes.data && uRes.data.users) ? uRes.data.users : (uRes.data || []));
        setJobs((jRes.data && jRes.data.jobs) ? jRes.data.jobs : (jRes.data || []));
      } catch (err: any) {
        console.error(err);
        setError(err?.response?.data?.message || 'Failed to load admin data');
      } finally {
        if (mounted) setLoading(false);
      }
    }

    fetchAll();
    return () => { mounted = false; };
  }, []);

  const counts = useMemo(() => {
    const pendingVerif = verifications.filter(v => v.status === 'pending').length;
    const totalUsers = users.length;
    const totalJobs = jobs.length;
    return { pendingVerif, totalUsers, totalJobs };
  }, [verifications, users, jobs]);

  const jobsByStatus = useMemo(() => {
    const map = new Map<string, number>();
    jobs.forEach(j => {
      const s = j.status || 'open';
      map.set(s, (map.get(s) || 0) + 1);
    });
    return Array.from(map.entries()).map(([status, count]) => ({ status, count }));
  }, [jobs]);

  async function handleVerificationAction(id: string, status: 'approved' | 'rejected') {
    setActionLoading(prev => ({ ...prev, [id]: true }));
    try {
      // Send update to server
      await api.patch(`/admin/verification/${id}`, { status });
      // optimistic UI update
      setVerifications(prev => prev.map(v => v._id === id ? { ...v, status } : v));
    } catch (err: any) {
      console.error(err);
      setError(err?.response?.data?.message || 'Action failed');
    } finally {
      setActionLoading(prev => ({ ...prev, [id]: false }));
    }
  }

  // small helper formats
  function dateShort(d?: string) {
    if (!d) return '-';
    return new Date(d).toLocaleString();
  }

  return (
    <div className="container py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold">Admin Dashboard</h1>
          <p className="text-sm text-gray-500">Overview & quick actions for OnlineWorkersKE</p>
        </div>
      </div>

      {error && <div className="mb-4 text-sm text-red-600">{error}</div>}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="card">
          <div className="text-sm text-gray-500">Pending verifications</div>
          <div className="flex items-center justify-between mt-3">
            <div className="text-2xl font-bold">{counts.pendingVerif}</div>
            <div className="text-xs text-gray-400">Review & approve</div>
          </div>
        </div>

        <div className="card">
          <div className="text-sm text-gray-500">Registered users (sample)</div>
          <div className="flex items-center justify-between mt-3">
            <div className="text-2xl font-bold">{counts.totalUsers}</div>
            <div className="text-xs text-gray-400">Latest 10</div>
          </div>
        </div>

        <div className="card">
          <div className="text-sm text-gray-500">Jobs (sample)</div>
          <div className="flex items-center justify-between mt-3">
            <div className="text-2xl font-bold">{counts.totalJobs}</div>
            <div className="text-xs text-gray-400">Latest 50</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Verification table */}
        <section className="lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-medium">Pending verification requests</h2>
            <div className="text-sm text-gray-500">{verifications.length} total</div>
          </div>

          <div className="card overflow-auto">
            {loading ? <div className="py-8 text-center">Loading...</div> : (
              verifications.length === 0 ? (
                <div className="py-8 text-center small text-gray-500">No verification requests</div>
              ) : (
                <table className="min-w-full text-left">
                  <thead>
                    <tr className="text-xs text-gray-500">
                      <th className="py-2">User</th>
                      <th className="py-2">Type</th>
                      <th className="py-2">Uploaded</th>
                      <th className="py-2">Status</th>
                      <th className="py-2">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {verifications.map(v => {
                      const uid = typeof v.userId === 'object' ? (v.userId as any)._id : String(v.userId);
                      const uname = typeof v.userId === 'object' ? (v.userId as any).name : (v.userId as any);
                      return (
                        <tr key={v._id} className="border-t">
                          <td className="py-3">
                            <div className="text-sm font-medium">{uname || '—'}</div>
                            <div className="text-xs text-gray-400">{String(uid)}</div>
                          </td>
                          <td className="py-3 text-sm">{v.type}</td>
                          <td className="py-3 text-sm text-gray-500">{dateShort(v.createdAt)}</td>
                          <td className="py-3">
                            <span className={`px-2 py-1 rounded text-xs ${v.status==='pending' ? 'bg-yellow-100 text-yellow-800' : v.status==='approved' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                              {v.status}
                            </span>
                          </td>
                          <td className="py-3">
                            <div className="flex gap-2">
                              <a href={v.fileUrl} target="_blank" rel="noreferrer" className="text-sm text-blue-600 hover:underline">View</a>

                              {v.status === 'pending' && (
                                <>
                                  <button
                                    disabled={!!actionLoading[v._id]}
                                    onClick={() => handleVerificationAction(v._id, 'approved')}
                                    className="text-sm px-2 py-1 rounded bg-green-100 text-green-800"
                                  >
                                    {actionLoading[v._id] ? '...' : 'Approve'}
                                  </button>

                                  <button
                                    disabled={!!actionLoading[v._id]}
                                    onClick={() => handleVerificationAction(v._id, 'rejected')}
                                    className="text-sm px-2 py-1 rounded bg-red-100 text-red-800"
                                  >
                                    {actionLoading[v._id] ? '...' : 'Reject'}
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )
            )}
          </div>
        </section>

        {/* Right: Users & Jobs summary */}
        <aside className="space-y-6">
          <div className="card">
            <h3 className="text-sm text-gray-500">Latest users</h3>
            <div className="mt-3 space-y-3">
              {users.length === 0 ? <div className="small text-gray-400">No users</div> : users.map(u => (
                <div key={u._id} className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium">{u.name}</div>
                    <div className="text-xs text-gray-400">{u.email}</div>
                  </div>
                  <div className="text-xs">
                    <span className={`px-2 py-1 rounded ${u.verified ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-700'}`}>{u.verified ? 'Verified' : 'Unverified'}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="card">
            <h3 className="text-sm text-gray-500">Jobs by status</h3>
            <div style={{ height: 180 }} className="mt-3">
              {jobsByStatus.length === 0 ? (
                <div className="small text-gray-400">No job data</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={jobsByStatus}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="status" />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Bar dataKey="count" fill="#0ea5a4" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </aside>
      </div>

      <div className="mt-8">
        <h3 className="text-lg font-medium mb-3">Recent jobs (sample)</h3>
        <div className="grid gap-3">
          {jobs.slice(0, 8).map(j => (
            <div key={j._id} className="card flex items-center justify-between">
              <div>
                <div className="text-sm font-medium">{j.title}</div>
                <div className="text-xs text-gray-400">{j.requiredSkills?.join(', ') || 'No skills'}</div>
              </div>
              <div className="text-right">
                <div className="text-sm font-semibold">{j.currency} {j.budget}</div>
                <div className="text-xs text-gray-400">{new Date(j.createdAt || '').toLocaleDateString()}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
