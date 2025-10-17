// Base types for the multi-tenant CBT platform

export enum Role {
  SUPER_ADMIN = 'SUPER_ADMIN',
  SCHOOL_ADMIN = 'SCHOOL_ADMIN',
  TEACHER = 'TEACHER',
  STUDENT = 'STUDENT',
}

export enum SchoolStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  SUSPENDED = 'SUSPENDED',
  REJECTED = 'REJECTED',
}

export enum QuestionType {
  MCQ = 'MCQ',
  TRUE_FALSE = 'TRUE_FALSE',
  ESSAY = 'ESSAY',
  SHORT_ANSWER = 'SHORT_ANSWER',
  FILL_IN_BLANK = 'FILL_IN_BLANK',
}

export enum PaymentStatus {
  PENDING = 'PENDING',
  SUCCESS = 'SUCCESS',
  FAILED = 'FAILED',
}

// School model
export interface School {
  id: string;
  name: string;
  slug: string;
  email: string;
  phone?: string;
  logoUrl?: string;
  status: SchoolStatus;
  createdAt: Date;
  updatedAt: Date;
}

// User model
export interface User {
  id: string;
  email: string;
  password: string;
  name: string;
  role: Role;
  schoolId?: string;
  createdAt: Date;
  updatedAt: Date;
  school?: School;
  StudentProfile?: Student;
  SchoolAdminProfile?: SchoolAdmin;
  TeacherProfile?: Teacher;
}

// School Admin profile
export interface SchoolAdmin {
  id: string;
  userId: string;
  schoolId: string;
  user: User;
  school: School;
}

// Teacher profile
export interface Teacher {
  id: string;
  userId: string;
  schoolId: string;
  employeeId: string;
  qualification?: string;
  specialization?: string;
  experience?: number;
  phone?: string;
  address?: string;
  avatar?: string;
  status: 'ACTIVE' | 'SUSPENDED' | 'TERMINATED' | 'ON_LEAVE';
  hireDate?: Date;
  lastLogin?: Date;
  user: User;
  school: School;
}

// Student profile
export interface Student {
  id: string;
  userId: string;
  schoolId: string;
  regNumber: string;
  user: User;
  school: School;
  answers?: Answer[];
  results?: Result[];
}

// Exam model
export interface Exam {
  id: string;
  title: string;
  description?: string;
  startTime: Date;
  endTime: Date;
  duration: number; // in minutes
  shuffle: boolean;
  negativeMarking: boolean;
  schoolId: string;
  createdAt: Date;
  school: School;
  questions?: Question[];
  answers?: Answer[];
  results?: Result[];
}

// Question model
export interface Question {
  id: string;
  text: string;
  type: QuestionType;
  options?: any; // JSON field for MCQ/TrueFalse options
  correctAnswer?: any; // JSON field for correct answers
  points: number;
  examId: string;
  exam: Exam;
  answers?: Answer[];
}

// Answer model
export interface Answer {
  id: string;
  studentId: string;
  questionId: string;
  examId: string;
  response?: any; // JSON field for student response
  createdAt: Date;
  student: Student;
  question: Question;
  exam: Exam;
}

// Result model
export interface Result {
  id: string;
  studentId: string;
  examId: string;
  score: number;
  gradedAt: Date;
  student: Student;
  exam: Exam;
}

// Payment model
export interface Payment {
  id: string;
  schoolId: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  reference: string;
  createdAt: Date;
  school: School;
}

