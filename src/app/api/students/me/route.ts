import { errorResponse, json } from "@/lib/http";
import { requireStudent } from "@/lib/guards";
import { publicUser } from "@/lib/dtos";

export async function GET() {
  try {
    const user = await requireStudent();
    return json({ user: publicUser(user) });
  } catch (error) {
    return errorResponse(error);
  }
}
