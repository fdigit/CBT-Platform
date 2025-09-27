import {
    Exam,
    ExamAttempt,
    PaymentStatus,
    Question,
    QuestionType,
    Role,
    School,
    SchoolStatus,
    User,
} from '@/types/models';
import { describe, expect, it } from '@jest/globals';

describe('Type Models', () => {
  describe('Enums', () => {
    it('should have correct Role enum values', () => {
      expect(Role.SUPER_ADMIN).toBe('SUPER_ADMIN');
      expect(Role.SCHOOL_ADMIN).toBe('SCHOOL_ADMIN');
      expect(Role.TEACHER).toBe('TEACHER');
      expect(Role.STUDENT).toBe('STUDENT');
    });

    it('should have correct SchoolStatus enum values', () => {
      expect(SchoolStatus.PENDING).toBe('PENDING');
      expect(SchoolStatus.APPROVED).toBe('APPROVED');
      expect(SchoolStatus.SUSPENDED).toBe('SUSPENDED');
      expect(SchoolStatus.REJECTED).toBe('REJECTED');
    });

    it('should have correct QuestionType enum values', () => {
      expect(QuestionType.MCQ).toBe('MCQ');
      expect(QuestionType.TRUE_FALSE).toBe('TRUE_FALSE');
      expect(QuestionType.ESSAY).toBe('ESSAY');
    });

    it('should have correct PaymentStatus enum values', () => {
      expect(PaymentStatus.PENDING).toBe('PENDING');
      expect(PaymentStatus.SUCCESS).toBe('SUCCESS');
      expect(PaymentStatus.FAILED).toBe('FAILED');
    });
  });

  describe('Interface Types', () => {
    it('should validate School interface structure', () => {
      const school: School = {
        id: 'school-1',
        name: 'Test School',
        slug: 'test-school',
        email: 'test@school.com',
        phone: '+1234567890',
        logoUrl: 'https://example.com/logo.png',
        status: SchoolStatus.APPROVED,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      expect(school.id).toBe('school-1');
      expect(school.name).toBe('Test School');
      expect(school.status).toBe(SchoolStatus.APPROVED);
    });

    it('should validate User interface structure', () => {
      const user: User = {
        id: 'user-1',
        email: 'user@example.com',
        password: 'hashedPassword',
        name: 'John Doe',
        role: Role.STUDENT,
        schoolId: 'school-1',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      expect(user.id).toBe('user-1');
      expect(user.email).toBe('user@example.com');
      expect(user.role).toBe(Role.STUDENT);
    });

    it('should validate Exam interface structure', () => {
      const exam: Exam = {
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
      };

      expect(exam.id).toBe('exam-1');
      expect(exam.title).toBe('Math Test');
      expect(exam.duration).toBe(60);
      expect(exam.isActive).toBe(true);
    });

    it('should validate Question interface structure', () => {
      const question: Question = {
        id: 'question-1',
        text: 'What is 2+2?',
        type: QuestionType.MCQ,
        options: ['3', '4', '5', '6'],
        correctAnswer: '4',
        marks: 5,
        examId: 'exam-1',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      expect(question.id).toBe('question-1');
      expect(question.type).toBe(QuestionType.MCQ);
      expect(question.correctAnswer).toBe('4');
      expect(question.options).toHaveLength(4);
    });

    it('should validate ExamAttempt interface structure', () => {
      const attempt: ExamAttempt = {
        id: 'attempt-1',
        studentId: 'student-1',
        examId: 'exam-1',
        answers: { 'question-1': '4' },
        score: 85,
        totalMarks: 100,
        completedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      expect(attempt.id).toBe('attempt-1');
      expect(attempt.studentId).toBe('student-1');
      expect(attempt.score).toBe(85);
      expect(attempt.answers).toEqual({ 'question-1': '4' });
    });
  });
});
