import { errorResponse, json } from "@/lib/http";
import { getClubSettings } from "@/lib/queries";

export async function GET() {
  try {
    const settings = await getClubSettings();
    return json({ settings });
  } catch (error) {
    return errorResponse(error);
  }
}
