#!/usr/bin/env node

require('dotenv').config({ path: '.env.local' });
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function checkSuperAdmin() {
  try {
    console.log('🔍 Checking Super Admin credentials...');
    console.log('');

    const superAdmin = await prisma.user.findUnique({
      where: { email: 'admin@cbtplatform.com' },
      include: { school: true },
    });

    if (superAdmin) {
      console.log('✅ Super Admin Found!');
      console.log('');
      console.log('📋 Super Admin Details:');
      console.log('Email:', superAdmin.email);
      console.log('Name:', superAdmin.name);
      console.log('Role:', superAdmin.role);
      console.log('Password:', 'Set (hashed)');
      console.log('School ID:', superAdmin.schoolId || 'None (Global Admin)');
      console.log('');
      console.log('🔐 Login Credentials:');
      console.log('Email: admin@cbtplatform.com');
      console.log('Password: admin123');
      console.log('');
      console.log('🌐 Access URLs:');
      console.log('Application: http://localhost:3002');
      console.log('Sign In: http://localhost:3002/auth/signin');
      console.log('Admin Dashboard: http://localhost:3002/admin');
      console.log('');

      // Test password verification
      const isValidPassword = await bcrypt.compare(
        'admin123',
        superAdmin.password
      );
      console.log(
        '🔒 Password Verification:',
        isValidPassword ? '✅ Valid' : '❌ Invalid'
      );
    } else {
      console.log('❌ Super Admin not found!');
      console.log('Creating Super Admin...');

      const hashedPassword = await bcrypt.hash('admin123', 12);

      const newSuperAdmin = await prisma.user.create({
        data: {
          id: 'super-admin-001',
          email: 'admin@cbtplatform.com',
          password: hashedPassword,
          name: 'Super Admin',
          role: 'SUPER_ADMIN',
        },
      });

      console.log('✅ Super Admin created successfully!');
      console.log('');
      console.log('🔐 Login Credentials:');
      console.log('Email: admin@cbtplatform.com');
      console.log('Password: admin123');
    }

    // Also check other admin users
    console.log('');
    console.log('👥 All Admin Users:');
    const allAdmins = await prisma.user.findMany({
      where: {
        role: {
          in: ['SUPER_ADMIN', 'SCHOOL_ADMIN'],
        },
      },
      include: { school: true },
    });

    allAdmins.forEach(admin => {
      console.log(`- ${admin.name} (${admin.role}): ${admin.email}`);
      if (admin.school) {
        console.log(`  School: ${admin.school.name}`);
      }
    });
  } catch (error) {
    console.error('❌ Error checking Super Admin:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkSuperAdmin();
