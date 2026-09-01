import { errorResponse, json, HttpError } from "@/lib/http";
import { announcementWithMeta } from "@/lib/news";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_request: Request, ctx: Ctx) {
  try {
    const { id } = await ctx.params;
    const item = await announcementWithMeta(id);
    if (!item || item.status !== "PUBLISHED") {
      throw new HttpError(404, "News post not found");
    }
    return json({
      announcement: {
        id: item.id,
        title: item.title,
        content: item.content,
        imageUrl: item.imageUrl,
        publishedAt: item.publishedAt,
        createdAt: item.createdAt,
        authorName: item.authorName,
        extraImages: item.extraImages,
      },
    });
  } catch (error) {
    return errorResponse(error);
  }
}
