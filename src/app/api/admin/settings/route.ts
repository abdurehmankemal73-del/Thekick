import { eq } from "drizzle-orm";
import { db } from "@/db";
import { clubSettings } from "@/db/schema";
import { errorResponse, json, readJson } from "@/lib/http";
import { requireAdmin } from "@/lib/guards";
import { clubSettingsSchema } from "@/lib/validations";
import { getClubSettings } from "@/lib/queries";
import { writeAudit } from "@/lib/audit";

export async function GET() {
  try {
    await requireAdmin();
    const settings = await getClubSettings();
    return json({ settings });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PATCH(request: Request) {
  try {
    const admin = await requireAdmin();
    const body = await readJson<unknown>(request);
    const data = clubSettingsSchema.parse(body);

    const payload = {
      email: data.email,
      phone: data.phone,
      telegram: data.telegram,
      location: data.location,
      schedule: data.schedule,
      facebookUrl: data.facebookUrl || null,
      instagramUrl: data.instagramUrl || null,
      youtubeUrl: data.youtubeUrl || null,
      about: data.about,
      mission: data.mission,
      vision: data.vision,
      philosophy: data.philosophy,
      itfInfo: data.itfInfo,
      activities: data.activities,
      achievements: data.achievements,
      instructors: data.instructors ?? [],
    };

    await db
      .insert(clubSettings)
      .values({ id: "default", ...payload })
      .onConflictDoUpdate({
        target: clubSettings.id,
        set: payload,
      });

    const [settings] = await db
      .select()
      .from(clubSettings)
      .where(eq(clubSettings.id, "default"))
      .limit(1);

    await writeAudit({
      actorId: admin.id,
      action: "SETTINGS_UPDATE",
      targetType: "club_settings",
      targetId: "default",
    });

    return json({ settings });
  } catch (error) {
    return errorResponse(error);
  }
}
