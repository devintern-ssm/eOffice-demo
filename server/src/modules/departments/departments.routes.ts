import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler, ApiError } from '../../utils/http.js';
import { authenticate, requireRole } from '../../middleware/auth.js';
import { prisma } from '../../prisma.js';

export const departmentsRouter = Router();

departmentsRouter.use(authenticate);

// Active departments — for pickers; any signed-in user.
departmentsRouter.get('/', asyncHandler(async (_req, res) => {
  const departments = await prisma.department.findMany({
    where: { active: true }, orderBy: { name: 'asc' }, select: { id: true, name: true, code: true },
  });
  res.json({ departments });
}));

const requireAdmin = requireRole('ADMIN');

// All departments incl. inactive (admin management).
departmentsRouter.get('/all', requireAdmin, asyncHandler(async (_req, res) => {
  const departments = await prisma.department.findMany({ orderBy: [{ active: 'desc' }, { name: 'asc' }] });
  res.json({ departments });
}));

departmentsRouter.post('/', requireAdmin, asyncHandler(async (req, res) => {
  const input = z.object({ name: z.string().min(1), code: z.string().min(1).max(10) }).parse(req.body);
  const name = input.name.trim();
  const code = input.code.trim().toUpperCase();
  const existing = await prisma.department.findUnique({ where: { name } });
  if (existing) throw ApiError.conflict('A department with that name already exists');
  const department = await prisma.department.create({ data: { name, code } });
  res.status(201).json({ department });
}));

departmentsRouter.patch('/:id', requireAdmin, asyncHandler(async (req, res) => {
  const input = z.object({ code: z.string().min(1).max(10).optional(), active: z.boolean().optional() }).parse(req.body);
  const data: { code?: string; active?: boolean } = {};
  if (input.code) data.code = input.code.trim().toUpperCase();
  if (input.active !== undefined) data.active = input.active;
  const exists = await prisma.department.findUnique({ where: { id: req.params.id } });
  if (!exists) throw ApiError.notFound('Department not found');
  const department = await prisma.department.update({ where: { id: req.params.id }, data });
  res.json({ department });
}));
