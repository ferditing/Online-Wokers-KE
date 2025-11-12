// src/pages/Profile.tsx  (only the skills selection part changed)
import React, { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useAuth } from '../context/AuthContext';
import { listSkills } from '../services/skills.service';
import api from '../services/api';
import { useNavigate } from 'react-router-dom';

type Form = { name?: string; phone?: string; idNumber?: string; skills?: string[]; };

export default function Profile() {
  const { user, loading, setUserFromResponse } = useAuth() as any;
  const { register, handleSubmit, setValue, watch } = useForm<Form>({ defaultValues: { skills: [] } });
  const [skillsCatalog, setSkillsCatalog] = useState<any[]>([]);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [category, setCategory] = useState<string | null>(null);
  const nav = useNavigate();

  useEffect(() => {
    (async () => {
      try {
        const resp = await listSkills();
        setSkillsCatalog(resp.skills || resp);
      } catch (e) { console.error(e); }
    })();
  }, []);

  useEffect(() => {
    if (user) {
      setValue('name', user.name);
      setValue('phone', user.phone || '');
      setValue('idNumber', user.idNumber || '');
      setValue('skills', user.skills || []);
    }
  }, [user, setValue]);

  // categories computed
  const categories = useMemo(() => {
    const map = new Map<string, string[]>();
    skillsCatalog.forEach(s => {
      const cat = s.category || 'Other';
      if (!map.has(cat)) map.set(cat, []);
      map.get(cat)!.push(s);
    });
    return Array.from(map.entries()).map(([key, skills]) => ({ key, skills }));
  }, [skillsCatalog]);

  const selectedSkills: string[] = watch('skills') || [];

  async function onSubmit(data: Form) {
    setMsg(null);
    if ((user?.role === 'worker') && (!data.skills || data.skills.length < 3)) {
      setMsg('Workers must select at least 3 skills.');
      return;
    }
    setBusy(true);
    try {
      const res = await api.patch('/profile', data);
      if (setUserFromResponse) setUserFromResponse(res.data.user);
      setMsg('Profile updated.');
      nav('/jobs');
    } catch (err: any) {
      setMsg(err?.response?.data?.message || 'Update failed');
    } finally { setBusy(false); }
  }

  return (
    <div className="container py-6">
      <div className="card max-w-3xl mx-auto">
        <h2 className="text-xl font-semibold">Your Profile</h2>
        <p className="small mt-1">Pick skills by category (workers must pick at least 3).</p>

        <form className="mt-4 space-y-4" onSubmit={handleSubmit(onSubmit)}>
          {/* basic fields omitted for brevity — keep your existing inputs for name/phone/id */}
          <div>
            <label className="block text-sm font-medium mb-2">Skill category</label>
            <div className="flex gap-2 flex-wrap">
              {categories.map(c => (
                <button
                  key={c.key}
                  type="button"
                  onClick={() => setCategory(c.key)}
                  className={`px-3 py-1 rounded-md text-sm ${category === c.key ? 'bg-teal-500 text-white' : 'bg-gray-100 text-gray-700'}`}
                >
                  {c.key} ({c.skills.length})
                </button>
              ))}
              <button type="button" onClick={() => setCategory(null)} className="px-3 py-1 rounded-md text-sm bg-white border">All</button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Skills ({selectedSkills.length} selected)</label>
            <div className="grid sm:grid-cols-2 gap-2">
              {(category ? skillsCatalog.filter(s => (s.category||'Other')===category) : skillsCatalog).map(s => {
                const checked = selectedSkills.includes(s.key);
                return (
                  <label key={s.key} className={`p-3 border rounded-md flex items-center gap-3 cursor-pointer ${checked ? 'border-primary bg-primary/10' : 'border-gray-200'}`}>
                    <input
                      type="checkbox"
                      value={s.key}
                      checked={checked}
                      onChange={(e) => {
                        const cur = new Set(selectedSkills);
                        if (e.target.checked) cur.add(s.key); else cur.delete(s.key);
                        setValue('skills', Array.from(cur), { shouldDirty: true });
                      }}
                      className="h-4 w-4"
                    />
                    <div>
                      <div className="text-sm font-medium">{s.name}</div>
                      <div className="small">{s.key}</div>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button className="btn btn-primary" type="submit" disabled={busy}>{busy ? 'Saving...' : 'Save profile'}</button>
            {msg && <div className="text-sm text-red-600">{msg}</div>}
          </div>
        </form>
      </div>
    </div>
  );
}
