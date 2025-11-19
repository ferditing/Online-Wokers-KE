// frontend/src/pages/Auth/Register.tsx
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
    <div className="min-h-[70vh] flex items-center justify-center">
      <form onSubmit={submit} className="w-full max-w-md p-8 bg-white rounded-lg shadow">
        <h2 className="text-2xl font-semibold text-violet-600 mb-4">Create your account</h2>

        <label className="block text-sm">Full name</label>
        <input
          className="input mt-1 mb-2"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          name="name"
        />

        <label className="block text-sm">Email</label>
        <input
          className="input mt-1 mb-2"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          type="email"
          name="email"
        />

        <label className="block text-sm">Password</label>
        <input
          type="password"
          className="input mt-1 mb-2"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          name="password"
        />

        <label className="block text-sm mt-2">Role</label>
        <select className="input mt-1 mb-4" value={role} onChange={(e) => setRole(e.target.value)} name="role">
          <option value="worker">Worker</option>
          <option value="employer">Employer</option>
        </select>

        <Button className="bg-violet-600 text-white w-full" type="submit" disabled={busy}>
          {busy ? "Creating..." : "Create account"}
        </Button>

        <div className="text-sm text-center mt-4">
          Already have an account?{" "}
          <Link to={`/login?next=${encodeURIComponent(redirect)}`} className="text-violet-600">
            Sign in
          </Link>
        </div>
      </form>
    </div>
  );
}
