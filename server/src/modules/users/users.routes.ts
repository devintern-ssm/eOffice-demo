import { Router } from 'express';
import { asyncHandler } from '../../utils/http.js';
import { authenticate } from '../../middleware/auth.js';
import { prisma } from '../../prisma.js';

export const usersRouter = Router();

usersRouter.use(authenticate);

// List active users (for recipient / reviewer selection).
usersRouter.get('/', asyncHandler(async (req, res) => {
  const section = req.query.section as string | undefined;
  const users = await prisma.user.findMany({
    where: { active: true, ...(section ? { section } : {}) },
    select: { id: true, name: true, designation: true, section: true, role: true },
    orderBy: [{ section: 'asc' }, { name: 'asc' }],
  });
  res.json({ users });
}));
