#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🚀 Setting up Multi-Vendor CBT Platform...\n');

// Check if .env.local exists
const envPath = path.join(process.cwd(), '.env.local');
if (!fs.existsSync(envPath)) {
  console.log('📝 Creating .env.local file...');
  const envExample = fs.readFileSync(
    path.join(process.cwd(), 'env.example'),
    'utf8'
  );
  fs.writeFileSync(envPath, envExample);
  console.log('✅ .env.local created from env.example');
  console.log('⚠️  Please update the environment variables in .env.local\n');
} else {
  console.log('✅ .env.local already exists\n');
}

// Check if node_modules exists
const nodeModulesPath = path.join(process.cwd(), 'node_modules');
if (!fs.existsSync(nodeModulesPath)) {
  console.log('📦 Installing dependencies...');
  try {
    execSync('npm install', { stdio: 'inherit' });
    console.log('✅ Dependencies installed\n');
  } catch (error) {
    console.error('❌ Failed to install dependencies:', error.message);
    process.exit(1);
  }
} else {
  console.log('✅ Dependencies already installed\n');
}

// Generate Prisma client
console.log('🔧 Generating Prisma client...');
try {
  execSync('npx prisma generate', { stdio: 'inherit' });
  console.log('✅ Prisma client generated\n');
} catch (error) {
  console.error('❌ Failed to generate Prisma client:', error.message);
  console.log('⚠️  Make sure your DATABASE_URL is correct in .env.local\n');
}

console.log('🎉 Setup completed!');
console.log('\n📋 Next steps:');
console.log('1. Update your environment variables in .env.local');
console.log('2. Set up your PostgreSQL database');
console.log('3. Run: npm run db:push');
console.log('4. Run: npm run db:seed');
console.log('5. Run: npm run dev');
console.log('\n🧪 Test credentials after seeding:');
console.log('Super Admin: admin@cbtplatform.com / admin123');
console.log('School Admin: admin@school.com / admin123');
console.log('Student: john.doe@student.com / student123');
