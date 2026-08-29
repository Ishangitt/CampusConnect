import { Link } from "react-router-dom";
import { Calendar, Users } from "lucide-react";
import SkillBadges from "./SkillBadges.jsx";

export default function ProjectCard({ project }) {
  const short =
    project.description.length > 110
      ? `${project.description.slice(0, 110)}...`
      : project.description;

  const memberCount = project.members?.length || 0;
  const teamSize = project.teamSize || 0;
  const spotsLeft = teamSize - memberCount;
  const fillPercent = teamSize > 0 ? Math.round((memberCount / teamSize) * 100) : 0;

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

      {/* Team size progress */}
      <div className="mt-4 rounded-xl border border-slate-100 bg-slate-50 px-3 py-2.5">
        <div className="flex items-center justify-between mb-1.5">
          <span className="flex items-center gap-1.5 text-xs font-medium text-slate-600">
            <Users size={13} className="text-indigo-400" />
            {memberCount} of {teamSize} members
          </span>
          {project.isOpen && spotsLeft > 0 ? (
            <span className="text-[11px] font-semibold text-indigo-600">
              {spotsLeft} spot{spotsLeft !== 1 ? "s" : ""} left
            </span>
          ) : !project.isOpen ? (
            <span className="text-[11px] font-semibold text-slate-400">Team full</span>
          ) : null}
        </div>
        {/* Progress bar */}
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-200">
          <div
            className={`h-full rounded-full transition-all ${
              fillPercent >= 100
                ? "bg-slate-400"
                : fillPercent >= 70
                ? "bg-amber-400"
                : "bg-indigo-500"
            }`}
            style={{ width: `${fillPercent}%` }}
          />
        </div>
      </div>

      {/* Footer meta */}
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400">
        {deadlineDate && (
          <span className="inline-flex items-center gap-1.5">
            <Calendar size={13} />
            Due {deadlineDate}
          </span>
        )}
        {project.creatorId?.name && (
          <span className="text-slate-400">by {project.creatorId.name}</span>
        )}
      </div>
    </Link>
  );
}
