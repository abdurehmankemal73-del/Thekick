import { auditLogs } from "@/db/schema";
import { db } from "@/db";

export async function writeAudit(input: {
  actorId?: string | null;
  action: string;
  targetType: string;
  targetId?: string | null;
  metadata?: Record<string, unknown>;
}) {
  await db.insert(auditLogs).values({
    actorId: input.actorId ?? null,
    action: input.action,
    targetType: input.targetType,
    targetId: input.targetId ?? null,
    metadata: input.metadata,
  });
}
