import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight, Plus, Search, SlidersHorizontal } from "lucide-react";
import api from "../api/client.js";
import ProjectCard from "../components/ProjectCard.jsx";
import EmptyState from "../components/EmptyState.jsx";
import Loader from "../components/Loader.jsx";
import { PROJECT_CATEGORIES } from "../constants/skills.js";

const PAGE_SIZE = 12;

export default function Projects() {
  const [projects, setProjects] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [q, setQ] = useState("");
  const [category, setCategory] = useState("All");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    // Reset to page 1 whenever search/filter changes
    setPage(1);
  }, [q, category]);

  useEffect(() => {
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await api.get("/projects", { params: { q, category, page, limit: PAGE_SIZE } });
        setProjects(res.data.projects);
        setPagination(res.data.pagination);
        setError("");
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load projects");
      } finally {
        setLoading(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [q, category, page]);

  return (
    <div>
      {/* Page header */}
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-indigo-600">Browse</p>
          <h1 className="mt-1 text-3xl font-semibold text-slate-900">Open Projects</h1>
          <p className="mt-2 text-slate-500">
            Find a team that fits your skills and interests.
          </p>
        </div>
        <Link
          to="/projects/create"
          className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 transition-colors shadow-sm shadow-indigo-200"
        >
          <Plus size={16} /> Create Project
        </Link>
      </div>

      {/* Search + Filter bar */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row">
        {/* Search input */}
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by title or description..."
            className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all"
          />
        </div>

        {/* Category filter */}
        <div className="relative">
          <SlidersHorizontal size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="appearance-none rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-8 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all cursor-pointer"
          >
            <option>All</option>
            {PROJECT_CATEGORIES.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Results */}
      {loading ? (
        <Loader label="Loading projects..." />
      ) : error ? (
        <div className="rounded-xl bg-rose-50 p-6 text-center">
          <p className="text-rose-700">{error}</p>
        </div>
      ) : projects.length === 0 ? (
        <EmptyState
          title="No open projects found"
          subtitle={q || category !== "All" ? "Try adjusting your search or filter." : "Be the first to create one!"}
          action={
            q || category !== "All" ? (
              <button
                onClick={() => { setQ(""); setCategory("All"); }}
                className="text-sm font-medium text-indigo-600 hover:text-indigo-800"
              >
                Clear filters
              </button>
            ) : (
              <Link to="/projects/create" className="text-sm font-medium text-indigo-600 hover:text-indigo-800">
                Create a project →
              </Link>
            )
          }
        />
      ) : (
        <>
          <p className="mb-4 text-sm text-slate-400">
            {pagination
              ? `Showing ${(pagination.page - 1) * pagination.limit + 1}–${Math.min(pagination.page * pagination.limit, pagination.total)} of ${pagination.total} project${pagination.total !== 1 ? "s" : ""}`
              : `${projects.length} project${projects.length !== 1 ? "s" : ""}`}
            {category !== "All" ? ` in "${category}"` : ""}
            {q ? ` matching "${q}"` : ""}
          </p>
          <div className="grid gap-4 md:grid-cols-2">
            {projects.map((project) => (
              <ProjectCard key={project._id} project={project} />
            ))}
          </div>

          {/* Pagination controls */}
          {pagination && pagination.totalPages > 1 && (
            <div className="mt-8 flex items-center justify-center gap-3">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={!pagination.hasPrev}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft size={16} /> Previous
              </button>
              <span className="text-sm text-slate-500">
                Page {pagination.page} of {pagination.totalPages}
              </span>
              <button
                onClick={() => setPage((p) => p + 1)}
                disabled={!pagination.hasNext}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Next <ChevronRight size={16} />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
