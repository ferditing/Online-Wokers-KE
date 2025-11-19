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
      // successful login -> redirect to dashboard or previously-intended route
      navigate(redirectTo, { replace: true });
    } catch (err: any) {
      console.error("Login error:", err);
      alert(err?.response?.data?.message || err?.message || "Login failed");
    }
  }

  return (
    <div className="container mx-auto py-8">
      <div className="max-w-md mx-auto bg-white p-6 rounded shadow">
        <h2 className="text-2xl font-semibold mb-4">Sign in</h2>
        <form onSubmit={handleSubmit(submit)} className="space-y-3">
          <div>
            <label className="block text-sm">Email</label>
            <input {...register("email", { required: true })} className="input" />
          </div>
          <div>
            <label className="block text-sm">Password</label>
            <input type="password" {...register("password", { required: true })} className="input" />
          </div>
          <div className="flex justify-end">
            <button type="submit" className="px-4 py-2 bg-violet-600 text-white rounded">Login</button>
          </div>
        </form>
        <div className="mt-4 text-center">
          <p className="text-sm text-gray-600">
            Don't have an account?{" "}
            <Link to="/register" className="text-violet-600 hover:underline">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
