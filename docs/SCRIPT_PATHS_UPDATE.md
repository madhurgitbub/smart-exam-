# Script References Update Guide

## Current Issue

After reorganization, HTML files will be in different folders, so script paths need updating.

## Path Mapping Reference

### Student Pages Location
**From**: `c:\Users\Admin\OneDrive\Desktop\smart exam\smart-exam-\`
**To**: `c:\Users\Admin\OneDrive\Desktop\smart exam\smart-exam-\frontend\public\student\`

**Relative path depth**: 4 levels up = `../../../../`

### Teacher Pages Location
**From**: `c:\Users\Admin\OneDrive\Desktop\smart exam\smart-exam-\`
**To**: `c:\Users\Admin\OneDrive\Desktop\smart exam\smart-exam-\frontend\public\teacher\`

**Relative path depth**: 4 levels up = `../../../../`

### Common Pages Location
**From**: `c:\Users\Admin\OneDrive\Desktop\smart exam\smart-exam-\`
**To**: `c:\Users\Admin\OneDrive\Desktop\smart exam\smart-exam-\frontend\public\common\`

**Relative path depth**: 4 levels up = `../../../../`

### JS Services Location
**Target**: `c:\Users\Admin\OneDrive\Desktop\smart exam\smart-exam-\frontend\public\js\`

---

## Update Pattern

### Old Format (from root):
```html
<script src="auth-service.js"></script>
<script src="config.js"></script>
<script src="exam-utils.js"></script>
```

### New Format (from student/teacher/common folder):
```html
<script src="../../js/auth-service.js"></script>
<script src="../../js/config.js"></script>
<script src="../../js/exam-utils.js"></script>
```

---

## Files to Update (23 HTML files)

### Student Folder (8 files)
- `student.html` - Login page
- `studenthome.html` - Dashboard
- `studentaccount.html` - Profile
- `student assinement.html` - Assignments
- `give test.html` - Exam engine
- `result.html` - Result display
- `results.html` - Results history
- `testhistory.html` - Test history

### Teacher Folder (7 files)
- `teacher.html` - Login page
- `teacherhome.html` - Dashboard (teacher home .html)
- `teacheraccount.html` - Profile (teacher account.html)
- `teacher-exam-management.html` - Exam management
- `teacher assinement .html` - Assignment management
- (And other teacher pages)

### Common Folder (2 files)
- `leaderboard.html`
- `help.html`

### Root Folder (1 file)
- `index.html`

---

## Script References That Need Updating

### Currently in All Pages:
```html
<script src="auth-service.js"></script>
<script src="exam-utils.js"></script>
<script src="exam-service.js"></script>
<script src="result-service.js"></script>
<script src="assignment-service.js"></script>
<script src="analytics-service.js"></script>
<script src="anticheat-system.js"></script>
<script src="config.js"></script>
<script src="api-config.js"></script>
<script src="theme.js"></script>
```

### After Update (for files in student/teacher/common):
```html
<script src="../../js/auth-service.js"></script>
<script src="../../js/exam-utils.js"></script>
<script src="../../js/exam-service.js"></script>
<script src="../../js/result-service.js"></script>
<script src="../../js/assignment-service.js"></script>
<script src="../../js/analytics-service.js"></script>
<script src="../../js/anticheat-system.js"></script>
<script src="../../js/config.js"></script>
<script src="../../js/api-config.js"></script>
<script src="../../js/theme.js"></script>
```

### For index.html (stays in root):
```html
<script src="js/auth-service.js"></script>
<script src="js/config.js"></script>
<!-- etc -->
```

---

## Complete Update Instructions

### For Student Pages (in frontend/public/student/):

Replace all:
```
src="auth-service.js" → src="../../js/auth-service.js"
src="exam-service.js" → src="../../js/exam-service.js"
src="result-service.js" → src="../../js/result-service.js"
src="assignment-service.js" → src="../../js/assignment-service.js"
src="analytics-service.js" → src="../../js/analytics-service.js"
src="anticheat-system.js" → src="../../js/anticheat-system.js"
src="exam-utils.js" → src="../../js/exam-utils.js"
src="config.js" → src="../../js/config.js"
src="api-config.js" → src="../../js/api-config.js"
src="theme.js" → src="../../js/theme.js"
```

### For Teacher Pages (in frontend/public/teacher/):

Same replacements as student pages:
```
src="..." → src="../../js/..."
```

### For Common Pages (in frontend/public/common/):

Same replacements:
```
src="..." → src="../../js/..."
```

### For index.html (stays in frontend/public/):

```
src="auth-service.js" → src="js/auth-service.js"
src="exam-service.js" → src="js/exam-service.js"
src="result-service.js" → src="js/result-service.js"
src="assignment-service.js" → src="js/assignment-service.js"
src="analytics-service.js" → src="js/analytics-service.js"
src="anticheat-system.js" → src="js/anticheat-system.js"
src="exam-utils.js" → src="js/exam-utils.js"
src="config.js" → src="js/config.js"
src="api-config.js" → src="js/api-config.js"
src="theme.js" → src="js/theme.js"
```

---

## Quick Edit Commands (Find & Replace)

In VS Code:
1. Open Find & Replace (Ctrl+H)
2. Enable "Replace All" mode
3. Use patterns below:

**For student folder:**
- Find: `src="auth-service.js"` → Replace: `src="../../js/auth-service.js"`
- Find: `src="exam-service.js"` → Replace: `src="../../js/exam-service.js"`
- (Repeat for all services)

Or use RegEx mode:
- Find: `src="([^"]+)-service.js"` → Replace: `src="../../js/$1-service.js"`
- Find: `src="config.js"` → Replace: `src="../../js/config.js"`
- Find: `src="exam-utils.js"` → Replace: `src="../../js/exam-utils.js"`

---

## Files to Create (Theme, Config Backups)

Some files reference `theme.js` and `api-config.js` which aren't in services. You may need to:

1. Check if `theme.js` exists and move it to `frontend/public/js/`
2. Check if `api-config.js` exists, or if it's a duplicate of `config.js`
3. Create stub files if missing

---

## Verification Checklist

After reorganization and updates:

- [ ] All HTML files moved to correct subfolders
- [ ] All `src="..."` paths updated
- [ ] All JS services in `frontend/public/js/`
- [ ] Database files in `database/migrations/`
- [ ] Documentation in `docs/`
- [ ] package.json in root
- [ ] .env.example in root
- [ ] index.html in `frontend/public/`

Then test:
```bash
cd frontend/public
python -m http.server 8080
# Visit http://localhost:8080/student/student.html
# Check browser console for errors
```

If no errors, all paths are correct!

