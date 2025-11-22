import { useForm } from "react-hook-form";
import { createJob } from "../services/jobs.service";
import { listSkills } from "../services/skills.service";
import { useNavigate } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import React from "react";

type Form = {
  title: string;
  description: string;
  budget: number;
  currency?: string;
  category?: string;
  requiredSkills: string[];
  preferredSkills: string[];
  verifyJob: boolean | string;
};

// Simple Rich Text Editor Component
const RichTextEditor = ({ value, onChange, placeholder }: any) => {
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [isList, setIsList] = useState(false);

  const handleFormat = (type: string) => {
    let newValue = value || '';
    
    switch (type) {
      case 'bold':
        if (isBold) {
          newValue = newValue.replace(/\*\*(.*?)\*\*/g, '$1');
        } else {
          newValue = newValue + ' **bold text** ';
        }
        setIsBold(!isBold);
        break;
      case 'italic':
        if (isItalic) {
          newValue = newValue.replace(/\*(.*?)\*/g, '$1');
        } else {
          newValue = newValue + ' *italic text* ';
        }
        setIsItalic(!isItalic);
        break;
      case 'list':
        if (isList) {
          newValue = newValue.replace(/- /g, '');
        } else {
          newValue = newValue + '\n- List item 1\n- List item 2\n- List item 3';
        }
        setIsList(!isList);
        break;
      case 'code':
        newValue = newValue + '\n```\n// Your code here\n```\n';
        break;
      case 'heading':
        newValue = newValue + '\n## Heading\n';
        break;
    }
    
    onChange(newValue);
  };

  return (
    <div className="border border-slate-300 rounded-2xl overflow-hidden focus-within:border-violet-500 focus-within:ring-2 focus-within:ring-violet-200 transition-all duration-200">
      {/* Toolbar */}
      <div className="flex items-center gap-1 p-3 border-b border-slate-200 bg-slate-50">
        <button
          type="button"
          onClick={() => handleFormat('bold')}
          className="p-2 rounded-lg hover:bg-slate-200 transition-colors"
          title="Bold"
        >
          <span className="font-bold text-slate-700">B</span>
        </button>
        <button
          type="button"
          onClick={() => handleFormat('italic')}
          className="p-2 rounded-lg hover:bg-slate-200 transition-colors"
          title="Italic"
        >
          <span className="italic text-slate-700">I</span>
        </button>
        <button
          type="button"
          onClick={() => handleFormat('list')}
          className="p-2 rounded-lg hover:bg-slate-200 transition-colors"
          title="Bullet List"
        >
          <span className="text-slate-700">• List</span>
        </button>
        <button
          type="button"
          onClick={() => handleFormat('heading')}
          className="p-2 rounded-lg hover:bg-slate-200 transition-colors"
          title="Heading"
        >
          <span className="text-slate-700">H</span>
        </button>
        <button
          type="button"
          onClick={() => handleFormat('code')}
          className="p-2 rounded-lg hover:bg-slate-200 transition-colors"
          title="Code Block"
        >
          <span className="text-slate-700">{`</>`}</span>
        </button>
        <div className="flex-1 text-right">
          <span className="text-xs text-slate-500">Supports Markdown</span>
        </div>
      </div>
      
      {/* Editor */}
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-4 py-4 min-h-48 resize-none border-none focus:ring-0 text-slate-700"
      />
      
      {/* Preview */}
      {value && (
        <div className="border-t border-slate-200 p-4 bg-slate-50">
          <div className="text-xs text-slate-500 mb-2 font-medium">Preview:</div>
          <div className="text-sm text-slate-600 prose prose-sm max-w-none">
            {value.split('\n').map((line: string, index: number) => {
              if (line.startsWith('## ')) {
                return <h3 key={index} className="text-lg font-bold text-slate-800 mt-2 mb-1">{line.replace('## ', '')}</h3>;
              }
              if (line.startsWith('- ')) {
                return <li key={index} className="ml-4">{line.replace('- ', '')}</li>;
              }
              if (line.startsWith('```')) {
                return <pre key={index} className="bg-slate-800 text-slate-100 p-2 rounded-lg text-xs mt-2"><code>{line.replace('```', '')}</code></pre>;
              }
              if (line.includes('**') && line.includes('**')) {
                const parts = line.split('**');
                return (
                  <p key={index} className="mt-1">
                    {parts.map((part, i) => 
                      i % 2 === 1 ? <strong key={i} className="font-bold">{part}</strong> : part
                    )}
                  </p>
                );
              }
              if (line.includes('*') && line.includes('*') && !line.startsWith('*')) {
                const parts = line.split('*');
                return (
                  <p key={index} className="mt-1">
                    {parts.map((part, i) => 
                      i % 2 === 1 ? <em key={i} className="italic">{part}</em> : part
                    )}
                  </p>
                );
              }
              return <p key={index} className="mt-1">{line}</p>;
            })}
          </div>
        </div>
      )}
    </div>
  );
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

  const watchedCategory = watch("category");
  const description = watch("description");

  useEffect(() => {
    (async () => {
      try {
        const s = await listSkills();
        const list = (s?.skills ?? s) as any[] ?? [];
        setSkillsCatalog(list);

        const cats = Array.from(new Set(list.map((it: any) => (it?.category ?? "Other"))));

        if (cats.length > 0) {
          const current = (watchedCategory ?? "").toString();
          if (!current) {
            setValue("category", cats[0]);
          }
        }
      } catch (e) {
        console.error("Could not load skills", e);
      }
    })();
  }, [setValue]);

  useEffect(() => { setValue("requiredSkills", requiredSkills); }, [requiredSkills, setValue]);
  useEffect(() => { setValue("preferredSkills", preferredSkills); }, [preferredSkills, setValue]);

  const categories = useMemo(() => {
    return Array.from(new Set(skillsCatalog.map(s => s?.category ?? "Other")));
  }, [skillsCatalog]);

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
    const verify = data.verifyJob === true || data.verifyJob === "true";

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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-violet-600 to-purple-600 p-8 text-white">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center">
                <span className="text-2xl">📝</span>
              </div>
              <div>
                <h1 className="text-3xl font-bold">Post a New Job</h1>
                <p className="text-violet-100 mt-2">Find the perfect worker for your project</p>
              </div>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="p-8 space-y-8">
            {/* Category & Title */}
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-3">Job Category</label>
                <select
                  className="w-full px-4 py-4 rounded-2xl border border-slate-300 focus:border-violet-500 focus:ring-2 focus:ring-violet-200 transition-all duration-200 bg-white"
                  {...register("category", { required: true })}
                >
                  <option value="">Choose a category</option>
                  {categories.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                {errors.category && <div className="text-rose-600 text-sm mt-2">Category is required</div>}
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-3">Job Title</label>
                <input 
                  className="w-full px-4 py-4 rounded-2xl border border-slate-300 focus:border-violet-500 focus:ring-2 focus:ring-violet-200 transition-all duration-200" 
                  {...register("title", { required: true, minLength: 3 })} 
                  placeholder="e.g., Senior React Developer"
                />
                {errors.title && <div className="text-rose-600 text-sm mt-2">Title is required (min 3 chars)</div>}
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-3">Job Description</label>
              <RichTextEditor
                value={description}
                onChange={(value: string) => setValue("description", value)}
                placeholder="Describe the job in detail... You can use the toolbar above to format your text with headings, lists, bold, italic, and code blocks."
              />
              {errors.description && <div className="text-rose-600 text-sm mt-2">Description is required</div>}
            </div>

            {/* Budget */}
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-3">Budget (KES)</label>
                <input 
                  type="number" 
                  className="w-full px-4 py-4 rounded-2xl border border-slate-300 focus:border-violet-500 focus:ring-2 focus:ring-violet-200 transition-all duration-200" 
                  {...register("budget", { required: true, valueAsNumber: true })} 
                  placeholder="5000"
                />
                {errors.budget && <div className="text-rose-600 text-sm mt-2">Budget is required</div>}
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-3">Currency</label>
                <input 
                  className="w-full px-4 py-4 rounded-2xl border border-slate-300 focus:border-violet-500 focus:ring-2 focus:ring-violet-200 transition-all duration-200" 
                  {...register("currency")} 
                  defaultValue="KES" 
                />
              </div>
            </div>

            {/* Required Skills */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <label className="block text-sm font-semibold text-slate-700">Required Skills (select up to 5)</label>
                <div className="text-sm text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
                  Selected: <span className="font-bold text-violet-600">{requiredSkills.length}</span>/5
                </div>
              </div>

              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {filtered.length === 0 ? (
                  <div className="text-sm text-slate-500 p-4 bg-slate-50 rounded-2xl text-center">
                    No skills in this category.
                  </div>
                ) : (
                  filtered.map((s: any) => {
                    const selected = requiredSkills.includes(s.key);
                    return (
                      <label 
                        key={s.key} 
                        className={`flex items-center gap-3 p-4 rounded-2xl border-2 cursor-pointer transition-all duration-200 ${
                          selected 
                            ? "bg-gradient-to-r from-violet-50 to-purple-50 border-violet-400 shadow-lg" 
                            : "bg-white border-slate-200 hover:border-violet-300 hover:shadow-md"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={selected}
                          onChange={() => toggleRequired(s.key)}
                          className="h-5 w-5 text-violet-600 rounded-lg focus:ring-violet-500"
                        />
                        <div className="flex-1">
                          <span className={`font-medium ${selected ? "text-violet-700" : "text-slate-700"}`}>
                            {s.name}
                          </span>
                          {s.category && (
                            <div className="text-xs text-slate-500 mt-1">{s.category}</div>
                          )}
                        </div>
                      </label>
                    );
                  })
                )}
              </div>
              {requiredSkills.length === 0 && <div className="text-rose-600 text-sm mt-3">At least one required skill is needed</div>}
            </div>

            {/* Preferred Skills */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-4">Preferred Skills (optional)</label>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {filtered.map((s: any) => {
                  const selected = preferredSkills.includes(s.key);
                  return (
                    <label 
                      key={"p-"+s.key} 
                      className={`flex items-center gap-3 p-4 rounded-2xl border-2 cursor-pointer transition-all duration-200 ${
                        selected 
                          ? "bg-gradient-to-r from-blue-50 to-cyan-50 border-blue-400 shadow-lg" 
                          : "bg-white border-slate-200 hover:border-blue-300 hover:shadow-md"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={selected}
                        onChange={() => togglePreferred(s.key)}
                        className="h-5 w-5 text-blue-600 rounded-lg focus:ring-blue-500"
                      />
                      <div className="flex-1">
                        <span className={`font-medium ${selected ? "text-blue-700" : "text-slate-700"}`}>
                          {s.name}
                        </span>
                        {s.category && (
                          <div className="text-xs text-slate-500 mt-1">{s.category}</div>
                        )}
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Job Verification */}
            <div className="bg-gradient-to-r from-slate-50 to-slate-100 p-6 rounded-2xl border border-slate-200">
              <label className="block text-sm font-semibold text-slate-700 mb-4">Job Verification</label>
              <div className="space-y-4">
                <label className="flex items-start gap-4 p-4 bg-white rounded-2xl border-2 border-slate-200 hover:border-slate-300 cursor-pointer transition-all duration-200">
                  <input
                    type="radio"
                    value="false"
                    {...register("verifyJob")}
                    defaultChecked
                    className="mt-1 h-5 w-5 text-violet-600"
                  />
                  <div className="flex-1">
                    <div className="font-medium text-slate-800">Post job without verification</div>
                    <div className="text-sm text-slate-600 mt-1">Free - Standard visibility</div>
                  </div>
                  <div className="text-2xl font-bold text-slate-400">FREE</div>
                </label>
                
                <label className="flex items-start gap-4 p-4 bg-gradient-to-r from-amber-50 to-orange-50 rounded-2xl border-2 border-amber-200 hover:border-amber-300 cursor-pointer transition-all duration-200">
                  <input
                    type="radio"
                    value="true"
                    {...register("verifyJob")}
                    className="mt-1 h-5 w-5 text-amber-600"
                  />
                  <div className="flex-1">
                    <div className="font-medium text-slate-800">Verify job for better visibility</div>
                    <div className="text-sm text-slate-600 mt-1">Verified badge and premium placement in search results</div>
                  </div>
                  <div className="text-2xl font-bold text-amber-600">KES 100</div>
                </label>
              </div>
              <p className="text-sm text-slate-500 mt-4">
                Verified jobs get a special badge and appear higher in search results, attracting more qualified applicants.
              </p>
            </div>

            {/* Submit Button */}
            <div className="flex items-center justify-between pt-6 border-t border-slate-200">
              <button
                type="button"
                onClick={() => nav("/jobs")}
                className="px-8 py-4 text-slate-600 font-semibold rounded-2xl border border-slate-300 hover:bg-slate-50 transition-all duration-200"
              >
                Cancel
              </button>
              
              <button
                type="submit"
                className="px-8 py-4 bg-gradient-to-r from-violet-600 to-purple-600 text-white font-semibold rounded-2xl shadow-2xl hover:shadow-3xl transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                disabled={busy}
                onClick={() => {
                  setValue("requiredSkills", requiredSkills);
                  setValue("preferredSkills", preferredSkills);
                }}
              >
                {busy ? (
                  <div className="flex items-center gap-3">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Creating Job...
                  </div>
                ) : (
                  "Create Job →"
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}