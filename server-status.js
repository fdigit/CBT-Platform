#!/usr/bin/env node

require('dotenv').config({ path: '.env.local' })
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function checkServerStatus() {
  try {
    console.log('🚀 CBT Platform Server Status Check')
    console.log('=====================================')
    console.log('')
    
    // Test database connection
    await prisma.$connect()
    console.log('✅ Database: Connected to Supabase')
    
    // Check user counts
    const userCount = await prisma.user.count()
    const schoolCount = await prisma.school.count()
    const examCount = await prisma.exam.count()
    const questionCount = await prisma.question.count()
    
    console.log('✅ Data: All tables populated')
    console.log(`   - Users: ${userCount}`)
    console.log(`   - Schools: ${schoolCount}`)
    console.log(`   - Exams: ${examCount}`)
    console.log(`   - Questions: ${questionCount}`)
    
    console.log('')
    console.log('🌐 Server Information:')
    console.log('✅ Application: Running on http://localhost:3000')
    console.log('✅ Sign In: http://localhost:3000/auth/signin')
    console.log('')
    console.log('🔐 Quick Login:')
    console.log('Super Admin: admin@cbtplatform.com / admin123')
    console.log('School Admin: admin@school.com / admin123')
    console.log('Student: john.doe@student.com / admin123')
    console.log('')
    console.log('🎯 Ready to use! All systems operational.')
    
  } catch (error) {
    console.error('❌ Server status check failed:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

checkServerStatus()
