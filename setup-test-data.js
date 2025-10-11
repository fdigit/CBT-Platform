require('dotenv').config({ path: '.env.local' });
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function setupTestData() {
  try {
    console.log('🔍 Checking database...\n');

    // Find Little Teddies school
    const school = await prisma.school.findFirst({
      where: {
        OR: [
          { slug: 'little-teddies' },
          { name: { contains: 'Little Teddies', mode: 'insensitive' } },
        ],
      },
    });

    if (!school) {
      console.log('❌ Little Teddies school not found!');
      return;
    }

    console.log(`✅ Found school: ${school.name} (ID: ${school.id})\n`);

    // Get all classes for the school
    const classes = await prisma.class.findMany({
      where: { schoolId: school.id },
      select: { id: true, name: true, section: true },
    });

    console.log(`📚 Classes found: ${classes.length}`);
    classes.forEach(c =>
      console.log(
        `  - ${c.name}${c.section ? ` ${c.section}` : ''} (ID: ${c.id})`
      )
    );
    console.log('');

    // Get teacher1
    const teacher1User = await prisma.user.findFirst({
      where: { email: 'teacher1@littleteddies.com' },
    });

    if (!teacher1User) {
      console.log('❌ teacher1@littleteddies.com not found!');
      return;
    }

    const teacher1 = await prisma.teacher.findUnique({
      where: { userId: teacher1User.id },
      include: {
        classes: {
          include: { class: true },
        },
      },
    });

    console.log(`👨‍🏫 Teacher: ${teacher1User.name} (${teacher1User.email})`);
    console.log(`   Current classes: ${teacher1.classes.length}`);
    teacher1.classes.forEach(tc =>
      console.log(
        `  - ${tc.class.name}${tc.class.section ? ` ${tc.class.section}` : ''}`
      )
    );
    console.log('');

    // Get all students
    const students = await prisma.student.findMany({
      where: { schoolId: school.id },
      include: {
        user: { select: { name: true, email: true } },
        class: { select: { name: true, section: true } },
      },
    });

    console.log(`👨‍🎓 Students found: ${students.length}`);
    students.forEach(s => {
      const className = s.class
        ? `${s.class.name}${s.class.section ? ` ${s.class.section}` : ''}`
        : 'No class';
      console.log(
        `  - ${s.user.name} (${s.user.email}) - Currently in: ${className}`
      );
    });
    console.log('');

    // Now make the changes
    console.log('🔧 Making changes...\n');

    // 1. Add teacher1 to ALL classes
    console.log('📝 Assigning teacher1 to all classes...');
    for (const classItem of classes) {
      // Check if already assigned
      const existing = await prisma.teacherClass.findFirst({
        where: {
          teacherId: teacher1.id,
          classId: classItem.id,
        },
      });

      if (!existing) {
        await prisma.teacherClass.create({
          data: {
            teacherId: teacher1.id,
            classId: classItem.id,
          },
        });
        console.log(
          `  ✅ Added to ${classItem.name}${classItem.section ? ` ${classItem.section}` : ''}`
        );
      } else {
        console.log(
          `  ⏭️  Already in ${classItem.name}${classItem.section ? ` ${classItem.section}` : ''}`
        );
      }
    }
    console.log('');

    // 2. Update ALL students to be in ALL classes
    // Note: In the actual database schema, a student can only be in ONE class at a time (classId field)
    // So we'll pick one class as their "primary" class, but we could track "enrolled classes" differently
    console.log(
      '⚠️  Note: The database schema only allows students to be in ONE class at a time.'
    );
    console.log(
      '   Students will be distributed evenly across classes for testing.\n'
    );

    // Distribute students evenly
    for (let i = 0; i < students.length; i++) {
      const targetClass = classes[i % classes.length];
      const student = students[i];

      if (student.classId !== targetClass.id) {
        await prisma.student.update({
          where: { id: student.id },
          data: { classId: targetClass.id },
        });
        console.log(
          `  ✅ ${student.user.name} → ${targetClass.name}${targetClass.section ? ` ${targetClass.section}` : ''}`
        );
      } else {
        console.log(
          `  ⏭️  ${student.user.name} already in ${targetClass.name}${targetClass.section ? ` ${targetClass.section}` : ''}`
        );
      }
    }

    console.log('\n✅ Setup complete!\n');

    // Show summary
    console.log('📊 SUMMARY:');
    const updatedTeacher = await prisma.teacher.findUnique({
      where: { id: teacher1.id },
      include: {
        classes: {
          include: { class: true },
        },
      },
    });
    console.log(
      `\n👨‍🏫 Teacher1 is now in ${updatedTeacher.classes.length} classes:`
    );
    updatedTeacher.classes.forEach(tc =>
      console.log(
        `  - ${tc.class.name}${tc.class.section ? ` ${tc.class.section}` : ''}`
      )
    );

    console.log(`\n👨‍🎓 Students distribution:`);
    for (const classItem of classes) {
      const studentsInClass = await prisma.student.count({
        where: { classId: classItem.id },
      });
      console.log(
        `  - ${classItem.name}${classItem.section ? ` ${classItem.section}` : ''}: ${studentsInClass} students`
      );
    }
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

setupTestData();
