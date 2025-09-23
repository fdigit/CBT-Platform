# Multi-Tenant CBT Platform Implementation

## Overview

This implementation provides a comprehensive multi-tenant Computer-Based Testing (CBT) platform where multiple schools can register and manage their own students, exams, and results independently.

## Architecture

### Database Schema

The platform uses a **school-scoped multi-tenancy** approach where:

- Each school has a unique `slug` for URL-friendly identification
- All user data is scoped to a specific school via `schoolId`
- Super admins can access all data across schools
- School admins and students are restricted to their school's data

### Key Models

#### School Model

```typescript
{
  id: string          // Unique identifier
  name: string        // School name
  slug: string        // URL-friendly identifier (unique)
  email: string       // School contact email (unique)
  phone?: string      // Optional phone number
  status: SchoolStatus // PENDING | APPROVED | SUSPENDED | REJECTED
  createdAt: Date
  updatedAt: Date
}
```

#### User Model

```typescript
{
  id: string
  email: string       // Unique across platform
  name: string
  role: Role          // SUPER_ADMIN | SCHOOL_ADMIN | STUDENT
  schoolId?: string   // Foreign key to School (null for super admin)
  // ... other fields
}
```

## Role-Based Access Control

### Roles

1. **SUPER_ADMIN**
   - Can view and manage all schools
   - Approve/reject school registrations
   - Access all data across the platform
   - No school scoping restrictions

2. **SCHOOL_ADMIN**
   - Can only manage their school's data
   - Create and manage exams
   - Manage students within their school
   - View school-specific analytics

3. **STUDENT**
   - Can only access their own data
   - Take exams from their school
   - View their own results
   - Cannot access other students' data

### Access Control Implementation

#### Middleware

- `src/lib/middleware.ts` - Comprehensive middleware for API routes
- `middleware.ts` - Next.js route protection middleware

#### Key Functions

```typescript
// School scoping for queries
getSchoolScopedWhere(user, additionalWhere);

// Student-specific scoping
getStudentScopedWhere(user, additionalWhere);

// Permission checks
canAccessSchool(user, schoolId);
canManageStudents(user);
canCreateExams(user);
```

## API Routes

All API routes are protected with role-based middleware:

### School Management

- `POST /api/schools/register` - Public school registration
- `GET /api/schools` - Super admin only
- `PATCH /api/schools` - Super admin only (approve/reject)

### Exam Management

- `POST /api/exams` - School admin only (scoped to their school)
- `GET /api/exams` - School admin only (scoped to their school)

### Student APIs

- `GET /api/student/exams` - Student only (scoped to their school)
- `GET /api/student/results` - Student only (their results only)

## Database Migration

### Updating Existing Database

Run the migration script to update your existing database:

```bash
psql -d your_database < update-schema.sql
```

### Key Changes

- Added `slug` field to schools (unique)
- Replaced `approved` with `status` enum
- Renamed `regNo` to `regNumber` in students
- Added performance indexes

### Prisma Migration

After updating the schema, generate and apply Prisma migrations:

```bash
npx prisma db push
# or
npx prisma migrate dev --name multi-tenant-update
```

## Implementation Features

### ✅ Completed Features

1. **Multi-tenant Database Schema**
   - School model with unique slug
   - User scoping with schoolId
   - Student and Exam models with school relations

2. **Role-based Authentication**
   - NextAuth.js integration
   - Session includes schoolId and role
   - Automatic dashboard routing

3. **Access Control Middleware**
   - API route protection
   - School-scoped queries
   - Permission validation

4. **School Registration**
   - Public registration endpoint
   - Automatic slug generation
   - Admin approval workflow

5. **Dashboard Routing**
   - Automatic redirection based on role
   - Route protection middleware
   - Role-specific layouts

## Usage Examples

### School Registration

```typescript
const response = await fetch('/api/schools/register', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: 'Brain Island Academy',
    email: 'admin@brainisland.edu',
    phone: '+234-xxx-xxx-xxxx',
    adminName: 'John Doe',
    adminEmail: 'john@brainisland.edu',
    adminPassword: 'securepassword123',
  }),
});
```

### Creating School-Scoped Exam

```typescript
// Automatically scoped to admin's school
const exam = await fetch('/api/exams', {
  method: 'POST',
  body: JSON.stringify({
    exam: {
      title: 'Mathematics Final Exam',
      startTime: '2024-01-15T09:00:00Z',
      endTime: '2024-01-15T11:00:00Z',
      duration: 120,
    },
    questions: [
      /* questions array */
    ],
  }),
});
```

## Security Features

1. **School Isolation**
   - All queries are automatically scoped
   - No cross-school data access
   - Secure session management

2. **Role Enforcement**
   - Route-level protection
   - API endpoint restrictions
   - Middleware validation

3. **Data Validation**
   - Zod schema validation
   - Type-safe operations
   - Input sanitization

## URL Structure

- Super Admin: `/admin/*`
- School Admin: `/school/*`
- Students: `/student/*`
- School-specific URLs: `/schools/{slug}/*` (future feature)

## Environment Variables

Ensure these are set in your `.env` file:

```env
DATABASE_URL="postgresql://..."
NEXTAUTH_SECRET="your-secret"
NEXTAUTH_URL="http://localhost:3000"
```

## TypeScript Support

Comprehensive TypeScript types are provided in:

- `src/types/models.ts` - Database models and interfaces
- `src/types/next-auth.d.ts` - NextAuth session extensions

## Testing

The implementation includes:

- Type safety throughout
- Comprehensive error handling
- Validation at all levels
- Secure defaults

## Next Steps

1. **Frontend Updates**
   - Update dashboard components to use new types
   - Implement school-specific branding
   - Add bulk student import functionality

2. **Advanced Features**
   - School-specific domains
   - Custom branding per school
   - Advanced analytics per school
   - Bulk operations

3. **Performance Optimizations**
   - Database query optimization
   - Caching strategies
   - Background job processing

## Support

For questions or issues with the multi-tenant implementation, refer to:

- Database schema: `prisma/schema.prisma`
- Type definitions: `src/types/models.ts`
- Middleware: `src/lib/middleware.ts`
- Migration script: `update-schema.sql`
