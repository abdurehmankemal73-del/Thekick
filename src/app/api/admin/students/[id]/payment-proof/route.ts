import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { requireAdmin } from "@/lib/guards";
import { errorResponse } from "@/lib/http";
import { readPaymentProof } from "@/lib/uploads";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_request: Request, ctx: Ctx) {
  try {
    await requireAdmin();
    const { id } = await ctx.params;
    const [student] = await db
      .select({ filename: users.paymentProofFilename })
      .from(users)
      .where(eq(users.id, id))
      .limit(1);
    if (!student?.filename) {
      return NextResponse.json({ error: "No payment screenshot yet" }, { status: 404 });
    }
    const file = await readPaymentProof(student.filename);
    if (!file) {
      return NextResponse.json({ error: "No payment screenshot yet" }, { status: 404 });
    }
    return new NextResponse(new Uint8Array(file.buffer), {
      headers: {
        "Content-Type": file.contentType,
        "Cache-Control": "private, no-store",
      },
    });
  } catch (error) {
    return errorResponse(error);
  }
}
