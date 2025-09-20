-- Seed data for CBT Platform
-- Run this after creating the database schema

-- Insert sample school
INSERT INTO "schools" ("id", "name", "email", "phone", "approved", "createdAt") VALUES
('school-001', 'Tech Academy', 'admin@techacademy.com', '+234-123-456-7890', true, CURRENT_TIMESTAMP);

-- Insert super admin user
INSERT INTO "users" ("id", "email", "password", "name", "role", "createdAt", "updatedAt") VALUES
('super-admin-001', 'admin@cbtplatform.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J/8K5K5K.', 'Super Admin', 'SUPER_ADMIN', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Insert school admin user
INSERT INTO "users" ("id", "email", "password", "name", "role", "createdAt", "updatedAt", "schoolId") VALUES
('school-admin-001', 'admin@school.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J/8K5K5K.', 'School Admin', 'SCHOOL_ADMIN', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'school-001');

-- Insert school admin profile
INSERT INTO "school_admins" ("id", "userId", "schoolId") VALUES
('admin-profile-001', 'school-admin-001', 'school-001');

-- Insert sample students
INSERT INTO "users" ("id", "email", "password", "name", "role", "createdAt", "updatedAt", "schoolId") VALUES
('student-001', 'john.doe@student.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J/8K5K5K.', 'John Doe', 'STUDENT', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'school-001'),
('student-002', 'jane.smith@student.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J/8K5K5K.', 'Jane Smith', 'STUDENT', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'school-001'),
('student-003', 'mike.johnson@student.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J/8K5K5K.', 'Mike Johnson', 'STUDENT', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'school-001'),
('student-004', 'sarah.wilson@student.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J/8K5K5K.', 'Sarah Wilson', 'STUDENT', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'school-001'),
('student-005', 'david.brown@student.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J/8K5K5K.', 'David Brown', 'STUDENT', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'school-001');

-- Insert student profiles
INSERT INTO "students" ("id", "userId", "schoolId", "regNo") VALUES
('student-profile-001', 'student-001', 'school-001', 'STU001'),
('student-profile-002', 'student-002', 'school-001', 'STU002'),
('student-profile-003', 'student-003', 'school-001', 'STU003'),
('student-profile-004', 'student-004', 'school-001', 'STU004'),
('student-profile-005', 'student-005', 'school-001', 'STU005');

-- Insert sample exam
INSERT INTO "exams" ("id", "title", "description", "startTime", "endTime", "duration", "shuffle", "negativeMarking", "createdAt", "schoolId") VALUES
('exam-001', 'Mathematics Assessment', 'Basic mathematics test covering algebra and geometry', 
 CURRENT_TIMESTAMP + INTERVAL '1 day', 
 CURRENT_TIMESTAMP + INTERVAL '1 day 1 hour', 
 60, true, false, CURRENT_TIMESTAMP, 'school-001');

-- Insert sample questions
INSERT INTO "questions" ("id", "text", "type", "options", "correctAnswer", "points", "examId") VALUES
('q-001', 'What is 2 + 2?', 'MCQ', '["3", "4", "5", "6"]', '4', 1.0, 'exam-001'),
('q-002', 'What is the capital of Nigeria?', 'MCQ', '["Lagos", "Abuja", "Kano", "Ibadan"]', 'Abuja', 1.0, 'exam-001'),
('q-003', 'The sun rises in the east.', 'TRUE_FALSE', '["True", "False"]', 'True', 1.0, 'exam-001'),
('q-004', 'Explain the concept of photosynthesis.', 'ESSAY', null, 'Expected answer: Process by which plants convert sunlight into energy', 5.0, 'exam-001'),
('q-005', 'What is 10 × 5?', 'MCQ', '["45", "50", "55", "60"]', '50', 1.0, 'exam-001');

-- Note: Password hash above is for 'admin123' - change this in production!
