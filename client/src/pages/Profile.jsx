import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ExternalLink, FolderKanban, Github, Linkedin, Pencil, Users } from "lucide-react";
import api from "../api/client.js";
import Loader from "../components/Loader.jsx";
import SkillBadges from "../components/SkillBadges.jsx";

export default function Profile() {
  const [user, setUser] = useState(null);
  const [metrics, setMetrics] = useState(null);
  const [createdProjects, setCreatedProjects] = useState([]);
  const [memberships, setMemberships] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.get("/users/me"), api.get("/users/me/dashboard")])
      .then(([meRes, dashRes]) => {
        setUser(meRes.data.user);
        setMetrics(dashRes.data.metrics);
        setCreatedProjects(dashRes.data.createdProjects || []);
        // Memberships = accepted applications where project still exists
        const accepted = (dashRes.data.applications || []).filter(
          (a) => a.status === "accepted" && a.projectId
        );
        setMemberships(accepted);
      })
      .catch((err) => setError(err.response?.data?.message || "Failed to load profile"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Loader label="Loading profile..." />;
  if (error) return <p className="rounded-xl bg-rose-50 p-4 text-rose-700">{error}</p>;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-indigo-600">Profile</p>
          <h1 className="mt-1 text-3xl font-semibold">{user.name || "Unnamed student"}</h1>
          <p className="mt-1 text-slate-500">{user.email}</p>
        </div>
        <Link
          to="/profile/edit"
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium hover:bg-slate-50 transition-colors"
        >
          <Pencil size={16} /> Edit
        </Link>
      </div>

      {/* Info card */}
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
            <a
              className="inline-flex items-center gap-2 text-indigo-600 hover:text-indigo-800"
              href={user.github}
              target="_blank"
              rel="noreferrer"
            >
              <Github size={16} /> GitHub <ExternalLink size={12} />
            </a>
          ) : null}
          {user.linkedin ? (
            <a
              className="inline-flex items-center gap-2 text-indigo-600 hover:text-indigo-800"
              href={user.linkedin}
              target="_blank"
              rel="noreferrer"
            >
              <Linkedin size={16} /> LinkedIn <ExternalLink size={12} />
            </a>
          ) : null}
        </div>
      </div>

      {/* Stats row */}
      {metrics && (
        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <div className="flex items-center gap-2 text-slate-500">
              <FolderKanban size={16} className="text-indigo-500" />
              <span className="text-sm font-medium">Projects Created</span>
            </div>
            <p className="mt-2 text-3xl font-bold text-slate-900">{metrics.projectsCreated}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <div className="flex items-center gap-2 text-slate-500">
              <Users size={16} className="text-emerald-500" />
              <span className="text-sm font-medium">Active Memberships</span>
            </div>
            <p className="mt-2 text-3xl font-bold text-slate-900">{metrics.activeMemberships}</p>
          </div>
        </div>
      )}

      {/* My Projects */}
      {createdProjects.length > 0 && (
        <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
          <h2 className="mb-4 text-lg font-semibold">My Projects</h2>
          <ul className="space-y-2">
            {createdProjects.map((p) => (
              <li key={p._id}>
                <Link
                  to={`/projects/${p._id}`}
                  className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 hover:border-indigo-200 hover:bg-indigo-50/30 transition-colors"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium text-slate-900">{p.title}</p>
                    <p className="mt-0.5 text-xs text-slate-500">
                      {p.category} · {p.members.length}/{p.teamSize} members
                    </p>
                  </div>
                  <span
                    className={`ml-3 flex-shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${
                      p.isOpen ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    {p.isOpen ? "Open" : "Closed"}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Teams I'm in */}
      {memberships.length > 0 && (
        <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
          <h2 className="mb-4 text-lg font-semibold">Teams I'm In</h2>
          <ul className="space-y-2">
            {memberships.map((app) => (
              <li key={app._id}>
                <Link
                  to={`/projects/${app.projectId}`}
                  className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 hover:border-emerald-200 hover:bg-emerald-50/30 transition-colors"
                >
                  <p className="truncate font-medium text-slate-900">{app.projectTitle}</p>
                  <span className="ml-3 flex-shrink-0 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
                    Member
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
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
