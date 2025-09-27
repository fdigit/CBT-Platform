/**
 * Unified Exam Status Logic
 * This centralizes all exam status calculations to prevent inconsistencies
 */

export interface ExamStatusInfo {
  examStatus: 'upcoming' | 'active' | 'completed';
  studentStatus: 'not_started' | 'in_progress' | 'completed' | 'submitted';
  canTake: boolean;
  canResume: boolean;
  timeRemaining: number;
  isExpired: boolean;
}

export interface ExamData {
  id: string;
  startTime: string | Date;
  endTime: string | Date;
  duration: number;
  maxAttempts: number;
  manualControl: boolean;
  isLive: boolean;
  isCompleted: boolean;
  status: string;
  attempts: Array<{
    status: string;
    submittedAt?: string | Date | null;
  }>;
  results: Array<{
    score: number;
  }>;
}

/**
 * Calculate unified exam status for any user type
 */
export function calculateExamStatus(
  exam: ExamData,
  currentTime: Date = new Date()
): ExamStatusInfo {
  const startTime = new Date(exam.startTime);
  const endTime = new Date(exam.endTime);
  const now = currentTime;

  // Get latest attempt and result
  const latestAttempt = exam.attempts[0]; // Assuming sorted by most recent
  const hasResult = exam.results.length > 0;
  const attemptCount = exam.attempts.length;

  // Determine exam status (when exam is available)
  let examStatus: 'upcoming' | 'active' | 'completed' = 'upcoming';
  let canTake = false;
  let canResume = false;
  let isExpired = false;

  if (exam.manualControl) {
    // Manual control overrides time-based logic
    if (exam.isCompleted) {
      examStatus = 'completed';
      isExpired = true;
    } else if (exam.isLive) {
      examStatus = 'active';
      canTake = true;
    } else {
      examStatus = 'upcoming';
    }
  } else {
    // Time-based logic
    if (now < startTime) {
      examStatus = 'upcoming';
    } else if (now >= startTime && now <= endTime) {
      examStatus = 'active';
      canTake = true;
    } else {
      examStatus = 'completed';
      isExpired = true;
    }
  }

  // Determine student status
  let studentStatus: 'not_started' | 'in_progress' | 'completed' | 'submitted' =
    'not_started';

  if (hasResult) {
    studentStatus = 'completed';
  } else if (latestAttempt) {
    if (latestAttempt.status === 'IN_PROGRESS') {
      studentStatus = 'in_progress';
      canResume = true;
      canTake = true; // Can resume
    } else if (latestAttempt.status === 'SUBMITTED') {
      studentStatus = 'submitted';
    }
  }

  // Check if student can take/retake exam
  if (examStatus === 'active' && attemptCount < exam.maxAttempts) {
    if (studentStatus === 'not_started' || studentStatus === 'submitted') {
      canTake = true;
    }
  }

  // Calculate time remaining
  let timeRemaining = 0;
  if (examStatus === 'active') {
    if (exam.manualControl && exam.isLive) {
      // For manual control, use original end time or current time + duration
      timeRemaining = Math.max(0, endTime.getTime() - now.getTime());
    } else {
      timeRemaining = Math.max(0, endTime.getTime() - now.getTime());
    }
  } else if (examStatus === 'upcoming') {
    timeRemaining = Math.max(0, startTime.getTime() - now.getTime());
  }

  return {
    examStatus,
    studentStatus,
    canTake,
    canResume,
    timeRemaining,
    isExpired,
  };
}

/**
 * Check if student can save answers (relaxed logic)
 */
export function canSaveAnswers(
  exam: ExamData,
  currentTime: Date = new Date()
): boolean {
  // Allow saving if:
  // 1. Exam is active (either time-based or manual control)
  // 2. Student has an active attempt
  // 3. Not expired (unless manual control overrides)

  if (exam.manualControl) {
    // Manual control: allow if exam is live and not completed
    return exam.isLive && !exam.isCompleted;
  } else {
    // Time-based: allow if within time window
    const now = currentTime;
    const startTime = new Date(exam.startTime);
    const endTime = new Date(exam.endTime);
    return now >= startTime && now <= endTime;
  }
}

/**
 * Get dynamic status for admin/teacher views
 */
export function getDynamicStatus(
  exam: ExamData,
  currentTime: Date = new Date()
): string {
  const status = calculateExamStatus(exam, currentTime);

  // Map to admin/teacher status format
  switch (status.examStatus) {
    case 'upcoming':
      return 'SCHEDULED';
    case 'active':
      return 'ACTIVE';
    case 'completed':
      return 'COMPLETED';
    default:
      return exam.status;
  }
}
