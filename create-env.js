const fs = require('fs')

const envContent = `DATABASE_URL="postgresql://postgres:[YOUR_PASSWORD]@db.mydmheuxeczdgtzdwucu.supabase.co:5432/postgres"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="cbt-platform-secret-key-change-in-production"
NODE_ENV="development"
NEXT_PUBLIC_APP_URL="http://localhost:3000"`

fs.writeFileSync('.env.local', envContent)
console.log('✅ .env.local file created successfully!')
console.log('')
console.log('📝 IMPORTANT: Please edit .env.local and replace [YOUR_PASSWORD] with your actual Supabase database password')
console.log('')
console.log('Your connection string should look like:')
console.log('DATABASE_URL="postgresql://postgres:your_actual_password@db.mydmheuxeczdgtzdwucu.supabase.co:5432/postgres"')
