# Smart Exam Platform - Deployment Guide

## Complete Step-by-Step Deployment Instructions

### Prerequisites
- Supabase Account (free tier available)
- Render Account (free tier available)
- GitHub Account (for easy deployment)
- Git installed locally
- Text editor (VS Code recommended)

---

## Part 1: Supabase Setup (Backend)

### Step 1.1: Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign in
2. Click **"New Project"**
3. Fill in:
   - **Name**: `smart-exam` (or your preference)
   - **Database Password**: Strong password (save it!)
   - **Region**: Select closest to you
   - **Pricing Plan**: Free (for development)
4. Click **"Create new project"** and wait ~5 minutes

### Step 1.2: Get Project Credentials

Once project is ready:

1. Go to **Settings** → **API**
2. Copy the following:
   - **Project URL** → `VITE_SUPABASE_URL`
   - **anon public** key → `VITE_SUPABASE_ANON_KEY`
3. Save these securely

### Step 1.3: Create Database Tables

1. Go to **SQL Editor**
2. Click **"New Query"**
3. Copy entire contents of `schema.sql` file
4. Paste into SQL editor
5. Click **"Run"** (wait for completion)
6. Verify tables appear in **Table Editor** → should see 12 tables

### Step 1.4: Enable Row Level Security (RLS)

1. Go to **SQL Editor**
2. Click **"New Query"**
3. Copy entire contents of `policies.sql` file
4. Paste into SQL editor
5. Click **"Run"** (wait for completion)
6. Go to **Authentication** → verify users system is enabled

### Step 1.5: Configure Authentication

1. Go to **Authentication** → **Providers**
2. Ensure **Email** is enabled
3. Go to **Authentication** → **Email Templates**
4. Customize email templates if needed
5. Go to **Settings** → **Auth** and note redirect URLs

---

## Part 2: Local Development Setup

### Step 2.1: Prepare Project Files

1. Create a folder: `smart-exam-platform`
2. Copy all files from this project into that folder
3. Your structure should match:
   ```
   smart-exam-platform/
   ├── frontend/
   ├── supabase/
   ├── auth-service.js
   ├── exam-service.js
   ├── result-service.js
   ├── analytics-service.js
   ├── anticheat-system.js
   ├── exam-utils.js
   ├── package.json
   ├── .env.example
   ├── README.md
   └── DEPLOYMENT.md
   ```

### Step 2.2: Configure Environment

1. Copy `.env.example` to `.env.local`
2. Fill in your Supabase credentials:
   ```
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key-here
   VITE_APP_ENV=development
   ```
3. Update credentials in JavaScript files:
   - `auth-service.js` (lines 13-14)
   - `exam-service.js` (lines 10-11)
   - `result-service.js` (lines 10-11)
   - `analytics-service.js` (lines 10-11)

   Replace:
   ```javascript
   this.supabaseUrl = 'https://your-project.supabase.co';
   this.supabaseKey = 'your-anonymous-key-here';
   ```

### Step 2.3: Run Locally

**Option A: Using Python (Recommended)**
```bash
cd smart-exam-platform/frontend/public
python -m http.server 8080
# Access: http://localhost:8080
```

**Option B: Using Node.js**
```bash
cd smart-exam-platform
npm install http-server
npx http-server frontend/public -c-1 -p 8080
# Access: http://localhost:8080
```

### Step 2.4: Test Locally

1. Open `http://localhost:8080`
2. Click **"Student"** to signup/login
3. Try creating an exam (as teacher)
4. Try taking an exam (as student)
5. Check results loading
6. Verify console for errors

---

## Part 3: Prepare for Production

### Step 3.1: Create Production Credentials

1. Create `.env.production`:
   ```
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key-here
   VITE_APP_ENV=production
   VITE_RENDER_URL=https://your-app.onrender.com
   ```

2. Update JavaScript files with production Supabase URL if different

### Step 3.2: Optimize for Production

1. Update `frontend/public/index.html` title and meta tags
2. Add favicon to `frontend/public/`
3. Verify all links use correct paths
4. Test all features work locally

### Step 3.3: Create .gitignore

Create `.gitignore` file:
```
.env
.env.local
.env.production
node_modules/
.DS_Store
*.log
dist/
build/
.vscode/
```

---

## Part 4: Deploy to Render

### Step 4.1: Push to GitHub

1. Create GitHub repository
2. Initialize git in project:
   ```bash
   cd smart-exam-platform
   git init
   git add .
   git commit -m "Initial commit: Smart Exam Platform"
   git branch -M main
   git remote add origin https://github.com/your-username/smart-exam-platform.git
   git push -u origin main
   ```

### Step 4.2: Create Render Account

