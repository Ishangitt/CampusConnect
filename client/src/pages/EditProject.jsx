import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import api from "../api/client.js";
import SkillPicker from "../components/SkillPicker.jsx";
import Loader from "../components/Loader.jsx";
import { PROJECT_CATEGORIES } from "../constants/skills.js";

export default function EditProject() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    title: "",
    description: "",
    category: PROJECT_CATEGORIES[0],
    requiredSkills: [],
    teamSize: 4,
    existingMembersCount: 0,
    deadline: "",
    whatsappNumber: "",
    isOpen: true,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .get(`/projects/${id}`)
      .then((res) => {
        const p = res.data.project;
        setForm({
          title: p.title || "",
          description: p.description || "",
          category: p.category || PROJECT_CATEGORIES[0],
          requiredSkills: p.requiredSkills || [],
          teamSize: p.teamSize || 4,
          existingMembersCount: p.existingMembersCount || 0,
          deadline: p.deadline ? new Date(p.deadline).toISOString().split("T")[0] : "",
          whatsappNumber: p.whatsappNumber || "",
          isOpen: p.isOpen ?? true,
        });
      })
      .catch((err) => setError(err.response?.data?.message || "Failed to load project"))
      .finally(() => setLoading(false));
  }, [id]);

  function update(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function onSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      await api.put(`/projects/${id}`, form);
      navigate(`/projects/${id}`);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update project");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <Loader label="Loading project..." />;

  return (
    <div className="mx-auto max-w-3xl">
      <Link
        to={`/projects/${id}`}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-indigo-600 hover:text-indigo-800"
      >
        <ArrowLeft size={14} /> Back to project
      </Link>
      <h1 className="mt-4 text-3xl font-semibold">Edit project</h1>
      <p className="mt-2 text-slate-500">Make changes to your project details below.</p>

      <form onSubmit={onSubmit} className="mt-6 space-y-5 rounded-2xl border border-slate-200 bg-white p-6">
        {error ? <p className="rounded-xl bg-rose-50 p-3 text-sm text-rose-700">{error}</p> : null}

        <label className="block">
          <span className="mb-1.5 block text-sm font-medium">Project title</span>
          <input
            required
            className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
            value={form.title}
            onChange={(e) => update("title", e.target.value)}
          />
        </label>

        <label className="block">
          <span className="mb-1.5 block text-sm font-medium">Description</span>
          <textarea
            required
            rows={5}
            className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
            value={form.description}
            onChange={(e) => update("description", e.target.value)}
          />
        </label>

        <label className="block">
          <span className="mb-1.5 block text-sm font-medium">Category</span>
          <select
            className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-indigo-500"
            value={form.category}
            onChange={(e) => update("category", e.target.value)}
          >
            {PROJECT_CATEGORIES.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </label>

        <div>
          <p className="mb-2 text-sm font-medium">Required skills</p>
          <SkillPicker
            selected={form.requiredSkills}
            onChange={(requiredSkills) => update("requiredSkills", requiredSkills)}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium">Team size</span>
            <input
              required
              type="number"
              min={2}
              className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-indigo-500"
              value={form.teamSize}
              onChange={(e) => update("teamSize", e.target.value)}
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium">
              Already have
              <span className="ml-1 font-normal text-slate-400">(offline members)</span>
            </span>
            <input
              type="number"
              min={0}
              className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-indigo-500"
              value={form.existingMembersCount}
              onChange={(e) => update("existingMembersCount", e.target.value)}
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium">Deadline</span>
            <input
              required
              type="date"
              className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-indigo-500"
              value={form.deadline}
              onChange={(e) => update("deadline", e.target.value)}
            />
          </label>
        </div>

        <label className="block">
          <span className="mb-1.5 block text-sm font-medium">
            WhatsApp number{" "}
            <span className="font-normal text-slate-400">(visible to team members only)</span>
          </span>
          <input
            type="tel"
            placeholder="e.g. +91 98765 43210"
            className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-indigo-500"
            value={form.whatsappNumber}
            onChange={(e) => update("whatsappNumber", e.target.value)}
          />
        </label>

        {/* Open/Closed toggle */}
        <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
          <input
            id="isOpen"
            type="checkbox"
            className="h-4 w-4 accent-indigo-600"
            checked={form.isOpen}
            onChange={(e) => update("isOpen", e.target.checked)}
          />
          <label htmlFor="isOpen" className="cursor-pointer text-sm font-medium text-slate-700">
            Open to new applications
          </label>
        </div>

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={saving}
            className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60 transition-colors"
          >
            {saving ? "Saving..." : "Save changes"}
          </button>
          <Link
            to={`/projects/${id}`}
            className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
