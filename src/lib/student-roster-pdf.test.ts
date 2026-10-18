import { writeFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { ACCOUNT_STATUSES, BELT_LEVELS } from "@/lib/constants";
import { splitText } from "@/lib/pdf";
import {
  buildStudentRosterPdf,
  sortRosterStudents,
  type RosterStudent,
} from "@/lib/student-roster-pdf";
import type { BeltLevel } from "@/db/schema";

function roster(count: number): RosterStudent[] {
  return Array.from({ length: count }, (_, index) => ({
    fullName: `Student Number ${index + 1}`,
    beltLevel: BELT_LEVELS[index % BELT_LEVELS.length] as BeltLevel,
    accountStatus: ACCOUNT_STATUSES[index % ACCOUNT_STATUSES.length],
  }));
}

/** Writes a copy of the document when PDF_SAMPLE=/path/prefix is set, for eyeballing. */
function maybeSave(pdf: Buffer, name: string) {
  if (process.env.PDF_SAMPLE) writeFileSync(`${process.env.PDF_SAMPLE}-${name}.pdf`, pdf);
}

describe("splitText", () => {
  it("keeps Latin text in the Latin face", () => {
    expect(splitText("Amina Hassan")).toEqual([{ text: "Amina Hassan", font: "sans" }]);
    expect(splitText("Amina", true)).toEqual([{ text: "Amina", font: "sans-bold" }]);
  });

  it("switches to the Ethiopic face for Amharic characters", () => {
    expect(splitText("አበበ ካድመ")).toEqual([{ text: "አበበ ካድመ", font: "ethiopic" }]);
  });

  it("splits mixed scripts into separate runs", () => {
    expect(splitText("Abel አበበ 12")).toEqual([
      { text: "Abel ", font: "sans" },
      { text: "አበበ ", font: "ethiopic" },
      { text: "12", font: "sans" },
    ]);
  });
});

describe("sortRosterStudents", () => {
  it("orders by belt rank and puts students without a belt last", () => {
    const sorted = sortRosterStudents([
      { fullName: "Zoe", beltLevel: null, accountStatus: "ACTIVE" },
      { fullName: "Bekele", beltLevel: "RED", accountStatus: "ACTIVE" },
      { fullName: "Aster", beltLevel: "WHITE", accountStatus: "ACTIVE" },
      { fullName: "Abel", beltLevel: "WHITE", accountStatus: "ACTIVE" },
    ]);

    expect(sorted.map((student) => student.fullName)).toEqual(["Abel", "Aster", "Bekele", "Zoe"]);
    expect(sorted[3].beltLevel).toBeNull();
  });
});

describe("buildStudentRosterPdf", () => {
  it("renders a roster that spans several pages", async () => {
    const pdf = await buildStudentRosterPdf(roster(120), {
      locale: "en",
      generatedAt: new Date("2026-10-18T09:30:00Z"),
    });

    expect(pdf.subarray(0, 5).toString()).toBe("%PDF-");
    expect(pdf.toString("latin1").trimEnd().endsWith("%%EOF")).toBe(true);
    expect(pdf.length).toBeGreaterThan(10_000);
    // more than one page means the content streams grew past a single page
    expect(pdf.toString("latin1").match(/\/Type \/Page[^s]/g)?.length).toBeGreaterThan(1);
    maybeSave(pdf, "pages");
  });

  it("renders Amharic names with an embedded Unicode font", async () => {
    const pdf = await buildStudentRosterPdf(
      [
        { fullName: "አበበ ከበደ", beltLevel: "RED", accountStatus: "ACTIVE" },
        { fullName: "Saada Mowlid", beltLevel: "WHITE_YELLOW_TAG", accountStatus: "PENDING" },
        { fullName: "ጌታችን ብርሃን", beltLevel: null, accountStatus: "SUSPENDED" },
      ],
      { locale: "am", generatedAt: new Date("2026-10-18T09:30:00Z") },
    );

    expect(pdf.subarray(0, 5).toString()).toBe("%PDF-");
    expect(pdf.length).toBeGreaterThan(10_000);
    expect(pdf.toString("latin1")).toContain("FontFile2");
    maybeSave(pdf, "amharic");
  });

  it("renders an empty roster instead of failing", async () => {
    const pdf = await buildStudentRosterPdf([], { locale: "en" });

    expect(pdf.subarray(0, 5).toString()).toBe("%PDF-");
    expect(pdf.length).toBeGreaterThan(5_000);
    maybeSave(pdf, "empty");
  });
});
