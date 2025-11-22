import React from 'react';
import { Link } from 'react-router-dom';

export default function JobCard({ job }: { job: any }) {
  const score = job.matchScore ?? 0;
  const required = job.requiredSkills ?? [];

  return (
    <article className="bg-white rounded-xl border border-gray-200 hover:border-blue-300 hover:shadow-lg transition-all duration-300 p-6 group">
      <div className="flex items-start justify-between gap-6">
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between mb-3">
            <h3 className="text-xl font-bold text-gray-900 group-hover:text-blue-700 transition-colors line-clamp-2">
              {job.title}
            </h3>
          </div>
          
          <p className="text-gray-600 leading-relaxed mb-4 line-clamp-3">
            {job.description}
          </p>
          
          <div className="flex flex-wrap gap-2 mb-4">
            {required.map((r: string) => (
              <span 
                key={r} 
                className="px-3 py-1.5 bg-blue-50 text-blue-700 rounded-full text-sm font-medium border border-blue-100"
              >
                {r}
              </span>
            ))}
          </div>
        </div>

        <div className="flex-shrink-0 text-right space-y-3">
          <div className="text-2xl font-bold text-gray-900">
            {job.currency} {job.budget}
          </div>
          
          <div className="flex justify-end">
            <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-semibold ${
              score >= required.length && required.length > 0 
                ? 'bg-green-100 text-green-800 border border-green-200' 
                : 'bg-gray-100 text-gray-700 border border-gray-200'
            }`}>
              <span className="w-2 h-2 bg-current rounded-full mr-2"></span>
              Match: {score}/{required.length}
            </span>
          </div>
          
          <div className="pt-2">
            <Link 
              to={`/jobs/${job._id || job.id}`} 
              className="inline-flex items-center text-blue-600 hover:text-blue-700 font-semibold text-sm transition-colors group/link"
            >
              View Details
              <svg className="w-4 h-4 ml-1 transform group-hover/link:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </div>
      </div>
    </article>
  );
}