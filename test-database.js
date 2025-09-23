#!/usr/bin/env node

require('dotenv').config({ path: '.env.local' });
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testDatabaseConnection() {
  console.log('🔍 Testing database connection...');

  try {
    // Test basic connection
    await prisma.$connect();
    console.log('✅ Database connection successful!');

    // Test if tables exist
    console.log('📋 Checking database tables...');

    const tables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name;
    `;

    console.log('📊 Found tables:', tables.map(t => t.table_name).join(', '));

    // Test if we can query users
    console.log('👥 Testing user queries...');
    const userCount = await prisma.user.count();
    console.log(`✅ Found ${userCount} users in database`);

    // Test if we can query schools
    console.log('🏫 Testing school queries...');
    const schoolCount = await prisma.school.count();
    console.log(`✅ Found ${schoolCount} schools in database`);

    // Test if we can query exams
    console.log('📝 Testing exam queries...');
    const examCount = await prisma.exam.count();
    console.log(`✅ Found ${examCount} exams in database`);

    // Test if we can query questions
    console.log('❓ Testing question queries...');
    const questionCount = await prisma.question.count();
    console.log(`✅ Found ${questionCount} questions in database`);

    // Test specific user lookup
    console.log('🔐 Testing authentication data...');
    const testUser = await prisma.user.findFirst({
      where: { email: 'admin@school.com' },
      include: { school: true },
    });

    if (testUser) {
      console.log(`✅ Test user found: ${testUser.name} (${testUser.role})`);
      if (testUser.school) {
        console.log(`✅ School: ${testUser.school.name}`);
      }
    } else {
      console.log('⚠️  Test user not found - database might need seeding');
    }

    // Test exam with questions
    console.log('📚 Testing exam with questions...');
    const testExam = await prisma.exam.findFirst({
      include: { questions: true, school: true },
    });

    if (testExam) {
      console.log(`✅ Test exam found: ${testExam.title}`);
      console.log(`✅ Questions: ${testExam.questions.length}`);
      console.log(`✅ School: ${testExam.school?.name}`);
    } else {
      console.log('⚠️  Test exam not found - database might need seeding');
    }

    console.log('');
    console.log('🎉 Database connection test completed successfully!');
    console.log('');
    console.log('📋 Summary:');
    console.log(`- Users: ${userCount}`);
    console.log(`- Schools: ${schoolCount}`);
    console.log(`- Exams: ${examCount}`);
    console.log(`- Questions: ${questionCount}`);
    console.log('');
    console.log('🚀 Your CBT platform is ready to use!');
  } catch (error) {
    console.error('❌ Database connection test failed:', error.message);

    if (error.message.includes('ENOTFOUND')) {
      console.log('💡 Tip: Check your DATABASE_URL in .env.local');
      console.log(
        '💡 Make sure you replaced [YOUR_PASSWORD] with your actual password'
      );
    } else if (error.message.includes('password')) {
      console.log('💡 Tip: Check your database password in .env.local');
    } else if (
      error.message.includes('relation') &&
      error.message.includes('does not exist')
    ) {
      console.log(
        '💡 Tip: Run the database setup script: node setup-supabase.js'
      );
    }

    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

testDatabaseConnection();
