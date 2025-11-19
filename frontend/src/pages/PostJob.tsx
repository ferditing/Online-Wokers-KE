// frontend/src/pages/PostJob.tsx
import { useForm } from "react-hook-form";
import { createJob } from "../services/jobs.service";
import { listSkills } from "../services/skills.service";
import { useNavigate } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";

type Form = {
  title: string;
  description: string;
  budget: number;
  currency?: string;
  category?: string;
  requiredSkills: string[];
  preferredSkills: string[];
  verifyJob: boolean | string; // radio returns string "true"/"false"
};

export default function PostJob() {
  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<Form>({
    defaultValues: { requiredSkills: [], preferredSkills: [], currency: "KES", category: "" }
  });
  const [skillsCatalog, setSkillsCatalog] = useState<any[]>([]);
  const [requiredSkills, setRequiredSkills] = useState<string[]>([]);
  const [preferredSkills, setPreferredSkills] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const nav = useNavigate();

  // watch the category field from RHF (single source of truth)
  const watchedCategory = watch("category");

  useEffect(() => {
    (async () => {
      try {
        const s = await listSkills();
        const list = (s?.skills ?? s) as any[] ?? [];
        setSkillsCatalog(list);

        // derive unique categories from skills
        const cats = Array.from(new Set(list.map((it: any) => (it?.category ?? "Other"))));

        if (cats.length > 0) {
          // only set if form category is empty or unset
          const current = (watchedCategory ?? "").toString();
          if (!current) {
            setValue("category", cats[0]);
          }
        }
      } catch (e) {
        console.error("Could not load skills", e);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setValue]); // keep as before; we use watchedCategory in render

  // keep RHF values in sync with local arrays
  useEffect(() => { setValue("requiredSkills", requiredSkills); }, [requiredSkills, setValue]);
  useEffect(() => { setValue("preferredSkills", preferredSkills); }, [preferredSkills, setValue]);

  // derive list of categories
  const categories = useMemo(() => {
    return Array.from(new Set(skillsCatalog.map(s => s?.category ?? "Other")));
  }, [skillsCatalog]);

  // skills filtered by chosen category (use watchedCategory)
  const filtered = useMemo(() => {
    const cat = (watchedCategory && watchedCategory !== "") ? watchedCategory : (categories[0] ?? "Other");
    return skillsCatalog.filter(s => (s?.category ?? "Other") === cat);
  }, [skillsCatalog, watchedCategory, categories]);

  function toggleRequired(key: string) {
    setRequiredSkills(prev => {
      if (prev.includes(key)) return prev.filter(k => k !== key);
      if (prev.length >= 5) {
        alert("You can select up to 5 required skills.");
        return prev;
      }
      return [...prev, key];
    });
  }

  function togglePreferred(key: string) {
    setPreferredSkills(prev => prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]);
  }

  async function onSubmit(data: Form) {
    // normalize verifyJob (radio returns string "true"/"false")
    const verify = data.verifyJob === true || data.verifyJob === "true";

    // local validation
    if (!data.title || data.title.trim().length < 3) {
      alert("Please provide a valid title (min 3 characters).");
      return;
    }
    if (!data.category) {
      alert("Please choose a category.");
      return;
    }
    if (!data.requiredSkills || data.requiredSkills.length === 0) {
      alert("Please choose at least one required skill.");
      return;
    }
    if (!data.budget || Number.isNaN(Number(data.budget)) || Number(data.budget) <= 0) {
      alert("Please provide a valid budget (> 0).");
      return;
    }

    try {
      setBusy(true);
      const payload = {
        title: data.title,
        description: data.description,
        budget: Number(data.budget),
        currency: data.currency || "KES",
        category: data.category,
        requiredSkills: data.requiredSkills || [],
        preferredSkills: data.preferredSkills || [],
        verifyJob: verify,
      };

      const createdJob = await createJob(payload);

      // If user chose to verify job, redirect to payment page
      if (verify) {
        nav(`/jobs/${createdJob._id}/verify`);
      } else {
        nav("/jobs");
      }
    } catch (err: any) {
      console.error("Create job failed", err);
      const message = (err?.response?.data?.message) ?? err?.message ?? String(err);
      alert(message || "Failed to create job");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="container py-6">
      <div className="card max-w-3xl mx-auto">
        <h2 className="text-xl font-semibold">Post a Job</h2>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-4 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Category</label>
            <select
              className="input"
              {...register("category", { required: true })}
            >
              <option value="">Choose a category</option>
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            {errors.category && <div className="text-rose-600 text-xs mt-1">Category is required</div>}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Title</label>
            <input className="input" {...register("title", { required: true, minLength: 3 })} />
            {errors.title && <div className="text-rose-600 text-xs mt-1">Title is required (min 3 chars)</div>}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <textarea className="input h-28" {...register("description", { required: true })} />
            {errors.description && <div className="text-rose-600 text-xs mt-1">Description is required</div>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Budget</label>
              <input className="input" type="number" {...register("budget", { required: true, valueAsNumber: true })} />
              {errors.budget && <div className="text-rose-600 text-xs mt-1">Budget is required</div>}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Currency</label>
              <input className="input" {...register("currency")} defaultValue="KES" />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium">Required skills (select up to 5)</label>
              <div className="text-xs text-slate-500">Selected: {requiredSkills.length}</div>
            </div>

            <div className="grid sm:grid-cols-2 gap-2">
              {filtered.length === 0 ? (
                <div className="text-sm text-slate-500">No skills in this category.</div>
              ) : (
                filtered.map((s: any) => {
                  const selected = requiredSkills.includes(s.key);
                  return (
                    <label key={s.key} className={`inline-flex items-center gap-2 p-2 border rounded cursor-pointer ${selected ? "bg-violet-50 border-violet-400" : "bg-white"}`}>
                      <input
                        type="checkbox"
                        checked={selected}
                        onChange={() => toggleRequired(s.key)}
                        className="h-4 w-4"
                      />
                      <span className="text-sm">{s.name}</span>
                    </label>
                  );
                })
              )}
            </div>
            {requiredSkills.length === 0 && <div className="text-rose-600 text-xs mt-1">At least one required skill is needed</div>}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Preferred skills</label>
            <div className="grid sm:grid-cols-2 gap-2">
              {filtered.map((s: any) => {
                const selected = preferredSkills.includes(s.key);
                return (
                  <label key={"p-"+s.key} className={`inline-flex items-center gap-2 p-2 border rounded cursor-pointer ${selected ? "bg-violet-50 border-violet-400" : "bg-white"}`}>
                    <input
                      type="checkbox"
                      checked={selected}
                      onChange={() => togglePreferred(s.key)}
                      className="h-4 w-4"
                    />
                    <span className="text-sm">{s.name}</span>
                  </label>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Job Verification</label>
            <div className="space-y-2">
              <label className="inline-flex items-center gap-2">
                <input
                  type="radio"
                  value="false"
                  {...register("verifyJob")}
                  defaultChecked
                />
                <span className="text-sm">Post job without verification (Free)</span>
              </label>
              <label className="inline-flex items-center gap-2">
                <input
                  type="radio"
                  value="true"
                  {...register("verifyJob")}
                />
                <span className="text-sm">Verify job for better visibility (KES 100)</span>
              </label>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Verified jobs get a special badge and appear higher in search results.
            </p>
          </div>

          <div>
            <button
              type="submit"
              className="inline-flex items-center justify-center rounded-md px-4 py-2 bg-violet-600 text-white font-medium"
              disabled={busy}
              onClick={() => {
                // ensure arrays are synced right before submit
                setValue("requiredSkills", requiredSkills);
                setValue("preferredSkills", preferredSkills);
              }}
            >
              {busy ? "Creating…" : "Create Job"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
