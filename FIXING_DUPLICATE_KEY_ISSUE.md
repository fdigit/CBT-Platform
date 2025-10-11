# 🔧 Fixing Duplicate Key Issue - MongoDB

## ⚠️ Current Issue

Your database has duplicate data in the `ExamAttempt` collection that's preventing the schema update:

```
Duplicate key: { studentId: ObjectId('68d5581cd6d06acdc30f8d7f'), examId: ObjectId('68d67c722c6813cdd5957401'), attemptNumber: 1 }
```

This is an **existing data issue**, not related to the new Academic Results module.

---

## 🎯 Solutions (Choose One)

### **Option 1: Quick Fix - Ignore the Error** ⭐ RECOMMENDED

The Academic Results module can work even if this index fails. The error is only about indexes, not the collections themselves.

**Steps:**

1. **Just start your dev server:**
   ```bash
   npm run dev
   ```

2. **Open browser:** http://localhost:3000

3. **If you get Prisma errors, run:**
   ```bash
   npx prisma generate
   npm run dev
   ```

4. **Test the Academic Results module:**
   - Login and navigate to `/admin/academic-results/settings`
   - If it loads without errors, the module is working!

> The database might have already created the Academic Results collections before the error occurred.

---

### **Option 2: Fix the Duplicate Data** (More thorough)

Remove the duplicate exam attempt from your database.

**Using MongoDB Compass (GUI):**

1. **Download MongoDB Compass:** https://www.mongodb.com/try/download/compass
2. **Connect** using your connection string:
   ```
   mongodb+srv://fmfonn_db_user:jYpHacSWtpqa8zy0@cbt.g8vbjeb.mongodb.net/cbt_platform
   ```
3. **Navigate to:** `cbt_platform` database → `ExamAttempt` collection
4. **Find duplicates:**
   - Filter: `{ "studentId": ObjectId("68d5581cd6d06acdc30f8d7f"), "examId": ObjectId("68d67c722c6813cdd5957401") }`
5. **Keep one, delete the duplicate**
6. **Retry:**
   ```bash
   npx prisma db push
   ```

**Using MongoDB Atlas Web Interface:**

1. Go to https://cloud.mongodb.com/
2. Click **"Browse Collections"** on your cluster
3. Find `cbt_platform` → `ExamAttempt`
4. Search for the duplicate records
5. Delete one of the duplicates
6. Retry `npx prisma db push`

---

### **Option 3: Skip Index Creation** (Temporary workaround)

Comment out the unique index in your Prisma schema temporarily:

**Edit `prisma/schema.prisma`:**

Find the `ExamAttempt` model and comment out the unique constraint:

```prisma
model ExamAttempt {
  // ... other fields

  // Temporarily commented to bypass duplicate key issue
  // @@unique([studentId, examId, attemptNumber])
}
```

Then run:
```bash
npx prisma generate
npx prisma db push
```

After Academic Results is working, fix the duplicate data and uncomment the index.

---

## ✅ Verify Academic Results Module Works

Even with the index error, the Academic Results module should still work. Test by:

### **1. Start Dev Server:**
```bash
npm run dev
```

### **2. Open Browser:**
```
http://localhost:3000
```

### **3. Check These URLs:**

**Admin Settings:**
```
http://localhost:3000/admin/academic-results/settings
```
- If this loads → Module is working! ✅
- Create a term/session to confirm database connectivity

**Teacher Page:**
```
http://localhost:3000/teacher/academic-results
```

**Student Page:**
```
http://localhost:3000/student/results
```

### **4. Check Browser Console:**
- Press `F12` to open DevTools
- Look for errors in Console tab
- If no Prisma errors → You're good to go!

---

## 🔍 Understanding the Error

**What happened:**
- Your existing database has 2+ exam attempts with the same `(studentId, examId, attemptNumber)` combination
- Prisma is trying to add a unique index that prevents duplicates
- MongoDB refuses because duplicate data already exists

**Impact on Academic Results:**
- ❌ Doesn't affect the new Academic Results collections
- ❌ Doesn't affect Academic Results APIs
- ❌ Doesn't affect Academic Results frontend
- ✅ Only affects exam attempt uniqueness validation

**Collections that should exist:**
- `AcademicResult` - Your new results data ✅
- `GradingScale` - Grading configuration ✅
- `TermSession` - Academic periods ✅

These might have been created before the error occurred!

---

## 🚀 Recommended Path Forward

1. **Run:** `npm run dev`
2. **Test** Academic Results module (see testing steps above)
3. **If working:** Proceed with testing, fix duplicate data later
4. **If not working:** Try Option 2 or 3 above

---

## 📞 Need Help?

If Academic Results module doesn't load:

1. **Check dev server console** for specific errors
2. **Check browser console** (F12) for client-side errors
3. **Try:** `npx prisma generate` then `npm run dev` again
4. **Last resort:** Fix duplicate data using Option 2

---

## 🎯 Next Steps After This is Resolved

Once dev server is running:

1. ✅ Create term/session in Admin Settings
2. ✅ Test teacher result entry
3. ✅ Test admin approval
4. ✅ Test student view and PDF download

See `LOCAL_TESTING_SETUP.md` for complete testing guide.




