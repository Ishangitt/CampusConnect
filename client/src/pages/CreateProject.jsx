import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/client.js";
import SkillPicker from "../components/SkillPicker.jsx";
import { PROJECT_CATEGORIES } from "../constants/skills.js";

export default function CreateProject() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    title: "",
    description: "",
    category: PROJECT_CATEGORIES[0],
    requiredSkills: [],
    teamSize: 4,
    deadline: "",
    whatsappNumber: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function update(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function onSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const res = await api.post("/projects", form);
      navigate(`/projects/${res.data.project._id}`);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create project");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-3xl font-semibold">Create project</h1>
      <p className="mt-2 text-slate-500">You are added as the first member automatically.</p>

      <form onSubmit={onSubmit} className="mt-6 space-y-5 rounded-2xl border border-slate-200 bg-white p-6">
        {error ? <p className="rounded-xl bg-rose-50 p-3 text-sm text-rose-700">{error}</p> : null}
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium">Project title</span>
          <input
            required
            className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-indigo-500"
            value={form.title}
            onChange={(e) => update("title", e.target.value)}
          />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium">Description</span>
          <textarea
            required
            rows={5}
            className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-indigo-500"
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
        <div className="grid gap-4 sm:grid-cols-2">
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
          <span className="mb-1.5 block text-sm font-medium">WhatsApp number <span className="font-normal text-slate-400">(visible to team members only)</span></span>
          <input
            type="tel"
            placeholder="e.g. +91 98765 43210"
            className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-indigo-500"
            value={form.whatsappNumber}
            onChange={(e) => update("whatsappNumber", e.target.value)}
          />
        </label>
        <button
          type="submit"
          disabled={saving}
          className="rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60"
        >
          {saving ? "Creating..." : "Create project"}
        </button>
      </form>
    </div>
  );
}
