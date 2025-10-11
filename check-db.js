const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkDatabase() {
  try {
    console.log('=== SCHOOLS ===');
    const schools = await prisma.school.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
        status: true,
        _count: {
          select: {
            teachers: true,
            students: true,
            classes: true,
          },
        },
      },
    });
    console.log(JSON.stringify(schools, null, 2));

    // Find Little Teddies school
    const littleTeddies = schools.find(
      s =>
        s.slug === 'little-teddies' ||
        s.name.toLowerCase().includes('little teddies')
    );

    if (littleTeddies) {
      console.log('\n=== LITTLE TEDDIES CLASSES ===');
      const classes = await prisma.class.findMany({
        where: { schoolId: littleTeddies.id },
        select: {
          id: true,
          name: true,
          section: true,
          academicYear: true,
          _count: {
            select: {
              students: true,
              teachers: true,
            },
          },
        },
      });
      console.log(JSON.stringify(classes, null, 2));

      console.log('\n=== LITTLE TEDDIES STUDENTS ===');
      const students = await prisma.student.findMany({
        where: { schoolId: littleTeddies.id },
        select: {
          id: true,
          regNumber: true,
          user: {
            select: {
              name: true,
              email: true,
            },
          },
          classId: true,
          class: {
            select: {
              name: true,
              section: true,
            },
          },
        },
      });
      console.log(JSON.stringify(students, null, 2));

      console.log('\n=== LITTLE TEDDIES TEACHERS ===');
      const teachers = await prisma.teacher.findMany({
        where: { schoolId: littleTeddies.id },
        select: {
          id: true,
          employeeId: true,
          user: {
            select: {
              name: true,
              email: true,
            },
          },
          classes: {
            select: {
              class: {
                select: {
                  name: true,
                  section: true,
                },
              },
            },
          },
        },
      });
      console.log(JSON.stringify(teachers, null, 2));
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkDatabase();
