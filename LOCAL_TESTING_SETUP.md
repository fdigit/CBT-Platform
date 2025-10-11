# 🧪 Local Testing Setup Guide

## Your Current IP Address

**IP:** `98.97.79.19`  
**Purpose:** Add this to MongoDB Atlas to enable local testing

---

## 🔧 Step 1: Whitelist Your IP in MongoDB Atlas

### Instructions:

1. Go to **MongoDB Atlas:** https://cloud.mongodb.com/
2. Log in to your account
3. Select your project/organization
4. Click **"Network Access"** (left sidebar under Security)
5. Click **"Add IP Address"** (green button)
6. **Enter:**
   - IP Address: `98.97.79.19`
   - Comment: `Local Development - Oct 2025`
7. Click **"Confirm"**
8. Wait 30-60 seconds for changes to apply

---

## 🚀 Step 2: Apply Schema Changes Locally

After adding your IP, run these commands:

```bash
# Generate Prisma Client
npx prisma generate

# Push schema to database (creates collections)
npx prisma db push

# Verify connection
npx prisma db pull
```

Expected output:
```
✔ Generated Prisma Client
✔ The database is now in sync with the Prisma schema
```

---

## 🧪 Step 3: Start Development Server

```bash
# Start Next.js development server
npm run dev

# Server will start at:
# http://localhost:3000
```

---

## 📋 Step 4: Initial Setup (Admin Dashboard)

1. **Open browser:** http://localhost:3000
2. **Login as Admin**
3. **Navigate to:** `/admin/academic-results/settings`
4. **Create your first Term/Session:**
   - Term: "First Term"
   - Session: "2024/2025"
   - Start Date: (today or any date)
   - End Date: (future date)
   - Check "Current Term" ✅
   - Click "Add Term/Session"

5. **Review Grading Scale** (optional)
   - Default Nigerian scale is already configured
   - Customize if needed for your school
   - Click "Save Grading Scale" if changes made

---

## 🧪 Step 5: Test Complete Workflow

### **Test 1: Teacher Flow** (5 minutes)

1. **Login as Teacher**
2. **Go to:** "Academic Results" (in sidebar)
3. **Select:**
   - Class: (your class)
   - Subject: (your subject)
   - Term: "First Term"
   - Session: "2024/2025"
4. **Click:** "Add Single Result"
5. **Enter:**
   - Student: (select from dropdown)
   - CA Score: 35 (0-40)
   - Exam Score: 55 (0-60)
   - Comment: "Good performance"
6. **Verify:** Total = 90, Grade = A*, Grade Point = 5.0
7. **Click:** "Save Result"
8. **Click:** "Submit 1 for Approval"

### **Test 2: Teacher Bulk Upload** (3 minutes)

1. **Still on Academic Results page**
2. **Click:** "Bulk Upload"
3. **Click:** "Download CSV Template"
4. **Open template in Excel/Notepad**
5. **Fill in data:**
   ```csv
   S/N,Student Name,Reg Number,CA Score,Exam Score,Remarks
   1,Test Student,STU001,38,58,Excellent
   2,Another Student,STU002,30,50,Very good
   ```
6. **Save as:** `test_results.csv`
7. **Upload the file**
8. **Verify:** Shows "Created: 2" or "Updated: 2"
9. **Check:** Results appear in table

### **Test 3: Admin Flow** (5 minutes)

1. **Login as Admin**
2. **Go to:** "Academic Results" (in sidebar)
3. **Filter:** Status = "Submitted"
4. **You should see:** The result(s) submitted by teacher
5. **Click:** "Approve" on first result
6. **Add comment:** "Approved - Good work"
7. **Click:** "Approve Result"
8. **Click:** "Publish X Approved" button (top right)
9. **Confirm:** Publication

### **Test 4: Admin Analytics** (2 minutes)

1. **Click:** "View Analytics" button
2. **Select:**
   - Term: "First Term"
   - Session: "2024/2025"
3. **Verify displays:**
   - ✅ Total students count
   - ✅ Average GPA
   - ✅ Pass rate
   - ✅ Subject performance bar chart
   - ✅ Grade distribution pie chart
   - ✅ Top performers list

### **Test 5: Student Flow** (5 minutes)

1. **Login as Student** (one whose result was published)
2. **Go to:** "Results" (in sidebar)
3. **Click:** "Academic Results" tab
4. **Select:**
   - Term: "First Term"
   - Session: "2024/2025"
5. **Verify displays:**
   - ✅ GPA summary card with your GPA
   - ✅ Results table with subjects
   - ✅ CA, Exam, Total, Grade columns
   - ✅ Class average comparison
6. **Click:** "Download Result Slip"
7. **Verify:** PDF downloads successfully
8. **Open PDF:** Check formatting (header, table, GPA, comments)

---

## ✅ Success Checklist

