import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { requirePendingStudent } from "@/lib/guards";
import { errorResponse, HttpError, json } from "@/lib/http";
import { deleteUploadedImage, readPaymentProof, saveUploadedImage } from "@/lib/uploads";
import { getClubSettings } from "@/lib/queries";

function imageResponse(file: { buffer: Buffer; contentType: string }) {
  return new NextResponse(new Uint8Array(file.buffer), {
    headers: {
      "Content-Type": file.contentType,
      "Cache-Control": "private, no-store",
    },
  });
}

export async function GET() {
  try {
    const user = await requirePendingStudent();
    if (!user.paymentProofFilename) {
      return NextResponse.json({ error: "No payment screenshot yet" }, { status: 404 });
    }
    const file = await readPaymentProof(user.paymentProofFilename);
    if (!file) {
      return NextResponse.json({ error: "No payment screenshot yet" }, { status: 404 });
    }
    return imageResponse(file);
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const settings = await getClubSettings();
    if (settings.paymentsEnabled === false) {
      throw new HttpError(403, "Payments are currently disabled by admin");
    }
    const user = await requirePendingStudent();
    const form = await request.formData();
    const file = form.get("screenshot");
    if (!(file instanceof File)) {
      throw new HttpError(400, "Choose a screenshot");
    }

    const url = await saveUploadedImage(file, "payments");
    const filename = url.split("/").pop();
    if (!filename) {
      throw new HttpError(500, "Could not save the screenshot");
    }

    if (user.paymentProofFilename && user.paymentProofFilename !== filename) {
      await deleteUploadedImage("payments", user.paymentProofFilename);
    }

    const submittedAt = new Date();
    await db
      .update(users)
      .set({
        paymentProofFilename: filename,
        paymentProofSubmittedAt: submittedAt,
      })
      .where(eq(users.id, user.id));

    return json({ ok: true, paymentProofSubmittedAt: submittedAt });
  } catch (error) {
    return errorResponse(error);
  }
}
