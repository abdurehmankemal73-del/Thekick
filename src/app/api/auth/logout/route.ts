import { signOut } from "@/auth";
import { json, errorResponse } from "@/lib/http";

export async function POST() {
  try {
    await signOut({ redirect: false });
    return json({ ok: true });
  } catch (error) {
    return errorResponse(error);
  }
}
