import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useAuth } from '../../context/AuthContext';

type Form = { name: string; email: string; password: string; role?: 'worker'|'employer' };

export default function Register() {
  const { register: regFn } = useAuth();
  const { register, handleSubmit } = useForm<Form>({ defaultValues: { role: 'worker' } });
  const nav = useNavigate();
  const [err, setErr] = React.useState<string | null>(null);

  async function onSubmit(data: Form) {
    try {
      setErr(null);
      await regFn(data);
      nav('/jobs');
    } catch (e: any) {
      setErr(e?.response?.data?.message || 'Registration failed');
    }
  }

  return (
    <div className="container" style={{ maxWidth: 480 }}>
      <div className="card" style={{ marginTop: 24 }}>
        <h3>Register</h3>
        {err && <div style={{ color: 'red' }}>{err}</div>}
        <form onSubmit={handleSubmit(onSubmit)} className="grid">
          <input className="input" placeholder="Full name" {...register('name')} />
          <input className="input" placeholder="Email" {...register('email')} />
          <input className="input" type="password" placeholder="Password" {...register('password')} />
          <select {...register('role')} className="input">
            <option value="worker">Worker (apply to jobs)</option>
            <option value="employer">Employer (post jobs)</option>
          </select>
          <button type="submit">Create account</button>
        </form>
      </div>
    </div>
  );
}
