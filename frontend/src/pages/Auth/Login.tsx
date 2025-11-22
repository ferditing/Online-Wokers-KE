import React from "react";
import { useForm } from "react-hook-form";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

type FormData = { email: string; password: string };

export default function Login() {
  const { register, handleSubmit } = useForm<FormData>();
  const { login } = useAuth();
  const navigate = useNavigate();
  const loc = useLocation();
  const redirectTo = (new URLSearchParams(loc.search).get("redirect") as string) || "/dashboard";

  async function submit(values: FormData) {
    try {
      await login(values.email, values.password);
      navigate(redirectTo, { replace: true });
    } catch (err: any) {
      console.error("Login error:", err);
      alert(err?.response?.data?.message || err?.message || "Login failed");
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
            Welcome back
          </h2>
          <p className="mt-2 text-slate-600">Sign in to your account</p>
        </div>

        <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 p-8">
          <form onSubmit={handleSubmit(submit)} className="space-y-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Email</label>
                <input 
                  {...register("email", { required: true })} 
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:border-violet-500 focus:ring-2 focus:ring-violet-200 transition-all duration-200"
                  placeholder="Enter your email"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Password</label>
                <input 
                  type="password" 
                  {...register("password", { required: true })} 
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:border-violet-500 focus:ring-2 focus:ring-violet-200 transition-all duration-200"
                  placeholder="Enter your password"
                />
              </div>
            </div>

            <button 
              type="submit" 
              className="w-full py-3 px-4 bg-gradient-to-r from-violet-600 to-purple-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
            >
              Sign in
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-slate-600">
              Don't have an account?{" "}
              <Link 
                to="/register" 
                className="font-semibold text-violet-600 hover:text-violet-700 transition-colors"
              >
                Create account
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}