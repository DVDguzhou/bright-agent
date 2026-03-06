import { prisma } from "./db";

export async function logEvent(
  actorUserId: string | null,
  entityType: string,
  entityId: string,
  action: string,
  meta?: Record<string, unknown>
) {
  await prisma.event.create({
    data: {
      actorUserId,
      entityType,
      entityId,
      action,
      meta: meta ? JSON.parse(JSON.stringify(meta)) : undefined,
    },
  });
}
