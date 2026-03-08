export async function logEvent(
  _actorUserId: string | null,
  _entityType: string,
  _entityId: string,
  _action: string,
  meta?: Record<string, unknown>
) {
  void meta;
}