// API Response types
export interface SchoolRegistrationResponse {
  message: string;
  schoolId: string;
  slug: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

// Dashboard statistics types
export interface DashboardStats {
  totalSchools?: number;
  totalStudents?: number;
  totalExams?: number;
  activeExams?: number;
  totalRevenue?: number;
}

export interface SchoolStats {
  totalStudents: number;
  totalExams: number;
  activeExams: number;
  completedExams: number;
}

export interface StudentStats {
  totalExams: number;
  completedExams: number;
  averageScore: number;
  upcomingExams: number;
}

// Form validation types
export interface SchoolRegistrationForm {
  name: string;
  email: string;
  phone?: string;
  adminName: string;
  adminEmail: string;
  adminPassword: string;
}

export interface LoginForm {
  email: string;
  password: string;
}

export interface ExamForm {
  title: string;
  description?: string;
  startTime: string;
  endTime: string;
  duration: number;
  shuffle: boolean;
  negativeMarking: boolean;
}

export interface QuestionForm {
  text: string;
  type: QuestionType;
  options?: string[];
  correctAnswer: any;
  points: number;
}

export interface StudentImportForm {
  name: string;
  email: string;
  regNumber: string;
}

// Session user type (extends NextAuth User)
export interface SessionUser {
  id: string;
  email: string;
  name: string;
  role: Role;
  schoolId?: string;
  school?: School;
  studentProfile?: Student;
  schoolAdminProfile?: SchoolAdmin;
  teacherProfile?: Teacher;
}

// Notification types
export enum NotificationType {
  SCHOOL_REGISTRATION = 'SCHOOL_REGISTRATION',
  SCHOOL_APPROVED = 'SCHOOL_APPROVED',
  SCHOOL_REJECTED = 'SCHOOL_REJECTED',
  PAYMENT_RECEIVED = 'PAYMENT_RECEIVED',
  SYSTEM_ALERT = 'SYSTEM_ALERT',
  ANNOUNCEMENT_POSTED = 'ANNOUNCEMENT_POSTED',
  ANNOUNCEMENT_COMMENT_ADDED = 'ANNOUNCEMENT_COMMENT_ADDED',
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  isRead: boolean;
  userId: string;
  metadata?: any;
  createdAt: Date;
  user: User;
}

// ===================================
// Academic Results Module Types
// ===================================

export enum ResultStatus {
  DRAFT = 'DRAFT',
  SUBMITTED = 'SUBMITTED',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  PUBLISHED = 'PUBLISHED',
}

export interface AcademicResult {
  id: string;
  // Relationships
  studentId: string;
  subjectId: string;
  teacherId: string;
  classId: string;
  schoolId: string;

  // Academic Period
  term: string; // "First Term", "Second Term", "Third Term"
  session: string; // "2024/2025"

  // Scores
  caScore: number; // Continuous Assessment (usually out of 40)
  examScore: number; // Exam score (usually out of 60)
  totalScore: number; // Auto-computed: caScore + examScore

  // Grading
  actualGrade: string; // A*, A, B, C, D, E, F
  targetedGrade?: string; // Optional: Grade student is aiming for
  gradePoint: number; // 5.0, 4.5, 4.0, etc.
  remark?: string; // "Excellent", "Very Good", "Good", etc.

  // Metadata
  scoresObtainable: number; // Usually 100
  scoresObtained: number; // Same as totalScore
  average?: number; // Class average for this subject

  // Status and Approval
  status: ResultStatus;
  submittedAt?: Date;
  approvedByAdmin: boolean;
  approvedBy?: string;
  approvedAt?: Date;

  // Teacher Comments
  teacherComment?: string;
  hodComment?: string; // Head of Department
  principalComment?: string;

  // Timestamps
  createdAt: Date;
  updatedAt: Date;

