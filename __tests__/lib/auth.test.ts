import { authOptions, Role } from '@/lib/auth';
import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import bcrypt from 'bcryptjs';

// Mock bcrypt
jest.mock('bcryptjs');
const mockedBcrypt = bcrypt as jest.Mocked<typeof bcrypt>;

// Mock prisma
jest.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
    },
  },
}));

import { prisma } from '@/lib/prisma';
const mockedPrisma = prisma as jest.Mocked<typeof prisma>;

describe('Authentication', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('authOptions.authorize', () => {
    it('should return null when credentials are missing', async () => {
      const credentialsProvider = authOptions.providers?.[0] as any;
      
      const result = await credentialsProvider.authorize({});
      
      expect(result).toBeNull();
    });

    it('should return null when email is missing', async () => {
      const credentialsProvider = authOptions.providers?.[0] as any;
      
      const result = await credentialsProvider.authorize({
        password: 'password123',
      });
      
      expect(result).toBeNull();
    });

    it('should return null when password is missing', async () => {
      const credentialsProvider = authOptions.providers?.[0] as any;
      
      const result = await credentialsProvider.authorize({
        email: 'test@example.com',
      });
      
      expect(result).toBeNull();
    });

    it('should return null when user is not found', async () => {
      mockedPrisma.user.findUnique.mockResolvedValue(null);
      
      const credentialsProvider = authOptions.providers?.[0] as any;
      
      const result = await credentialsProvider.authorize({
        email: 'nonexistent@example.com',
        password: 'password123',
      });
      
      expect(result).toBeNull();
      expect(mockedPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'nonexistent@example.com' },
        include: {
          school: true,
          StudentProfile: true,
          SchoolAdminProfile: true,
          TeacherProfile: true,
        },
      });
    });

    it('should return null when password is invalid', async () => {
      const mockUser = {
        id: '1',
        email: 'test@example.com',
        password: 'hashedPassword',
        name: 'Test User',
        role: Role.STUDENT,
        schoolId: 'school1',
        createdAt: new Date(),
        updatedAt: new Date(),
        school: null,
        StudentProfile: null,
        SchoolAdminProfile: null,
        TeacherProfile: null,
      };

      mockedPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockedBcrypt.compare.mockResolvedValue(false);

      const credentialsProvider = authOptions.providers?.[0] as any;
      
      const result = await credentialsProvider.authorize({
        email: 'test@example.com',
        password: 'wrongPassword',
      });
      
      expect(result).toBeNull();
      expect(mockedBcrypt.compare).toHaveBeenCalledWith('wrongPassword', 'hashedPassword');
    });

    it('should return user when credentials are valid', async () => {
      const mockUser = {
        id: '1',
        email: 'test@example.com',
        password: 'hashedPassword',
        name: 'Test User',
        role: Role.STUDENT,
        schoolId: 'school1',
        createdAt: new Date(),
        updatedAt: new Date(),
        school: null,
        StudentProfile: null,
        SchoolAdminProfile: null,
        TeacherProfile: null,
      };

      mockedPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockedBcrypt.compare.mockResolvedValue(true);

      const credentialsProvider = authOptions.providers?.[0] as any;
      
      const result = await credentialsProvider.authorize({
        email: 'test@example.com',
        password: 'correctPassword',
      });
      
      expect(result).toEqual({
        id: '1',
        email: 'test@example.com',
        name: 'Test User',
        role: Role.STUDENT,
        schoolId: 'school1',
      });
      expect(mockedBcrypt.compare).toHaveBeenCalledWith('correctPassword', 'hashedPassword');
    });
  });

  describe('Role enum', () => {
    it('should have all required roles', () => {
      expect(Role.SUPER_ADMIN).toBe('SUPER_ADMIN');
      expect(Role.SCHOOL_ADMIN).toBe('SCHOOL_ADMIN');
      expect(Role.TEACHER).toBe('TEACHER');
      expect(Role.STUDENT).toBe('STUDENT');
    });
  });
});
