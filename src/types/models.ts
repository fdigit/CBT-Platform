// Base types for the multi-tenant CBT platform

export enum Role {
  SUPER_ADMIN = 'SUPER_ADMIN',
  SCHOOL_ADMIN = 'SCHOOL_ADMIN',
  TEACHER = 'TEACHER',
  STUDENT = 'STUDENT'
}

export enum SchoolStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  SUSPENDED = 'SUSPENDED',
  REJECTED = 'REJECTED'
}

export enum QuestionType {
  MCQ = 'MCQ',
  TRUE_FALSE = 'TRUE_FALSE',
  ESSAY = 'ESSAY'
}

export enum PaymentStatus {
  PENDING = 'PENDING',
  SUCCESS = 'SUCCESS',
  FAILED = 'FAILED'
}

// School model
export interface School {
  id: string
  name: string
  slug: string
  email: string
  phone?: string
  logoUrl?: string
  status: SchoolStatus
  createdAt: Date
  updatedAt: Date
}

// User model
export interface User {
  id: string
  email: string
  password: string
  name: string
  role: Role
  schoolId?: string
  createdAt: Date
  updatedAt: Date
  school?: School
  StudentProfile?: Student
  SchoolAdminProfile?: SchoolAdmin
  TeacherProfile?: Teacher
}

// School Admin profile
export interface SchoolAdmin {
  id: string
  userId: string
  schoolId: string
  user: User
  school: School
}

// Teacher profile
export interface Teacher {
  id: string
  userId: string
  schoolId: string
  employeeId: string
  qualification?: string
  specialization?: string
  experience?: number
  phone?: string
  address?: string
  avatar?: string
  status: 'ACTIVE' | 'SUSPENDED' | 'TERMINATED' | 'ON_LEAVE'
  hireDate?: Date
  lastLogin?: Date
  user: User
  school: School
}

// Student profile
export interface Student {
  id: string
  userId: string
  schoolId: string
  regNumber: string
  user: User
  school: School
  answers?: Answer[]
  results?: Result[]
}

// Exam model
export interface Exam {
  id: string
  title: string
  description?: string
  startTime: Date
  endTime: Date
  duration: number // in minutes
  shuffle: boolean
  negativeMarking: boolean
  schoolId: string
  createdAt: Date
  school: School
  questions?: Question[]
  answers?: Answer[]
  results?: Result[]
}

// Question model
export interface Question {
  id: string
  text: string
  type: QuestionType
  options?: any // JSON field for MCQ/TrueFalse options
  correctAnswer?: any // JSON field for correct answers
  points: number
  examId: string
  exam: Exam
  answers?: Answer[]
}

// Answer model
export interface Answer {
  id: string
  studentId: string
  questionId: string
  examId: string
  response?: any // JSON field for student response
  createdAt: Date
  student: Student
  question: Question
  exam: Exam
}

// Result model
export interface Result {
  id: string
  studentId: string
  examId: string
  score: number
  gradedAt: Date
  student: Student
  exam: Exam
}

// Payment model
export interface Payment {
  id: string
  schoolId: string
  amount: number
  currency: string
  status: PaymentStatus
  reference: string
  createdAt: Date
  school: School
}

// API Response types
export interface SchoolRegistrationResponse {
  message: string
  schoolId: string
  slug: string
}

export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  message?: string
  error?: string
}

// Dashboard statistics types
export interface DashboardStats {
  totalSchools?: number
  totalStudents?: number
  totalExams?: number
  activeExams?: number
  totalRevenue?: number
}

export interface SchoolStats {
  totalStudents: number
  totalExams: number
  activeExams: number
  completedExams: number
}

export interface StudentStats {
  totalExams: number
  completedExams: number
  averageScore: number
  upcomingExams: number
}

// Form validation types
export interface SchoolRegistrationForm {
  name: string
  email: string
  phone?: string
  adminName: string
  adminEmail: string
  adminPassword: string
}

export interface LoginForm {
  email: string
  password: string
}

export interface ExamForm {
  title: string
  description?: string
  startTime: string
  endTime: string
  duration: number
  shuffle: boolean
  negativeMarking: boolean
}

export interface QuestionForm {
  text: string
  type: QuestionType
  options?: string[]
  correctAnswer: any
  points: number
}

export interface StudentImportForm {
  name: string
  email: string
  regNumber: string
}

// Session user type (extends NextAuth User)
export interface SessionUser {
  id: string
  email: string
  name: string
  role: Role
  schoolId?: string
  school?: School
  studentProfile?: Student
  schoolAdminProfile?: SchoolAdmin
  teacherProfile?: Teacher
}

// Notification types
export enum NotificationType {
  SCHOOL_REGISTRATION = 'SCHOOL_REGISTRATION',
  SCHOOL_APPROVED = 'SCHOOL_APPROVED',
  SCHOOL_REJECTED = 'SCHOOL_REJECTED',
  PAYMENT_RECEIVED = 'PAYMENT_RECEIVED',
  SYSTEM_ALERT = 'SYSTEM_ALERT'
}

export interface Notification {
  id: string
  title: string
  message: string
  type: NotificationType
  isRead: boolean
  userId: string
  metadata?: any
  createdAt: Date
  user: User
}