  // Relations (populated)
  student?: Student;
  subject?: Subject;
  teacher?: Teacher;
  class?: Class;
  school?: School;
  approver?: User;
}

export interface GradingScale {
  id: string;
  schoolId: string;
  minScore: number; // Minimum percentage (e.g., 90)
  maxScore: number; // Maximum percentage (e.g., 100)
  grade: string; // "A*", "A", "B", etc.
  gradePoint: number; // 5.0, 4.5, 4.0, etc.
  remark: string; // "Excellent", "Very Good", etc.
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  school?: School;
}

export interface TermSession {
  id: string;
  schoolId: string;
  term: string; // "First Term", "Second Term", "Third Term"
  session: string; // "2024/2025"
  startDate: Date;
  endDate: Date;
  isCurrent: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  school?: School;
}

export interface Class {
  id: string;
  name: string;
  section?: string;
  schoolId: string;
  academicYear: string;
  description?: string;
  maxStudents: number;
  room?: string;
  status: 'ACTIVE' | 'INACTIVE' | 'ARCHIVED';
  createdAt: Date;
  updatedAt: Date;
}

export interface Subject {
  id: string;
  name: string;
  code?: string;
  description?: string;
  schoolId: string;
  status: 'ACTIVE' | 'INACTIVE' | 'ARCHIVED';
  createdAt: Date;
  updatedAt: Date;
}

// ===================================
// API Request/Response Types
// ===================================

export interface CreateAcademicResultRequest {
  studentId: string;
  subjectId: string;
  classId: string;
  term: string;
  session: string;
  caScore: number;
  examScore: number;
  teacherComment?: string;
}

export interface BulkUploadResultRequest {
  classId: string;
  subjectId: string;
  term: string;
  session: string;
  results: {
    studentRegNumber: string;
    caScore: number;
    examScore: number;
    remarks?: string;
  }[];
}

export interface AcademicResultsResponse {
  results: AcademicResult[];
  gpa?: number;
  classAverage?: number;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface GradingScaleConfig {
  minScore: number;
  maxScore: number;
  grade: string;
  gradePoint: number;
  remark: string;
}

export interface GradeCalculationResult {
  totalScore: number;
  actualGrade: string;
  gradePoint: number;
  remark: string;
  scoresObtained: number;
  scoresObtainable: number;
}

export interface GPACalculation {
  gpa: number;
  totalGradePoints: number;
  numberOfSubjects: number;
  results: AcademicResult[];
}

export interface ResultApprovalRequest {
  comment?: string;
  hodComment?: string;
  principalComment?: string;
}

export interface ResultsAnalytics {
  totalResults: number;
  pendingApproval: number;
  approved: number;
  rejected: number;
  averageGPA: number;
  topPerformers: {
    studentId: string;
    studentName: string;
    gpa: number;
  }[];
  subjectPerformance: {
    subjectId: string;
    subjectName: string;
    average: number;
    passRate: number;
  }[];
}

// ===================================
// Announcements Module Types
// ===================================

export enum TargetAudience {
  STUDENTS = 'STUDENTS',
  TEACHERS = 'TEACHERS',
  ALL = 'ALL',
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  authorId: string;
  authorRole: Role;
  schoolId: string;
  targetAudience: TargetAudience;
  classIds?: string[];
  subjectIds?: string[];
  recipientIds?: string[]; // Array of specific user IDs when using individual selection
  isPinned: boolean;
  isPublished: boolean;
  createdAt: Date;
  updatedAt: Date;
  
  // Relations (populated)
  author?: User;
  school?: School;
  comments?: AnnouncementComment[];
  _count?: {
    comments: number;
  };
}

export interface AnnouncementComment {
  id: string;
  content: string;
  announcementId: string;
  authorId: string;
  parentCommentId?: string;
  isEdited: boolean;
  editedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  
  // Relations (populated)
  announcement?: Announcement;
  author?: User;
  parentComment?: AnnouncementComment;
  replies?: AnnouncementComment[];
  _count?: {
    replies: number;
  };
}

// ===================================
// Announcement API Request/Response Types
// ===================================

export interface CreateAnnouncementRequest {
  title: string;
  content: string;
  targetAudience: TargetAudience;
  classIds?: string[];
  subjectIds?: string[];
  recipientIds?: string[]; // Specific user IDs when using individual selection
  isPinned?: boolean;
}

export interface UpdateAnnouncementRequest {
  title?: string;
  content?: string;
  targetAudience?: TargetAudience;
  classIds?: string[];
  subjectIds?: string[];
  recipientIds?: string[]; // Specific user IDs when using individual selection
  isPinned?: boolean;
  isPublished?: boolean;
}

export interface CreateCommentRequest {
  content: string;
  parentCommentId?: string;
}

export interface UpdateCommentRequest {
  content: string;
}

export interface AnnouncementListResponse {
  announcements: Announcement[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface CommentListResponse {
  comments: AnnouncementComment[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

// ===================================
// User Selection Types
// ===================================

export interface UserListItem {
  id: string;
  name: string;
  email: string;
  role: Role;
  className?: string; // For students
  section?: string;
}

export interface UserListResponse {
  users: UserListItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}
