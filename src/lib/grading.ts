// Grading calculation utilities for Academic Results Module

import {
  AcademicResult,
  GPACalculation,
  GradeCalculationResult,
  GradingScaleConfig,
} from '@/types/models';

/**
 * Default grading scale (Nigerian system)
 * Can be overridden by school-specific configuration
 */
export const DEFAULT_GRADING_SCALE: GradingScaleConfig[] = [
  {
    minScore: 90,
    maxScore: 100,
    grade: 'A*',
    gradePoint: 5.0,
    remark: 'Excellent',
  },
  {
    minScore: 80,
    maxScore: 89,
    grade: 'A',
    gradePoint: 4.5,
    remark: 'Very Good',
  },
  {
    minScore: 70,
    maxScore: 79,
    grade: 'B+',
    gradePoint: 4.0,
    remark: 'Good',
  },
  {
    minScore: 60,
    maxScore: 69,
    grade: 'B',
    gradePoint: 3.5,
    remark: 'Average',
  },
  {
    minScore: 50,
    maxScore: 59,
    grade: 'C',
    gradePoint: 3.0,
    remark: 'Fair',
  },
  {
    minScore: 40,
    maxScore: 49,
    grade: 'D',
    gradePoint: 2.0,
    remark: 'Poor',
  },
  { minScore: 0, maxScore: 39, grade: 'F', gradePoint: 0.0, remark: 'Fail' },
];

/**
 * Calculate grade based on total score and grading scale
 */
export function calculateGrade(
  totalScore: number,
  scoresObtainable: number = 100,
  gradingScale: GradingScaleConfig[] = DEFAULT_GRADING_SCALE
): GradeCalculationResult {
  // Calculate percentage
  const percentage = (totalScore / scoresObtainable) * 100;

  // Find matching grade from scale
  const gradeInfo = gradingScale.find(
    scale => percentage >= scale.minScore && percentage <= scale.maxScore
  );

  if (!gradeInfo) {
    // Fallback to F if no match
    return {
      totalScore,
      actualGrade: 'F',
      gradePoint: 0.0,
      remark: 'Fail',
      scoresObtained: totalScore,
      scoresObtainable,
    };
  }

  return {
    totalScore,
    actualGrade: gradeInfo.grade,
    gradePoint: gradeInfo.gradePoint,
    remark: gradeInfo.remark,
    scoresObtained: totalScore,
    scoresObtainable,
  };
}

/**
 * Calculate GPA from multiple academic results
 */
export function calculateGPA(results: AcademicResult[]): GPACalculation {
  if (results.length === 0) {
    return {
      gpa: 0,
      totalGradePoints: 0,
      numberOfSubjects: 0,
      results: [],
    };
  }

  const totalGradePoints = results.reduce(
    (sum, result) => sum + result.gradePoint,
    0
  );
  const gpa = totalGradePoints / results.length;

  return {
    gpa: Math.round(gpa * 100) / 100, // Round to 2 decimal places
    totalGradePoints,
    numberOfSubjects: results.length,
    results,
  };
}

/**
 * Calculate class average for a specific subject
 */
export function calculateClassAverage(results: AcademicResult[]): number {
  if (results.length === 0) return 0;

  const totalScore = results.reduce(
    (sum, result) => sum + result.totalScore,
    0
  );
  const average = totalScore / results.length;

  return Math.round(average * 100) / 100;
}

/**
 * Calculate overall grade from GPA
 */
export function getOverallGradeFromGPA(gpa: number): string {
  if (gpa >= 4.5) return 'A*';
  if (gpa >= 4.0) return 'A';
  if (gpa >= 3.5) return 'B+';
  if (gpa >= 3.0) return 'B';
  if (gpa >= 2.5) return 'C';
  if (gpa >= 2.0) return 'D';
  return 'F';
}

/**
 * Calculate pass rate from results
 */
export function calculatePassRate(results: AcademicResult[]): number {
  if (results.length === 0) return 0;

  const passedResults = results.filter(result => result.totalScore >= 40);
  const passRate = (passedResults.length / results.length) * 100;

  return Math.round(passRate * 100) / 100;
}

/**
 * Determine if a student passed based on score
 */
export function isPassed(
  totalScore: number,
  passingMark: number = 40
): boolean {
  return totalScore >= passingMark;
}

/**
 * Get grade color for UI
 */
export function getGradeColor(grade: string): string {
  switch (grade) {
    case 'A*':
    case 'A':
      return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
    case 'B+':
    case 'B':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
    case 'C':
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
    case 'D':
      return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
    case 'F':
      return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
  }
}

/**
 * Validate CA and Exam scores
 */
export function validateScores(
  caScore: number,
  examScore: number,
  maxCA: number = 40,
  maxExam: number = 60
): { valid: boolean; error?: string } {
  if (caScore < 0 || caScore > maxCA) {
    return {
      valid: false,
      error: `CA score must be between 0 and ${maxCA}`,
    };
  }

  if (examScore < 0 || examScore > maxExam) {
    return {
      valid: false,
      error: `Exam score must be between 0 and ${maxExam}`,
    };
  }

  return { valid: true };
}

/**
 * Format GPA to string
 */
export function formatGPA(gpa: number): string {
  return gpa.toFixed(2);
}

/**
 * Get grade point from grade
 */
export function getGradePoint(
  grade: string,
  gradingScale: GradingScaleConfig[] = DEFAULT_GRADING_SCALE
): number {
  const gradeInfo = gradingScale.find(scale => scale.grade === grade);
  return gradeInfo?.gradePoint || 0;
}

/**
 * Calculate student's rank in class based on GPA
 */
export function calculateRank(studentGPA: number, allGPAs: number[]): number {
  const sortedGPAs = [...allGPAs].sort((a, b) => b - a);
  return sortedGPAs.indexOf(studentGPA) + 1;
}

/**
 * Generate performance summary
 */
export function generatePerformanceSummary(gpa: number): string {
  if (gpa >= 4.5) return 'Outstanding performance! Keep up the excellent work.';
  if (gpa >= 4.0) return 'Very good performance! You are doing great.';
  if (gpa >= 3.5) return 'Good performance. Continue to work hard.';
  if (gpa >= 3.0) return 'Fair performance. Put in more effort to improve.';
  if (gpa >= 2.0) return 'Below average. Significant improvement needed.';
  return 'Poor performance. Please seek additional help and work harder.';
}

/**
 * Compute CA and Exam contributions
 */
export function computeScoreBreakdown(caScore: number, examScore: number) {
  const totalScore = caScore + examScore;
  const caPercentage = totalScore > 0 ? (caScore / totalScore) * 100 : 0;
  const examPercentage = totalScore > 0 ? (examScore / totalScore) * 100 : 0;

  return {
    totalScore,
    caScore,
    examScore,
    caPercentage: Math.round(caPercentage),
    examPercentage: Math.round(examPercentage),
  };
}
