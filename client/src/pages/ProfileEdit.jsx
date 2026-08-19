import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/client.js";
import SkillPicker from "../components/SkillPicker.jsx";
import Loader from "../components/Loader.jsx";
import { YEAR_OPTIONS } from "../constants/skills.js";

const emptyForm = {
  name: "",
  college: "",
  branch: "",
  year: "",
  bio: "",
  skills: [],
  interests: "",
  github: "",
  linkedin: "",
};

export default function ProfileEdit() {
  const navigate = useNavigate();
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .get("/users/me")
      .then((res) => {
        const user = res.data.user;
        setForm({
          name: user.name || "",
          college: user.college || "",
          branch: user.branch || "",
          year: user.year || "",
          bio: user.bio || "",
          skills: user.skills || [],
          interests: (user.interests || []).join(", "),
          github: user.github || "",
          linkedin: user.linkedin || "",
        });
      })
      .catch((err) => setError(err.response?.data?.message || "Failed to load profile"))
      .finally(() => setLoading(false));
  }, []);

  function update(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function onSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      await api.put("/users/profile", {
        ...form,
        interests: form.interests,
      });
      navigate("/profile");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to save profile");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <Loader label="Loading profile..." />;

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-3xl font-semibold">Edit profile</h1>
      <p className="mt-2 text-slate-500">Skills must be chosen from the list so matching stays accurate.</p>

      <form onSubmit={onSubmit} className="mt-6 space-y-5 rounded-2xl border border-slate-200 bg-white p-6">
        {error ? <p className="rounded-xl bg-rose-50 p-3 text-sm text-rose-700">{error}</p> : null}
        <Input label="Name" value={form.name} onChange={(v) => update("name", v)} />
        <Input label="College" value={form.college} onChange={(v) => update("college", v)} />
        <Input label="Branch" value={form.branch} onChange={(v) => update("branch", v)} />
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-slate-700">Year</span>
          <select
            className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-indigo-500"
            value={form.year}
            onChange={(e) => update("year", e.target.value)}
          >
            <option value="">Select year</option>
            {YEAR_OPTIONS.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-slate-700">Bio</span>
          <textarea
            rows={4}
            className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-indigo-500"
            value={form.bio}
            onChange={(e) => update("bio", e.target.value)}
          />
        </label>
        <div>
          <p className="mb-2 text-sm font-medium text-slate-700">Skills</p>
          <SkillPicker selected={form.skills} onChange={(skills) => update("skills", skills)} />
        </div>
        <Input
          label="Interests (comma separated)"
          value={form.interests}
          onChange={(v) => update("interests", v)}
          placeholder="Hackathons, Open Source"
        />
        <Input label="GitHub URL" value={form.github} onChange={(v) => update("github", v)} />
        <Input label="LinkedIn URL" value={form.linkedin} onChange={(v) => update("linkedin", v)} />
        <button
          type="submit"
          disabled={saving}
          className="rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60"
        >
          {saving ? "Saving..." : "Save profile"}
        </button>
      </form>
    </div>
  );
}

function Input({ label, value, onChange, placeholder }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-slate-700">{label}</span>
      <input
        className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-indigo-500"
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  );
}
