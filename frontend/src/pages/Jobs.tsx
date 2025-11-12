import React, { useEffect, useState } from 'react';
import { listJobs } from '../services/jobs.service';
import JobCard from '../components/JobCard';
import { useAuth } from '../context/AuthContext';

export default function Jobs() {
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  async function fetch() {
    setLoading(true);
    try {
      const res = await listJobs();
      let serverJobs = res.jobs || res;
      const userSkills: string[] = (user && (user as any).skills) ? (user as any).skills : [];

      const jobsWithScore = serverJobs.map((j: any) => {
        if (typeof j.matchScore === 'number') return j;
        const required = Array.isArray(j.requiredSkills) ? j.requiredSkills : [];
        const overlap = required.filter((s: string) => userSkills.includes(s)).length;
        return { ...j, matchScore: overlap };
      });

      jobsWithScore.sort((a: any, b: any) => {
        if (b.matchScore !== a.matchScore) return b.matchScore - a.matchScore;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });

      setJobs(jobsWithScore);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetch(); }, [user]);

  return (
    <div className="container py-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Open Jobs</h1>
        <div className="text-sm text-gray-500">Top matches appear first</div>
      </div>

      <div className="mt-4 grid gap-4">
        {loading ? <div className="text-center py-10">Loading...</div> : (
          jobs.length === 0 ? <div className="card">No jobs yet.</div> : jobs.map(j => <JobCard key={j._id || j.id} job={j} />)
        )}
      </div>
    </div>
  );
}