After testing, verify:

- ✅ Teacher can enter single results
- ✅ Teacher can bulk upload via CSV
- ✅ Auto-grading works correctly (A* for 90+, A for 80-89, etc.)
- ✅ Teacher can submit results for approval
- ✅ Admin can approve/reject results
- ✅ Admin can publish approved results
- ✅ Analytics page shows charts and stats
- ✅ Student can view published results only
- ✅ Student GPA calculates correctly
- ✅ Student can download PDF result slip
- ✅ PDF is properly formatted

---

## 🔍 Troubleshooting Local Issues

### **Issue: "Server selection timeout" when running prisma db push**

**Solution:**
- Verify you added IP `98.97.79.19` to MongoDB Atlas
- Wait 60 seconds after adding IP
- Check your internet connection
- Restart terminal and try again

### **Issue: "Unauthorized" when testing APIs**

**Solution:**
- Clear browser cookies
- Check you're logged in with correct role
- Verify session is active

### **Issue: No students appear in dropdown**

**Solution:**
- Verify students are assigned to the selected class
- Check students have `status: 'ACTIVE'`
- Ensure you selected correct class/subject combination

### **Issue: Results don't show for student**

**Solution:**
- Verify results are PUBLISHED (not just APPROVED)
- Check student is selecting correct term/session
- Ensure student is enrolled in the class

### **Issue: PDF download fails**

**Solution:**
- Open browser console (F12) to see errors
- Verify student has published results for selected term/session
- Check if `jspdf` packages are installed: `npm list jspdf jspdf-autotable`

### **Issue: Bulk upload errors**

**Solution:**
- Download template from the modal (don't create your own)
- Ensure registration numbers match exactly (case-sensitive)
- Verify score ranges: CA (0-40), Exam (0-60)
- Check CSV encoding is UTF-8
- Remove any special characters from names

---

## 📊 Sample Test Data

### **Sample CSV for Bulk Upload:**

```csv
S/N,Student Name,Reg Number,CA Score,Exam Score,Remarks
1,John Doe,STU2024001,35,55,Good performance
2,Jane Smith,STU2024002,38,58,Excellent work
3,Bob Johnson,STU2024003,30,50,Very good
4,Alice Williams,STU2024004,32,52,Good effort
5,Charlie Brown,STU2024005,28,48,Fair performance
```

### **Expected Grades:**

| Total | Grade | GP | Remark |
|-------|-------|----|----|
| 90-100 | A* | 5.0 | Excellent |
| 80-89 | A | 4.5 | Very Good |
| 70-79 | B+ | 4.0 | Good |
| 60-69 | B | 3.5 | Average |
| 50-59 | C | 3.0 | Fair |
| 40-49 | D | 2.0 | Poor |
| 0-39 | F | 0.0 | Fail |

---

## 🎯 Performance Testing

After functional testing, check:

- ✅ Page load times < 2 seconds
- ✅ API response times < 1 second
- ✅ Bulk upload handles 50+ students smoothly
- ✅ Analytics page renders with 100+ results
- ✅ PDF generation < 3 seconds
- ✅ No console errors in browser
- ✅ No memory leaks during navigation

---

## 🔐 Security Testing

Verify authorization:

- ✅ Teacher can only see their own classes/subjects
- ✅ Teacher cannot approve results
- ✅ Student can only see their own results
- ✅ Student can only see PUBLISHED results
- ✅ Admin can access all schools (SUPER_ADMIN) or only their school (SCHOOL_ADMIN)

---

## 📝 Notes for Local Development

**Database:**
- Changes you make locally will affect your production MongoDB Atlas database
- Use test data or create separate test accounts
- Consider creating a separate development database cluster

**Hot Reload:**
- Next.js dev server has hot reload enabled
- Changes to components/pages reload automatically
- API route changes require manual refresh

**Debugging:**
- Use `console.log()` in API routes to debug
- Check Prisma queries with `prisma.$queryRaw()`
- Use React DevTools for component debugging

---

## 🚀 When Ready to Deploy

After successful local testing:

1. **Commit changes:**
   ```bash
   git add .
   git commit -m "feat: Academic Results Module tested and ready"
   git push origin main
   ```

2. **Whitelist Vercel IPs in MongoDB Atlas:**
   - Add IP: `0.0.0.0/0` (Allow from anywhere)
   - Or add Vercel-specific IPs

3. **Deploy to Vercel:**
   - Automatic deployment on push
   - Or manual: `vercel --prod`

4. **Test in production:**
   - Repeat tests on live URL
   - Verify environment variables are set

---

## 🎉 Local Testing Complete!

Once all tests pass:
- ✅ Module is working correctly
- ✅ Ready for production deployment
- ✅ Can train users on the system

**Next:** Deploy to Vercel following `VERCEL_DEPLOYMENT_GUIDE.md`




