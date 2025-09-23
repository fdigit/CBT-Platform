import { prisma } from '@/lib/prisma';

export interface NotificationData {
  title: string;
  message: string;
  type:
    | 'ASSIGNMENT_CREATED'
    | 'ASSIGNMENT_SUBMITTED'
    | 'ASSIGNMENT_GRADED'
    | 'LESSON_PLAN_SUBMITTED'
    | 'LESSON_PLAN_APPROVED'
    | 'LESSON_PLAN_REJECTED'
    | 'LESSON_PLAN_NEEDS_REVISION'
    | 'SCHOOL_REGISTRATION'
    | 'SCHOOL_APPROVED'
    | 'SCHOOL_REJECTED';
  userId: string;
  metadata?: any;
}

export async function createNotification(data: NotificationData) {
  try {
    const notification = await prisma.notification.create({
      data: {
        title: data.title,
        message: data.message,
        type: data.type,
        userId: data.userId,
        metadata: data.metadata || {},
        isRead: false,
      },
    });

    return notification;
  } catch (error) {
    console.error('Error creating notification:', error);
    throw error;
  }
}

export async function createBulkNotifications(
  notifications: NotificationData[]
) {
  try {
    const createdNotifications = await prisma.notification.createMany({
      data: notifications.map(notification => ({
        title: notification.title,
        message: notification.message,
        type: notification.type,
        userId: notification.userId,
        metadata: notification.metadata || {},
        isRead: false,
      })),
    });

    return createdNotifications;
  } catch (error) {
    console.error('Error creating bulk notifications:', error);
    throw error;
  }
}

// Assignment-related notification helpers
export async function notifyStudentsAboutAssignment(
  assignmentId: string,
  assignmentTitle: string,
  teacherName: string,
  studentIds: string[]
) {
  const notifications: NotificationData[] = studentIds.map(studentId => ({
    title: 'New Assignment Posted',
    message: `${teacherName} has posted a new assignment: "${assignmentTitle}"`,
    type: 'ASSIGNMENT_CREATED',
    userId: studentId,
    metadata: {
      assignmentId,
      teacherName,
      assignmentTitle,
    },
  }));

  return createBulkNotifications(notifications);
}

export async function notifyTeacherAboutSubmission(
  teacherId: string,
  studentName: string,
  assignmentTitle: string,
  assignmentId: string,
  submissionId: string
) {
  return createNotification({
    title: 'New Assignment Submission',
    message: `${studentName} has submitted their assignment for "${assignmentTitle}"`,
    type: 'ASSIGNMENT_SUBMITTED',
    userId: teacherId,
    metadata: {
      assignmentId,
      submissionId,
      studentName,
      assignmentTitle,
    },
  });
}

export async function notifyStudentAboutGrade(
  studentId: string,
  assignmentTitle: string,
  score: number,
  maxScore: number,
  assignmentId: string
) {
  return createNotification({
    title: 'Assignment Graded',
    message: `Your assignment "${assignmentTitle}" has been graded. Score: ${score}/${maxScore}`,
    type: 'ASSIGNMENT_GRADED',
    userId: studentId,
    metadata: {
      assignmentId,
      assignmentTitle,
      score,
      maxScore,
    },
  });
}

// Lesson plan-related notification helpers
export async function notifyAdminAboutLessonPlan(
  adminId: string,
  teacherName: string,
  lessonPlanTitle: string,
  lessonPlanId: string
) {
  return createNotification({
    title: 'New Lesson Plan Submitted',
    message: `${teacherName} has submitted a lesson plan for review: "${lessonPlanTitle}"`,
    type: 'LESSON_PLAN_SUBMITTED',
    userId: adminId,
    metadata: {
      lessonPlanId,
      teacherName,
      lessonPlanTitle,
    },
  });
}

export async function notifyTeacherAboutLessonPlanReview(
  teacherId: string,
  lessonPlanTitle: string,
  reviewStatus: 'APPROVED' | 'REJECTED' | 'NEEDS_REVISION',
  reviewerName: string,
  lessonPlanId: string,
  reviewNotes?: string
) {
  const statusMessages = {
    APPROVED: 'has been approved',
    REJECTED: 'has been rejected',
    NEEDS_REVISION: 'needs revision',
  };

  const notificationTypes = {
    APPROVED: 'LESSON_PLAN_APPROVED' as const,
    REJECTED: 'LESSON_PLAN_REJECTED' as const,
    NEEDS_REVISION: 'LESSON_PLAN_NEEDS_REVISION' as const,
  };

  return createNotification({
    title: 'Lesson Plan Review Update',
    message: `Your lesson plan "${lessonPlanTitle}" ${statusMessages[reviewStatus]} by ${reviewerName}`,
    type: notificationTypes[reviewStatus],
    userId: teacherId,
    metadata: {
      lessonPlanId,
      lessonPlanTitle,
      reviewStatus,
      reviewerName,
      reviewNotes,
    },
  });
}

export async function getUserNotifications(userId: string, limit = 20) {
  try {
    const notifications = await prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return notifications;
  } catch (error) {
    console.error('Error fetching user notifications:', error);
    throw error;
  }
}

export async function markNotificationAsRead(
  notificationId: string,
  userId: string
) {
  try {
    const notification = await prisma.notification.updateMany({
      where: {
        id: notificationId,
        userId,
      },
      data: {
        isRead: true,
      },
    });

    return notification;
  } catch (error) {
    console.error('Error marking notification as read:', error);
    throw error;
  }
}

export async function markAllNotificationsAsRead(userId: string) {
  try {
    const notifications = await prisma.notification.updateMany({
      where: {
        userId,
        isRead: false,
      },
      data: {
        isRead: true,
      },
    });

    return notifications;
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    throw error;
  }
}

export async function getUnreadNotificationCount(userId: string) {
  try {
    const count = await prisma.notification.count({
      where: {
        userId,
        isRead: false,
      },
    });

    return count;
  } catch (error) {
    console.error('Error getting unread notification count:', error);
    throw error;
  }
}

// School-related notification helpers
export async function createSchoolRegistrationNotification(
  adminId: string,
  schoolName: string,
  schoolId: string
) {
  return createNotification({
    title: 'New School Registration',
    message: `A new school "${schoolName}" has registered and is awaiting approval`,
    type: 'SCHOOL_REGISTRATION',
    userId: adminId,
    metadata: {
      schoolId,
      schoolName,
    },
  });
}

export async function createSchoolApprovalNotification(
  schoolAdminId: string,
  schoolName: string,
  approved: boolean,
  rejectionReason?: string
) {
  const status = approved ? 'approved' : 'rejected';
  const message = approved
    ? `Your school "${schoolName}" has been approved and is now active`
    : `Your school "${schoolName}" registration has been rejected. Reason: ${rejectionReason || 'Not specified'}`;

  return createNotification({
    title: `School Registration ${approved ? 'Approved' : 'Rejected'}`,
    message,
    type: approved ? 'SCHOOL_APPROVED' : 'SCHOOL_REJECTED',
    userId: schoolAdminId,
    metadata: {
      schoolName,
      approved,
      rejectionReason,
    },
  });
}
