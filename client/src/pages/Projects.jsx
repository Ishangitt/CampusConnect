import { useEffect, useState } from "react";
import { Search } from "lucide-react";
import api from "../api/client.js";
import ProjectCard from "../components/ProjectCard.jsx";
import EmptyState from "../components/EmptyState.jsx";
import Loader from "../components/Loader.jsx";
import { PROJECT_CATEGORIES } from "../constants/skills.js";

export default function Projects() {
  const [projects, setProjects] = useState([]);
  const [q, setQ] = useState("");
  const [category, setCategory] = useState("All");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await api.get("/projects", { params: { q, category } });
        setProjects(res.data.projects);
        setError("");
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load projects");
      } finally {
        setLoading(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [q, category]);

  return (
    <div>
      <div className="mb-6">
        <p className="text-sm font-medium text-indigo-600">Browse</p>
        <h1 className="mt-1 text-3xl font-semibold">Open projects</h1>
        <p className="mt-2 text-slate-500">Search by title and filter by category. Only open teams are shown.</p>
      </div>

      <div className="mb-6 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-3 text-slate-400" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by title..."
            className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-sm outline-none focus:border-indigo-500"
          />
        </div>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-indigo-500"
        >
          <option>All</option>
          {PROJECT_CATEGORIES.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <Loader label="Loading projects..." />
      ) : error ? (
        <p className="rounded-xl bg-rose-50 p-4 text-rose-700">{error}</p>
      ) : projects.length === 0 ? (
        <EmptyState title="No open projects" subtitle="Try a different search or create a new project." />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {projects.map((project) => (
            <ProjectCard key={project._id} project={project} />
          ))}
        </div>
      )}
    </div>
  );
}
