import { errorResponse, json, HttpError } from "@/lib/http";
import { getSessionUser } from "@/lib/guards";
import { publicUser } from "@/lib/dtos";

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) {
      throw new HttpError(401, "You must be signed in");
    }
    return json({ user: publicUser(user) });
  } catch (error) {
    return errorResponse(error);
  }
}
