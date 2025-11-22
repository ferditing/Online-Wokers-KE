import React, { useEffect, useMemo, useState } from "react";
import api from "../services/api";
import { Link } from "react-router-dom";
import Card from "../components/ui/Card";

type User = {
  _id: string;
  name: string;
  email: string;
  role?: string;
  verified?: boolean;
  skills?: string[];
};

type Job = {
  _id: string;
  title: string;
  status?: string;
  budget?: number;
  currency?: string;
};

type Application = {
  _id: string;
  job?: Job | any;
  status?: string;
  createdAt?: string;
};

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [verifications, setVerifications] = useState<number | null>(null);
  const [paymentsPending, setPaymentsPending] = useState<number | null>(null);

  const [users, setUsers] = useState<User[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [query, setQuery] = useState("");
  const [limit, setLimit] = useState(50);

  useEffect(() => {
    let mounted = true;
    async function loadStats() {
      setStatsLoading(true);
      try {
        const [vRes, pRes] = await Promise.all([
          api.get("/admin/verification?status=pending&limit=1").catch(() => ({ data: { items: [] } })),
          api.get("/payments?status=release_requested").catch(() => ({ data: [] }))
        ]);
        if (!mounted) return;
        const vItems = vRes.data?.items ?? vRes.data ?? [];
        const pItems = pRes.data?.payments ?? pRes.data ?? [];
        setVerifications(Array.isArray(vItems) ? vItems.length : Number(vItems) || 0);
        setPaymentsPending(Array.isArray(pItems) ? pItems.length : Number(pItems) || 0);
      } catch (err: any) {
        console.error(err);
      } finally {
        if (mounted) setStatsLoading(false);
      }
    }
    loadStats();
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    let mounted = true;
    async function loadUsers() {
      setUsersLoading(true);
      setError(null);
      try {
        const res = await api.get(`/admin/users?limit=${limit}`);
        const fetched = res.data?.users ?? res.data ?? [];
        if (!mounted) return;

        const withRecent = await Promise.all(
          fetched.map(async (u: User) => {
            try {
              if (u.role === "employer") {
                const jr = await api.get(`/jobs?employer=${u._id}&limit=3`).catch(() => ({ data: [] }));
                const jobs = jr.data?.jobs ?? jr.data ?? [];
                const doneCount = Array.isArray(jobs) ? jobs.filter((j: Job) => j.status === "completed").length : 0;
                return { ...u, recentJobs: jobs, doneCount };
              } else {
                const ar = await api.get(`/applications?worker=${u._id}&limit=6`).catch(() => ({ data: [] }));
                const apps = ar.data?.applications ?? ar.data ?? [];
                const doneCount = Array.isArray(apps) ? apps.filter((a: Application) => a.status === "accepted" || a.status === "completed").length : 0;
                const recentJobs = (Array.isArray(apps) ? apps.slice(0, 3).map(a => (a.job && a.job.title) ? a.job : a.jobId ?? a.job ?? null).filter(Boolean) : []);
                return { ...u, recentJobs, doneCount };
              }
            } catch (e) {
              return { ...u, recentJobs: [], doneCount: 0 };
            }
          })
        );

        setUsers(withRecent);
      } catch (err: any) {
        console.error(err);
        setError(err?.response?.data?.message || "Could not load users");
      } finally {
        if (mounted) setUsersLoading(false);
        if (mounted) setLoading(false);
      }
    }
    loadUsers();
    return () => { mounted = false; };
  }, [limit]);

  const filtered = useMemo(() => {
    if (!query) return users;
    const q = query.toLowerCase();
    return users.filter(u => (u.name || "").toLowerCase().includes(q) || (u.email || "").toLowerCase().includes(q));
  }, [users, query]);

  if (loading || statsLoading) return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 border-4 border-violet-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-slate-600 font-medium">Loading admin dashboard...</p>
        </div>
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
        <div className="flex items-center justify-between mb-8">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
              Admin Dashboard
            </h1>
            <p className="text-slate-600">Users, verifications and platform controls</p>
          </div>
          <div className="flex gap-3">
            <Link 
              to="/admin/verifications" 
              className="px-6 py-3 bg-gradient-to-r from-violet-600 to-purple-600 text-white font-semibold rounded-xl hover:shadow-lg transition-all duration-200"
            >
              Review Verifications
            </Link>
            <Link 
              to="/admin/payments" 
              className="px-6 py-3 bg-gradient-to-r from-cyan-600 to-blue-600 text-white font-semibold rounded-xl hover:shadow-lg transition-all duration-200"
            >
              Payments
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
          <Card className="text-center p-6">
            <div className="w-12 h-12 bg-gradient-to-r from-violet-500 to-purple-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <span className="text-white text-xl">📋</span>
            </div>
            <div className="text-sm text-slate-500 font-medium">Pending Verifications</div>
            <div className="text-3xl font-bold text-slate-800 mt-2">{verifications ?? "—"}</div>
          </Card>

          <Card className="text-center p-6">
            <div className="w-12 h-12 bg-gradient-to-r from-emerald-500 to-green-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <span className="text-white text-xl">👥</span>
            </div>
            <div className="text-sm text-slate-500 font-medium">Users (shown)</div>
            <div className="text-3xl font-bold text-slate-800 mt-2">{users.length ?? "—"}</div>
          </Card>

          <Card className="text-center p-6">
            <div className="w-12 h-12 bg-gradient-to-r from-amber-500 to-orange-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <span className="text-white text-xl">💰</span>
            </div>
            <div className="text-sm text-slate-500 font-medium">Payments Awaiting Release</div>
            <div className="text-3xl font-bold text-slate-800 mt-2">{paymentsPending ?? "—"}</div>
          </Card>
        </div>

        <Card className="p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div className="flex items-center gap-4">
              <div className="relative">
                <input
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  placeholder="Search users by name or email..."
                  className="pl-10 pr-4 py-3 w-80 rounded-xl border border-slate-300 focus:border-violet-500 focus:ring-2 focus:ring-violet-200 transition-all duration-200"
                />
                <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400">
                  🔍
                </div>
              </div>
              
              <select 
                value={limit} 
                onChange={e => setLimit(Number(e.target.value))} 
                className="px-4 py-3 rounded-xl border border-slate-300 focus:border-violet-500 focus:ring-2 focus:ring-violet-200 transition-all duration-200"
              >
                <option value={10}>10 users</option>
                <option value={25}>25 users</option>
                <option value={50}>50 users</option>
              </select>
            </div>
            
            <div className="text-sm text-slate-500 font-medium">
              💡 Click a user to open their profile / verification
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl border border-slate-200">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-slate-50 to-slate-100 border-b border-slate-200">
                <tr>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-slate-700">User</th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-slate-700">Role</th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-slate-700">Verified</th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-slate-700">Jobs Done</th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-slate-700">Recent Activity</th>
                  <th className="px-6 py-4 text-sm font-semibold text-slate-700">Actions</th>
                </tr>
              </thead>
              
              <tbody className="divide-y divide-slate-100">
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center">
                      <div className="space-y-3">
                        <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto">
                          <span className="text-2xl text-slate-400">👥</span>
                        </div>
                        <p className="text-slate-600 font-medium">No users found</p>
                        <p className="text-sm text-slate-500">Try adjusting your search criteria</p>
                      </div>
                    </td>
                  </tr>
                )}

                {filtered.map((u: any) => (
                  <tr key={u._id} className="hover:bg-slate-50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-r from-violet-500 to-purple-500 rounded-xl flex items-center justify-center text-white font-bold text-sm">
                          {u.name?.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-semibold text-slate-800 group-hover:text-violet-700 transition-colors">
                            {u.name}
                          </div>
                          <div className="text-xs text-slate-500">{u.email}</div>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700 capitalize">
                        {u.role ?? "—"}
                      </span>
                    </td>

                    <td className="px-6 py-4">
                      {u.verified ? (
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 border border-emerald-200">
                          <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></div>
                          Verified
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800 border border-amber-200">
                          <div className="w-1.5 h-1.5 bg-amber-500 rounded-full"></div>
                          Not verified
                        </span>
                      )}
                    </td>

                    <td className="px-6 py-4">
                      <div className="text-lg font-bold text-slate-800">{u.doneCount ?? 0}</div>
                    </td>

                    <td className="px-6 py-4">
                      {Array.isArray(u.recentJobs) && u.recentJobs.length > 0 ? (
                        <div className="space-y-1 max-w-[320px]">
                          {u.recentJobs.slice(0, 3).map((r: any, i: number) => (
                            <div key={i} className="text-sm text-slate-700 truncate" title={r.title ?? r}>
                              • {r.title ?? r}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span className="text-sm text-slate-400">—</span>
                      )}
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3 justify-end">
                        <Link 
                          to={`/admin/user/${u._id}`} 
                          className="text-sm font-medium text-violet-600 hover:text-violet-700 transition-colors"
                        >
                          View Profile
                        </Link>
                        <Link 
                          to={`/admin/verifications?userId=${u._id}`} 
                          className="text-sm font-medium text-slate-600 hover:text-slate-700 transition-colors"
                        >
                          Verifications
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-6 flex items-center justify-between text-sm text-slate-500">
            <p>Showing {filtered.length} user(s)</p>
            <p>Use the limit dropdown to fetch more users</p>
          </div>
        </Card>
      </div>
    </div>
  );
}