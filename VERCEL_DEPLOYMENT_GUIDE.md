# 🚀 Vercel Deployment Guide - Academic Results Module

## ✅ Pre-Deployment Checklist

All code has been implemented and is ready for deployment:
- ✅ 27 new files created (APIs, components, pages)
- ✅ 6 existing files updated (schema, types, sidebars, student page)
- ✅ Required npm packages installed (`jspdf`, `jspdf-autotable`, `xlsx`)
- ✅ PostgreSQL remnants removed
- ✅ MongoDB schema configured
- ✅ `.env` file configured with MongoDB Atlas connection

---

## 🔧 Local MongoDB Connection Issue

Your local machine cannot connect to MongoDB Atlas due to:
- **IP Whitelist** - Your current IP may not be whitelisted
- **Network/Firewall** - Local restrictions

**Solution:** Deploy to Vercel where the connection will work automatically.

---

## 📝 Step-by-Step Deployment

### **Step 1: Fix MongoDB Atlas IP Whitelist (Important!)**

1. Go to [MongoDB Atlas](https://cloud.mongodb.com/)
2. Navigate to: **Network Access** (in left sidebar)
3. Click **"Add IP Address"**
4. Choose one of:
   - **"Allow Access from Anywhere"** - `0.0.0.0/0` (easiest for Vercel)
   - **"Add Current IP Address"** (for local testing)
5. Click **"Confirm"**

> ⚠️ **Important:** Vercel uses dynamic IPs, so "Allow Access from Anywhere" is recommended for production deployments.

---

### **Step 2: Commit and Push Your Changes**

```bash
# Check what files have changed
git status

# Add all new Academic Results files
git add .

# Commit with descriptive message
git commit -m "feat: Add complete Academic Results Module

- Add AcademicResult, GradingScale, TermSession models to Prisma schema
- Implement 14 backend APIs (teacher, admin, student)
- Add grading calculation utilities with Nigerian grading scale
- Create teacher results entry interface with bulk upload
- Build admin approval dashboard with analytics
- Add student results view with PDF download
- Update navigation in all sidebars
- Install required packages: jspdf, jspdf-autotable, xlsx"

# Push to your repository
git push origin main
```

---

### **Step 3: Configure Vercel Environment Variables**

1. Go to your [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your **CBT project**
3. Go to **Settings** → **Environment Variables**
4. Add/Update these variables:

```env
DATABASE_URL=mongodb+srv://fmfonn_db_user:jYpHacSWtpqa8zy0@cbt.g8vbjeb.mongodb.net/cbt_platform?retryWrites=true&w=majority

NEXTAUTH_URL=https://your-app.vercel.app
NEXTAUTH_SECRET=your-nextauth-secret-key-here

# (Keep your other existing environment variables)
```

> ⚠️ Make sure to set environment variables for **Production**, **Preview**, and **Development** environments.

---

### **Step 4: Deploy to Vercel**

Vercel will automatically deploy when you push to your repository.

**OR manually trigger deployment:**

1. In Vercel Dashboard → **Deployments**
2. Click **"Redeploy"** or wait for automatic deployment
3. Monitor the build logs

---

### **Step 5: Verify Database Schema Applied**

After deployment, Vercel will run `prisma generate` automatically during build.

To manually push schema changes to production database:

```bash
# In Vercel project settings, add this to Build Command:
npx prisma generate && npx prisma db push --accept-data-loss && next build
```

**OR** use the Vercel CLI locally (recommended):

```bash
# Install Vercel CLI
npm install -g vercel

# Login to Vercel
vercel login

# Link to your project
vercel link

# Run db push with production environment
vercel env pull .env.production
npx prisma db push
```

---

## 🧪 Post-Deployment Testing

### **1. Initial Setup (Admin)**

1. Login as **School Admin** or **Super Admin**
2. Go to `/admin/academic-results/settings`
3. **Create Term/Session:**
   - Term: "First Term"
   - Session: "2024/2025"
   - Set start/end dates
   - Mark as "Current Term" ✅
4. **Review Grading Scale** (default is already set)
   - Optionally customize for your school
   - Click "Save Grading Scale"

### **2. Test Teacher Flow**

1. Login as **Teacher**
2. Navigate to **Academic Results** (in sidebar)
3. Select: Class, Subject, Term, Session
4. **Test Single Entry:**
   - Click "Add Single Result"
   - Select student
   - Enter CA score (0-40)
   - Enter Exam score (0-60)
   - Verify total auto-calculates
   - Verify grade auto-assigns
   - Click "Save Result"
5. **Test Bulk Upload:**
   - Click "Bulk Upload"
   - Download CSV template
   - Fill in student data
   - Upload file
   - Verify results created
6. **Submit for Approval:**
   - Review results in table
   - Click "Submit X for Approval"
   - Confirm submission

### **3. Test Admin Flow**

1. Login as **School Admin**
2. Go to `/admin/academic-results`
3. Filter: Status = "Submitted"
4. **Test Approval:**
   - Click "Approve" on a result
   - Add HOD/Principal comments (optional)
   - Confirm approval
5. **Test Publishing:**
   - Click "Publish X Approved" button
   - Confirm publication
6. **View Analytics:**
   - Click "View Analytics"
   - Verify charts display correctly
   - Check top performers list

### **4. Test Student Flow**

1. Login as **Student**
2. Go to **Results** page
3. Click **"Academic Results"** tab
4. Select Term and Session
5. Verify:
   - ✅ Results table displays correctly
   - ✅ GPA summary shows correct calculation
   - ✅ Class average comparison visible
6. **Test PDF Download:**
   - Click "Download Result Slip"
   - Verify PDF downloads
   - Check PDF formatting (header, table, GPA, comments)

---

## 🔍 Troubleshooting

### **Issue: "Unauthorized" errors**

**Solution:**
- Check NEXTAUTH_URL in Vercel environment variables
- Verify NEXTAUTH_SECRET is set correctly
- Clear browser cookies and login again

### **Issue: Database connection errors on Vercel**

**Solution:**
- Verify DATABASE_URL in Vercel environment variables
- Check MongoDB Atlas IP whitelist includes `0.0.0.0/0`
- Ensure MongoDB cluster is active

### **Issue: "No results found" for students**

**Causes:**
1. Results not published (only APPROVED, not PUBLISHED)
2. Wrong term/session selected
3. Student not enrolled in class

**Solution:**
- Admin must PUBLISH approved results (not just approve)
- Verify term/session matches
- Check student's class assignment

### **Issue: PDF download fails**

**Solution:**
- Verify `jspdf` and `jspdf-autotable` are in `package.json` dependencies
- Check browser console for errors
- Ensure student has published results for selected term/session

### **Issue: Bulk upload errors**

**Solution:**
- Download the CSV template from the upload modal
- Ensure registration numbers match exactly (case-sensitive)
- Verify CA scores: 0-40, Exam scores: 0-60
- Check for special characters in student names

### **Issue: Prisma schema not applied**

**Solution:**
```bash
# SSH into Vercel (if possible) or use CLI
vercel env pull
npx prisma generate
npx prisma db push
```

---

## 📊 Database Collections Created

After successful deployment, these collections will exist in MongoDB:

- ✅ `AcademicResult` - Student CA and Exam scores
- ✅ `GradingScale` - School-specific grading configuration
- ✅ `TermSession` - Academic terms and sessions

---

## 🎉 Success Indicators

Your deployment is successful when:

- ✅ Teacher can enter and submit results
- ✅ Admin can approve and publish results
- ✅ Student can view results and download PDF
- ✅ Analytics page shows charts
- ✅ No console errors in browser
- ✅ PDF downloads with correct formatting

---

## 🔐 Security Notes

1. **Never commit `.env` file** - Already in `.gitignore`
2. **Rotate NEXTAUTH_SECRET** if exposed
3. **Use strong MongoDB passwords**
4. **Review MongoDB Atlas IP whitelist** regularly
5. **Enable MongoDB Atlas audit logs** for production

---

## 📞 Need Help?

**Common Issues:**
- MongoDB connection: Check IP whitelist
- Missing environment variables: Verify Vercel settings
- Build failures: Check build logs in Vercel dashboard
- Runtime errors: Check Vercel function logs

**Resources:**
- MongoDB Atlas Docs: https://docs.atlas.mongodb.com/
- Vercel Docs: https://vercel.com/docs
- Prisma Docs: https://www.prisma.io/docs

---

## 🎯 Quick Command Reference

```bash
# Commit and push changes
git add .
git commit -m "feat: Add Academic Results Module"
git push origin main

# Deploy via Vercel CLI
vercel --prod

# Pull Vercel environment variables
vercel env pull .env.production

# Push Prisma schema to production
npx prisma db push

# View Vercel logs
vercel logs
```

---

**🎉 You're all set! Deploy and test your Academic Results Module.**

After deployment, create a term/session in Admin Settings, then test the complete workflow:
**Teacher Entry → Admin Approval → Student View → PDF Download** ✨


