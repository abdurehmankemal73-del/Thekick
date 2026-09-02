import { errorResponse, json, HttpError } from "@/lib/http";
import { requireAdmin } from "@/lib/guards";
import { adminStudent } from "@/lib/dtos";
import { approveStudent } from "@/lib/students";

export const maxDuration = 26;

type Ctx = { params: Promise<{ id: string }> };

export async function POST(_request: Request, ctx: Ctx) {
  try {
    const admin = await requireAdmin();
    const { id } = await ctx.params;
    const result = await approveStudent(admin, id);
    if (!result.student) {
      throw new HttpError(500, "Approval did not complete");
    }
    const emailSent = Boolean(result.emailSent ?? result.student.approvalEmailSentAt);
    return json({
      student: adminStudent(result.student),
      alreadyApproved: result.alreadyApproved,
      emailSent,
      emailError: result.emailError,
      previewUrl: result.previewUrl,
      message: result.alreadyApproved
        ? "This student was already approved."
        : result.previewUrl
          ? "Student approved. Open the email preview from the server log or the returned preview URL (development mailbox)."
          : emailSent
            ? "Student approved and notification email sent."
            : `Student approved. Notification email was not sent: ${result.emailError ?? "check SMTP_PASS."}`,
    });
  } catch (error) {
    return errorResponse(error);
  }
}
