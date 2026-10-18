import {
  ACCOUNT_STATUS_LABELS,
  ACCOUNT_STATUS_VISUALS,
  BELT_LABELS,
  BELT_LEVELS,
  BELT_VISUALS,
  CLUB,
} from "@/lib/constants";
import {
  createPdfDocument,
  drawText,
  fitText,
  measureText,
  pdfToBuffer,
  type PdfDocument,
  type PdfTextStyle,
} from "@/lib/pdf";
import { messages, type Locale, type MessageKey } from "@/i18n/messages";
import type { AccountStatus, BeltLevel } from "@/db/schema";

export type RosterStudent = {
  fullName: string;
  beltLevel: BeltLevel | null;
  accountStatus: AccountStatus;
};

export type RosterOptions = {
  /** Language of the belt labels and of the document itself. */
  locale?: Locale;
  generatedAt?: Date;
};

const PAGE_WIDTH = 595.28; // A4 portrait in points
const PAGE_HEIGHT = 841.89;
const MARGIN = 50;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;

const COL_NUMBER = 28;
const COL_NAME = 205;
const COL_BELT = 184;
const COL_STATUS = CONTENT_WIDTH - COL_NUMBER - COL_NAME - COL_BELT;

const ROW_HEIGHT = 22;
const TABLE_HEADER_HEIGHT = 24;
const CHIP = { width: 34, height: 13 };
const BODY_FONT_SIZE = 10;
/** Space kept at the bottom of every page for the footer line. */
const FOOTER_TOP = PAGE_HEIGHT - 47;

const COLORS = {
  ink: "#18181b",
  muted: "#71717a",
  faint: "#a1a1aa",
  line: "#e4e4e7",
  band: "#f4f4f5",
  headFill: "#27272a",
  accent: "#c8102e",
  white: "#ffffff",
};

/** Text baseline that visually centres `size` pt text inside a `box` pt tall row. */
function centeredTextY(boxTop: number, box: number, size: number) {
  return boxTop + (box - size) / 2 - 2;
}

/** White belt first, students without a belt last, then alphabetical by name. */
export function sortRosterStudents(students: RosterStudent[]): RosterStudent[] {
  const rank = (belt: BeltLevel | null) =>
    belt ? BELT_LEVELS.indexOf(belt) : Number.MAX_SAFE_INTEGER;
  return [...students].sort(
    (a, b) => rank(a.beltLevel) - rank(b.beltLevel) || a.fullName.localeCompare(b.fullName),
  );
}

function drawBeltChip(doc: PdfDocument, x: number, y: number, belt: BeltLevel | null) {
  if (!belt) {
    doc
      .rect(x, y, CHIP.width, CHIP.height)
      .fillAndStroke("#fafafa", COLORS.faint);
    return;
  }

  const visual = BELT_VISUALS[belt];
  doc
    .roundedRect(x, y, CHIP.width, CHIP.height, CHIP.height / 2)
    .fillAndStroke(visual.fill, visual.stroke);

  if (visual.stripe) {
    doc
      .rect(x + CHIP.width * 0.66, y + 1.5, CHIP.width * 0.18, CHIP.height - 3)
      .fill(visual.stripe);
  }
}

/** Draws an account-status pill (Active, Waiting, Stopped, …) sized to its label. */
function drawStatusPill(
  doc: PdfDocument,
  x: number,
  rowTop: number,
  status: AccountStatus,
  label: string,
  style: PdfTextStyle,
) {
  const pillY = rowTop + (ROW_HEIGHT - CHIP.height) / 2;
  const width = Math.min(
    COL_STATUS - 8,
    Math.max(46, measureText(doc, label, style) + 14),
  );
  const visual = ACCOUNT_STATUS_VISUALS[status];

  doc
    .roundedRect(x, pillY, width, CHIP.height, CHIP.height / 2)
    .fillAndStroke(visual.fill, visual.stroke);

  const textStyle = { ...style, color: visual.text };
  drawText(
    doc,
    fitText(doc, label, width - 10, textStyle),
    x + 7,
    centeredTextY(pillY, CHIP.height, style.size ?? BODY_FONT_SIZE),
    textStyle,
  );
}

/**
 * Builds the admin roster PDF: active students with their belt level and
 * account status, ordered by the caller, laid out as a table with a repeated
 * header. The caller is responsible for restricting the roster to active
 * students (the export route always filters to ACTIVE).
 */
