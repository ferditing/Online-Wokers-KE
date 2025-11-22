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
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Open Jobs</h1>
              <p className="text-gray-600 mt-2">Find your next opportunity from available positions</p>
            </div>
            <div className="text-sm text-gray-500 bg-blue-50 px-3 py-2 rounded-lg border border-blue-100">
              <span className="font-semibold text-blue-700">Top matches</span> appear first
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {loading ? (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-12 text-center">
              <div className="flex justify-center mb-4">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Loading Jobs</h3>
              <p className="text-gray-500">Finding the best opportunities for you...</p>
            </div>
          ) : jobs.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-12 text-center">
              <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No Jobs Available</h3>
              <p className="text-gray-500">Check back later for new opportunities</p>
            </div>
          ) : (
            jobs.map(j => <JobCard key={j._id || j.id} job={j} />)
          )}
        </div>
      </div>
    </div>
  );
}