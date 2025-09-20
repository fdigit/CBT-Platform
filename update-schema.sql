-- Migration script to update the existing database schema
-- for the multi-tenant CBT platform

-- Add slug column to schools table
ALTER TABLE "schools" ADD COLUMN "slug" VARCHAR(255);

-- Add status column to schools table (replacing approved)
DO $$ 
BEGIN
    -- Create enum if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'SchoolStatus') THEN
        CREATE TYPE "SchoolStatus" AS ENUM ('PENDING', 'APPROVED', 'SUSPENDED', 'REJECTED');
    END IF;
END $$;

-- Add status column with default value
ALTER TABLE "schools" ADD COLUMN "status" "SchoolStatus" DEFAULT 'PENDING';

-- Add updatedAt column to schools table
ALTER TABLE "schools" ADD COLUMN "updatedAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP;

-- Update existing schools to have status based on approved field (if it exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'schools' AND column_name = 'approved') THEN
        UPDATE "schools" SET "status" = 'APPROVED' WHERE "approved" = true;
        UPDATE "schools" SET "status" = 'PENDING' WHERE "approved" = false;
        -- Drop the old approved column
        ALTER TABLE "schools" DROP COLUMN "approved";
    END IF;
END $$;

-- Generate slugs for existing schools
UPDATE "schools" 
SET "slug" = LOWER(
    REGEXP_REPLACE(
        REGEXP_REPLACE(
            REGEXP_REPLACE("name", '[^a-zA-Z0-9\s-]', '', 'g'),
            '\s+', '-', 'g'
        ),
        '-+', '-', 'g'
    )
)
WHERE "slug" IS NULL;

-- Handle duplicate slugs by appending numbers
DO $$
DECLARE
    school_record RECORD;
    new_slug VARCHAR(255);
    counter INTEGER;
BEGIN
    FOR school_record IN 
        SELECT id, slug FROM "schools" 
        WHERE slug IN (
            SELECT slug FROM "schools" 
            GROUP BY slug 
            HAVING COUNT(*) > 1
        )
        ORDER BY "createdAt"
    LOOP
        counter := 1;
        new_slug := school_record.slug || '-' || counter;
        
        WHILE EXISTS (SELECT 1 FROM "schools" WHERE slug = new_slug AND id != school_record.id) LOOP
            counter := counter + 1;
            new_slug := school_record.slug || '-' || counter;
        END LOOP;
        
        UPDATE "schools" SET slug = new_slug WHERE id = school_record.id;
    END LOOP;
END $$;

-- Make slug column unique and not null
ALTER TABLE "schools" ALTER COLUMN "slug" SET NOT NULL;
ALTER TABLE "schools" ADD CONSTRAINT "schools_slug_key" UNIQUE ("slug");

-- Update students table to rename regNo to regNumber (if regNo exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'students' AND column_name = 'regNo') THEN
        ALTER TABLE "students" RENAME COLUMN "regNo" TO "regNumber";
    END IF;
END $$;

-- Ensure regNumber is unique if not already
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                   WHERE table_name = 'students' AND constraint_name = 'students_regNumber_key') THEN
        ALTER TABLE "students" ADD CONSTRAINT "students_regNumber_key" UNIQUE ("regNumber");
    END IF;
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS "idx_schools_status" ON "schools"("status");
CREATE INDEX IF NOT EXISTS "idx_users_school_id" ON "users"("schoolId");
CREATE INDEX IF NOT EXISTS "idx_students_school_id" ON "students"("schoolId");
CREATE INDEX IF NOT EXISTS "idx_exams_school_id" ON "exams"("schoolId");
CREATE INDEX IF NOT EXISTS "idx_exams_start_time" ON "exams"("startTime");
CREATE INDEX IF NOT EXISTS "idx_results_student_id" ON "results"("studentId");
CREATE INDEX IF NOT EXISTS "idx_results_exam_id" ON "results"("examId");

-- Update any existing triggers or functions if needed
-- (This is a placeholder for any custom database functions)

COMMIT;
