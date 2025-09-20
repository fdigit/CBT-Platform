# Multi-Vendor CBT Platform

A comprehensive Computer-Based Testing platform built with Next.js 15, React 19, TypeScript, and PostgreSQL. This platform allows schools to register, manage students, and conduct online examinations with advanced analytics and security features.

## 🚀 Features

### Authentication & Roles
- **Multi-role system**: Super Admin, School Admin, Student
- **Role-based access control** with NextAuth.js
- **JWT sessions** for secure authentication
- **Password hashing** with bcryptjs

### School Management
- **School registration** with admin approval workflow
- **Individual school dashboards** with analytics
- **Student management** with CSV import support
- **Unique login credentials** for each student

### Exam Management
- **Multiple question types**: MCQ, True/False, Essay
- **Bulk question upload** via CSV/Excel templates
- **Flexible exam settings**: duration, start/end time, shuffle options, negative marking
- **Real-time exam monitoring**

### Exam Environment
- **Countdown timer** with auto-submit
- **Auto-save answers** every 30 seconds
- **Anti-cheating measures**: fullscreen mode, copy-paste disabled
- **Question navigation** and review system

### Grading & Results
- **Auto-grading** for objective questions
- **Manual grading** for essay questions
- **Export results** to PDF/Excel formats
- **Performance analytics** and reporting

### Payments
- **Subscription model** (monthly/yearly for schools)
- **Pay-per-exam** option
- **Paystack integration** for Nigerian payments
- **Payment verification** and tracking

### Analytics & Reports
- **Student performance tracking**
- **School-level dashboards** with charts (Recharts)
- **Real-time statistics** and insights
- **Exportable reports** in multiple formats

## 🛠 Tech Stack

### Core Framework & Runtime
- **Next.js 15** (App Router)
- **React 19**
- **TypeScript 5**

### Styling & UI
- **Tailwind CSS 3**
- **@tailwindcss/typography**
- **Lucide React** (icons)
- **Framer Motion** (animations)
- **Radix UI** (components)

### Database & ORM
- **PostgreSQL 16** (via Supabase or Neon)
- **Prisma 6** (ORM)

### Caching & Real-Time
- **Upstash Redis** for exam sessions
- **Optional WebSockets** (Pusher/Socket.IO)

### State Management
- **@tanstack/react-query 5**
- **Zustand** (optional for local UI state)

### Authentication & Security
- **NextAuth.js 4**
- **bcryptjs** (password hashing)
- **jsonwebtoken**
- **zod** (validation)
- **Helmet.js** (security headers)

### Exam & Content Management
- **Tiptap** (rich text editor)
- **DOMPurify** (XSS protection)

### File & Media Handling
- **Cloudinary** (image storage)
- **Sharp** (image processing)

### Email & Notifications
- **Resend** (transactional emails)
- **react-hot-toast** (UI notifications)

### Payments
- **Paystack** (primary payment processor)
- **Stripe** (optional for future expansion)

### Analytics & Charts
- **Recharts** (dashboards)
- **PostHog or Plausible** (usage analytics)

### Utilities
- **date-fns** (date manipulation)
- **uuid** (unique identifiers)
- **clsx** (conditional classes)
- **tailwind-merge** (class merging)
- **dotenv** (environment variables)

### Development Tools
- **ESLint** (linting)
- **Prettier** (code formatting)
- **Jest + React Testing Library** (testing)

### Hosting
- **Vercel** (frontend + API routes)
- **Supabase/Neon** (database)
- **Upstash** (Redis)
- **Cloudinary** (media)

## 📋 Prerequisites

Before you begin, ensure you have the following installed:
- **Node.js** (v18 or higher)
- **npm** or **yarn**
- **PostgreSQL** database
- **Git**

## 🚀 Getting Started

### 1. Clone the Repository

```bash
git clone <repository-url>
cd multi-vendor-cbt-platform
```

### 2. Install Dependencies

```bash
npm install
# or
yarn install
```

### 3. Environment Setup

Copy the environment example file and configure your variables:

```bash
cp env.example .env.local
```

Update the following variables in `.env.local`:

