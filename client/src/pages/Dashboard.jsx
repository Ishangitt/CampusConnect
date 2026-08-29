import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Bell, Clock, FolderKanban, Plus, Users } from "lucide-react";
import api from "../api/client.js";
import EmptyState from "../components/EmptyState.jsx";
import Loader from "../components/Loader.jsx";

const statusStyles = {
  pending: "bg-amber-50 text-amber-700 border-amber-200",
  accepted: "bg-emerald-50 text-emerald-700 border-emerald-200",
  rejected: "bg-rose-50 text-rose-700 border-rose-200",
};

const statusIcons = {
  pending: "⏳",
  accepted: "✓",
  rejected: "✕",
};

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  function load() {
    setLoading(true);
    setError("");
    return api
      .get("/users/me/dashboard")
      .then((res) => setData(res.data))
      .catch((err) => setError(err.response?.data?.message || "Failed to load dashboard"))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
  }, []);

  if (loading) return <Loader label="Loading dashboard..." />;

  if (error) {
    return (
      <div className="rounded-2xl border border-rose-200 bg-rose-50 p-8 text-center">
        <p className="text-lg font-semibold text-rose-800">Something went wrong</p>
        <p className="mt-1 text-sm text-rose-600">{error}</p>
        <p className="mt-1 text-xs text-rose-500">If your backend is waking up, wait a moment and retry.</p>
        <button
          onClick={load}
          className="mt-4 rounded-xl bg-indigo-600 px-5 py-2 text-sm font-medium text-white hover:bg-indigo-700 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!data?.user) return <Loader label="Loading dashboard..." />;

  const name = data.user.name || "Student";
  const totalPending = (data.createdProjects || []).reduce((sum, p) => sum + (p.pendingRequestsCount || 0), 0);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-indigo-600">Dashboard</p>
          <h1 className="mt-1 text-3xl font-semibold text-slate-900">Welcome back, {name} 👋</h1>
          <p className="mt-2 text-slate-500">Manage your projects and track your applications.</p>
        </div>
        <Link
          to="/projects/create"
          className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 transition-colors shadow-sm shadow-indigo-200"
        >
          <Plus size={16} /> New Project
        </Link>
      </div>

      {/* Metrics */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <div className="flex items-center gap-3 text-slate-500">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
              <FolderKanban size={18} />
            </div>
            <span className="text-sm font-medium">Projects Created</span>
          </div>
          <p className="mt-3 text-3xl font-bold text-slate-900">{data.metrics.projectsCreated}</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <div className="flex items-center gap-3 text-slate-500">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <Users size={18} />
            </div>
            <span className="text-sm font-medium">Active Memberships</span>
          </div>
          <p className="mt-3 text-3xl font-bold text-slate-900">{data.metrics.activeMemberships}</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <div className="flex items-center gap-3 text-slate-500">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
              <Bell size={18} />
            </div>
            <span className="text-sm font-medium">Pending Requests</span>
          </div>
          <p className="mt-3 text-3xl font-bold text-slate-900">{totalPending}</p>
        </div>
      </div>

      {/* My Created Projects */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
        <div className="flex items-center justify-between gap-4 mb-4">
          <h2 className="text-lg font-semibold">My Projects</h2>
          {data.createdProjects.length > 0 && (
            <Link
              to="/projects/create"
              className="flex items-center gap-1.5 text-sm font-medium text-indigo-600 hover:text-indigo-800"
            >
              <Plus size={14} /> Create new
            </Link>
          )}
        </div>

        {data.createdProjects.length === 0 ? (
          <EmptyState
            title="No projects yet"
            subtitle="Create a project and start building your dream team."
            action={
              <Link
                to="/projects/create"
                className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
              >
                <Plus size={14} /> Create your first project
              </Link>
            }
          />
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-slate-100 text-xs font-semibold uppercase tracking-wide text-slate-400">
                  <tr>
                    <th className="pb-3">Title</th>
                    <th className="pb-3">Category</th>
                    <th className="pb-3">Team</th>
                    <th className="pb-3">Status</th>
                    <th className="pb-3">Requests</th>
                    <th className="pb-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {data.createdProjects.map((project) => (
                    <tr key={project._id} className="border-t border-slate-100 hover:bg-slate-50/50">
                      <td className="py-3 pr-4">
                        <Link
                          to={`/projects/${project._id}`}
                          className="font-semibold text-slate-900 hover:text-indigo-600 transition-colors"
                        >
                          {project.title}
                        </Link>
                      </td>
                      <td className="py-3 pr-4">
                        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                          {project.category}
                        </span>
                      </td>
                      <td className="py-3 pr-4 text-slate-600">
                        {project.members.length}/{project.teamSize}
                      </td>
                      <td className="py-3 pr-4">
                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                            project.isOpen
                              ? "bg-emerald-50 text-emerald-700"
                              : "bg-slate-100 text-slate-500"
                          }`}
                        >
                          {project.isOpen ? "Open" : "Closed"}
                        </span>
                      </td>
                      <td className="py-3 pr-4">
                        {project.pendingRequestsCount > 0 ? (
                          <Link
                            to={`/projects/${project._id}/requests`}
                            className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700 hover:bg-amber-100 transition-colors"
                          >
                            <Bell size={11} />
                            {project.pendingRequestsCount} pending
                          </Link>
                        ) : (
                          <span className="text-xs text-slate-400">None</span>
                        )}
                      </td>
                      <td className="py-3">
                        <div className="flex gap-2">
                          <Link
                            to={`/projects/${project._id}`}
                            className="rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors"
                          >
                            View
                          </Link>
                          <Link
                            to={`/projects/${project._id}/requests`}
                            className="rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors"
                          >
                            Requests
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="grid gap-3 md:hidden">
              {data.createdProjects.map((project) => (
                <div key={project._id} className="rounded-xl border border-slate-200 p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <Link
                        to={`/projects/${project._id}`}
                        className="block truncate font-semibold text-slate-900 hover:text-indigo-600"
                      >
                        {project.title}
                      </Link>
                      <p className="mt-0.5 text-xs text-slate-500">
                        {project.category} · {project.members.length}/{project.teamSize} members
                      </p>
                    </div>
                    <span
                      className={`flex-shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${
                        project.isOpen ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      {project.isOpen ? "Open" : "Closed"}
                    </span>
                  </div>
                  <div className="mt-3 flex items-center gap-2">
                    {project.pendingRequestsCount > 0 && (
                      <Link
                        to={`/projects/${project._id}/requests`}
                        className="flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700"
                      >
                        <Bell size={11} />
                        {project.pendingRequestsCount} pending
                      </Link>
                    )}
                    <Link
                      to={`/projects/${project._id}/requests`}
                      className="ml-auto rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50"
                    >
                      Requests
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </section>

      {/* My Applications */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
        <h2 className="mb-4 text-lg font-semibold">My Applications</h2>

        {data.applications.length === 0 ? (
          <EmptyState
            title="No applications yet"
            subtitle="Browse open projects and request to join a team."
            action={
              <Link to="/projects" className="text-sm font-medium text-indigo-600 hover:text-indigo-800">
                Browse projects →
              </Link>
            }
          />
        ) : (
          <div className="space-y-2">
            {data.applications.map((app) => (
              <div
                key={app._id}
                className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 bg-slate-50/50 px-4 py-3"
              >
                <div className="min-w-0 flex-1">
                  {app.projectId ? (
                    <Link
                      to={`/projects/${app.projectId}`}
                      className="block truncate text-sm font-semibold text-slate-900 hover:text-indigo-600 transition-colors"
                    >
                      {app.projectTitle}
                    </Link>
                  ) : (
                    <p className="truncate text-sm font-semibold text-slate-400">{app.projectTitle}</p>
                  )}
                  <p className="mt-0.5 flex items-center gap-1 text-xs text-slate-400">
                    <Clock size={11} />
                    Applied {new Date(app.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                  </p>
                  {/* Re-apply hint for rejected */}
                  {app.status === "rejected" && app.projectId && (
                    <Link
                      to={`/projects/${app.projectId}`}
                      className="mt-1 inline-block text-xs font-medium text-indigo-500 hover:text-indigo-700"
                    >
                      View project to re-apply →
                    </Link>
                  )}
                </div>
                <span
                  className={`flex-shrink-0 rounded-full border px-3 py-1 text-xs font-semibold capitalize ${statusStyles[app.status]}`}
                >
                  {statusIcons[app.status]} {app.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