1. Go to [render.com](https://render.com)
2. Sign up with GitHub
3. Click **"Authorize render-iac"**

### Step 4.3: Deploy Static Site

1. Go to Dashboard → **New +**
2. Select **"Static Site"**
3. Connect your GitHub repository
4. Fill in:
   - **Name**: `smart-exam` (or your choice)
   - **Branch**: `main`
   - **Build Command**: (leave empty for static site)
   - **Publish directory**: `frontend/public`

5. Click **"Create Static Site"**
6. Wait for deployment (~2 minutes)
7. Note your Render URL: `https://smart-exam.onrender.com`

### Step 4.4: Configure Environment on Render

1. Go to your deployed site's **Settings**
2. Click **"Environment"**
3. Add these variables:
   ```
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key-here
   VITE_APP_ENV=production
   VITE_RENDER_URL=https://your-app.onrender.com
   ```

4. Click **"Save"**
5. Go back and wait for redeploy

### Step 4.5: Verify Deployment

1. Click **"Open Site"** in Render
2. Test all functionality:
   - Sign up with test account
   - Create exam
   - Take exam
   - View results
   - Check leaderboard
3. Check browser console for errors

---

## Part 5: Post-Deployment

### Step 5.1: Setup Custom Domain (Optional)

1. In Render, go to **Settings** → **Custom Domains**
2. Enter your domain (e.g., `exam.yourcompany.com`)
3. Follow DNS instructions
4. Update Supabase **Auth** → **Redirect URLs** to include your domain

### Step 5.2: Monitor Performance

1. Check Render **Logs** for errors
2. Monitor Supabase **Database** usage
3. Check Supabase **Logs** for auth errors
4. Setup alerts for high usage

### Step 5.3: Backup Database

1. In Supabase, go to **Backups**
2. Enable **Automatic backups**
3. Configure backup frequency

### Step 5.4: Setup Email Configuration (Optional)

1. Supabase → **Authentication** → **Email**
2. Configure SMTP for custom emails
3. Update email templates

---

## Troubleshooting

### Issue: "Supabase client not initialized"
**Solution:**
- Verify `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are correct
- Check network tab in DevTools for API calls
- Verify no CORS errors

### Issue: "Authentication failed"
**Solution:**
- Clear browser cache/localStorage
- Verify Supabase Auth is enabled
- Check if user email is verified
- Verify RLS policies are correct

### Issue: "404 Not Found" on Render
**Solution:**
- Verify build command and publish directory
- Check file paths are relative
- Ensure index.html is in publish directory

### Issue: "Database connection error"
**Solution:**
- Verify database is running in Supabase
- Check connection string
- Verify RLS policies aren't blocking access
- Check Supabase status page

### Issue: "CORS error"
**Solution:**
- This shouldn't happen with Supabase (it handles CORS)
- Check browser console for exact error
- Verify Supabase project is active

---

## Production Checklist

Before going live, ensure:

- [ ] All Supabase tables created
- [ ] RLS policies enabled
- [ ] Authentication working
- [ ] All services can connect to Supabase
- [ ] Anti-cheat system initialized
- [ ] All pages load without errors
- [ ] Responsive design tested on mobile
- [ ] Forms validated and working
- [ ] Results calculated correctly
- [ ] Email notifications working (if enabled)
- [ ] Admin can manage users
- [ ] Teachers can create exams
- [ ] Students can take exams
- [ ] Leaderboard displays correctly
- [ ] Analytics showing data
- [ ] Error handling working
- [ ] Backup strategy in place
- [ ] Monitoring and alerts configured

---

## Performance Optimization Tips

1. **Database**:
   - Indexes already created
   - Use query selectors to limit columns
   - Cache frequently accessed data

2. **Frontend**:
   - Lazy load libraries (Chart.js, jsPDF)
   - Minify CSS/JS before production
   - Enable gzip compression on Render
   - Use browser caching

3. **Supabase**:
   - Monitor Row Level Security performance
   - Optimize queries in Analytics queries
   - Use connection pooling

---

## Scaling for Production

As users grow:

1. **Upgrade Render Plan**: Free tier → Pro ($7/month)
2. **Upgrade Supabase Plan**: Free → Pro ($25/month)
3. **Add Caching**: Implement Redis caching layer
4. **Database Optimization**: Analyze slow queries in Supabase logs
5. **CDN Integration**: Use Render's built-in CDN

---

## Security Hardening

Before production:

1. ✅ RLS policies enabled (done)
2. ✅ Authentication required (done)
3. ✅ Anti-cheat logging (done)
4. [ ] SSL/HTTPS enabled (Render automatic)
5. [ ] Security headers configured
6. [ ] CSRF protection enabled
7. [ ] Input validation on all forms
8. [ ] Rate limiting on auth endpoints

---

## Support & Documentation

- **Supabase Docs**: https://supabase.com/docs
- **Render Docs**: https://render.com/docs
- **JavaScript Docs**: https://developer.mozilla.org
- **Supabase Discord**: discord.supabase.io
- **Email Support**: support@smartexam.com

---

## Version History

- **v1.0.0** - Initial production deployment

---

**Last Updated**: 2026-05-22  
**Deployment Status**: Ready for Production ✅
