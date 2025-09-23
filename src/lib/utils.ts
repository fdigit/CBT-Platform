import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date | string) {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(date));
}

export function formatDateTime(date: Date | string) {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date));
}

export function formatCurrency(amount: number, currency = 'NGN') {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency,
  }).format(amount);
}

export function generateExamCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

export function calculateScore(answers: any[], questions: any[]) {
  let score = 0;
  let totalPoints = 0;

  questions.forEach(question => {
    totalPoints += question.points;
    const answer = answers.find(a => a.questionId === question.id);

    if (answer && question.type === 'MCQ') {
      if (
        JSON.stringify(answer.response) ===
        JSON.stringify(question.correctAnswer)
      ) {
        score += question.points;
      }
    } else if (answer && question.type === 'TRUE_FALSE') {
      if (answer.response === question.correctAnswer) {
        score += question.points;
      }
    }
  });

  return { score, totalPoints, percentage: (score / totalPoints) * 100 };
}
