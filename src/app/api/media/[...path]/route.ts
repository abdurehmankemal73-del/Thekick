import { NextResponse } from "next/server";
import { readUploadedImage } from "@/lib/uploads";

type Ctx = { params: Promise<{ path: string[] }> };

export async function GET(_request: Request, ctx: Ctx) {
  const segments = (await ctx.params).path ?? [];
  const key = segments.join("/");
  const file = await readUploadedImage(key);
  if (!file) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return new NextResponse(new Uint8Array(file.buffer), {
    headers: {
      "Content-Type": file.contentType,
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
