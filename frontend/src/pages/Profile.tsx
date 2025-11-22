import React, { useEffect, useMemo, useState} from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";

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
  const [allSkills, setAllSkills] = useState<SeedSkill[] | null>(null);
  const [skillFilter, setSkillFilter] = useState("");
  const [newSkill, setNewSkill] = useState("");

  const userId = (user && (user.id || user._id || user._idStr)) || null;

  useEffect(() => {
    if (!user) return;
    setForm({ name: user.name || "", phone: user.phone || "" });
    setSkills(Array.isArray(user.skills) ? user.skills : []);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    let mounted = true;
    async function loadSeeded() {
      try {
        const res = await api.get("/skills");
        if (!mounted) return;
        const payload = res.data?.skills ?? res.data ?? [];
        const normalized: SeedSkill[] = (Array.isArray(payload) ? payload : []).map((s: any) => ({
          key: s.key ?? s._id ?? s.name,
          name: s.name ?? s.key ?? s._id,
          category: s.category ?? "Other",
        }));
        setAllSkills(normalized);
      } catch (err) {
        console.warn("Could not load seeded skills, falling back to free-form mode", err);
        setAllSkills(null);
      }
    }

    loadSeeded();
    return () => { mounted = false; };
  }, []);

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

  function toggleSkillKey(keyOrName: string) {
    setSkills(prev => (prev.includes(keyOrName) ? prev.filter(s => s !== keyOrName) : [...prev, keyOrName]));
  }

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

  if (!user) return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <p className="text-slate-600">Please login to view profile</p>
      </div>
    </div>
  );

  if (loading) return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 border-4 border-violet-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-slate-600 font-medium">Loading profile...</p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-3 space-y-6">
            <Card className="p-8">
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
                <div className="flex items-center gap-4">
                  <div className="w-20 h-20 bg-gradient-to-r from-violet-600 to-purple-600 rounded-2xl flex items-center justify-center text-white font-bold text-2xl">
                    {user.name?.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-slate-800">{user.name}</h2>
                    <div className="text-slate-600">{user.email}</div>
                    <div className="text-sm text-slate-500 mt-1 capitalize">{user.role}</div>
                  </div>
                </div>

                <div className="text-right space-y-3">
                  <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold ${
                    user.verified 
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' 
                      : 'bg-amber-100 text-amber-800 border border-amber-200'
                  }`}>
                    <div className={`w-2 h-2 rounded-full ${user.verified ? 'bg-emerald-500' : 'bg-amber-500'}`}></div>
                    {user.verified ? 'Verified' : 'Not Verified'}
                  </div>
                  
                  <div className="flex gap-3">
                    <Button 
                      onClick={() => setEditingProfile(v => !v)} 
                      variant={editingProfile ? "secondary" : "primary"}
                    >
                      {editingProfile ? "Cancel" : "Edit Profile"}
                    </Button>
                    <Button 
                      onClick={() => setEditingSkills(v => !v)} 
                      variant={editingSkills ? "secondary" : "primary"}
                    >
                      {editingSkills ? "Cancel" : "Edit Skills"}
                    </Button>
                  </div>
                </div>
              </div>

              {/* Profile Edit Form */}
              {editingProfile && (
                <div className="mt-8 p-6 bg-slate-50 rounded-2xl border border-slate-200">
                  <h3 className="text-lg font-semibold text-slate-800 mb-4">Edit Profile</h3>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Full Name</label>
                      <input 
                        className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:border-violet-500 focus:ring-2 focus:ring-violet-200 transition-all duration-200" 
                        value={form.name} 
                        onChange={e => setForm({ ...form, name: e.target.value })} 
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Phone Number</label>
                      <input 
                        className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:border-violet-500 focus:ring-2 focus:ring-violet-200 transition-all duration-200" 
                        value={form.phone} 
                        onChange={e => setForm({ ...form, phone: e.target.value })} 
                      />
                    </div>
                  </div>
                  <div className="flex gap-3 mt-6">
                    <Button onClick={saveProfile} className="bg-gradient-to-r from-violet-600 to-purple-600">
                      Save Changes
                    </Button>
                    <Button onClick={() => setEditingProfile(false)} variant="secondary">
                      Cancel
                    </Button>
                  </div>
                </div>
              )}

              {/* Skills Section */}
              <div className="mt-8">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-semibold text-slate-800">Skills & Expertise</h3>
                  <div className="text-sm text-slate-500">
                    {skills.length} skill{skills.length !== 1 ? 's' : ''}
                  </div>
                </div>

                {!editingSkills ? (
                  <div className="flex flex-wrap gap-3">
                    {skills.length === 0 ? (
                      <div className="text-slate-500 italic">No skills added yet</div>
                    ) : skills.map((s: string, i: number) => {
                      const seeded = allSkills?.find(x => x.key === s || x.name === s);
                      const label = seeded ? seeded.name : s;
                      return (
                        <div key={i} className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-violet-100 to-purple-100 border border-violet-200 text-violet-700 rounded-xl font-medium">
                          {label}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Skills Editor */}
                    {allSkills ? (
                      <>
                        <div className="flex items-center gap-4">
                          <div className="relative flex-1">
                            <input 
                              className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-300 focus:border-violet-500 focus:ring-2 focus:ring-violet-200 transition-all duration-200" 
                              placeholder="Search skills by name or category..." 
                              value={skillFilter} 
                              onChange={e => setSkillFilter(e.target.value)} 
                            />
                            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400">
                              🔍
                            </div>
                          </div>
                          <div className="text-sm font-medium text-slate-600 bg-slate-100 px-3 py-2 rounded-lg">
                            {skills.length} selected
                          </div>
                        </div>

                        <div className="grid md:grid-cols-2 gap-3 max-h-80 overflow-y-auto p-2">
                          {filteredSeeded.length === 0 ? (
                            <div className="col-span-2 text-center text-slate-500 py-8">
                              No skills match your search
                            </div>
                          ) : filteredSeeded.map(s => {
                            const isSelected = skills.includes(s.key) || skills.includes(s.name);
                            return (
                              <button
                                key={s.key}
                                onClick={() => toggleSkillKey(s.key)}
                                className={`text-left p-4 rounded-xl border-2 transition-all duration-200 ${
                                  isSelected 
                                    ? "bg-gradient-to-r from-violet-600 to-purple-600 text-white border-violet-600 shadow-lg" 
                                    : "bg-white text-slate-700 border-slate-200 hover:border-violet-300 hover:shadow-md"
                                }`}
                              >
                                <div className="flex items-center justify-between">
                                  <div>
                                    <div className="font-medium">{s.name}</div>
                                    <div className="text-xs opacity-70">{s.category}</div>
                                  </div>
                                  {isSelected && (
                                    <div className="text-sm font-semibold">✓</div>
                                  )}
                                </div>
                              </button>
                            );
                          })}
                        </div>

                        <div className="border-t border-slate-200 pt-6">
                          <label className="block text-sm font-medium text-slate-700 mb-3">Add Custom Skill</label>
                          <div className="flex gap-3">
                            <input 
                              className="flex-1 px-4 py-3 rounded-xl border border-slate-300 focus:border-violet-500 focus:ring-2 focus:ring-violet-200 transition-all duration-200" 
                              placeholder="e.g., Local plumbing, Traditional crafts..." 
                              value={newSkill} 
                              onChange={e => setNewSkill(e.target.value)} 
                              onKeyDown={e => e.key === "Enter" && addCustomSkill()} 
                            />
                            <Button onClick={addCustomSkill} variant="secondary">
                              Add
                            </Button>
                          </div>
                        </div>
                      </>
                    ) : (
                      // Fallback UI
                      <div className="space-y-4">
                        <div className="text-slate-600 bg-slate-50 p-4 rounded-xl">
                          Seeded skills unavailable — use free-form input below.
                        </div>
                        <div className="flex gap-3">
                          <input 
                            className="flex-1 px-4 py-3 rounded-xl border border-slate-300 focus:border-violet-500 focus:ring-2 focus:ring-violet-200 transition-all duration-200" 
                            placeholder="Add skill e.g., React developer" 
                            value={newSkill} 
                            onChange={e => setNewSkill(e.target.value)} 
                            onKeyDown={e => e.key === 'Enter' && addCustomSkill()} 
                          />
                          <Button onClick={addCustomSkill} variant="secondary">
                            Add
                          </Button>
                        </div>
                      </div>
                    )}

                    {/* Selected Skills Preview */}
                    <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200">
                      <h4 className="font-semibold text-slate-800 mb-4">Selected Skills ({skills.length})</h4>
                      <div className="flex flex-wrap gap-2">
                        {skills.length === 0 ? (
                          <div className="text-slate-500 italic">No skills selected</div>
                        ) : skills.map((s, i) => {
                          const seeded = allSkills?.find(x => x.key === s || x.name === s);
                          const label = seeded ? seeded.name : s;
                          return (
                            <div key={i} className="inline-flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 rounded-lg">
                              <span className="text-sm font-medium text-slate-700">{label}</span>
                              <button 
                                onClick={() => removeSkill(i)} 
                                className="text-slate-400 hover:text-rose-500 transition-colors"
                              >
                                ×
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Save Actions */}
                    <div className="flex gap-3 pt-4">
                      <Button onClick={saveSkills} className="bg-gradient-to-r from-violet-600 to-purple-600">
                        Save Skills
                      </Button>
                      <Button onClick={() => setEditingSkills(false)} variant="secondary">
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              {/* Profile Information */}
              <div className="mt-8 grid md:grid-cols-2 gap-6 p-6 bg-slate-50 rounded-2xl border border-slate-200">
                <div>
                  <h4 className="font-semibold text-slate-800 mb-3">Profile Information</h4>
                  <div className="space-y-2 text-slate-600">
                    <div><strong>Email:</strong> {user.email}</div>
                    <div><strong>Phone:</strong> {user.phone || '—'}</div>
                    <div><strong>Member since:</strong> {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : '—'}</div>
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold text-slate-800 mb-3">Account Status</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-slate-600">Verification:</span>
                      <span className={user.verified ? "text-emerald-600 font-semibold" : "text-amber-600 font-semibold"}>
                        {user.verified ? "Verified" : "Pending"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Role:</span>
                      <span className="font-semibold text-slate-800 capitalize">{user.role}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Total Skills:</span>
                      <span className="font-semibold text-slate-800">{skills.length}</span>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <Card className="p-6">
              <h4 className="font-semibold text-slate-800 mb-4">Quick Actions</h4>
              <div className="space-y-3">
                <Button 
                  onClick={() => setEditingSkills(true)} 
                  variant="secondary" 
                  className="w-full justify-start"
                >
                  ✏️ Edit Skills
                </Button>
                <Button 
                  onClick={() => setEditingProfile(true)} 
                  variant="secondary" 
                  className="w-full justify-start"
                >
                  👤 Edit Profile
                </Button>
                <Link 
                  to="/profile/verify" 
                  className="block w-full px-4 py-3 text-left bg-gradient-to-r from-violet-600 to-purple-600 text-white font-semibold rounded-xl hover:shadow-lg transition-all duration-200"
                >
                  📄 Upload Verification
                </Link>
              </div>
            </Card>

            {/* Verification Status */}
            <Card className="p-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-r from-violet-600 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <span className="text-white text-2xl">🛡️</span>
                </div>
                <h5 className="font-semibold text-slate-800 mb-2">Verification Status</h5>
                {user.verified ? (
                  <div className="text-emerald-600 bg-emerald-50 px-3 py-2 rounded-lg font-semibold">
                    ✓ Verified Account
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="text-amber-600 bg-amber-50 px-3 py-2 rounded-lg font-semibold">
                      ⚠️ Not Verified
                    </div>
                    <p className="text-sm text-slate-600">
                      Complete verification to apply for jobs
                    </p>
                    <Link 
                      to="/profile/verify" 
                      className="inline-block px-4 py-2 bg-amber-600 text-white text-sm font-semibold rounded-lg hover:bg-amber-700 transition-colors"
                    >
                      Verify Now
                    </Link>
                  </div>
                )}
              </div>
            </Card>

            {/* Stats Card */}
            <Card className="p-6">
              <h5 className="font-semibold text-slate-800 mb-4">Profile Stats</h5>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-slate-600">Skills:</span>
                  <span className="font-bold text-slate-800">{skills.length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-600">Status:</span>
                  <span className={`font-bold ${user.verified ? 'text-emerald-600' : 'text-amber-600'}`}>
                    {user.verified ? 'Active' : 'Pending'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-600">Member:</span>
                  <span className="font-bold text-slate-800">
                    {user.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : '—'}
                  </span>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}