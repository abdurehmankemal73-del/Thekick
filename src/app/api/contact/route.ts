import { db } from "@/db";
import { contactMessages } from "@/db/schema";
import { errorResponse, json, readJson } from "@/lib/http";
import { contactSchema } from "@/lib/validations";

export async function POST(request: Request) {
  try {
    const body = await readJson<unknown>(request);
    const data = contactSchema.parse(body);
    await db.insert(contactMessages).values({
      fullName: data.fullName,
      email: data.email.toLowerCase(),
      message: data.message,
    });
    return json({ message: "Thank you. We have received your message." }, 201);
  } catch (error) {
    return errorResponse(error);
  }
}
