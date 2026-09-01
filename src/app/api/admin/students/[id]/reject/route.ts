import { errorResponse, json } from "@/lib/http";
import { requireAdmin } from "@/lib/guards";
import { adminStudent } from "@/lib/dtos";
import { rejectStudent } from "@/lib/students";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(_request: Request, ctx: Ctx) {
  try {
    const admin = await requireAdmin();
    const { id } = await ctx.params;
    const student = await rejectStudent(admin, id);
    return json({
      student: adminStudent(student),
      message: "Registration rejected.",
    });
  } catch (error) {
    return errorResponse(error);
  }
}
