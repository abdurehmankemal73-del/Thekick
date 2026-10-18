import { gunzipSync } from "node:zlib";
import PDFDocumentModule from "pdfkit";
import { PDF_FONT_PROGRAMS } from "@/lib/pdf-fonts";

/**
 * Tiny helper layer over pdfkit for the admin exports.
 *
 * pdfkit's built-in (standard 14) fonts only cover Latin text, so every document
 * registers the Noto faces embedded in `@/lib/pdf-fonts` and picks the right face
 * per text run. That way a student named in Amharic stays readable in the file
 * instead of turning into question marks.
 */

type FontAlias = keyof typeof PDF_FONT_PROGRAMS;

const fontCache = new Map<FontAlias, Buffer>();

function fontSource(alias: FontAlias) {
  let source = fontCache.get(alias);
  if (!source) {
    source = gunzipSync(Buffer.from(PDF_FONT_PROGRAMS[alias], "base64"));
    fontCache.set(alias, source);
  }
  return source;
}

// The published types describe the module value as an instance, so the
// constructor is re-declared here once for the whole app.
const PDFDocument = PDFDocumentModule as unknown as new (
  options?: PDFKit.PDFDocumentOptions,
) => PDFKit.PDFDocument;

export type PdfDocument = PDFKit.PDFDocument;

export type PdfTextStyle = {
  size?: number;
  bold?: boolean;
  color?: string;
};

const ETHIOPIC = /[\u1200-\u139f\u2d80-\u2ddf\uab01-\uab6f]/;

type TextRun = { text: string; font: FontAlias };

/** Splits text into runs that share one font face. */
export function splitText(text: string, bold = false): TextRun[] {
  const runs: TextRun[] = [];
  for (const char of text) {
    const font: FontAlias = ETHIOPIC.test(char) ? "ethiopic" : bold ? "sans-bold" : "sans";
    const previous = runs[runs.length - 1];
    // Whitespace borrows the face of the text around it, so a phrase written in
    // one script never changes look just because it contains a space.
    const resolved = previous && !ETHIOPIC.test(char) && /\s/.test(char) ? previous.font : font;
    if (previous?.font === resolved) previous.text += char;
    else runs.push({ text: char, font: resolved });
  }
  return runs;
}

/** Creates an A4 document with the club export defaults and the fonts registered. */
export function createPdfDocument(options?: PDFKit.PDFDocumentOptions): PdfDocument {
  const doc = new PDFDocument({
    size: "A4",
    layout: "portrait",
    margins: { top: 50, bottom: 60, left: 50, right: 50 },
    bufferPages: true,
    ...options,
  });

  for (const alias of Object.keys(PDF_FONT_PROGRAMS) as FontAlias[]) {
    doc.registerFont(alias, fontSource(alias));
  }
  doc.font("sans");
  return doc;
}

/** Width of a text string in points, honouring the per-run font faces. */
export function measureText(doc: PdfDocument, text: string, style: PdfTextStyle = {}) {
  const size = style.size ?? 10;
  let width = 0;
  for (const run of splitText(text, style.bold)) {
    doc.font(run.font).fontSize(size);
    width += doc.widthOfString(run.text);
  }
  return width;
}

/**
 * Draws a single line of text at an absolute position, returns its width.
 * The text is laid out run by run so mixed Latin/Amharic strings stay aligned.
 */
export function drawText(
  doc: PdfDocument,
  text: string,
  x: number,
  y: number,
  style: PdfTextStyle = {},
) {
  const size = style.size ?? 10;
  let cursor = x;
  for (const run of splitText(text, style.bold)) {
    doc.font(run.font).fontSize(size);
    if (style.color) doc.fillColor(style.color);
    doc.text(run.text, cursor, y, { lineBreak: false });
    cursor += doc.widthOfString(run.text);
  }
  return cursor - x;
}

/** Truncates text with an ellipsis so it fits inside `maxWidth` points. */
export function fitText(
  doc: PdfDocument,
  text: string,
  maxWidth: number,
  style: PdfTextStyle = {},
) {
  if (measureText(doc, text, style) <= maxWidth) return text;

  const ellipsis = "…";
  let fitted = text;
  while (fitted.length > 0 && measureText(doc, `${fitted}${ellipsis}`, style) > maxWidth) {
    fitted = fitted.slice(0, -1);
  }
  fitted = fitted.trimEnd();
  return fitted ? `${fitted}${ellipsis}` : "";
}

/** Ends the document and resolves with the generated PDF bytes. */
export function pdfToBuffer(doc: PdfDocument): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);
    doc.end();
  });
}
