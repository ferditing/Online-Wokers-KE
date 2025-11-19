// frontend/src/pages/Home.tsx
import { useRef } from "react";
import { Link } from "react-router-dom";
import Card from "../components/ui/Card";

export default function Home() {
  const jobsRef = useRef<HTMLElement | null>(null);

  function scrollToJobs() {
    if (jobsRef.current) {
      jobsRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    } else {
      window.scrollTo({ top: window.innerHeight, behavior: "smooth" });
    }
  }

  return (
    <div className="w-full">
      {/* HERO: full viewport height (fills main area width — sidebar margin handled by Layout) */}
      <section className="h-screen flex items-center bg-gradient-to-b from-white to-slate-50">
        <div className="w-full px-4">
          <div className="grid lg:grid-cols-2 gap-8 items-center">
            {/* Left: intro + CTAs */}
            <div className="max-w-2xl">
              <h1 className="text-5xl md:text-6xl font-extrabold text-indigo-800 leading-tight">
                Jobs that fit skills — fast
              </h1>
              <p className="mt-6 text-lg text-gray-600 max-w-xl">
                Verified workers, trusted employers, secure M-Pesa escrow — hire or get work in minutes.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  to="/register?role=employer"
                  className="inline-flex items-center gap-2 px-5 py-3 bg-indigo-600 text-white rounded-md shadow hover:bg-indigo-700 transition"
                >
                  Become an employer
                </Link>

                <Link
                  to="/register?role=worker"
                  className="inline-flex items-center gap-2 px-5 py-3 border border-indigo-200 text-indigo-700 rounded-md hover:bg-indigo-50 transition"
                >
                  Become a worker
                </Link>

                <button
                  onClick={scrollToJobs}
                  className="inline-flex items-center gap-2 px-5 py-3 bg-white border rounded-md text-indigo-700 hover:shadow"
                >
                  Browse jobs
                </button>
              </div>

              <p className="mt-4 text-xs text-slate-400">
                Verified profiles • Escrow protected • Fast payouts
              </p>
            </div>

            {/* Right: visual / feature highlights (keeps hero balanced) */}
            <div className="w-full">
              <div className="h-56 md:h-72 lg:h-80 bg-gradient-to-tr from-violet-100 to-indigo-50 rounded-lg flex items-center justify-center border">
                <div className="text-center text-sm text-slate-600">
                  <div className="font-medium text-indigo-700 mb-2">OnlineWorkersKE</div>
                  <div>Find skilled workers or gigs fast. Secure payments with M-Pesa escrow.</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* TWO CARDS: full width (stack on small, two columns on md+) */}
      <section className="py-8 bg-white">
        <div className="w-full px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Card>
                <h3 className="text-lg font-semibold">How it works</h3>
                <ol className="mt-3 text-sm text-gray-600 list-decimal list-inside space-y-1">
                  <li>Post job with required skills</li>
                  <li>Hire verified workers and top up escrow</li>
                  <li>Release funds after approval</li>
                </ol>
              </Card>
            </div>

            <div>
              <Card>
                <h3 className="text-lg font-semibold">About OnlineWorkersKE</h3>
                <p className="mt-3 text-sm text-gray-600">
                  We connect verified Kenyan workers with trusted employers, protect payments with M-Pesa escrow,
                  and focus on skill-based matching so the right people find the right jobs quickly.
                </p>
                <ul className="mt-3 text-sm text-gray-600 list-disc list-inside space-y-1">
                  <li>Verification-first approach</li>
                  <li>Escrow-protected payments</li>
                  <li>Fast onboarding and payouts</li>
                </ul>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURED JOBS (anchor target) */}
      <section ref={jobsRef} className="py-12 bg-white">
        <div className="w-full px-4">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-semibold text-indigo-800">Featured jobs</h2>
            <Link to="/jobs" className="text-sm text-indigo-600 hover:underline">Browse all jobs</Link>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Example job cards — replace with map over actual jobs */}
            <Card>
              <div className="flex justify-between items-start gap-4">
                <div>
                  <div className="font-medium">React Developer</div>
                  <div className="text-xs text-gray-500 mt-1">React, TypeScript — remote</div>
                  <div className="text-sm text-slate-600 mt-2">Short-term contract, 2–4 weeks</div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-semibold">KES 8,000</div>
                  <div className="text-xs text-gray-400">fixed</div>
                </div>
              </div>
            </Card>

            <Card>
              <div className="flex justify-between items-start gap-4">
                <div>
                  <div className="font-medium">Graphic Designer</div>
                  <div className="text-xs text-gray-500 mt-1">Figma, Illustrator</div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-semibold">KES 3,500</div>
                </div>
              </div>
            </Card>

            <Card>
              <div className="flex justify-between items-start gap-4">
                <div>
                  <div className="font-medium">Mobile App Tester</div>
                  <div className="text-xs text-gray-500 mt-1">Manual QA — remote</div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-semibold">KES 2,000</div>
                </div>
              </div>
            </Card>
          </div>

          <div className="mt-8 text-center">
            <Link to="/jobs" className="inline-block px-6 py-3 bg-indigo-600 text-white rounded-md shadow hover:bg-indigo-700">
              Browse all jobs
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
