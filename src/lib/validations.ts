import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const schoolRegistrationSchema = z.object({
  name: z.string().min(2, 'School name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional(),
  adminName: z.string().min(2, 'Admin name must be at least 2 characters'),
  adminEmail: z.string().email('Invalid admin email address'),
  adminPassword: z.string().min(6, 'Password must be at least 6 characters'),
});

export const studentImportSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  regNumber: z
    .string()
    .min(3, 'Registration number must be at least 3 characters'),
});

export const examSchema = z.object({
  title: z.string().min(3, 'Exam title must be at least 3 characters'),
  description: z.string().optional(),
  startTime: z.string().min(1, 'Start time is required'),
  endTime: z.string().min(1, 'End time is required'),
  duration: z.number().min(1, 'Duration must be at least 1 minute'),
  shuffle: z.boolean().default(false),
  negativeMarking: z.boolean().default(false),
  totalMarks: z.number().optional(),
  passingMarks: z.number().optional(),
  instructions: z.string().optional(),
  allowPreview: z.boolean().default(false),
  showResultsImmediately: z.boolean().default(false),
  maxAttempts: z.number().min(1).default(1),
  isLive: z.boolean().default(false),
  subjectId: z.string().optional(),
  classId: z.string().optional(),
});

export const questionSchema = z.object({
  text: z.string().min(3, 'Question text must be at least 3 characters'),
  type: z.enum([
    'MCQ',
    'TRUE_FALSE',
    'ESSAY',
    'SHORT_ANSWER',
    'FILL_IN_BLANK',
    'MATCHING',
  ]),
  options: z.array(z.string()).optional().nullable(),
  correctAnswer: z.any(),
  points: z.number().min(0.5).default(1),
  order: z.number().optional().nullable(),
  imageUrl: z.string().optional().nullable(),
  audioUrl: z.string().optional().nullable(),
  videoUrl: z.string().optional().nullable(),
  explanation: z.string().optional().nullable(),
  difficulty: z.enum(['EASY', 'MEDIUM', 'HARD']).optional().nullable(),
  tags: z.array(z.string()).optional().nullable(),
});

export const answerSchema = z.object({
  questionId: z.string(),
  response: z.any(),
});

export const paymentSchema = z.object({
  amount: z.number().min(100, 'Minimum amount is ₦100'),
  currency: z.string().default('NGN'),
});
