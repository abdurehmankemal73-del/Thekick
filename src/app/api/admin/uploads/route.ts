import { errorResponse, json, HttpError } from "@/lib/http";
import { requireAdmin } from "@/lib/guards";
import { saveUploadedImage } from "@/lib/uploads";
import { writeAudit } from "@/lib/audit";

export async function POST(request: Request) {
  try {
    const admin = await requireAdmin();
    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File)) {
      throw new HttpError(400, "Choose an image file");
    }
    const url = await saveUploadedImage(file, "news");
    await writeAudit({
      actorId: admin.id,
      action: "IMAGE_UPLOAD",
      targetType: "upload",
      metadata: { url },
    });
    return json({ url }, 201);
  } catch (error) {
    return errorResponse(error);
  }
}
