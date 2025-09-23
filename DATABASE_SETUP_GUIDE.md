# 🗄️ Database Setup Guide for CBT Platform

## Quick Setup Options

### Option 1: Supabase (Recommended - Free Tier)

1. **Create Supabase Account**
   - Go to [supabase.com](https://supabase.com)
   - Sign up and create new project
   - Choose a region close to you

2. **Get Connection Details**
   - Go to Settings > Database
   - Copy the connection string
   - It looks like: `postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres`

3. **Update Environment**
   ```env
   DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres"
   ```

### Option 2: Neon (Free Tier)

1. **Create Neon Account**
   - Go to [neon.tech](https://neon.tech)
   - Sign up and create new database

2. **Get Connection String**
   - Copy the connection string from dashboard
   - Format: `postgresql://[USER]:[PASSWORD]@[HOST]/[DATABASE]?sslmode=require`

3. **Update Environment**
   ```env
   DATABASE_URL="postgresql://[USER]:[PASSWORD]@[HOST]/[DATABASE]?sslmode=require"
   ```

### Option 3: Local PostgreSQL

1. **Install PostgreSQL**

   ```bash
   # Windows (Chocolatey)
   choco install postgresql

   # macOS (Homebrew)
   brew install postgresql

   # Ubuntu/Debian
   sudo apt-get install postgresql postgresql-contrib
   ```

2. **Create Database**

   ```sql
   sudo -u postgres psql
   CREATE DATABASE cbt_platform;
   CREATE USER cbt_user WITH PASSWORD 'your_password';
   GRANT ALL PRIVILEGES ON DATABASE cbt_platform TO cbt_user;
   ```

3. **Update Environment**
   ```env
   DATABASE_URL="postgresql://postgres:password@localhost:5432/cbt_platform"
   ```

## 🛠️ Setting Up Database Schema

### Method 1: Using pgAdmin (GUI)

1. **Install pgAdmin**
   - Download from [pgadmin.org](https://www.pgadmin.org/download/)
   - Install and launch

2. **Connect to Database**
   - Right-click "Servers" → "Create" → "Server"
   - **General Tab**: Name = "CBT Platform"
   - **Connection Tab**:
     - Host: `localhost` (local) or your cloud host
     - Port: `5432`
     - Database: `postgres` or your database name
     - Username: `postgres` or your username
     - Password: your password
     - SSL Mode: `Require` (for cloud) or `Prefer` (for local)

3. **Run Schema Script**
   - Open Query Tool (Tools → Query Tool)
   - Copy and paste contents of `database-setup.sql`
   - Execute (F5)

4. **Add Sample Data**
   - Copy and paste contents of `seed-data.sql`
   - Execute (F5)

### Method 2: Using Command Line

```bash
# Connect to database
psql "postgresql://postgres:password@localhost:5432/cbt_platform"

# Run schema
\i database-setup.sql

# Run seed data
\i seed-data.sql
```

## 🔧 Environment Configuration

Create `.env.local` file in your project root:

```env
# Database
DATABASE_URL="postgresql://postgres:password@localhost:5432/cbt_platform"

# NextAuth.js
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-here-change-this-in-production"

# Optional Services (can be added later)
UPSTASH_REDIS_REST_URL="https://your-redis-url.upstash.io"
UPSTASH_REDIS_REST_TOKEN="your-redis-token"
PAYSTACK_SECRET_KEY="sk_test_your_paystack_secret_key"
PAYSTACK_PUBLIC_KEY="pk_test_your_paystack_public_key"
CLOUDINARY_CLOUD_NAME="your-cloudinary-cloud-name"
CLOUDINARY_API_KEY="your-cloudinary-api-key"
CLOUDINARY_API_SECRET="your-cloudinary-api-secret"
RESEND_API_KEY="re_your_resend_api_key"

# App Configuration
NODE_ENV="development"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

## 🚀 Testing the Connection

1. **Start the Application**

   ```bash
   npm run dev
   ```

2. **Test Login Credentials**
   - Super Admin: `admin@cbtplatform.com` / `admin123`
   - School Admin: `admin@school.com` / `admin123`
   - Student: `john.doe@student.com` / `admin123`

3. **Verify Database Connection**
   - Check if you can access `/school` dashboard
   - Try creating an exam at `/school/exams/create`
   - Check if data persists after page refresh

## 🔍 Troubleshooting

### Common Issues:

1. **Connection Refused**
   - Check if PostgreSQL is running
   - Verify host, port, and credentials
   - Ensure firewall allows connections

2. **SSL Certificate Error**
   - Add `?sslmode=require` to connection string
   - For local development, use `?sslmode=disable`

3. **Permission Denied**
   - Ensure user has proper privileges
   - Check if database exists
   - Verify connection string format

4. **Prisma Generation Issues**
   - Use manual SQL setup (database-setup.sql)
   - Restart development server
   - Clear node_modules and reinstall

### Connection String Formats:

```env
# Local PostgreSQL
DATABASE_URL="postgresql://username:password@localhost:5432/database_name"

# Supabase
DATABASE_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres"

# Neon
DATABASE_URL="postgresql://[USER]:[PASSWORD]@[HOST]/[DATABASE]?sslmode=require"

# Railway
DATABASE_URL="postgresql://postgres:[PASSWORD]@[HOST]:[PORT]/[DATABASE]"
```

## 📊 Database Schema Overview

The CBT platform includes these main tables:

- **users**: User accounts with roles
- **schools**: School information
- **school_admins**: School administrator profiles
- **students**: Student profiles
- **exams**: Examination details
- **questions**: Exam questions
- **answers**: Student responses
- **results**: Exam scores
- **payments**: Payment records

## 🎯 Next Steps

1. **Set up database** using one of the methods above
2. **Run the schema** and seed data scripts
3. **Update environment variables**
4. **Test the application** with provided credentials
5. **Start creating exams** and managing students!

---

**Need Help?** Check the troubleshooting section or refer to the main README.md for additional setup instructions.
