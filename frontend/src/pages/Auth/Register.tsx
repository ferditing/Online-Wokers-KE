import React, { useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import api from "../../services/api";
import Button from "../../components/ui/Button";

export default function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("worker");
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const redirect = new URLSearchParams(location.search).get("next") || "/";

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      await api.post("/auth/register", { name, email, password, role });
      alert("Registered. Please log in.");
      navigate("/login?next=" + encodeURIComponent(redirect));
    } catch (err: any) {
      alert(err?.response?.data?.message || "Registration failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="mx-auto w-20 h-20 bg-gradient-to-r from-violet-600 to-purple-600 rounded-2xl flex items-center justify-center shadow-2xl mb-6">
            <span className="text-white text-2xl font-bold">OW</span>
          </div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
            Create account
          </h2>
          <p className="mt-2 text-slate-600">Join OnlineWorkersKE today</p>
        </div>

        <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 p-8">
          <form onSubmit={submit} className="space-y-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Full name</label>
                <input
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:border-violet-500 focus:ring-2 focus:ring-violet-200 transition-all duration-200"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  name="name"
                  placeholder="Enter your full name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Email</label>
                <input
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:border-violet-500 focus:ring-2 focus:ring-violet-200 transition-all duration-200"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  type="email"
                  name="email"
                  placeholder="Enter your email"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Password</label>
                <input
                  type="password"
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:border-violet-500 focus:ring-2 focus:ring-violet-200 transition-all duration-200"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  name="password"
                  placeholder="Create a password"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Role</label>
                <select 
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:border-violet-500 focus:ring-2 focus:ring-violet-200 transition-all duration-200"
                  value={role} 
                  onChange={(e) => setRole(e.target.value)} 
                  name="role"
                >
                  <option value="worker">Worker</option>
                  <option value="employer">Employer</option>
                </select>
              </div>
            </div>

            <Button 
              className="w-full py-3" 
              type="submit" 
              disabled={busy}
            >
              {busy ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Creating account...
                </div>
              ) : (
                "Create account"
              )}
            </Button>

            <div className="text-center">
              <p className="text-sm text-slate-600">
                Already have an account?{" "}
                <Link 
                  to={`/login?next=${encodeURIComponent(redirect)}`} 
                  className="font-semibold text-violet-600 hover:text-violet-700 transition-colors"
                >
                  Sign in
                </Link>
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}