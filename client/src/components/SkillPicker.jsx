import { PREDEFINED_SKILLS } from "../constants/skills.js";

export default function SkillPicker({ selected = [], onChange }) {
  function toggle(skill) {
    if (selected.includes(skill)) {
      onChange(selected.filter((s) => s !== skill));
    } else {
      onChange([...selected, skill]);
    }
  }

  return (
    <div className="flex flex-wrap gap-2">
      {PREDEFINED_SKILLS.map((skill) => {
        const active = selected.includes(skill);
        return (
          <button
            type="button"
            key={skill}
            onClick={() => toggle(skill)}
            className={`rounded-full border px-3 py-1.5 text-sm transition ${
              active
                ? "border-indigo-600 bg-indigo-600 text-white"
                : "border-slate-200 bg-white text-slate-700 hover:border-indigo-300"
            }`}
          >
            {skill}
          </button>
        );
      })}
    </div>
  );
}
