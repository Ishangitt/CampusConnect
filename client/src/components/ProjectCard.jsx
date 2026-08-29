import { Link } from "react-router-dom";
import { Calendar, Users } from "lucide-react";
import SkillBadges from "./SkillBadges.jsx";

export default function ProjectCard({ project }) {
  const short =
    project.description.length > 110
      ? `${project.description.slice(0, 110)}...`
      : project.description;

  const spotsLeft = project.teamSize - (project.members?.length || 0);
  const deadlineDate = project.deadline
    ? new Date(project.deadline).toLocaleDateString("en-IN", { day: "numeric", month: "short" })
    : null;

  return (
    <Link
      to={`/projects/${project._id}`}
      className="card-hover group block rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
    >
      {/* Top row */}
      <div className="mb-3 flex items-start justify-between gap-3">
        <h3 className="text-base font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors leading-tight">
          {project.title}
        </h3>
        <div className="flex flex-shrink-0 flex-col items-end gap-1.5">
          <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">
            {project.category}
          </span>
          <span
            className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${
              project.isOpen
                ? "bg-emerald-50 text-emerald-700"
                : "bg-slate-100 text-slate-400"
            }`}
          >
            {project.isOpen ? "Open" : "Closed"}
          </span>
        </div>
      </div>

      {/* Description */}
      <p className="mb-3 text-sm leading-6 text-slate-500">{short}</p>

      {/* Skills */}
      <SkillBadges skills={project.requiredSkills} />

      {/* Footer meta */}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3 text-xs text-slate-400">
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1.5">
            <Users size={13} />
            {project.members?.length || 0}/{project.teamSize}
            {project.isOpen && spotsLeft > 0 && (
              <span className="text-indigo-500 font-medium">· {spotsLeft} open</span>
            )}
          </span>
          {deadlineDate && (
            <span className="inline-flex items-center gap-1.5">
              <Calendar size={13} />
              {deadlineDate}
            </span>
          )}
        </div>
        {project.creatorId?.name && (
          <span className="text-slate-400">by {project.creatorId.name}</span>
        )}
      </div>
    </Link>
  );
}
