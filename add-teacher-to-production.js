const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function addTeacher() {
  try {
    console.log('🔍 Adding teacher to production database...');
    
    // First, get the school ID (assuming Little Teddies school exists)
    const school = await prisma.school.findFirst({
      where: {
        OR: [
          { name: { contains: 'Little Teddies', mode: 'insensitive' } },
          { email: 'demo@school.com' } // fallback to demo school
        ]
      }
    });

    if (!school) {
      console.error('❌ No school found. Please create a school first.');
      return;
    }

    console.log('✅ Found school:', school.name);

    // Hash the password
    const hashedPassword = await bcrypt.hash('admin123', 12);

    // Create or update the teacher
    const teacher = await prisma.user.upsert({
      where: { email: 'teacher1@littleteddies.com' },
      update: {
        password: hashedPassword,
        name: 'Mrs. Sarah Johnson',
        role: 'TEACHER',
        schoolId: school.id,
      },
      create: {
        email: 'teacher1@littleteddies.com',
        password: hashedPassword,
        name: 'Mrs. Sarah Johnson',
        role: 'TEACHER',
        schoolId: school.id,
      },
    });

    console.log('✅ Teacher created/updated:', teacher.email);
    console.log('📧 Email:', teacher.email);
    console.log('🔑 Password: admin123');
    console.log('🏫 School:', school.name);
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

addTeacher();
