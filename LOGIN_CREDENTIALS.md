# 🔐 CBT Platform Login Credentials

## 🌐 Application Access

- **URL**: http://localhost:3000
- **Sign In Page**: http://localhost:3000/auth/signin

## 👤 User Accounts

### 🏛️ Super Admin (Global Platform Administrator)

- **Email**: `admin@cbtplatform.com`
- **Password**: `admin123`
- **Role**: SUPER_ADMIN
- **Access**: Full platform control, school approval, global settings
- **Dashboard**: http://localhost:3000/admin

### 🏫 School Admin (School Administrator)

- **Email**: `admin@littleteddies.com`
- **Password**: `admin123`
- **Role**: SCHOOL_ADMIN
- **Name**: Little Teddies Administrator
- **School**: Little Teddies
- **School Status**: APPROVED
- **Access**: School management, exam approval, student management
- **Dashboard**: http://localhost:3000/school

### 👨‍🏫 Teachers (Little Teddies)

- **Email**: `c`
- **Password**: `admin123`
- **Role**: TEACHER
- **Name**: Mrs. Sarah Johnson
- **Employee ID**: LT001
- **Specialization**: Early Childhood Education
- **Subjects**: Mathematics, English Language
- **Assigned Classes**: Nursery 1 A, Nursery 2 A
- **Dashboard**: http://localhost:3000/teacher

- **Email**: `teacher2@littleteddies.com`
- **Password**: `admin123`
- **Role**: TEACHER
- **Name**: Mr. David Williams
- **Employee ID**: LT002
- **Specialization**: Mathematics
- **Subjects**: Mathematics, Basic Science
- **Assigned Classes**: Primary 1 A, Primary 2 A
- **Dashboard**: http://localhost:3000/teacher

- **Email**: `teacher3@littleteddies.com`
- **Password**: `admin123`
- **Role**: TEACHER
- **Name**: Miss Emma Brown
- **Employee ID**: LT003
- **Specialization**: English Language
- **Subjects**: English Language, Social Studies
- **Assigned Classes**: Primary 1 A, Primary 3 A
- **Dashboard**: http://localhost:3000/teacher

### 👨‍🎓 Students (Little Teddies)

- **Email**: `student1@littleteddies.com` to `student10@littleteddies.com`
- **Password**: `admin123`
- **Registration Numbers**: LT001 to LT010
- **School**: Little Teddies
- **Classes**: Distributed across Nursery 1A, Nursery 2A, Primary 1A, Primary 2A, Primary 3A
- **Dashboard**: http://localhost:3000/student

**Sample Student Accounts:**

- `student1@littleteddies.com` - Alice Cooper (Nursery 1 A)
- `student2@littleteddies.com` - Bob Smith (Nursery 1 A)
- `student3@littleteddies.com` - Charlie Brown (Nursery 2 A)
- `student5@littleteddies.com` - Edward Norton (Primary 1 A)
- `student7@littleteddies.com` - George Wilson (Primary 2 A)
- `student9@littleteddies.com` - Ian Thompson (Primary 3 A)

### 🧪 Universal Test Student (For Testing All Features)

- **Email**: `student10@littleteddies.com`
- **Password**: `admin123`
- **Role**: STUDENT
- **Name**: Test Student Universal
- **Registration Number**: LT010
- **School**: Little Teddies
- **Primary Class**: Primary 3 A
- **Status**: ACTIVE
- **Access**: Can test all student features across multiple classes and subjects
- **Available Exams**: Mathematics Assessment, English Language Test
- **Dashboard**: http://localhost:3000/student

## 🎯 Quick Start Guide

### For Super Admin:

1. Go to http://localhost:3000/auth/signin
2. Login with `admin@cbtplatform.com` / `admin123`
3. Access Super Admin Dashboard at http://localhost:3000/admin
4. Approve schools, manage platform settings

### For School Admin (Little Teddies):

1. Go to http://localhost:3000/auth/signin
2. Login with `admin@littleteddies.com` / `admin123`
3. Access School Dashboard at http://localhost:3000/school
4. Approve teacher exams, manage students

### For Teachers (Little Teddies):

1. Go to http://localhost:3000/auth/signin
2. Login with any teacher email / `admin123`
3. Access Teacher Dashboard at http://localhost:3000/teacher
4. Create exams, manage classes, grade students

### For Students (Little Teddies):

1. Go to http://localhost:3000/auth/signin
2. Login with any student email / `admin123`
3. Access Student Dashboard at http://localhost:3000/student
4. Take exams, view results

## 📚 Available Features

### Super Admin Features:

- ✅ School approval/rejection
- ✅ Platform-wide analytics
- ✅ User management
- ✅ System settings

### School Admin Features:

- ✅ Create and manage exams
- ✅ Add/edit questions (MCQ, True/False, Essay)
- ✅ Student management
- ✅ Exam scheduling
- ✅ Results and analytics
- ✅ School dashboard

### Student Features:

- ✅ Take exams
- ✅ View exam results
- ✅ Student dashboard
- ✅ Exam history

## 🔧 Database Information

- **Database**: Supabase PostgreSQL
- **Connection**: Successfully established
- **Tables**: 8 tables created
- **Sample Data**: Loaded and ready

## 🚀 Getting Started

1. **Start the application**: `npm run dev`
2. **Access**: http://localhost:3002
3. **Login** with any of the credentials above
4. **Explore** the different dashboards and features

---

**Note**: All passwords are set to `admin123` for testing purposes. Change these in production!
