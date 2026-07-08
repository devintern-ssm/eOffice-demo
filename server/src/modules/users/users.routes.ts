import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler, ApiError } from '../../utils/http.js';
import { authenticate, requireRole } from '../../middleware/auth.js';
import { ROLES } from '../../utils/domain.js';
import { prisma } from '../../prisma.js';
import { registerUser, hashPassword } from '../auth/auth.service.js';

export const usersRouter = Router();

usersRouter.use(authenticate);

const adminUserSelect = {
  id: true, name: true, designation: true, section: true, role: true, email: true, active: true, createdAt: true,
} as const;

// List ACTIVE users (for recipient / reviewer selection) — available to any signed-in user.
usersRouter.get('/', asyncHandler(async (req, res) => {
  const section = req.query.section as string | undefined;
  const users = await prisma.user.findMany({
    where: { active: true, ...(section ? { section } : {}) },
    select: { id: true, name: true, designation: true, section: true, role: true },
    orderBy: [{ section: 'asc' }, { name: 'asc' }],
  });
  res.json({ users });
}));

// --- Admin (super-admin) user management ---
const requireAdmin = requireRole('ADMIN');

usersRouter.get('/all', requireAdmin, asyncHandler(async (_req, res) => {
  const users = await prisma.user.findMany({
    orderBy: [{ active: 'desc' }, { section: 'asc' }, { name: 'asc' }],
    select: adminUserSelect,
  });
  res.json({ users });
}));

const createUserSchema = z.object({
  name: z.string().min(1),
  designation: z.string().min(1),
  section: z.string().min(1),
  role: z.enum(ROLES),
  email: z.string().email(),
  password: z.string().min(6),
});

usersRouter.post('/', requireAdmin, asyncHandler(async (req, res) => {
  const input = createUserSchema.parse(req.body);
  const user = await registerUser(input);
  res.status(201).json({ user });
}));

const updateUserSchema = z.object({
  role: z.enum(ROLES).optional(),
  section: z.string().min(1).optional(),
  designation: z.string().min(1).optional(),
  active: z.boolean().optional(),
});

usersRouter.patch('/:id', requireAdmin, asyncHandler(async (req, res) => {
  const input = updateUserSchema.parse(req.body);
  // Guard against an admin locking themselves out.
  if (req.params.id === req.user!.id && (input.active === false || (input.role && input.role !== 'ADMIN'))) {
    throw ApiError.badRequest('You cannot deactivate or demote your own admin account');
  }
  const exists = await prisma.user.findUnique({ where: { id: req.params.id } });
  if (!exists) throw ApiError.notFound('User not found');
  const user = await prisma.user.update({ where: { id: req.params.id }, data: input, select: adminUserSelect });
  res.json({ user });
}));

usersRouter.post('/:id/reset-password', requireAdmin, asyncHandler(async (req, res) => {
  const { password } = z.object({ password: z.string().min(6) }).parse(req.body);
  const exists = await prisma.user.findUnique({ where: { id: req.params.id } });
  if (!exists) throw ApiError.notFound('User not found');
  await prisma.user.update({ where: { id: req.params.id }, data: { passwordHash: await hashPassword(password) } });
  res.json({ ok: true });
}));
