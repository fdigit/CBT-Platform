import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import bcrypt from 'bcryptjs';
import { NextRequest } from 'next/server';

// Mock NextAuth
jest.mock('next-auth', () => ({
  getServerSession: jest.fn(),
}));

// Mock bcrypt
jest.mock('bcryptjs');
const mockedBcrypt = bcrypt as jest.Mocked<typeof bcrypt>;

// Mock prisma
jest.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
  },
}));

import { prisma } from '@/lib/prisma';
const mockedPrisma = prisma as jest.Mocked<typeof prisma>;

describe('Authentication API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/auth/signin', () => {
    it('should return 400 when email is missing', async () => {
      const request = new NextRequest('http://localhost:3000/api/auth/signin', {
        method: 'POST',
        body: JSON.stringify({ password: 'password123' }),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await fetch('http://localhost:3000/api/auth/signin', {
        method: 'POST',
        body: JSON.stringify({ password: 'password123' }),
        headers: { 'Content-Type': 'application/json' },
      });

      expect(response.status).toBe(400);
    });

    it('should return 400 when password is missing', async () => {
      const request = new NextRequest('http://localhost:3000/api/auth/signin', {
        method: 'POST',
        body: JSON.stringify({ email: 'test@example.com' }),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await fetch('http://localhost:3000/api/auth/signin', {
        method: 'POST',
        body: JSON.stringify({ email: 'test@example.com' }),
        headers: { 'Content-Type': 'application/json' },
      });

      expect(response.status).toBe(400);
    });

    it('should return 401 when user is not found', async () => {
      mockedPrisma.user.findUnique.mockResolvedValue(null);

      const response = await fetch('http://localhost:3000/api/auth/signin', {
        method: 'POST',
        body: JSON.stringify({
          email: 'nonexistent@example.com',
          password: 'password123',
        }),
        headers: { 'Content-Type': 'application/json' },
      });

      expect(response.status).toBe(401);
    });

    it('should return 401 when password is incorrect', async () => {
      const mockUser = {
        id: '1',
        email: 'test@example.com',
        password: 'hashedPassword',
        name: 'Test User',
        role: 'STUDENT',
        schoolId: 'school1',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockedPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockedBcrypt.compare.mockResolvedValue(false);

      const response = await fetch('http://localhost:3000/api/auth/signin', {
        method: 'POST',
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'wrongPassword',
        }),
        headers: { 'Content-Type': 'application/json' },
      });

      expect(response.status).toBe(401);
    });

    it('should return 200 when credentials are valid', async () => {
      const mockUser = {
        id: '1',
        email: 'test@example.com',
        password: 'hashedPassword',
        name: 'Test User',
        role: 'STUDENT',
        schoolId: 'school1',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockedPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockedBcrypt.compare.mockResolvedValue(true);

      const response = await fetch('http://localhost:3000/api/auth/signin', {
        method: 'POST',
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'correctPassword',
        }),
        headers: { 'Content-Type': 'application/json' },
      });

      expect(response.status).toBe(200);
    });
  });
});