export async function buildStudentRosterPdf(
  students: RosterStudent[],
  options: RosterOptions = {},
): Promise<Buffer> {
  const locale: Locale = options.locale ?? "en";
  const generatedAt = options.generatedAt ?? new Date();
  const t = (key: MessageKey) => messages[locale][key] ?? messages.en[key];

  const beltLabel = (belt: BeltLevel | null) => {
    if (!belt) return t("noBelt");
    const key = `belt_${belt}` as MessageKey;
    return messages[locale][key] ?? messages.en[key] ?? BELT_LABELS[belt];
  };

  const statusLabel = (status: AccountStatus) => {
    const key = `status_${status}` as MessageKey;
    return messages[locale][key] ?? messages.en[key] ?? ACCOUNT_STATUS_LABELS[status];
  };

  const doc = createPdfDocument({
    info: {
      Title: `${CLUB.shortName} — ${t("rosterTitle")}`,
      Author: CLUB.fullName,
      Subject: t("rosterSubtitle"),
      Creator: CLUB.shortName,
      CreationDate: generatedAt,
    },
  });

  const dateText = new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Africa/Addis_Ababa",
  }).format(generatedAt);

  let y = MARGIN;

  drawText(doc, CLUB.fullName, MARGIN, y, { size: 11, bold: true, color: COLORS.accent });
  y += 20;
  drawText(doc, t("rosterTitle"), MARGIN, y, { size: 20, bold: true, color: COLORS.ink });
  y += 27;
  drawText(doc, t("rosterSubtitle"), MARGIN, y, { size: 10, color: COLORS.muted });
  y += 16;
  const meta = [
    t("rosterCount").replace("{n}", String(students.length)),
    t("rosterActiveOnly"),
    t("rosterGenerated").replace("{date}", dateText),
  ].join("  ·  ");
  drawText(doc, meta, MARGIN, y, { size: 9, color: COLORS.muted });
  y += 24;

  const headerStyle: PdfTextStyle = { size: 9, bold: true, color: COLORS.white };
  const rowStyle: PdfTextStyle = { size: BODY_FONT_SIZE, color: COLORS.ink };

  const drawTableHeader = () => {
    doc.rect(MARGIN, y, CONTENT_WIDTH, TABLE_HEADER_HEIGHT).fill(COLORS.headFill);
    const textY = centeredTextY(y, TABLE_HEADER_HEIGHT, 9);
    drawText(doc, "#", MARGIN + 8, textY, headerStyle);
    drawText(doc, t("colStudentName"), MARGIN + COL_NUMBER + 8, textY, headerStyle);
    drawText(doc, t("colBeltLevel"), MARGIN + COL_NUMBER + COL_NAME + 8, textY, headerStyle);
    drawText(doc, t("colStatus"), MARGIN + COL_NUMBER + COL_NAME + COL_BELT + 8, textY, headerStyle);
    y += TABLE_HEADER_HEIGHT;
  };

  const fitsOnPage = () => y + ROW_HEIGHT <= PAGE_HEIGHT - MARGIN - 14;

  // Rules are painted after the row fill of the row they close: the zebra band
  // of the next row would otherwise cover the lower half of the hairline and
  // some separators disappear when the page is rendered.
  const drawRule = (atY: number) => {
    doc.moveTo(MARGIN, atY).lineTo(PAGE_WIDTH - MARGIN, atY).lineWidth(0.5).stroke(COLORS.line);
  };

  if (students.length === 0) {
    drawText(doc, t("noStudents"), MARGIN, y + 6, { size: 11, color: COLORS.muted });
    y += 30;
  } else {
    drawTableHeader();
    let rowsOnPage = 0;

    students.forEach((student, index) => {
      if (!fitsOnPage()) {
        doc.addPage();
        y = MARGIN;
        rowsOnPage = 0;
        drawTableHeader();
      }

      if (index % 2 === 1) doc.rect(MARGIN, y, CONTENT_WIDTH, ROW_HEIGHT).fill(COLORS.band);
      if (rowsOnPage > 0) drawRule(y);

      const textY = centeredTextY(y, ROW_HEIGHT, BODY_FONT_SIZE);
      const nameX = MARGIN + COL_NUMBER + 8;
      const beltX = MARGIN + COL_NUMBER + COL_NAME + 8;

      drawText(doc, String(index + 1), MARGIN + 8, textY, { ...rowStyle, color: COLORS.muted });
      drawText(doc, fitText(doc, student.fullName, COL_NAME - 16, rowStyle), nameX, textY, rowStyle);

      drawBeltChip(doc, beltX, y + (ROW_HEIGHT - CHIP.height) / 2, student.beltLevel);
      const labelStyle = { ...rowStyle, size: BODY_FONT_SIZE - 1 };
      drawText(
        doc,
        fitText(doc, beltLabel(student.beltLevel), COL_BELT - CHIP.width - 20, labelStyle),
        beltX + CHIP.width + 6,
        textY,
        labelStyle,
      );

      drawStatusPill(
        doc,
        MARGIN + COL_NUMBER + COL_NAME + COL_BELT + 8,
        y,
        student.accountStatus,
        statusLabel(student.accountStatus),
        labelStyle,
      );

      y += ROW_HEIGHT;
      rowsOnPage += 1;
    });

    drawRule(y);
  }

  const range = doc.bufferedPageRange();
  for (let page = range.start; page < range.start + range.count; page += 1) {
    doc.switchToPage(page);
    doc
      .moveTo(MARGIN, FOOTER_TOP)
      .lineTo(PAGE_WIDTH - MARGIN, FOOTER_TOP)
      .lineWidth(0.5)
      .stroke(COLORS.line);

    const footerStyle: PdfTextStyle = { size: 8, color: COLORS.muted };
    drawText(doc, `${CLUB.shortName} · ${t("rosterTitle")}`, MARGIN, FOOTER_TOP + 7, footerStyle);

    const current = page - range.start + 1;
    const label = t("pageOf")
      .replace("{current}", String(current))
      .replace("{total}", String(range.count));
    drawText(
      doc,
      label,
      PAGE_WIDTH - MARGIN - measureText(doc, label, footerStyle),
      FOOTER_TOP + 7,
      footerStyle,
    );
  }

  return pdfToBuffer(doc);
}
