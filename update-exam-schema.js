#!/usr/bin/env node

require('dotenv').config({ path: '.env.local' })
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function updateExamSchema() {
  try {
    console.log('🔧 Updating exam schema...')
    
    // Add is_live column to exams table
    await prisma.$executeRaw`
      ALTER TABLE exams ADD COLUMN IF NOT EXISTS is_live BOOLEAN DEFAULT false;
    `
    
    console.log('✅ Added is_live column to exams table')
    
    // Update existing exam to be live
    await prisma.$executeRaw`
      UPDATE exams SET is_live = true WHERE id = 'exam-001';
    `
    
    console.log('✅ Updated sample exam to be live')
    
    // Verify the update
    const exam = await prisma.$queryRaw`
      SELECT id, title, is_live FROM exams WHERE id = 'exam-001';
    `
    
    console.log('📋 Updated exam:', exam[0])
    
    console.log('🎉 Exam schema update completed!')
    
  } catch (error) {
    console.error('❌ Error updating exam schema:', error)
  } finally {
    await prisma.$disconnect()
  }
}

updateExamSchema()
