import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { FolderKanban, Plus, Users } from "lucide-react";
import api from "../api/client.js";
import EmptyState from "../components/EmptyState.jsx";
import Loader from "../components/Loader.jsx";

const statusStyles = {
  pending: "bg-amber-50 text-amber-700",
  accepted: "bg-emerald-50 text-emerald-700",
  rejected: "bg-rose-50 text-rose-700",
};

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await api.get("/users/me/dashboard");
        if (!cancelled) setData(res.data);
      } catch (err) {
        if (!cancelled) setError(err.response?.data?.message || "Failed to load dashboard");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) return <Loader label="Loading dashboard..." />;
  if (error) {
    return (
      <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-center">
        <p className="font-medium text-rose-800">{error}</p>
        <p className="mt-1 text-xs text-rose-600">If your backend is waking up, please wait a moment and try again.</p>
        <button
          onClick={() => {
            setLoading(true);
            setError("");
            api.get("/users/me/dashboard")
              .then((res) => setData(res.data))
              .catch((err) => setError(err.response?.data?.message || "Failed to load dashboard"))
              .finally(() => setLoading(false));
          }}
          className="mt-4 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
        >
          Retry
        </button>
      </div>
    );
  }
  if (!data || !data.user) return <Loader label="Loading dashboard..." />;

  const name = data.user.name || "Student";

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-indigo-600">Dashboard</p>
          <h1 className="mt-1 text-3xl font-semibold text-slate-900">Welcome, {name}</h1>
          <p className="mt-2 text-slate-500">Track the projects you created and the teams you applied to.</p>
        </div>
        <Link
          to="/projects/create"
          className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-700"
        >
          <Plus size={16} /> Create project
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <div className="flex items-center gap-3 text-slate-500">
            <FolderKanban size={18} /> Projects Created
          </div>
          <p className="mt-3 text-3xl font-semibold">{data.metrics.projectsCreated}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <div className="flex items-center gap-3 text-slate-500">
            <Users size={18} /> Active Memberships
          </div>
          <p className="mt-3 text-3xl font-semibold">{data.metrics.activeMemberships}</p>
        </div>
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-5">
        <h2 className="text-lg font-semibold">My Created Projects</h2>
        {data.createdProjects.length === 0 ? (
          <div className="mt-4">
            <EmptyState
              title="No projects yet"
              subtitle="Create a project to start building a team."
              action={
                <Link to="/projects/create" className="text-sm font-medium text-indigo-600">
                  Create your first project
                </Link>
              }
            />
          </div>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-slate-500">
                <tr>
                  <th className="pb-3 font-medium">Title</th>
                  <th className="pb-3 font-medium">Category</th>
                  <th className="pb-3 font-medium">Team</th>
                  <th className="pb-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {data.createdProjects.map((project) => (
                  <tr key={project._id} className="border-t border-slate-100">
                    <td className="py-3">
                      <Link to={`/projects/${project._id}`} className="font-medium text-indigo-600">
                        {project.title}
                      </Link>
                    </td>
                    <td className="py-3 text-slate-600">{project.category}</td>
                    <td className="py-3 text-slate-600">
                      {project.members.length}/{project.teamSize}
                    </td>
                    <td className="py-3">
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                          project.isOpen ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {project.isOpen ? "Open" : "Closed"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5">
        <h2 className="text-lg font-semibold">My Applications</h2>
        {data.applications.length === 0 ? (
          <div className="mt-4">
            <EmptyState
              title="No applications yet"
              subtitle="Browse open projects and request to join a team."
              action={
                <Link to="/projects" className="text-sm font-medium text-indigo-600">
                  Browse projects
                </Link>
              }
            />
          </div>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-slate-500">
                <tr>
                  <th className="pb-3 font-medium">Project Title</th>
                  <th className="pb-3 font-medium">Application Status</th>
                </tr>
              </thead>
              <tbody>
                {data.applications.map((app) => (
                  <tr key={app._id} className="border-t border-slate-100">
                    <td className="py-3">
                      {app.projectId ? (
                        <Link to={`/projects/${app.projectId}`} className="font-medium text-indigo-600">
                          {app.projectTitle}
                        </Link>
                      ) : (
                        app.projectTitle
                      )}
                    </td>
                    <td className="py-3">
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-medium capitalize ${
                          statusStyles[app.status]
                        }`}
                      >
                        {app.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
