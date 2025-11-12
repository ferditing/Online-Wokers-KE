// src/pages/Home.tsx
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { listJobs } from "../services/jobs.service";

export default function Home() {
  const [featured, setFeatured] = useState<any[]>([]);
  const [q, setQ] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const res = await listJobs({ limit: 6 }); // adjust service to accept params
        const jobs = res.jobs || res;
        setFeatured(jobs.slice(0, 6));
      } catch (e) {
        console.error(e);
      }
    })();
  }, []);

  return (
    <div className="container py-8">
      <section className="grid lg:grid-cols-2 gap-8 items-center mb-10">
        <div>
          <h1 className="text-4xl font-bold leading-tight">Find verified online workers — fast</h1>
          <p className="mt-4 text-gray-600">OnlineWorkersKE connects vetted Kenyan youth with remote tasks and short-term online gigs. Post a job, review applicants, and pay securely — we take care of the rest.</p>

          <div className="mt-6 flex gap-3">
            <Link to="/register?role=employer" className="btn btn-primary">Become an employer</Link>
            <Link to="/register?role=worker" className="btn border">Become a worker</Link>
          </div>

          <div className="mt-6">
            <label className="text-sm text-gray-600">Search jobs</label>
            <div className="flex gap-2 mt-2">
              <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search by title or skill" className="input" />
              <Link to={`/jobs?q=${encodeURIComponent(q)}`} className="btn btn-primary px-4">Search</Link>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold">How it works</h3>
            <ol className="mt-3 list-decimal list-inside text-sm text-gray-600">
              <li>Post an online job with required skills and budget.</li>
              <li>Verified workers with matching skills apply.</li>
              <li>Pick a worker, receive deliverables, release payment.</li>
              <li>Leave a review — help the best workers grow.</li>
            </ol>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold">Why choose us</h3>
            <ul className="mt-3 list-disc list-inside text-sm text-gray-600">
              <li>Verification for quality and trust</li>
              <li>Skill-based matching for better hires</li>
              <li>Transparent pricing and platform protection</li>
            </ul>
          </div>
        </div>
      </section>

      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-semibold">Featured jobs</h2>
          <Link to="/jobs" className="text-sm text-gray-600">View all</Link>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {featured.map(j => (
            <Link key={j._id} to={`/jobs/${j._id}`} className="card hover:shadow-md transition">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-medium">{j.title}</h3>
                  <p className="text-sm text-gray-500 mt-1 line-clamp-3">{j.description}</p>
                  <div className="mt-3 text-xs text-gray-500">{j.requiredSkills?.slice(0,3).join(', ')}</div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-semibold">{j.currency || 'KES'} {j.budget}</div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
