# 🚀 Supabase Setup Guide for CBT Platform

## Your Supabase Project Details

- **Project URL**: https://mydmheuxeczdgtzdwucu.supabase.co
- **Project Reference**: mydmheuxeczdgtzdwucu
- **Anon Key**: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im15ZG1oZXV4ZWN6ZGd0emR3dWN1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgwMjkzMDAsImV4cCI6MjA3MzYwNTMwMH0.yXgW_61J7chz6a2GvwiH_W2SQujqMWSpp_56dtaD5Uk

## Step 1: Get Your Database Password

1. **Go to your Supabase Dashboard**: https://supabase.com/dashboard/project/mydmheuxeczdgtzdwucu
2. **Navigate to**: Settings → Database
3. **Find**: "Connection string" section
4. **Copy the password** from the connection string (it's the part after `postgres:` and before `@`)

## Step 2: Create Environment File

1. **Create `.env.local`** in your project root
2. **Copy contents** from `supabase-config.env`
3. **Replace `[YOUR_DATABASE_PASSWORD]`** with your actual database password

Example:

```env
DATABASE_URL="postgresql://postgres:your_actual_password_here@db.mydmheuxeczdgtzdwucu.supabase.co:5432/postgres"
```

## Step 3: Set Up Database Schema

### Option A: Using Supabase SQL Editor (Recommended)

1. **Go to**: Supabase Dashboard → SQL Editor
2. **Create new query**
3. **Copy and paste** the contents of `database-setup.sql`
4. **Run the query**

### Option B: Using pgAdmin

1. **Connect to Supabase** in pgAdmin:

   ```
   General Tab:
   - Name: CBT Platform Supabase

   Connection Tab:
   - Host: db.mydmheuxeczdgtzdwucu.supabase.co
   - Port: 5432
   - Database: postgres
   - Username: postgres
   - Password: [your database password]
   - SSL Mode: Require
   ```

2. **Run the SQL scripts**:
   - Open Query Tool
   - Copy `database-setup.sql` content
   - Execute (F5)
   - Copy `seed-data.sql` content
   - Execute (F5)

## Step 4: Test the Connection

1. **Start your development server**:

   ```bash
   npm run dev
   ```

2. **Test login credentials**:
   - Super Admin: `admin@cbtplatform.com` / `admin123`
   - School Admin: `admin@school.com` / `admin123`
   - Student: `john.doe@student.com` / `admin123`

## Step 5: Verify Database Connection

1. **Go to**: http://localhost:3000/auth/signin
2. **Login** as school admin: `admin@school.com` / `admin123`
3. **Navigate to**: School Dashboard
4. **Try creating an exam**: Click "Create Exam"

## Troubleshooting

### Common Issues:

1. **"Invalid password" error**
   - Double-check your database password in `.env.local`
   - Make sure there are no extra spaces or characters

2. **"Connection refused" error**
   - Verify the connection string format
   - Check if SSL mode is set correctly

3. **"Database does not exist" error**
   - Run the `database-setup.sql` script first
   - Make sure you're connected to the `postgres` database

### Connection String Format:

```
postgresql://postgres:[PASSWORD]@db.mydmheuxeczdgtzdwucu.supabase.co:5432/postgres
```

## Next Steps

1. ✅ **Database connected** to Supabase
2. ✅ **Schema created** with all tables
3. ✅ **Sample data loaded** for testing
4. 🚀 **Ready to create exams**!

## Supabase Dashboard Access

- **Dashboard**: https://supabase.com/dashboard/project/mydmheuxeczdgtzdwucu
- **SQL Editor**: https://supabase.com/dashboard/project/mydmheuxeczdgtzdwucu/sql
- **Table Editor**: https://supabase.com/dashboard/project/mydmheuxeczdgtzdwucu/editor

You can now:

- View your database tables in the Supabase dashboard
- Run SQL queries directly in the SQL editor
- Monitor your database usage and performance
- Manage your database backups and settings

---

**Need Help?** Check the troubleshooting section or refer to the main README.md for additional setup instructions.
