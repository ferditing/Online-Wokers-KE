import React from 'react';
import { useForm } from 'react-hook-form';
import { createJob } from '../services/jobs.service';
import { useNavigate } from 'react-router-dom';

export default function PostJob() {
  const { register, handleSubmit } = useForm<{ title: string; description: string; budget: number }>();
  const nav = useNavigate();

  async function onSubmit(data: any) {
    try {
      await createJob(data);
      nav('/jobs');
    } catch (e: any) {
      alert(e?.response?.data?.message || 'Create job failed');
    }
  }

  return (
    <div className="container" style={{ maxWidth: 800 }}>
      <div className="card" style={{ marginTop: 20 }}>
        <h3>Post a Job</h3>
        <form onSubmit={handleSubmit(onSubmit)} className="grid">
          <input className="input" placeholder="Title" {...register('title')} />
          <textarea className="input" placeholder="Description" {...register('description' as any)} />
          <input className="input" placeholder="Budget (KES)" type="number" {...register('budget' as any)} />
          <button type="submit">Create Job</button>
        </form>
      </div>
    </div>
  );
}
