# Bulk Results Upload - Excel Template Guide

## 📋 Excel Template Format

Use this exact format for bulk uploading student results:

### Column Headers (Row 1)
| S/N | Student Name | Reg Number | CA Score | Exam Score | Remarks |
|-----|--------------|------------|----------|------------|---------|

### Example Data (Rows 2+)
| S/N | Student Name | Reg Number | CA Score | Exam Score | Remarks |
|-----|--------------|------------|----------|------------|---------|
| 1   | John Doe     | STU2024001 | 35       | 55         | Good performance |
| 2   | Jane Smith   | STU2024002 | 30       | 50         | Well done |
| 3   | Bob Johnson  | STU2024003 | 38       | 58         | Excellent |

---

## ✅ Column Descriptions

### 1. S/N (Optional)
- **Type**: Number
- **Description**: Serial number for reference
- **Not used** in processing

### 2. Student Name (Optional)
- **Type**: Text
- **Description**: Student's full name for reference
- **Not used** in processing (only for teacher's reference)

### 3. Reg Number (Required)
- **Type**: Text
- **Description**: Student's registration number
- **Format**: Exactly as registered in the system
- **Example**: STU2024001, REG/2024/001, etc.
- **⚠️ Critical**: Must match exactly with database

### 4. CA Score (Required)
- **Type**: Number
- **Description**: Continuous Assessment score
- **Range**: 0 - 40
- **Decimal**: Allowed (e.g., 35.5)
- **Default**: 0 if empty

### 5. Exam Score (Required)
- **Type**: Number
- **Description**: Examination score
- **Range**: 0 - 60
- **Decimal**: Allowed (e.g., 55.5)
- **Default**: 0 if empty

### 6. Remarks (Optional)
- **Type**: Text
- **Description**: Teacher's comment
- **Max Length**: 500 characters
- **Example**: "Good performance", "Needs improvement", etc.

---

## 🔧 Supported Column Name Variations

The system recognizes these alternative column names:

### Reg Number
- `Reg Number`
- `RegNumber`
- `Registration Number`
- `reg_number`

### CA Score
- `CA Score`
- `CA`
- `ca_score`

### Exam Score
- `Exam Score`
- `Exam`
- `exam_score`

### Remarks
- `Remarks`
- `Teacher Comment`
- `remarks`

---

## ✨ Processing Logic

1. **Registration Number Lookup**: System finds student by reg number
2. **Validation**: Checks CA (0-40) and Exam (0-60) ranges
3. **Auto-calculation**: 
   - Total Score = CA + Exam
   - Grade, Grade Point, Remark automatically assigned
4. **Upsert**: Creates new or updates existing result
5. **Status**: All bulk uploaded results start as DRAFT

---

## 📊 Sample Excel File

```
A         B            C            D          E           F
S/N   Student Name  Reg Number   CA Score  Exam Score  Remarks
1     John Doe      STU2024001   35        55          Good
2     Jane Smith    STU2024002   30        50          Very good
3     Bob Johnson   STU2024003   38        58          Excellent
4     Alice Brown   STU2024004   32        48          Good effort
5     Charlie Lee   STU2024005   40        60          Outstanding
```

---

## ⚠️ Common Errors & Solutions

### Error: "Student not found with reg number"
**Cause**: Registration number doesn't match database
**Solution**: 
- Check for extra spaces
- Verify uppercase/lowercase
- Ensure student exists in system

### Error: "Invalid CA score: XX (must be 0-40)"
**Cause**: CA score outside valid range
**Solution**: 
- CA must be 0-40
- Check for typos
- Ensure numeric value

### Error: "Invalid Exam score: XX (must be 0-60)"
**Cause**: Exam score outside valid range
**Solution**: 
- Exam must be 0-60
- Check for typos
- Ensure numeric value

### Error: "Student does not belong to this class"
**Cause**: Student registered in different class
**Solution**: 
- Verify student's current class
- Upload results for correct class

---

## 📥 Upload Process

1. **Prepare Excel file** using template
2. **Fill in student data** with accurate reg numbers
3. **Select**: Class, Subject, Term, Session on upload form
4. **Upload file**
5. **Review results**:
   - ✅ Created: New results added
   - 🔄 Updated: Existing results modified
   - ❌ Errors: Issues with specific rows
6. **Fix errors** if any and re-upload
7. **Submit for approval** when satisfied

---

## 🎯 Best Practices

### Before Upload
- ✅ Double-check registration numbers
- ✅ Verify all scores are within range
- ✅ Remove empty rows
- ✅ Save as .xlsx or .xls format

### During Upload
- ✅ Select correct class and subject
- ✅ Verify term and session
- ✅ Wait for upload to complete

### After Upload
- ✅ Review success summary
- ✅ Check error list carefully
- ✅ Fix errors and re-upload
- ✅ Submit for admin approval

---

## 💡 Tips

1. **Download Template**: Ask admin for pre-filled template with student names
2. **Backup**: Keep a copy of your Excel file
3. **Test First**: Upload a small batch to test
4. **Incremental**: Upload in batches (e.g., 20-30 students at a time)
5. **Consistency**: Use same format for all uploads

---

## 📧 Support

If you encounter persistent issues:
- Contact school admin
- Provide error message screenshot
- Share sample (anonymized) Excel file
- Mention class, subject, term, session

---

## 🔗 Related

- **Teacher Results Guide**: How to enter results manually
- **Admin Approval Guide**: How admins approve results
- **Student View Guide**: How students access results
- **PDF Generation**: How result slips are created




