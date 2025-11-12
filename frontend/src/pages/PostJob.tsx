// frontend/src/pages/PostJob.tsx
import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { createJob } from '../services/jobs.service';
import { listSkills } from '../services/skills.service';
import { useNavigate } from 'react-router-dom';

type Form = {
  title: string;
  description: string;
  budget: number;
  currency?: string;
  requiredSkills: string[];
  preferredSkills: string[];
};

export default function PostJob() {
  const { register, handleSubmit, setValue } = useForm<Form>({
    defaultValues: { requiredSkills: [], preferredSkills: [] }
  });
  const [skillsCatalog, setSkillsCatalog] = useState<any[]>([]);
  const nav = useNavigate();

  useEffect(() => {
    (async () => {
      try {
        const s = await listSkills();
        setSkillsCatalog(s.skills || s);
      } catch (e) { console.error(e); }
    })();
  }, []);

  // helper to toggle checkbox arrays
  function toggleArray(field: 'requiredSkills' | 'preferredSkills', value: string) {
    const cur = (document.querySelectorAll(`input[name="${field}"]:checked`) as any) || [];
    const values = Array.from(cur).map((i: any) => i.value);
    setValue(field, values, { shouldDirty: true, shouldValidate: true });
  }

  async function onSubmit(data: any) {
    // ensure at least one required skill
    if (!data.requiredSkills || data.requiredSkills.length === 0) {
      alert('Please select at least one required skill for this job.');
      return;
    }

    try {
      const payload = {
        title: data.title,
        description: data.description,
        budget: Number(data.budget),
        currency: data.currency || 'KES',
        requiredSkills: data.requiredSkills || [],
        preferredSkills: data.preferredSkills || [],
      };
      await createJob(payload);
      nav('/jobs');
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Failed to create job');
    }
  }

  return (
    <div className="container py-6">
      <div className="card max-w-3xl mx-auto">
        <h2 className="text-xl font-semibold">Post a Job</h2>
        <form onSubmit={handleSubmit(onSubmit)} className="mt-4 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Title</label>
            <input className="input" {...register('title', { required: true })} />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <textarea className="input h-28" {...register('description', { required: true })} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Budget (KES)</label>
              <input className="input" type="number" {...register('budget', { required: true })} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Currency</label>
              <input className="input" {...register('currency')} defaultValue="KES" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Required skills</label>
            <div className="grid sm:grid-cols-2 gap-2">
              {skillsCatalog.map(s => (
                <label key={s.key} className="inline-flex items-center gap-2 p-2 border rounded" >
                  <input
                    type="checkbox"
                    name="requiredSkills"
                    value={s.key}
                    onChange={() => toggleArray('requiredSkills', s.key)}
                    className="h-4 w-4"
                  />
                  <span className="text-sm">{s.name}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Preferred skills</label>
            <div className="grid sm:grid-cols-2 gap-2">
              {skillsCatalog.map(s => (
                <label key={'p-'+s.key} className="inline-flex items-center gap-2 p-2 border rounded" >
                  <input
                    type="checkbox"
                    name="preferredSkills"
                    value={s.key}
                    onChange={() => toggleArray('preferredSkills', s.key)}
                    className="h-4 w-4"
                  />
                  <span className="text-sm">{s.name}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <button className="btn btn-primary" type="submit">Create Job</button>
          </div>
        </form>
      </div>
    </div>
  );
}
