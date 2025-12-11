# 🚀 Deployment Guide - SIP2LIFE Plant Management System

## Overview
This guide will help you deploy your application to the internet for FREE using:
- **Vercel** (Frontend hosting)
- **Render** (Backend hosting)
- **Supabase** (Database & Storage - already set up)

---

## Prerequisites
✅ GitHub account (you have this)
✅ Supabase project (already set up)
⬜ Vercel account (we'll create)
⬜ Render account (we'll create)

---

## Step 1: Push Code to GitHub

### 1.1 Initialize Git Repository
Open terminal in project root and run:
```bash
cd c:\Users\Lenovo\.gemini\antigravity\playground\tachyon-sun
git init
git add .
git commit -m "Initial commit - SIP2LIFE Management System"
```

### 1.2 Create GitHub Repository
1. Go to https://github.com/new
2. Repository name: `sip2life-management`
3. Description: "Plant Management System for SIP2LIFE Distilleries"
4. **Keep it Private** (recommended)
5. **DO NOT** initialize with README (we already have one)
6. Click "Create repository"

### 1.3 Push to GitHub
Copy the commands shown on GitHub (will look like this):
```bash
git remote add origin https://github.com/YOUR_USERNAME/sip2life-management.git
git branch -M main
git push -u origin main
```

---

## Step 2: Deploy Backend to Render

### 2.1 Create Render Account
1. Go to https://render.com
2. Click "Get Started"
3. Sign up with GitHub (easiest)

### 2.2 Create Web Service
1. Click "New +" → "Web Service"
2. Connect your GitHub repository
3. Select `sip2life-management`
4. Configure:
   - **Name**: `sip2life-backend`
   - **Root Directory**: `server`
   - **Environment**: `Node`
   - **Build Command**: `npm install && npx prisma generate`
   - **Start Command**: `node index.js`
   - **Instance Type**: `Free`

### 2.3 Add Environment Variables
Click "Environment" tab and add:
```
DATABASE_URL=postgresql://postgres.duqrwfnqqxhbckxdyztm:%40Primetech098@aws-0-ap-south-1.pooler.supabase.com:5432/postgres
DIRECT_URL=postgresql://postgres.duqrwfnqqxhbckxdyztm:%40Primetech098@aws-0-ap-south-1.pooler.supabase.com:5432/postgres
PORT=3000
JWT_SECRET=your_super_secret_key_change_this
SUPABASE_URL=https://duqrwfnqqxhbckxdyztm.supabase.co
SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR1cXJ3Zm5xcXhoYmNreGR5enRtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUzNjA0MzEsImV4cCI6MjA4MDkzNjQzMX0.5jq-_NqlPAO3-q3CCicE03RJ6qvBji1hhWzk2dZwKdY
```

### 2.4 Deploy
1. Click "Create Web Service"
2. Wait for deployment (5-10 minutes)
3. Copy your backend URL (e.g., `https://sip2life-backend.onrender.com`)

---

## Step 3: Deploy Frontend to Vercel

### 3.1 Create Vercel Account
1. Go to https://vercel.com
2. Click "Sign Up"
3. Sign up with GitHub

### 3.2 Import Project
1. Click "Add New..." → "Project"
2. Import `sip2life-management` repository
3. Configure:
   - **Framework Preset**: Vite
   - **Root Directory**: `client`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`

### 3.3 Add Environment Variable
Click "Environment Variables" and add:
```
VITE_API_URL=https://sip2life-backend.onrender.com
```
(Replace with your actual Render backend URL from Step 2.4)

### 3.4 Deploy
1. Click "Deploy"
2. Wait for deployment (2-3 minutes)
3. Your site will be live at `https://sip2life-management.vercel.app`

---

## Step 4: Update Frontend API URL

After deployment, update the frontend to use the environment variable:

In `client/src/pages/*.jsx`, replace all instances of:
```javascript
'http://localhost:3000/api/...'
```

With:
```javascript
`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/...`
```

Then commit and push:
```bash
git add .
git commit -m "Use environment variable for API URL"
git push
```

Vercel will auto-deploy the update.

---

## Step 5: Initialize Database

### 5.1 Run Migrations on Render
1. Go to Render dashboard → Your service
2. Click "Shell" tab
3. Run:
   ```bash
   npx prisma db push
   node seed.js
   ```

---

## 🎉 Done!

Your application is now live at:
- **Frontend**: `https://sip2life-management.vercel.app`
- **Backend**: `https://sip2life-backend.onrender.com`

### Default Login:
- Email: `admin@sip2life.com`
- Password: `admin`

**⚠️ IMPORTANT**: Change the admin password immediately after first login!

---

## Troubleshooting

### Backend won't start
- Check Render logs for errors
- Verify all environment variables are set correctly
- Ensure DATABASE_URL is correct

### Frontend can't connect to backend
- Verify VITE_API_URL is set in Vercel
- Check backend is running on Render
- Check browser console for CORS errors

### Database connection fails
- Verify Supabase credentials
- Check if Supabase project is active
- Ensure connection string format is correct

---

## Free Tier Limitations

- **Render**: Backend sleeps after 15 min of inactivity (first request may be slow)
- **Vercel**: 100GB bandwidth/month
- **Supabase**: 500MB database, 1GB storage

These are sufficient for small-medium usage. Upgrade if needed.

---

## Support

For issues, contact your development team or refer to:
- Vercel Docs: https://vercel.com/docs
- Render Docs: https://render.com/docs
- Supabase Docs: https://supabase.com/docs
