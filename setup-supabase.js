#!/usr/bin/env node

require('dotenv').config({ path: '.env.local' })
const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function setupDatabase() {
  console.log('🚀 Setting up CBT Platform database...')
  
  try {
    // Test connection
    await prisma.$connect()
    console.log('✅ Connected to Supabase database')
    
    // Create enum types
    console.log('📝 Creating enum types...')
    await prisma.$executeRaw`
      DO $$ BEGIN
        CREATE TYPE "Role" AS ENUM ('SUPER_ADMIN', 'SCHOOL_ADMIN', 'STUDENT');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `
    
    await prisma.$executeRaw`
      DO $$ BEGIN
        CREATE TYPE "QuestionType" AS ENUM ('MCQ', 'TRUE_FALSE', 'ESSAY');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `
    
    await prisma.$executeRaw`
      DO $$ BEGIN
        CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'SUCCESS', 'FAILED');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `
    
    console.log('✅ Enum types created')
    
    // Create tables
    console.log('📝 Creating tables...')
    
    // Users table
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "users" (
        "id" TEXT NOT NULL,
        "email" TEXT NOT NULL,
        "password" TEXT NOT NULL,
        "name" TEXT NOT NULL,
        "role" "Role" NOT NULL,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL,
        "schoolId" TEXT,
        CONSTRAINT "users_pkey" PRIMARY KEY ("id")
      );
    `
    
    // Schools table
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "schools" (
        "id" TEXT NOT NULL,
        "name" TEXT NOT NULL,
        "email" TEXT NOT NULL,
        "phone" TEXT,
        "logoUrl" TEXT,
        "approved" BOOLEAN NOT NULL DEFAULT false,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "schools_pkey" PRIMARY KEY ("id")
      );
    `
    
    // School admins table
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "school_admins" (
        "id" TEXT NOT NULL,
        "userId" TEXT NOT NULL,
        "schoolId" TEXT NOT NULL,
        CONSTRAINT "school_admins_pkey" PRIMARY KEY ("id")
      );
    `
    
    // Students table
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "students" (
        "id" TEXT NOT NULL,
        "userId" TEXT NOT NULL,
        "schoolId" TEXT NOT NULL,
        "regNo" TEXT NOT NULL,
        CONSTRAINT "students_pkey" PRIMARY KEY ("id")
      );
    `
    
    // Exams table
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "exams" (
        "id" TEXT NOT NULL,
        "title" TEXT NOT NULL,
        "description" TEXT,
        "startTime" TIMESTAMP(3) NOT NULL,
        "endTime" TIMESTAMP(3) NOT NULL,
        "duration" INTEGER NOT NULL,
        "shuffle" BOOLEAN NOT NULL DEFAULT false,
        "negativeMarking" BOOLEAN NOT NULL DEFAULT false,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "schoolId" TEXT NOT NULL,
        CONSTRAINT "exams_pkey" PRIMARY KEY ("id")
      );
    `
    
    // Questions table
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "questions" (
        "id" TEXT NOT NULL,
        "text" TEXT NOT NULL,
        "type" "QuestionType" NOT NULL,
        "options" JSONB,
        "correctAnswer" JSONB,
        "points" DOUBLE PRECISION NOT NULL DEFAULT 1,
        "examId" TEXT NOT NULL,
        CONSTRAINT "questions_pkey" PRIMARY KEY ("id")
      );
    `
    
    // Answers table
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "answers" (
        "id" TEXT NOT NULL,
        "studentId" TEXT NOT NULL,
        "questionId" TEXT NOT NULL,
        "examId" TEXT NOT NULL,
        "response" JSONB,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "answers_pkey" PRIMARY KEY ("id")
      );
    `
    
    // Results table
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "results" (
        "id" TEXT NOT NULL,
        "studentId" TEXT NOT NULL,
        "examId" TEXT NOT NULL,
        "score" DOUBLE PRECISION NOT NULL,
        "gradedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "results_pkey" PRIMARY KEY ("id")
      );
    `
    
    // Payments table
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "payments" (
        "id" TEXT NOT NULL,
        "schoolId" TEXT NOT NULL,
        "amount" DOUBLE PRECISION NOT NULL,
        "currency" TEXT NOT NULL DEFAULT 'NGN',
        "status" "PaymentStatus" NOT NULL,
        "reference" TEXT NOT NULL,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
      );
    `
    
    console.log('✅ Tables created')
    
    // Create indexes
    console.log('📝 Creating indexes...')
    await prisma.$executeRaw`CREATE UNIQUE INDEX IF NOT EXISTS "users_email_key" ON "users"("email");`
    await prisma.$executeRaw`CREATE UNIQUE INDEX IF NOT EXISTS "schools_email_key" ON "schools"("email");`
    await prisma.$executeRaw`CREATE UNIQUE INDEX IF NOT EXISTS "school_admins_userId_key" ON "school_admins"("userId");`
    await prisma.$executeRaw`CREATE UNIQUE INDEX IF NOT EXISTS "students_userId_key" ON "students"("userId");`
    await prisma.$executeRaw`CREATE UNIQUE INDEX IF NOT EXISTS "students_regNo_key" ON "students"("regNo");`
    await prisma.$executeRaw`CREATE UNIQUE INDEX IF NOT EXISTS "payments_reference_key" ON "payments"("reference");`
    
    console.log('✅ Indexes created')
    
    // Add foreign key constraints
    console.log('📝 Adding foreign key constraints...')
    await prisma.$executeRaw`ALTER TABLE "users" ADD CONSTRAINT IF NOT EXISTS "users_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE SET NULL ON UPDATE CASCADE;`
    await prisma.$executeRaw`ALTER TABLE "school_admins" ADD CONSTRAINT IF NOT EXISTS "school_admins_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;`
    await prisma.$executeRaw`ALTER TABLE "school_admins" ADD CONSTRAINT IF NOT EXISTS "school_admins_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE RESTRICT ON UPDATE CASCADE;`
    await prisma.$executeRaw`ALTER TABLE "students" ADD CONSTRAINT IF NOT EXISTS "students_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;`
    await prisma.$executeRaw`ALTER TABLE "students" ADD CONSTRAINT IF NOT EXISTS "students_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE RESTRICT ON UPDATE CASCADE;`
    await prisma.$executeRaw`ALTER TABLE "exams" ADD CONSTRAINT IF NOT EXISTS "exams_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE RESTRICT ON UPDATE CASCADE;`
    await prisma.$executeRaw`ALTER TABLE "questions" ADD CONSTRAINT IF NOT EXISTS "questions_examId_fkey" FOREIGN KEY ("examId") REFERENCES "exams"("id") ON DELETE RESTRICT ON UPDATE CASCADE;`
    await prisma.$executeRaw`ALTER TABLE "answers" ADD CONSTRAINT IF NOT EXISTS "answers_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE RESTRICT ON UPDATE CASCADE;`
    await prisma.$executeRaw`ALTER TABLE "answers" ADD CONSTRAINT IF NOT EXISTS "answers_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "questions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;`
    await prisma.$executeRaw`ALTER TABLE "answers" ADD CONSTRAINT IF NOT EXISTS "answers_examId_fkey" FOREIGN KEY ("examId") REFERENCES "exams"("id") ON DELETE RESTRICT ON UPDATE CASCADE;`
    await prisma.$executeRaw`ALTER TABLE "results" ADD CONSTRAINT IF NOT EXISTS "results_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE RESTRICT ON UPDATE CASCADE;`
    await prisma.$executeRaw`ALTER TABLE "results" ADD CONSTRAINT IF NOT EXISTS "results_examId_fkey" FOREIGN KEY ("examId") REFERENCES "exams"("id") ON DELETE RESTRICT ON UPDATE CASCADE;`
    await prisma.$executeRaw`ALTER TABLE "payments" ADD CONSTRAINT IF NOT EXISTS "payments_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE RESTRICT ON UPDATE CASCADE;`
    
    console.log('✅ Foreign key constraints added')
    
    // Insert seed data
    console.log('🌱 Inserting seed data...')
    
    const hashedPassword = await bcrypt.hash('admin123', 12)
    
    // Create sample school
    const school = await prisma.school.upsert({
      where: { email: 'admin@techacademy.com' },
      update: {},
      create: {
        id: 'school-001',
        name: 'Tech Academy',
        email: 'admin@techacademy.com',
        phone: '+234-123-456-7890',
        approved: true,
      },
    })
    
    // Create super admin
    const superAdmin = await prisma.user.upsert({
      where: { email: 'admin@cbtplatform.com' },
      update: {},
      create: {
        id: 'super-admin-001',
        email: 'admin@cbtplatform.com',
        password: hashedPassword,
        name: 'Super Admin',
        role: 'SUPER_ADMIN',
      },
    })
    
    // Create school admin
    const schoolAdmin = await prisma.user.upsert({
      where: { email: 'admin@school.com' },
      update: {},
      create: {
        id: 'school-admin-001',
        email: 'admin@school.com',
        password: hashedPassword,
        name: 'School Admin',
        role: 'SCHOOL_ADMIN',
        schoolId: school.id,
      },
    })
    
    // Create school admin profile
    await prisma.schoolAdmin.upsert({
      where: { userId: schoolAdmin.id },
      update: {},
      create: {
        id: 'admin-profile-001',
        userId: schoolAdmin.id,
        schoolId: school.id,
      },
    })
    
    // Create sample students
    const students = [
      { id: 'student-001', email: 'john.doe@student.com', name: 'John Doe', regNo: 'STU001' },
      { id: 'student-002', email: 'jane.smith@student.com', name: 'Jane Smith', regNo: 'STU002' },
      { id: 'student-003', email: 'mike.johnson@student.com', name: 'Mike Johnson', regNo: 'STU003' },
      { id: 'student-004', email: 'sarah.wilson@student.com', name: 'Sarah Wilson', regNo: 'STU004' },
      { id: 'student-005', email: 'david.brown@student.com', name: 'David Brown', regNo: 'STU005' },
    ]
    
    for (const studentData of students) {
      const user = await prisma.user.upsert({
        where: { email: studentData.email },
        update: {},
        create: {
          id: studentData.id,
          email: studentData.email,
          password: hashedPassword,
          name: studentData.name,
          role: 'STUDENT',
          schoolId: school.id,
        },
      })
      
      await prisma.student.upsert({
        where: { userId: user.id },
        update: {},
        create: {
          id: `student-profile-${studentData.id}`,
          userId: user.id,
          schoolId: school.id,
          regNo: studentData.regNo,
        },
      })
    }
    
    // Create sample exam
    const exam = await prisma.exam.upsert({
      where: { id: 'exam-001' },
      update: {},
      create: {
        id: 'exam-001',
        title: 'Mathematics Assessment',
        description: 'Basic mathematics test covering algebra and geometry',
        startTime: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
        endTime: new Date(Date.now() + 25 * 60 * 60 * 1000), // Tomorrow + 1 hour
        duration: 60,
        shuffle: true,
        negativeMarking: false,
        schoolId: school.id,
      },
    })
    
    // Create sample questions
    const questions = [
      {
        id: 'q-001',
        text: 'What is 2 + 2?',
        type: 'MCQ',
        options: ['3', '4', '5', '6'],
        correctAnswer: '4',
        points: 1.0,
      },
      {
        id: 'q-002',
        text: 'What is the capital of Nigeria?',
        type: 'MCQ',
        options: ['Lagos', 'Abuja', 'Kano', 'Ibadan'],
        correctAnswer: 'Abuja',
        points: 1.0,
      },
      {
        id: 'q-003',
        text: 'The sun rises in the east.',
        type: 'TRUE_FALSE',
        options: ['True', 'False'],
        correctAnswer: 'True',
        points: 1.0,
      },
      {
        id: 'q-004',
        text: 'Explain the concept of photosynthesis.',
        type: 'ESSAY',
        options: null,
        correctAnswer: 'Expected answer: Process by which plants convert sunlight into energy',
        points: 5.0,
      },
      {
        id: 'q-005',
        text: 'What is 10 × 5?',
        type: 'MCQ',
        options: ['45', '50', '55', '60'],
        correctAnswer: '50',
        points: 1.0,
      },
    ]
    
    for (const questionData of questions) {
      await prisma.question.upsert({
        where: { id: questionData.id },
        update: {},
        create: {
          id: questionData.id,
          text: questionData.text,
          type: questionData.type,
          options: questionData.options,
          correctAnswer: questionData.correctAnswer,
          points: questionData.points,
          examId: exam.id,
        },
      })
    }
    
    console.log('✅ Seed data inserted')
    console.log('🎉 Database setup completed successfully!')
    console.log('')
    console.log('📋 Test Credentials:')
    console.log('Super Admin: admin@cbtplatform.com / admin123')
    console.log('School Admin: admin@school.com / admin123')
    console.log('Student: john.doe@student.com / admin123')
    console.log('')
    console.log('🚀 You can now start the application with: npm run dev')
    
  } catch (error) {
    console.error('❌ Error setting up database:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

setupDatabase()
