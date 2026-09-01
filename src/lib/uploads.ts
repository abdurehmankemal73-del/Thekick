import { and, eq } from "drizzle-orm";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { db } from "@/db";
import { uploadedFiles } from "@/db/schema";
import { ALLOWED_IMAGE_TYPES, MAX_UPLOAD_BYTES } from "@/lib/constants";
import { HttpError } from "@/lib/http";

const MAGIC: Array<{ mime: (typeof ALLOWED_IMAGE_TYPES)[number]; test: (bytes: Buffer) => boolean; ext: string }> = [
  {
    mime: "image/jpeg",
    ext: "jpg",
    test: (bytes) => bytes.length > 2 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff,
  },
  {
    mime: "image/png",
    ext: "png",
    test: (bytes) =>
      bytes.length > 7 &&
      bytes[0] === 0x89 &&
      bytes[1] === 0x50 &&
      bytes[2] === 0x4e &&
      bytes[3] === 0x47,
  },
  {
    mime: "image/gif",
    ext: "gif",
    test: (bytes) => bytes.length > 5 && bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46,
  },
  {
    mime: "image/webp",
    ext: "webp",
    test: (bytes) =>
      bytes.length > 11 &&
      bytes.toString("ascii", 0, 4) === "RIFF" &&
      bytes.toString("ascii", 8, 12) === "WEBP",
  },
];

export async function saveUploadedImage(file: File, folder: "news") {
  if (!file || file.size === 0) {
    throw new HttpError(400, "Choose an image file");
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    throw new HttpError(400, "Image must be 5MB or smaller");
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const match = MAGIC.find((item) => item.test(buffer));
  if (!match) {
    throw new HttpError(400, "Only JPEG, PNG, WebP, and GIF images are allowed");
  }

  const filename = `${crypto.randomUUID()}.${match.ext}`;

  await db.insert(uploadedFiles).values({
    folder,
    filename,
    contentType: match.mime,
    data: buffer,
  });

  return `/api/media/${folder}/${filename}`;
}

export async function readUploadedImage(key: string) {
  const match = /^news\/([A-Za-z0-9._-]+)$/.exec(key);
  if (!match) return null;
  const filename = match[1];

  const [row] = await db
    .select({
      data: uploadedFiles.data,
      contentType: uploadedFiles.contentType,
    })
    .from(uploadedFiles)
    .where(and(eq(uploadedFiles.folder, "news"), eq(uploadedFiles.filename, filename)))
    .limit(1);

  if (row) {
    return { buffer: Buffer.from(row.data), contentType: row.contentType };
  }

  const filePath = path.join(process.cwd(), "public", "uploads", "news", filename);
  try {
    const buffer = await readFile(filePath);
    const ext = path.extname(filePath).toLowerCase();
    const contentType =
      ext === ".png"
        ? "image/png"
        : ext === ".gif"
          ? "image/gif"
          : ext === ".webp"
            ? "image/webp"
            : "image/jpeg";
    return { buffer, contentType };
  } catch {
    return null;
  }
}
