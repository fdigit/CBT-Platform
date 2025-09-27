import { beforeEach, describe, expect, it, jest } from '@jest/globals';

// Mock prisma
jest.mock('@/lib/prisma', () => ({
  prisma: {
    exam: {
      findMany: jest.fn(),
      create: jest.fn(),
    },
    question: {
      findMany: jest.fn(),
      create: jest.fn(),
    },
  },
}));

// Mock auth
jest.mock('@/lib/auth', () => ({
  getServerSession: jest.fn(),
}));

import { prisma } from '@/lib/prisma';
const mockedPrisma = prisma as jest.Mocked<typeof prisma>;

describe('Exams API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/exams', () => {
    it('should return exams for authenticated user', async () => {
      const mockExams = [
        {
          id: 'exam-1',
          title: 'Math Test',
          description: 'Basic math test',
          duration: 60,
          totalMarks: 100,
          passingMarks: 50,
          startDate: new Date(),
          endDate: new Date(),
          isActive: true,
          schoolId: 'school-1',
          teacherId: 'teacher-1',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockedPrisma.exam.findMany.mockResolvedValue(mockExams);

      const response = await fetch('http://localhost:3000/api/exams', {
        method: 'GET',
        headers: {
          'Authorization': 'Bearer valid-token',
        },
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data).toEqual(mockExams);
    });

    it('should return 401 for unauthenticated user', async () => {
      const response = await fetch('http://localhost:3000/api/exams', {
        method: 'GET',
      });

      expect(response.status).toBe(401);
    });

    it('should handle database errors gracefully', async () => {
      mockedPrisma.exam.findMany.mockRejectedValue(new Error('Database error'));

      const response = await fetch('http://localhost:3000/api/exams', {
        method: 'GET',
        headers: {
          'Authorization': 'Bearer valid-token',
        },
      });

      expect(response.status).toBe(500);
    });
  });

  describe('POST /api/exams', () => {
    it('should create a new exam for authenticated teacher', async () => {
      const newExam = {
        title: 'Science Test',
        description: 'Basic science test',
        duration: 90,
        totalMarks: 100,
        passingMarks: 60,
        startDate: new Date(),
        endDate: new Date(),
      };

      const mockCreatedExam = {
        id: 'exam-2',
        ...newExam,
        isActive: true,
        schoolId: 'school-1',
        teacherId: 'teacher-1',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockedPrisma.exam.create.mockResolvedValue(mockCreatedExam);

      const response = await fetch('http://localhost:3000/api/exams', {
        method: 'POST',
        body: JSON.stringify(newExam),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer valid-teacher-token',
        },
      });

      expect(response.status).toBe(201);
      const data = await response.json();
      expect(data).toEqual(mockCreatedExam);
    });

    it('should return 400 when required fields are missing', async () => {
      const incompleteExam = {
        title: 'Incomplete Test',
        // Missing required fields
      };

      const response = await fetch('http://localhost:3000/api/exams', {
        method: 'POST',
        body: JSON.stringify(incompleteExam),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer valid-token',
        },
      });

      expect(response.status).toBe(400);
    });

    it('should return 403 for non-teacher users', async () => {
      const newExam = {
        title: 'Science Test',
        description: 'Basic science test',
        duration: 90,
        totalMarks: 100,
        passingMarks: 60,
        startDate: new Date(),
        endDate: new Date(),
      };

      const response = await fetch('http://localhost:3000/api/exams', {
        method: 'POST',
        body: JSON.stringify(newExam),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer student-token',
        },
      });

      expect(response.status).toBe(403);
    });
  });
});
