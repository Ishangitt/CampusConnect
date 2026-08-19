export function getSkillMatch(studentSkills = [], requiredSkills = []) {
  if (!requiredSkills.length) {
    return { percent: 100, matched: [], missing: [] };
  }

  const studentSet = new Set(studentSkills);
  const matched = requiredSkills.filter((skill) => studentSet.has(skill));
  const missing = requiredSkills.filter((skill) => !studentSet.has(skill));
  const percent = Math.round((matched.length / requiredSkills.length) * 100);

  return { percent, matched, missing };
}
