import type { Prisma } from '@prisma/client';

export type NotificationType =
  | 'OPEN_NOTE' | 'SIGN' | 'RETURN' | 'FINALIZE' | 'HANDOVER' | 'ASSIGN' | 'COMMENT';

/**
 * Build the args for a `notification.create`. Works with both the callback-form
 * (`tx.notification.create(...)`) and the array-form (`prisma.notification.create(...)`)
 * transactions used across the services.
 */
export function notifyData(
  userId: string,
  type: NotificationType,
  message: string,
  fileId?: string | null,
): Prisma.NotificationCreateArgs {
  return { data: { userId, type, message, fileId: fileId ?? null } };
}