```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/cbt_platform"

# NextAuth.js
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-nextauth-secret-key-here"

# Redis (Upstash)
UPSTASH_REDIS_REST_URL="https://your-redis-url.upstash.io"
UPSTASH_REDIS_REST_TOKEN="your-redis-token"

# Paystack
PAYSTACK_SECRET_KEY="sk_test_your_paystack_secret_key"
PAYSTACK_PUBLIC_KEY="pk_test_your_paystack_public_key"

# Cloudinary
CLOUDINARY_CLOUD_NAME="your-cloudinary-cloud-name"
CLOUDINARY_API_KEY="your-cloudinary-api-key"
CLOUDINARY_API_SECRET="your-cloudinary-api-secret"

# Resend (Email)
RESEND_API_KEY="re_your_resend_api_key"

# App Configuration
NODE_ENV="development"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### 4. Database Setup

Generate Prisma client and run migrations:

```bash
# Generate Prisma client
npm run db:generate

# Push schema to database
npm run db:push

# Seed the database with sample data
npm run db:seed
```

### 5. Start Development Server

```bash
npm run dev
# or
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 🧪 Test Credentials

After running the seed script, you can use these test credentials:

### Super Admin
- **Email**: `admin@cbtplatform.com`
- **Password**: `admin123`

### School Admin
- **Email**: `admin@school.com`
- **Password**: `admin123`

### Student
- **Email**: `john.doe@student.com`
- **Password**: `student123`

## 📁 Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   ├── auth/              # Authentication pages
│   ├── admin/             # Super admin dashboard
│   ├── school/            # School admin dashboard
│   ├── student/           # Student dashboard
│   └── globals.css        # Global styles
├── components/            # Reusable UI components
│   ├── ui/               # Base UI components
│   └── providers.tsx     # Context providers
├── lib/                  # Utility libraries
│   ├── auth.ts           # NextAuth configuration
│   ├── prisma.ts         # Prisma client
│   ├── utils.ts          # Utility functions
│   ├── validations.ts    # Zod schemas
│   └── paystack.ts       # Payment integration
├── hooks/                # Custom React hooks
├── types/                # TypeScript type definitions
└── context/              # React contexts
```

## 🔧 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint errors
- `npm run format` - Format code with Prettier
- `npm run format:check` - Check code formatting
- `npm run db:generate` - Generate Prisma client
- `npm run db:push` - Push schema to database
- `npm run db:migrate` - Run database migrations
- `npm run db:seed` - Seed database with sample data
- `npm run db:studio` - Open Prisma Studio
- `npm run test` - Run tests
- `npm run test:watch` - Run tests in watch mode

## 🚀 Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Set environment variables in Vercel dashboard
4. Deploy!

### Database Setup

For production, use a managed PostgreSQL service:

- **Supabase**: [supabase.com](https://supabase.com)
- **Neon**: [neon.tech](https://neon.tech)
- **Railway**: [railway.app](https://railway.app)

### Redis Setup

For caching and session management:

- **Upstash**: [upstash.com](https://upstash.com)

## 🔒 Security Features

- **Password hashing** with bcryptjs
- **JWT-based sessions** with NextAuth.js
- **Role-based access control**
- **Anti-cheating measures** in exam environment
- **XSS protection** with DOMPurify
- **CSRF protection** with NextAuth.js
- **Secure headers** with Helmet.js

## 📊 Database Schema

The platform uses a comprehensive database schema with the following main entities:

- **Users** (with roles: SUPER_ADMIN, SCHOOL_ADMIN, STUDENT)
- **Schools** (with approval workflow)
- **Students** (linked to schools)
- **Exams** (with flexible settings)
- **Questions** (MCQ, True/False, Essay)
- **Answers** (student responses)
- **Results** (graded scores)
- **Payments** (subscription tracking)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

If you encounter any issues or have questions:

1. Check the [Issues](https://github.com/your-repo/issues) page
2. Create a new issue with detailed information
3. Contact the development team

## 🎯 Roadmap

- [ ] Mobile app (React Native)
- [ ] Advanced analytics dashboard
- [ ] Multi-language support
- [ ] Integration with LMS platforms
- [ ] AI-powered question generation
- [ ] Video proctoring integration
- [ ] Advanced reporting features

---

Built with ❤️ using Next.js, React, TypeScript, and modern web technologies.
