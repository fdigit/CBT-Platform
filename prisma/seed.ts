import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed...');

  // Create Super Admin
  const superAdminPassword = await bcrypt.hash('admin123', 12);
  const superAdmin = await prisma.user.upsert({
    where: { email: 'admin@cbtplatform.com' },
    update: {},
    create: {
      email: 'admin@cbtplatform.com',
      password: superAdminPassword,
      name: 'Super Admin',
      role: 'SUPER_ADMIN',
    },
  });

  console.log('✅ Super Admin created:', superAdmin.email);

  // Create Sample School
  const school = await prisma.school.upsert({
    where: { email: 'demo@school.com' },
    update: {},
    create: {
      name: 'Demo High School',
      slug: 'demo-high-school',
      email: 'demo@school.com',
      phone: '+234-123-456-7890',
      status: 'APPROVED',
    },
  });

  console.log('✅ School created:', school.name);

  // Create School Admin
  const schoolAdminPassword = await bcrypt.hash('admin123', 12);
  const schoolAdmin = await prisma.user.upsert({
    where: { email: 'admin@school.com' },
    update: {},
    create: {
      email: 'admin@school.com',
      password: schoolAdminPassword,
      name: 'School Administrator',
      role: 'SCHOOL_ADMIN',
      schoolId: school.id,
    },
  });

  // Create School Admin Profile
  await prisma.schoolAdmin.upsert({
    where: { userId: schoolAdmin.id },
    update: {},
    create: {
      userId: schoolAdmin.id,
      schoolId: school.id,
    },
  });

  console.log('✅ School Admin created:', schoolAdmin.email);

  // Create Sample Students
  const studentPassword = await bcrypt.hash('student123', 12);
  const students = [
    {
      email: 'john.doe@student.com',
      name: 'John Doe',
      regNo: 'STU001',
    },
    {
      email: 'jane.smith@student.com',
      name: 'Jane Smith',
      regNo: 'STU002',
    },
    {
      email: 'mike.johnson@student.com',
      name: 'Mike Johnson',
      regNo: 'STU003',
    },
    {
      email: 'sarah.wilson@student.com',
      name: 'Sarah Wilson',
      regNo: 'STU004',
    },
    {
      email: 'david.brown@student.com',
      name: 'David Brown',
      regNo: 'STU005',
    },
  ];

  for (const studentData of students) {
    const user = await prisma.user.upsert({
      where: { email: studentData.email },
      update: {},
      create: {
        email: studentData.email,
        password: studentPassword,
        name: studentData.name,
        role: 'STUDENT',
        schoolId: school.id,
      },
    });

    await prisma.student.upsert({
      where: { userId: user.id },
      update: {},
      create: {
        userId: user.id,
        schoolId: school.id,
        regNumber: studentData.regNo,
      },
    });

    console.log('✅ Student created:', studentData.name);
  }

  // Create Sample Exam
  const exam = await prisma.exam.create({
    data: {
      title: 'Mathematics Assessment',
      description: 'Basic mathematics test covering algebra and geometry',
      startTime: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
      endTime: new Date(Date.now() + 25 * 60 * 60 * 1000), // Tomorrow + 1 hour
      duration: 60, // 60 minutes
      shuffle: true,
      negativeMarking: false,
      schoolId: school.id,
    },
  });

  console.log('✅ Exam created:', exam.title);

  // Create Sample Questions
  const questions = [
    {
      text: 'What is the value of x in the equation 2x + 5 = 15?',
      type: 'MCQ' as const,
      options: ['5', '10', '15', '20'],
      correctAnswer: ['5'],
      points: 1,
    },
    {
      text: 'The sum of angles in a triangle is always 180 degrees.',
      type: 'TRUE_FALSE' as const,
      options: ['True', 'False'],
      correctAnswer: 'True',
      points: 1,
    },
    {
      text: 'Calculate the area of a circle with radius 7cm. (Use π = 3.14)',
      type: 'ESSAY' as const,
      options: null,
      correctAnswer: {
        expectedAnswer: '153.86 cm²',
        explanation: 'Area = πr² = 3.14 × 7² = 153.86 cm²',
      },
      points: 2,
    },
    {
      text: 'Which of the following is a prime number?',
      type: 'MCQ' as const,
      options: ['4', '6', '7', '8'],
      correctAnswer: ['7'],
      points: 1,
    },
    {
      text: 'The square root of 64 is 8.',
      type: 'TRUE_FALSE' as const,
      options: ['True', 'False'],
      correctAnswer: 'True',
      points: 1,
    },
  ];

  for (const questionData of questions) {
    await prisma.question.create({
      data: {
        text: questionData.text,
        type: questionData.type,
        options: questionData.options || undefined,
        correctAnswer: questionData.correctAnswer,
        points: questionData.points,
        examId: exam.id,
      },
    });
  }

  console.log('✅ Questions created:', questions.length);

  // Create Sample Payment
  await prisma.payment.create({
    data: {
      schoolId: school.id,
      amount: 50000, // ₦50,000
      currency: 'NGN',
      status: 'SUCCESS',
      reference: 'PAY_' + Date.now(),
    },
  });

  console.log('✅ Sample payment created');

  console.log('🎉 Seed completed successfully!');
  console.log('\n📋 Test Credentials:');
  console.log('Super Admin: admin@cbtplatform.com / admin123');
  console.log('School Admin: admin@school.com / admin123');
  console.log('Student: john.doe@student.com / student123');
}

main()
  .catch(e => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
