import { describe, expect, it } from "vitest";
import { applyGradeScores, calculateOverallScore, storedOrCalculatedOverall } from "@/lib/grades";

describe("calculateOverallScore", () => {
  it("averages the five skill scores and rounds to a whole number", () => {
    expect(
      calculateOverallScore({
        patternScore: 82,
        sparringScore: 78,
        kicksScore: 85,
        theoryScore: 80,
        disciplineScore: 90,
      }),
    ).toBe(83);
  });

  it("waits until all five skill scores are present", () => {
    expect(
      calculateOverallScore({
        patternScore: 100,
        sparringScore: 50,
        kicksScore: null,
        theoryScore: undefined,
        disciplineScore: null,
      }),
    ).toBeNull();
  });

  it("returns null when no skill scores are present", () => {
    expect(calculateOverallScore({})).toBeNull();
    expect(
      calculateOverallScore({
        patternScore: null,
        sparringScore: null,
        kicksScore: null,
        theoryScore: null,
        disciplineScore: null,
      }),
    ).toBeNull();
  });

  it("prefers the calculated average and falls back to a stored overall", () => {
    expect(
      storedOrCalculatedOverall({
        patternScore: 82,
        sparringScore: 78,
        kicksScore: 85,
        theoryScore: 80,
        disciplineScore: 90,
        overallScore: 99,
      }),
    ).toBe(83);
    expect(
      storedOrCalculatedOverall({
        patternScore: 100,
        sparringScore: 50,
        overallScore: 99,
      }),
    ).toBe(99);
    expect(storedOrCalculatedOverall({ overallScore: 88 })).toBe(88);
  });
});

describe("applyGradeScores", () => {
  it("fills missing patch fields from the existing grade and recalculates overall", () => {
    expect(
      applyGradeScores(
        {
          patternScore: 80,
          sparringScore: 80,
          kicksScore: 80,
          theoryScore: 80,
          disciplineScore: 80,
        },
        { patternScore: 100 },
      ),
    ).toEqual({
      patternScore: 100,
      sparringScore: 80,
      kicksScore: 80,
      theoryScore: 80,
      disciplineScore: 80,
      overallScore: 84,
    });
  });

  it("leaves overall empty until the existing grade has all five scores", () => {
    expect(
      applyGradeScores(
        {
          patternScore: 80,
          sparringScore: 80,
          kicksScore: null,
          theoryScore: 80,
          disciplineScore: 80,
        },
        { patternScore: 100 },
      ),
    ).toEqual({
      patternScore: 100,
      sparringScore: 80,
      kicksScore: null,
      theoryScore: 80,
      disciplineScore: 80,
      overallScore: null,
    });
  });
});
