import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Github, Linkedin, Pencil } from "lucide-react";
import api from "../api/client.js";
import Loader from "../components/Loader.jsx";
import SkillBadges from "../components/SkillBadges.jsx";

export default function Profile() {
  const [user, setUser] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get("/users/me")
      .then((res) => setUser(res.data.user))
      .catch((err) => setError(err.response?.data?.message || "Failed to load profile"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Loader label="Loading profile..." />;
  if (error) return <p className="rounded-xl bg-rose-50 p-4 text-rose-700">{error}</p>;

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-indigo-600">Profile</p>
          <h1 className="mt-1 text-3xl font-semibold">{user.name || "Unnamed student"}</h1>
          <p className="mt-1 text-slate-500">{user.email}</p>
        </div>
        <Link
          to="/profile/edit"
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium hover:bg-slate-50"
        >
          <Pencil size={16} /> Edit
        </Link>
      </div>

      <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="College" value={user.college} />
          <Field label="Branch" value={user.branch} />
          <Field label="Year" value={user.year} />
          <Field label="Interests" value={(user.interests || []).join(", ")} />
        </div>
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Bio</p>
          <p className="mt-1 text-slate-700">{user.bio || "No bio yet"}</p>
        </div>
        <div>
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-400">Skills</p>
          <SkillBadges skills={user.skills} />
        </div>
        <div className="flex gap-4 text-sm">
          {user.github ? (
            <a className="inline-flex items-center gap-2 text-indigo-600" href={user.github} target="_blank" rel="noreferrer">
              <Github size={16} /> GitHub
            </a>
          ) : null}
          {user.linkedin ? (
            <a className="inline-flex items-center gap-2 text-indigo-600" href={user.linkedin} target="_blank" rel="noreferrer">
              <Linkedin size={16} /> LinkedIn
            </a>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function Field({ label, value }) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-slate-400">{label}</p>
      <p className="mt-1 text-slate-800">{value || "—"}</p>
    </div>
  );
}
