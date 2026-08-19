export default function SkillBadges({ skills = [], tone = "indigo" }) {
  const tones = {
    indigo: "bg-indigo-50 text-indigo-700",
    emerald: "bg-emerald-50 text-emerald-700",
    slate: "bg-slate-100 text-slate-700",
    rose: "bg-rose-50 text-rose-700",
  };

  if (!skills.length) {
    return <p className="text-sm text-slate-500">None</p>;
  }

  return (
    <div className="flex flex-wrap gap-2">
      {skills.map((skill) => (
        <span
          key={skill}
          className={`rounded-full px-2.5 py-1 text-xs font-medium ${tones[tone] || tones.indigo}`}
        >
          {skill}
        </span>
      ))}
    </div>
  );
}
