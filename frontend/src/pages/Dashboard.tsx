// frontend/src/pages/Dashboard.tsx
import React, { useEffect, useMemo, useState } from "react";
import api from "../services/api";
import { Link } from "react-router-dom";
import Card from "../components/ui/Card";

/**
 * Admin Dashboard (polished)
 * - Top stats
 * - Users list with recent jobs/applications and verified status
 */

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
        // Fetch users list (admin endpoint)
        const res = await api.get(`/admin/users?limit=${limit}`);
        const fetched = res.data?.users ?? res.data ?? [];
        if (!mounted) return;

        // For each user, fetch small sample of jobs/applications depending on role
        // This will produce at most N additional requests where N = users.length (ok for <=50)
        const withRecent = await Promise.all(
          fetched.map(async (u: User) => {
            try {
              if (u.role === "employer") {
                const jr = await api.get(`/jobs?employer=${u._id}&limit=3`).catch(() => ({ data: [] }));
                const jobs = jr.data?.jobs ?? jr.data ?? [];
                const doneCount = Array.isArray(jobs) ? jobs.filter((j: Job) => j.status === "completed").length : 0;
                return { ...u, recentJobs: jobs, doneCount };
              } else {
                // worker: fetch applications
                const ar = await api.get(`/applications?worker=${u._id}&limit=6`).catch(() => ({ data: [] }));
                const apps = ar.data?.applications ?? ar.data ?? [];
                // count accepted/completed
                const doneCount = Array.isArray(apps) ? apps.filter((a: Application) => a.status === "accepted" || a.status === "completed").length : 0;
                // extract recent job titles if populated (safe)
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

  if (loading || statsLoading) return <div className="container py-8">Loading admin dashboard…</div>;
  if (error) return <div className="container py-8 text-red-600">{error}</div>;

  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold">Admin dashboard</h1>
          <p className="text-sm text-slate-500 mt-1">Users, verifications and platform controls</p>
        </div>
        <div className="flex gap-3">
          <Link to="/admin/verifications" className="px-3 py-2 bg-violet-600 text-white rounded-md">Review verifications</Link>
          <Link to="/admin/payments" className="px-3 py-2 bg-cyan-600 text-white rounded-md">Payments</Link>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <Card>
          <div className="text-sm text-slate-500">Pending verifications</div>
          <div className="text-2xl font-semibold mt-2">{verifications ?? "—"}</div>
        </Card>

        <Card>
          <div className="text-sm text-slate-500">Users (shown)</div>
          <div className="text-2xl font-semibold mt-2">{users.length ?? "—"}</div>
        </Card>

        <Card>
          <div className="text-sm text-slate-500">Payments awaiting release</div>
          <div className="text-2xl font-semibold mt-2">{paymentsPending ?? "—"}</div>
        </Card>
      </div>

      <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search users by name or email"
            className="input px-3 py-2 w-[260px]"
          />
          <select value={limit} onChange={e => setLimit(Number(e.target.value))} className="input px-3 py-2">
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
          </select>
        </div>
        <div className="text-sm text-slate-500">Tip: Click a user to open their profile / verification</div>
      </div>

      <div className="bg-white border rounded shadow-sm overflow-x-auto">
        <table className="w-full table-auto">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left px-4 py-3 text-sm">User</th>
              <th className="text-left px-4 py-3 text-sm">Role</th>
              <th className="text-left px-4 py-3 text-sm">Verified</th>
              <th className="text-left px-4 py-3 text-sm">Jobs done</th>
              <th className="text-left px-4 py-3 text-sm">Recent</th>
              <th className="px-4 py-3 text-sm" />
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-sm text-slate-500">No users found</td>
              </tr>
            )}

            {filtered.map((u: any) => (
              <tr key={u._id} className="hover:bg-gray-50">
                <td className="px-4 py-4">
                  <div className="font-medium">{u.name}</div>
                  <div className="text-xs text-slate-500">{u.email}</div>
                </td>

                <td className="px-4 py-4 text-sm text-slate-600">{u.role ?? "—"}</td>

                <td className="px-4 py-4">
                  {u.verified ? (
                    <span className="inline-block px-2 py-1 rounded-full text-xs bg-emerald-100 text-emerald-800">Verified</span>
                  ) : (
                    <span className="inline-block px-2 py-1 rounded-full text-xs bg-amber-100 text-amber-800">Not verified</span>
                  )}
                </td>

                <td className="px-4 py-4 text-sm">{u.doneCount ?? 0}</td>

                <td className="px-4 py-4 text-sm">
                  {Array.isArray(u.recentJobs) && u.recentJobs.length > 0 ? (
                    <ul className="list-disc list-inside text-sm text-slate-600 max-w-[320px]">
                      {u.recentJobs.slice(0, 3).map((r: any, i: number) => (
                        <li key={i} title={r.title ?? r}>{r.title ?? r}</li>
                      ))}
                    </ul>
                  ) : (
                    <span className="text-xs text-slate-400">—</span>
                  )}
                </td>

                <td className="px-4 py-4 text-right">
                  <div className="flex items-center gap-2 justify-end">
                    <Link to={`/admin/user/${u._id}`} className="text-sm text-violet-600 hover:underline">View profile</Link>
                    <Link to={`/admin/verifications?userId=${u._id}`} className="text-sm text-slate-600 hover:underline">Verifications</Link>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-6 text-sm text-slate-500">
        Showing {filtered.length} user(s). Use the limit dropdown to fetch more.
      </div>
    </div>
  );
}
