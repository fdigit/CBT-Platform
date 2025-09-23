const fs = require('fs');

const envContent = `DATABASE_URL="postgresql://postgres:Myangel002!@db.mydmheuxeczdgtzdwucu.supabase.co:5432/postgres"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="cbt-platform-secret-key-change-in-production"
NODE_ENV="development"
NEXT_PUBLIC_APP_URL="http://localhost:3000"`;

fs.writeFileSync('.env.local', envContent);
console.log('✅ .env.local file updated with your Supabase credentials!');
console.log('');
console.log('🔗 Database URL configured:');
console.log(
  'postgresql://postgres:Myangel002!@db.mydmheuxeczdgtzdwucu.supabase.co:5432/postgres'
);
console.log('');
console.log('🚀 Ready to test database connection!');
