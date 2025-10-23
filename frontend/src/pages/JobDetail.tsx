import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getJob, applyToJob, submitDeliverable } from '../services/jobs.service';
import { useAuth } from '../context/AuthContext';
import { useForm } from 'react-hook-form';

export default function JobDetail() {
  const { id } = useParams<{ id: string }>();
  const [job, setJob] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const { register, handleSubmit } = useForm<{ coverMessage: string; proposedPrice?: number }>();
  const submitForm = useForm<{ files: string[]; notes?: string }>();

  useEffect(() => {
    if (!id) return;
    (async () => {
      setLoading(true);
      try {
        const res = await getJob(id);
        setJob(res.job || res);
      } catch (e) { console.error(e); }
      setLoading(false);
    })();
  }, [id]);

  async function onApply(data: any) {
    try {
      await applyToJob(id!, data);
      alert('Applied — check dashboard or wait for employer');
    } catch (e: any) {
      alert(e?.response?.data?.message || 'Apply failed');
    }
  }

  async function onSubmitDeliverable(data: any) {
    try {
      await submitDeliverable(id!, data);
      alert('Submission sent');
    } catch (e: any) {
      alert(e?.response?.data?.message || 'Submit failed');
    }
  }

  if (loading) return <div className="container">Loading...</div>;
  if (!job) return <div className="container">Job not found</div>;

  return (
    <div className="container">
      <div className="card" style={{ marginTop: 20 }}>
        <h3>{job.title}</h3>
        <div className="small">Budget: {job.currency} {job.budget}</div>
        <p style={{ marginTop: 12 }}>{job.description}</p>

        {user?.role === 'worker' && (
          <div style={{ marginTop: 16 }}>
            <h4>Apply</h4>
            <form onSubmit={handleSubmit(onApply)} className="grid">
              <textarea placeholder="Cover message" {...register('coverMessage') as any} className="input" />
              <input type="number" placeholder="Proposed price (optional)" {...register('proposedPrice' as any)} className="input" />
              <button type="submit">Apply</button>
            </form>
          </div>
        )}

        {user?.role === 'worker' && (
          <div style={{ marginTop: 16 }}>
            <h4>Submit deliverable</h4>
            <form onSubmit={submitForm.handleSubmit(onSubmitDeliverable)} className="grid">
              <input placeholder="File URLs comma separated" {...submitForm.register('files' as any)} className="input" />
              <textarea placeholder="Notes" {...submitForm.register('notes' as any)} className="input" />
              <button type="submit">Submit</button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
