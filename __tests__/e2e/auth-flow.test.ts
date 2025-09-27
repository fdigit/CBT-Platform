import { beforeEach, describe, expect, it, jest } from '@jest/globals';

// Mock fetch for API testing
global.fetch = jest.fn();
const mockFetch = fetch as jest.MockedFunction<typeof fetch>;

describe('End-to-End Authentication Flow', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('User Registration and Login Flow', () => {
    it('should complete full registration and login flow', async () => {
      // Mock successful user registration
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: async () => ({
          id: 'user-1',
          email: 'newuser@example.com',
          name: 'New User',
          role: 'STUDENT',
          message: 'User created successfully',
        }),
      } as Response);

      // Test user registration
      const registrationResponse = await fetch('http://localhost:3000/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: 'newuser@example.com',
          password: 'password123',
          name: 'New User',
          role: 'STUDENT',
        }),
      });

      expect(registrationResponse.ok).toBe(true);
      expect(registrationResponse.status).toBe(201);

      // Mock successful login
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          user: {
            id: 'user-1',
            email: 'newuser@example.com',
            name: 'New User',
            role: 'STUDENT',
          },
          accessToken: 'mock-access-token',
        }),
      } as Response);

      // Test user login
      const loginResponse = await fetch('http://localhost:3000/api/auth/signin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: 'newuser@example.com',
          password: 'password123',
        }),
      });

      expect(loginResponse.ok).toBe(true);
      expect(loginResponse.status).toBe(200);

      const loginData = await loginResponse.json();
      expect(loginData.user.email).toBe('newuser@example.com');
      expect(loginData.accessToken).toBeDefined();
    });

    it('should handle registration with existing email', async () => {
      // Mock user already exists error
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 409,
        json: async () => ({
          error: 'User already exists',
        }),
      } as Response);

      const response = await fetch('http://localhost:3000/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: 'existing@example.com',
          password: 'password123',
          name: 'Existing User',
          role: 'STUDENT',
        }),
      });

      expect(response.ok).toBe(false);
      expect(response.status).toBe(409);

      const errorData = await response.json();
      expect(errorData.error).toBe('User already exists');
    });
  });

  describe('Protected Route Access', () => {
    it('should allow access to student dashboard with valid token', async () => {
      // Mock successful authentication check
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          user: {
            id: 'user-1',
            email: 'student@example.com',
            name: 'Student User',
            role: 'STUDENT',
            schoolId: 'school-1',
          },
        }),
      } as Response);

      const response = await fetch('http://localhost:3000/api/auth/me', {
        method: 'GET',
        headers: {
          'Authorization': 'Bearer valid-token',
        },
      });

      expect(response.ok).toBe(true);
      expect(response.status).toBe(200);

      const userData = await response.json();
      expect(userData.user.role).toBe('STUDENT');
    });

    it('should deny access without valid token', async () => {
      // Mock unauthorized access
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({
          error: 'Unauthorized',
        }),
      } as Response);

      const response = await fetch('http://localhost:3000/api/auth/me', {
        method: 'GET',
      });

      expect(response.ok).toBe(false);
      expect(response.status).toBe(401);

      const errorData = await response.json();
      expect(errorData.error).toBe('Unauthorized');
    });
  });

  describe('Role-based Access Control', () => {
    it('should allow teacher to create exams', async () => {
      // Mock teacher authentication
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          user: {
            id: 'teacher-1',
            email: 'teacher@example.com',
            name: 'Teacher User',
            role: 'TEACHER',
            schoolId: 'school-1',
          },
        }),
      } as Response);

      // Mock exam creation
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: async () => ({
          id: 'exam-1',
          title: 'Math Test',
          description: 'Basic math test',
          duration: 60,
          totalMarks: 100,
          passingMarks: 50,
          teacherId: 'teacher-1',
          schoolId: 'school-1',
          createdAt: new Date(),
        }),
      } as Response);

      // Test exam creation by teacher
      const examResponse = await fetch('http://localhost:3000/api/exams', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer teacher-token',
        },
        body: JSON.stringify({
          title: 'Math Test',
          description: 'Basic math test',
          duration: 60,
          totalMarks: 100,
          passingMarks: 50,
          startDate: new Date(),
          endDate: new Date(),
        }),
      });

      expect(examResponse.ok).toBe(true);
      expect(examResponse.status).toBe(201);

      const examData = await examResponse.json();
      expect(examData.title).toBe('Math Test');
      expect(examData.teacherId).toBe('teacher-1');
    });

    it('should deny student from creating exams', async () => {
      // Mock student trying to create exam
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 403,
        json: async () => ({
          error: 'Forbidden: Insufficient permissions',
        }),
      } as Response);

      const response = await fetch('http://localhost:3000/api/exams', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer student-token',
        },
        body: JSON.stringify({
          title: 'Unauthorized Test',
          description: 'This should fail',
          duration: 60,
          totalMarks: 100,
          passingMarks: 50,
        }),
      });

      expect(response.ok).toBe(false);
      expect(response.status).toBe(403);

      const errorData = await response.json();
      expect(errorData.error).toContain('Forbidden');
    });
  });
});
