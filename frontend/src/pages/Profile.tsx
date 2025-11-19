// frontend/src/pages/Profile.tsx
import React, { useEffect, useMemo, useState} from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";

/**
 * Profile page
 * - Fetches seeded skills from /api/skills and shows them grouped and searchable
 * - User selects skills (stored as skill.key when possible; custom skills allowed)
 * - Save sends PATCH /api/users/:id { skills: [...] }
 *
 * Fallback: if /api/skills fails, show the previous free-form add UI.
 */

type SeedSkill = {
  key: string;
  name: string;
  category?: string;
};

export default function Profile() {
  const { user, refreshUser } = useAuth() as any;
  const [loading, setLoading] = useState(true);
  const [editingProfile, setEditingProfile] = useState(false);
  const [editingSkills, setEditingSkills] = useState(false);

  const [form, setForm] = useState({ name: "", phone: "" });

  // Skills UI state
  const [skills, setSkills] = useState<string[]>([]);
  const [allSkills, setAllSkills] = useState<SeedSkill[] | null>(null); // null => not loaded or failed
  const [skillFilter, setSkillFilter] = useState("");
  const [newSkill, setNewSkill] = useState("");

  // derived
  const userId = (user && (user.id || user._id || user._idStr)) || null;

  useEffect(() => {
    if (!user) return;
    setForm({ name: user.name || "", phone: user.phone || "" });
    setSkills(Array.isArray(user.skills) ? user.skills : []);
    setLoading(false);
  }, [user]);

  // load seeded skills when entering edit mode (or once on mount)
  useEffect(() => {
    let mounted = true;
    async function loadSeeded() {
      try {
        const res = await api.get("/skills");
        if (!mounted) return;
        // Expecting res.data.skills or res.data
        const payload = res.data?.skills ?? res.data ?? [];
        // Normalize to {key,name,category}
        const normalized: SeedSkill[] = (Array.isArray(payload) ? payload : []).map((s: any) => ({
          key: s.key ?? s._id ?? s.name,
          name: s.name ?? s.key ?? s._id,
          category: s.category ?? "Other",
        }));
        setAllSkills(normalized);
      } catch (err) {
        console.warn("Could not load seeded skills, falling back to free-form mode", err);
        setAllSkills(null); // marker for fallback
      }
    }

    loadSeeded();
    return () => { mounted = false; };
  }, []); // load once

  async function saveProfile() {
    if (!userId) return alert("Invalid user");
    try {
      setLoading(true);
      const res = await api.patch(`/users/${userId}`, { name: form.name, phone: form.phone });
      if (res.data?.user) {
        await refreshUser();
        setEditingProfile(false);
      }
    } catch (err) {
      console.error(err);
      alert("Could not update profile.");
    } finally {
      setLoading(false);
    }
  }

  async function saveSkills() {
    if (!userId) return alert("Invalid user");
    if (!Array.isArray(skills) || skills.length < 3) {
      if (!confirm("You have fewer than 3 skills — you must have at least 3 to apply to jobs. Save anyway?")) {
        return;
      }
    }

    try {
      setLoading(true);
      const res = await api.patch(`/users/${userId}`, { skills });
      if (res.data?.user) {
        await refreshUser();
        setEditingSkills(false);
      }
    } catch (err) {
      console.error(err);
      alert("Could not update skills.");
    } finally {
      setLoading(false);
    }
  }

  // add selected seeded skill by key
  function toggleSkillKey(keyOrName: string) {
    setSkills(prev => (prev.includes(keyOrName) ? prev.filter(s => s !== keyOrName) : [...prev, keyOrName]));
  }

  // add custom skill text
  function addCustomSkill() {
    const s = newSkill.trim();
    if (!s) return;
    if (skills.includes(s)) {
      setNewSkill("");
      return;
    }
    setSkills(prev => [...prev, s]);
    setNewSkill("");
  }

  function removeSkill(i: number) {
    setSkills(prev => prev.filter((_, idx) => idx !== i));
  }

  const filteredSeeded = useMemo(() => {
    if (!allSkills) return [];
    const q = skillFilter.trim().toLowerCase();
    return allSkills.filter(s => (!q) || s.name.toLowerCase().includes(q) || s.key.toLowerCase().includes(q) || (s.category || "").toLowerCase().includes(q));
  }, [allSkills, skillFilter]);

  if (!user) return <div className="container py-8">Please login to view profile</div>;
  if (loading) return <div className="container py-8">Loading…</div>;

  return (
    <div className="container mx-auto py-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold">{user.name}</h2>
                <div className="text-sm text-slate-500">{user.email}</div>
                <div className="text-xs mt-1">{user.role}</div>
              </div>

              <div className="text-right">
                <div className={`inline-flex items-center px-2 py-1 text-xs rounded ${user.verified ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                  {user.verified ? 'Verified' : 'Not verified'}
                </div>
                <div className="mt-3">
                  <button onClick={() => setEditingProfile(v => !v)} className="px-3 py-1 ml-2 border rounded text-sm">Edit profile</button>
                  <button onClick={() => setEditingSkills(v => !v)} className="px-3 py-1 ml-2 border rounded text-sm">Edit skills</button>
                </div>
              </div>
            </div>

            {/* profile edit form */}
            {editingProfile && (
              <div className="mt-4">
                <label className="block text-sm">Name</label>
                <input className="input mt-1" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
                <label className="block text-sm mt-3">Phone</label>
                <input className="input mt-1" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
                <div className="mt-3">
                  <button onClick={saveProfile} className="inline-flex items-center justify-center rounded-md px-4 py-2 bg-violet-600 text-white font-medium">Save</button>
                  <button onClick={() => setEditingProfile(false)} className="ml-2 px-3 py-2 border rounded">Cancel</button>
                </div>
              </div>
            )}

            {/* skills display / edit */}
            <div className="mt-4">
              <h3 className="text-sm text-slate-600">Skills</h3>

              {!editingSkills ? (
                <div className="mt-2 flex flex-wrap gap-2">
                  {skills.length === 0 ? <div className="text-sm text-slate-500">No skills added</div> : skills.map((s: string, i: number) => {
                    // try to resolve to a friendly name if seeded exists
                    const seeded = allSkills?.find(x => x.key === s || x.name === s);
                    const label = seeded ? seeded.name : s;
                    return <span key={i} className="px-3 py-1 rounded-full bg-violet-50 text-violet-700 text-sm">{label}</span>;
                  })}
                </div>
              ) : (
                <div className="mt-2">
                  {/* If seeded skills loaded -> show search + grouped list */}
                  {allSkills ? (
                    <>
                      <div className="flex items-center gap-3">
                        <input className="input" placeholder="Search skills or category" value={skillFilter} onChange={e => setSkillFilter(e.target.value)} />
                        <div className="text-sm text-slate-500">Selected: {skills.length}</div>
                      </div>

                      <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-2 max-h-64 overflow-auto">
                        {filteredSeeded.length === 0 ? <div className="text-sm text-slate-500">No skills match.</div> : filteredSeeded.map(s => {
                          const isSelected = skills.includes(s.key) || skills.includes(s.name);
                          return (
                            <button
                              key={s.key}
                              onClick={() => toggleSkillKey(s.key)}
                              className={`w-full text-left p-2 rounded border ${isSelected ? "bg-violet-600 text-white border-violet-600" : "bg-white text-slate-700 hover:bg-violet-50"}`}
                            >
                              <div className="flex items-center justify-between">
                                <div>
                                  <div className="font-medium">{s.name}</div>
                                  <div className="text-xs text-slate-500">{s.category}</div>
                                </div>
                                <div className="text-xs">{isSelected ? "Selected" : "Select"}</div>
                              </div>
                            </button>
                          );
                        })}
                      </div>

                      <div className="mt-4">
                        <label className="block text-sm">Add custom skill</label>
                        <div className="flex gap-2 mt-1">
                          <input className="input" placeholder="e.g. Local plumbing" value={newSkill} onChange={e => setNewSkill(e.target.value)} onKeyDown={e => e.key === "Enter" && addCustomSkill()} />
                          <button onClick={addCustomSkill} className="px-4 py-2 rounded border">Add</button>
                        </div>
                      </div>
                    </>
                  ) : (
                    // fallback: freeform list (behaviour similar to your previous textarea)
                    <>
                      <div className="text-sm text-slate-500 mb-2">Seeded skills unavailable — use free-form add.</div>
                      <div className="flex gap-2">
                        <input className="input" placeholder="Add skill e.g. React developer" value={newSkill} onChange={e => setNewSkill(e.target.value)} onKeyDown={e => e.key === 'Enter' && addCustomSkill()} />
                        <button onClick={addCustomSkill} className="px-4 py-2 rounded border">Add</button>
                      </div>

                      <div className="mt-3 space-y-2">
                        {skills.map((s, i) => (
                          <div key={i} className="flex items-center justify-between bg-slate-50 p-2 rounded">
                            <div className="text-sm">{s}</div>
                            <div>
                              <button onClick={() => removeSkill(i)} className="text-sm text-rose-600">Remove</button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </>
                  )}

                  {/* selected skills preview */}
                  <div className="mt-4">
                    <div className="text-xs text-slate-500 mb-2">Selected skills</div>
                    <div className="flex flex-wrap gap-2">
                      {skills.length === 0 ? <div className="text-sm text-slate-500">None</div> : skills.map((s, i) => {
                        const seeded = allSkills?.find(x => x.key === s || x.name === s);
                        const label = seeded ? seeded.name : s;
                        return (
                          <div key={i} className="inline-flex items-center gap-2 bg-slate-100 px-3 py-1 rounded">
                            <span className="text-xs">{label}</span>
                            <button onClick={() => removeSkill(i)} className="text-xs text-rose-600">x</button>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="mt-3">
                    <button onClick={saveSkills} className="inline-flex items-center justify-center rounded-md px-4 py-2 bg-violet-600 text-white font-medium">Save skills</button>
                    <button onClick={() => setEditingSkills(false)} className="ml-2 px-3 py-2 border rounded">Cancel</button>
                  </div>
                </div>
              )}
            </div>

            {/* other fields */}
            <div className="mt-4 text-sm text-slate-500">
              <div><strong>Email:</strong> {user.email}</div>
              <div className="mt-1"><strong>Phone:</strong> {user.phone || '—'}</div>
              <div className="mt-1"><strong>Member since:</strong> {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : '—'}</div>
            </div>
          </div>
        </div>

        <aside>
          <div className="card">
            <h4 className="text-sm text-slate-500">Quick actions</h4>
            <div className="mt-3 flex flex-col gap-2">
              <button onClick={() => { setEditingSkills(true); }} className="px-3 py-2 border rounded text-left">Edit skills</button>
              <button onClick={() => { setEditingProfile(true); }} className="px-3 py-2 border rounded text-left">Edit profile</button>
              <Link to="/profile/verify" className="text-sm text-violet-600">Upload verification documents</Link>
            </div>
          </div>

          <div className="card mt-4">
            <h5 className="text-sm text-slate-500">Profile status</h5>
            <div className="mt-3 text-sm">
              {user.verified ? <div className="text-green-700">Verified — good to apply</div> : <div className="text-yellow-800">Not verified — upload documents</div>}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
