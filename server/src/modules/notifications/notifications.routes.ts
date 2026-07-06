import { Router } from 'express';
import { asyncHandler } from '../../utils/http.js';
import { authenticate } from '../../middleware/auth.js';
import { prisma } from '../../prisma.js';

export const notificationsRouter = Router();

notificationsRouter.use(authenticate);

/** My recent notifications + unread count (drives the header bell). */
notificationsRouter.get('/', asyncHandler(async (req, res) => {
  const userId = req.user!.id;
  const [notifications, unreadCount] = await Promise.all([
    prisma.notification.findMany({ where: { userId }, orderBy: { createdAt: 'desc' }, take: 30 }),
    prisma.notification.count({ where: { userId, read: false } }),
  ]);
  res.json({
    notifications: notifications.map((n) => ({
      id: n.id, type: n.type, message: n.message, fileId: n.fileId, read: n.read, date: n.createdAt,
    })),
    unreadCount,
  });
}));

/** Mark all my notifications read. */
notificationsRouter.post('/read', asyncHandler(async (req, res) => {
  await prisma.notification.updateMany({ where: { userId: req.user!.id, read: false }, data: { read: true } });
  res.json({ unreadCount: 0 });
}));

/** Mark one notification read (scoped to the owner). */
notificationsRouter.post('/:id/read', asyncHandler(async (req, res) => {
  await prisma.notification.updateMany({ where: { id: req.params.id, userId: req.user!.id }, data: { read: true } });
  const unreadCount = await prisma.notification.count({ where: { userId: req.user!.id, read: false } });
  res.json({ unreadCount });
}));
