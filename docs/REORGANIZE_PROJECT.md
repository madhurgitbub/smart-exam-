# Smart Exam Platform - Project Reorganization Guide

## Current Status
✅ **Phases 1-7 Complete** (60% of work done)
⏳ **Phases 8-18 Pending** (40% remaining)

**Current Issue**: All files are in root directory, need to organize into proper folder structure.

## Target Folder Structure

```
smart-exam/
├── frontend/
│   ├── public/
│   │   ├── index.html (root page)
│   │   ├── help.html
│   │   ├── student/
│   │   │   ├── studenthome.html
│   │   │   ├── student.html
│   │   │   ├── studentaccount.html
│   │   │   ├── studentassignment.html
│   │   │   ├── give test.html
│   │   │   ├── result.html
│   │   │   ├── results.html
│   │   │   └── testhistory.html
│   │   ├── teacher/
│   │   │   ├── teacherhome.html
│   │   │   ├── teacher.html
│   │   │   ├── teacheraccount.html
│   │   │   ├── teacher-exam-management.html
│   │   │   └── teacher-assinement.html
│   │   ├── common/
│   │   │   └── leaderboard.html
│   │   ├── css/
│   │   │   └── (CSS files if any)
│   │   ├── js/
│   │   │   ├── auth-service.js
│   │   │   ├── exam-service.js
│   │   │   ├── result-service.js
│   │   │   ├── assignment-service.js
│   │   │   ├── analytics-service.js
│   │   │   ├── anticheat-system.js
│   │   │   ├── exam-utils.js
│   │   │   └── config.js
│   │   └── assets/
│   │       └── (Images, fonts, etc.)
│
├── backend/
│   ├── services/
│   │   └── (Backend services if needed)
│   ├── functions/
│   │   └── (Supabase Edge Functions)
│   └── middleware/
│       └── (Auth middleware, error handlers)
│
├── database/
│   ├── migrations/
│   │   ├── 001_init_schema.sql
│   │   └── 002_init_policies.sql
│   └── seeds/
│       └── (Sample data)
│
├── docs/
│   ├── API.md
│   ├── README.md
│   ├── DEPLOYMENT.md
│   ├── HTML_INTEGRATION_GUIDE.md
│   └── (Phase documentation)
│
├── package.json
├── .env.example
├── .gitignore
└── README.md
```

## Manual Reorganization Steps

### Step 1: Move HTML Files

**Student Pages** → `frontend/public/student/`
```
- studenthome.html
- student.html
- studentaccount.html
- studentassignment.html
- give test.html
- result.html
- results.html
- testhistory.html
```

**Teacher Pages** → `frontend/public/teacher/`
```
- teacherhome.html
- teacher.html
- teacheraccount.html
- teacher-exam-management.html
- teacher assinement.html
- teacher account.html
- teacher home.html
```

**Common Pages** → `frontend/public/` (root) and `frontend/public/common/`
```
- index.html → frontend/public/
- help.html → frontend/public/
- leaderboard.html → frontend/public/common/
```

### Step 2: Move JavaScript Services → `frontend/public/js/`

```
- auth-service.js
- exam-service.js
- result-service.js
- assignment-service.js
- analytics-service.js
- anticheat-system.js
- exam-utils.js
- config.js
```

### Step 3: Move Database Files → `database/migrations/`

```
- schema.sql → database/migrations/001_init_schema.sql
- policies.sql → database/migrations/002_init_policies.sql
```

### Step 4: Move Documentation → `docs/`

Keep these in docs/:
```
- README.md
- API.md
- DEPLOYMENT.md
- HTML_INTEGRATION_GUIDE.md
- And all PHASE_*.md files
```

### Step 5: Clean Up Root

Remove old files from root after moving, keep only:
```
- package.json
- .env.example
- .gitignore
- README.md (or move to docs/)
```

## Update File References

After moving files, update all script references in HTML files:

**OLD:**
```html
<script src="config.js"></script>
<script src="auth-service.js"></script>
```

**NEW:**
```html
<script src="../../js/config.js"></script>
<script src="../../js/auth-service.js"></script>
```

## Manual Windows File Operations

Since PowerShell isn't available, use Windows Explorer or these commands:

```batch
cd "c:\Users\Admin\OneDrive\Desktop\smart exam\smart-exam-"

# Create folders
mkdir frontend\public\student
mkdir frontend\public\teacher
mkdir frontend\public\common
mkdir frontend\public\js
mkdir backend\services
mkdir database\migrations
mkdir docs

# Move files (use cut & paste in File Explorer OR use these commands)
# Copy then delete - example for student.html:
copy student.html frontend\public\student\
del student.html

# Or use move command (Windows only):
move student.html frontend\public\student\
```

## Next: Verify Project is Runnable

After reorganization:

1. ✅ All files properly organized
2. ✅ All script references updated
3. ✅ All HTML files point to correct services
4. ✅ Database schema ready to import
5. ✅ Config.js has Supabase credentials
6. ✅ package.json ready to `npm install`

Then the project will be **FULLY RUNNABLE**.

