export const GRADE_SCORE_KEYS = [
  "patternScore",
  "sparringScore",
  "kicksScore",
  "theoryScore",
  "disciplineScore",
] as const;

export type GradeScoreKey = (typeof GRADE_SCORE_KEYS)[number];

export type ComponentScores = Partial<Record<GradeScoreKey, number | null>>;

export type ResolvedGradeScores = Record<GradeScoreKey, number | null> & {
  overallScore: number | null;
};

export function calculateOverallScore(scores: ComponentScores): number | null {
  const values = GRADE_SCORE_KEYS.map((key) => scores[key]);
  if (!values.every((value): value is number => typeof value === "number" && Number.isFinite(value))) {
    return null;
  }
  return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
}

export function storedOrCalculatedOverall(
  grade: ComponentScores & { overallScore?: number | null },
): number | null {
  return calculateOverallScore(grade) ?? grade.overallScore ?? null;
}

export function applyGradeScores(
  existing: ComponentScores,
  incoming: ComponentScores,
): ResolvedGradeScores {
  const patternScore =
    incoming.patternScore !== undefined ? incoming.patternScore ?? null : existing.patternScore ?? null;
  const sparringScore =
    incoming.sparringScore !== undefined ? incoming.sparringScore ?? null : existing.sparringScore ?? null;
  const kicksScore =
    incoming.kicksScore !== undefined ? incoming.kicksScore ?? null : existing.kicksScore ?? null;
  const theoryScore =
    incoming.theoryScore !== undefined ? incoming.theoryScore ?? null : existing.theoryScore ?? null;
  const disciplineScore =
    incoming.disciplineScore !== undefined
      ? incoming.disciplineScore ?? null
      : existing.disciplineScore ?? null;

  return {
    patternScore,
    sparringScore,
    kicksScore,
    theoryScore,
    disciplineScore,
    overallScore: calculateOverallScore({
      patternScore,
      sparringScore,
      kicksScore,
      theoryScore,
      disciplineScore,
    }),
  };
}
