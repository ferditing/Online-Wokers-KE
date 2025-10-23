import React from 'react';
import { Link } from 'react-router-dom';

export default function JobCard({ job }: { job: any }) {
  return (
    <div className="card">
      <h4>{job.title}</h4>
      <p className="small">{job.description?.slice(0, 140)}{job.description?.length > 140 ? '...' : ''}</p>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
        <div className="small">{job.currency} {job.budget}</div>
        <Link to={`/jobs/${job._id}`}>View</Link>
      </div>
    </div>
  );
}
