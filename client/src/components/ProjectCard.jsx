import { Link } from "react-router-dom";
import { Users } from "lucide-react";
import SkillBadges from "./SkillBadges.jsx";

export default function ProjectCard({ project }) {
  const short =
    project.description.length > 120
      ? `${project.description.slice(0, 120)}...`
      : project.description;

  return (
    <Link
      to={`/projects/${project._id}`}
      className="block rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
    >
      <div className="mb-3 flex items-start justify-between gap-3">
        <h3 className="text-lg font-semibold text-slate-900">{project.title}</h3>
        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
          {project.category}
        </span>
      </div>
      <p className="mb-4 text-sm leading-6 text-slate-600">{short}</p>
      <SkillBadges skills={project.requiredSkills} />
      <div className="mt-4 flex items-center gap-2 text-sm text-slate-500">
        <Users size={16} />
        {project.members?.length || 0} / {project.teamSize} members
      </div>
    </Link>
  );
}
