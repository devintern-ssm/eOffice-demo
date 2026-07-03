import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import type { User } from '@prisma/client';
import { prisma } from '../../prisma.js';
import { config } from '../../config.js';
import { ApiError } from '../../utils/http.js';
import type { Role } from '../../utils/domain.js';

export function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 10);
}

export function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

export function signToken(user: Pick<User, 'id' | 'role' | 'section' | 'name'>): string {
  return jwt.sign(
    { role: user.role, section: user.section, name: user.name },
    config.jwtSecret,
    { subject: user.id, expiresIn: config.jwtExpiresIn as jwt.SignOptions['expiresIn'] },
  );
}

export function toPublicUser(user: User) {
  return {
    id: user.id,
    name: user.name,
    designation: user.designation,
    section: user.section,
    role: user.role,
    email: user.email,
  };
}

export async function registerUser(input: {
  name: string; designation: string; section: string; role: Role; email: string; password: string;
}) {
  const existing = await prisma.user.findUnique({ where: { email: input.email } });
  if (existing) throw ApiError.conflict('Email already registered');
  const user = await prisma.user.create({
    data: {
      name: input.name,
      designation: input.designation,
      section: input.section,
      role: input.role,
      email: input.email,
      passwordHash: await hashPassword(input.password),
    },
  });
  return toPublicUser(user);
}

export async function login(email: string, password: string) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !user.active) throw ApiError.unauthorized('Invalid credentials');
  const ok = await verifyPassword(password, user.passwordHash);
  if (!ok) throw ApiError.unauthorized('Invalid credentials');
  return { token: signToken(user), user: toPublicUser(user) };
}
