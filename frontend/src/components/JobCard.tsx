import React from 'react';
import { Link } from 'react-router-dom';

export default function JobCard({ job }: { job: any }) {
  const score = job.matchScore ?? 0;
  const required = job.requiredSkills ?? [];

  return (
    <article className="card hover:shadow-md transition">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-slate-800">{job.title}</h3>
          <p className="text-sm text-gray-600 mt-2 line-clamp-3">{job.description}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {required.map((r: string) => (
              <span key={r} className="text-xs px-2 py-1 bg-gray-100 rounded-md text-gray-700">{r}</span>
            ))}
          </div>
        </div>

        <div className="flex-shrink-0 text-right">
          <div className="text-sm font-semibold text-slate-900">{job.currency} {job.budget}</div>
          <div className="mt-2">
            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${score >= required.length && required.length>0 ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-700'}`}>
              Match: {score}
            </span>
          </div>
          <div className="mt-4">
            <Link to={`/jobs/${job._id || job.id}`} className="text-sm text-blue-600 hover:underline">View →</Link>
          </div>
        </div>
      </div>
    </article>
  );
}
