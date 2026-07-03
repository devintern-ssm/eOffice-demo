import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler, ApiError } from '../../utils/http.js';
import { authenticate } from '../../middleware/auth.js';
import { ROLES } from '../../utils/domain.js';
import { login, registerUser } from './auth.service.js';
import { prisma } from '../../prisma.js';
import { toPublicUser } from './auth.service.js';

export const authRouter = Router();

const registerSchema = z.object({
  name: z.string().min(1),
  designation: z.string().min(1),
  section: z.string().min(1),
  role: z.enum(ROLES),
  email: z.string().email(),
  password: z.string().min(6),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

// NOTE (Phase 0): registration is open for development convenience.
// Lock this behind ADMIN in the RBAC hardening slice (1.10).
authRouter.post('/register', asyncHandler(async (req, res) => {
  const input = registerSchema.parse(req.body);
  const user = await registerUser(input);
  res.status(201).json({ user });
}));

authRouter.post('/login', asyncHandler(async (req, res) => {
  const { email, password } = loginSchema.parse(req.body);
  const result = await login(email, password);
  res.json(result);
}));

authRouter.get('/me', authenticate, asyncHandler(async (req, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.user!.id } });
  if (!user) throw ApiError.notFound('User not found');
  res.json({ user: toPublicUser(user) });
}));
