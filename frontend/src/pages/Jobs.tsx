import React, { useEffect, useState } from 'react';
import { listJobs } from '../services/jobs.service';
import JobCard from '../components/JobCard';

export default function Jobs() {
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  async function fetch() {
    setLoading(true);
    try {
      const res = await listJobs();
      setJobs(res.jobs || res);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetch(); }, []);

  return (
    <div className="container">
      <h2 style={{ marginTop: 20 }}>Open Jobs</h2>
      {loading ? <div>Loading...</div> : (
        <div style={{ display: 'grid', gap: 12, marginTop: 12 }}>
          {jobs.length === 0 ? <div className="card">No jobs yet.</div> : jobs.map(j => <JobCard key={j._id} job={j} />)}
        </div>
      )}
    </div>
  );
}
