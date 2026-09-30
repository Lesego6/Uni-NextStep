function getPoints(mark) {
  if (mark >= 80) return 7;
  if (mark >= 70) return 6;
  if (mark >= 60) return 5;
  if (mark >= 50) return 4;
  if (mark >= 40) return 3;
  if (mark >= 30) return 2;
  if (mark > 0) return 1;
  return 0;
}

function calculateAps(subjects) {
  const validSubjects = subjects
    .filter((subject) => {
      const mark = Number(subject?.percentage);
      const isValidMark = Number.isFinite(mark) && mark >= 0 && mark <= 100;
      const isLifeOrientation = typeof subject?.name === 'string' && /life orientation/i.test(subject.name);
      return isValidMark && !isLifeOrientation;
    })
    .map((subject) => ({
      name: String(subject.name).trim(),
      percentage: Number(subject.percentage)
    }))
    .sort((a, b) => b.percentage - a.percentage)
    .slice(0, 6);

  const total = validSubjects.reduce((sum, subject) => sum + getPoints(subject.percentage), 0);
  return Math.min(total, 42);
}

module.exports = { calculateAps };
