@echo off
echo 🚀 Setting up CBT Platform with Supabase...
echo.

echo 📝 Step 1: Update your .env.local file
echo Please edit .env.local and replace [YOUR_PASSWORD] with your actual Supabase database password
echo.
echo Your connection string should look like:
echo DATABASE_URL="postgresql://postgres:your_actual_password@db.mydmheuxeczdgtzdwucu.supabase.co:5432/postgres"
echo.
pause

echo 📝 Step 2: Running database setup...
node setup-supabase.js

echo.
echo ✅ Setup complete! You can now start the application with:
echo npm run dev
echo.
pause
