import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useAuth } from '../../context/AuthContext';

type Form = { email: string; password: string };

export default function Login() {
  const { login } = useAuth();
  const { register, handleSubmit } = useForm<Form>();
  const nav = useNavigate();
  const [err, setErr] = React.useState<string | null>(null);

  async function onSubmit(data: Form) {
    try {
      setErr(null);
      await login(data.email, data.password);
      nav('/jobs');
    } catch (e: any) {
      setErr(e?.response?.data?.message || 'Login failed');
    }
  }

  return (
    <div className="container" style={{ maxWidth: 480 }}>
      <div className="card" style={{ marginTop: 24 }}>
        <h3>Login</h3>
        {err && <div style={{ color: 'red' }}>{err}</div>}
        <form onSubmit={handleSubmit(onSubmit)} className="grid">
          <input className="input" placeholder="Email" {...register('email')} />
          <input className="input" type="password" placeholder="Password" {...register('password')} />
          <button type="submit">Login</button>
        </form>
      </div>
    </div>
  );
}
