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
      {/* HERO SECTION */}
      <section className="min-h-screen flex items-center bg-gradient-to-br from-slate-50 via-white to-violet-50">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center max-w-7xl mx-auto">
            {/* Left: Hero Content */}
            <div className="space-y-8">
              <div className="space-y-6">
                <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold leading-tight">
                  <span className="bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent">
                    Jobs that fit
                  </span>
                  <br />
                  <span className="bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
                    skills — fast
                  </span>
                </h1>
                <p className="text-xl text-slate-600 leading-relaxed max-w-2xl">
                  Verified workers, trusted employers, secure M-Pesa escrow — 
                  hire or get work in minutes. Built for Kenya's digital workforce.
                </p>
              </div>

              <div className="flex flex-wrap gap-4">
                <Link
                  to="/register?role=employer"
                  className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-violet-600 to-purple-600 text-white font-semibold rounded-2xl shadow-2xl hover:shadow-3xl transform hover:scale-105 transition-all duration-200"
                >
                  <span>👔</span>
                  Become an Employer
                </Link>

                <Link
                  to="/register?role=worker"
                  className="inline-flex items-center gap-3 px-8 py-4 bg-white text-slate-800 font-semibold rounded-2xl border-2 border-violet-200 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 hover:border-violet-300"
                >
                  <span>💼</span>
                  Become a Worker
                </Link>

                <button
                  onClick={scrollToJobs}
                  className="inline-flex items-center gap-3 px-8 py-4 bg-white text-slate-700 font-semibold rounded-2xl border border-slate-200 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
                >
                  <span>🔍</span>
                  Browse Jobs
                </button>
              </div>

              <div className="flex items-center gap-6 pt-4">
                {["Verified Profiles", "Escrow Protected", "Fast Payouts"].map((feature, index) => (
                  <div key={index} className="flex items-center gap-2 text-sm text-slate-500">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                    {feature}
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Visual Element */}
            <div className="relative">
              <div className="relative bg-gradient-to-br from-white to-slate-50 rounded-3xl shadow-2xl p-8 border border-slate-200">
                <div className="absolute -top-4 -right-4 w-24 h-24 bg-gradient-to-r from-violet-500 to-purple-500 rounded-2xl rotate-12 flex items-center justify-center">
                  <span className="text-white text-2xl">🚀</span>
                </div>
                
                <div className="space-y-6">
                  <div className="text-center space-y-4">
                    <div className="w-20 h-20 bg-gradient-to-r from-violet-600 to-purple-600 rounded-2xl flex items-center justify-center mx-auto">
                      <span className="text-white text-2xl font-bold">OW</span>
                    </div>
                    <div>
                      <div className="font-bold text-slate-800 text-xl mb-2">OnlineWorkersKE</div>
                      <div className="text-slate-600">Find skilled workers or gigs fast. Secure payments with M-Pesa escrow.</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    {[
                      { icon: "✅", label: "Verified", value: "100%" },
                      { icon: "💰", label: "Escrow", value: "Secure" },
                      { icon: "⚡", label: "Payouts", value: "24h" },
                      { icon: "🌟", label: "Rating", value: "4.9/5" }
                    ].map((stat, index) => (
                      <div key={index} className="text-center p-4 bg-slate-50 rounded-xl">
                        <div className="text-2xl mb-2">{stat.icon}</div>
                        <div className="text-sm text-slate-600">{stat.label}</div>
                        <div className="font-bold text-slate-800">{stat.value}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS SECTION */}
      <section className="py-20 bg-white">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <Card className="p-8">
                <div className="space-y-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-violet-500 to-purple-500 rounded-2xl flex items-center justify-center">
                    <span className="text-white text-xl">🚀</span>
                  </div>
                  <h3 className="text-2xl font-bold text-slate-800">How it works</h3>
                  <ol className="space-y-3 text-slate-600">
                    <li className="flex items-start gap-3">
                      <div className="w-6 h-6 bg-violet-100 text-violet-600 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">1</div>
                      <span>Post job with required skills</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <div className="w-6 h-6 bg-violet-100 text-violet-600 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">2</div>
                      <span>Hire verified workers and top up escrow</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <div className="w-6 h-6 bg-violet-100 text-violet-600 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">3</div>
                      <span>Release funds after approval</span>
                    </li>
                  </ol>
                </div>
              </Card>

              <Card className="p-8">
                <div className="space-y-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center">
                    <span className="text-white text-xl">🌟</span>
                  </div>
                  <h3 className="text-2xl font-bold text-slate-800">About OnlineWorkersKE</h3>
                  <p className="text-slate-600 leading-relaxed">
                    We connect verified Kenyan workers with trusted employers, protect payments with M-Pesa escrow,
                    and focus on skill-based matching so the right people find the right jobs quickly.
                  </p>
                  <ul className="space-y-2 text-slate-600">
                    {["Verification-first approach", "Escrow-protected payments", "Fast onboarding and payouts"].map((item, index) => (
                      <li key={index} className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURED JOBS SECTION */}
      <section ref={jobsRef} className="py-20 bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-12">
              <div className="space-y-2">
                <h2 className="text-4xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
                  Featured Jobs
                </h2>
                <p className="text-slate-600">Find your next opportunity from verified employers</p>
              </div>
              <Link 
                to="/jobs" 
                className="px-6 py-3 bg-white text-slate-700 font-semibold rounded-xl border border-slate-200 hover:shadow-lg transition-all duration-200"
              >
                Browse All Jobs
              </Link>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                { title: "React Developer", skills: "React, TypeScript", type: "Remote", duration: "2–4 weeks", budget: "8,000" },
                { title: "Graphic Designer", skills: "Figma, Illustrator", type: "Remote", duration: "1–2 weeks", budget: "3,500" },
                { title: "Mobile App Tester", skills: "Manual QA", type: "Remote", duration: "Flexible", budget: "2,000" }
              ].map((job, index) => (
                <Card key={index} className="p-6 hover:shadow-xl transition-all duration-300 group">
                  <div className="space-y-4">
                    <div className="flex items-start justify-between">
                      <div className="space-y-2">
                        <h3 className="font-bold text-slate-800 text-lg group-hover:text-violet-700 transition-colors">
                          {job.title}
                        </h3>
                        <div className="text-sm text-slate-500">{job.skills} — {job.type}</div>
                        <div className="text-sm text-slate-600">{job.duration}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-xl font-bold text-slate-800">KES {job.budget}</div>
                        <div className="text-xs text-slate-400">fixed</div>
                      </div>
                    </div>
                    
                    <div className="pt-4 border-t border-slate-100">
                      <button className="w-full py-3 bg-gradient-to-r from-violet-600 to-purple-600 text-white font-semibold rounded-xl hover:shadow-lg transform hover:scale-105 transition-all duration-200">
                        Apply Now
                      </button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            <div className="mt-12 text-center">
              <Link 
                to="/jobs" 
                className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-violet-600 to-purple-600 text-white font-semibold rounded-2xl shadow-2xl hover:shadow-3xl transform hover:scale-105 transition-all duration-200"
              >
                <span>🔍</span>
                Browse All Available Jobs
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}