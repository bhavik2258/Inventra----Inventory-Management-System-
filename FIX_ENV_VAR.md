# 🔧 Fix 404 Error on Login

## Problem
Getting 404 error on login:
```
https://inventra-backend-eavj.onrender.com//auth/login
```

Notice the **double slash**: `//auth/login`

## Root Cause
Your `VITE_API_URL` environment variable is missing `/api` at the end

## Solution

### Step 1: Check Current VITE_API_URL in Render
1. Go to your **Frontend Static Site** on Render dashboard
2. Click on your frontend service
3. Go to "Environment" tab
4. Check the value of `VITE_API_URL`

### Step 2: Update VITE_API_URL

**Current (WRONG):**
```
VITE_API_URL = https://inventra-backend-eavj.onrender.com
```

**Should be (CORRECT):**
```
VITE_API_URL = https://inventra-backend-eavj.onrender.com/api
```

### Step 3: Steps to Fix

1. Go to Render Dashboard
2. Click on your **Frontend Static Site** (inventra-frontend)
3. Click "Environment" tab
4. Find `VITE_API_URL`
5. Edit the value to include `/api`:
   ```
   https://your-backend-url.onrender.com/api
   ```
6. Click "Save Changes"
7. Wait for redeploy

### Step 4: Retrofit First Request After Deploy

The site will automatically redeploy with the correct URL.

---

## Summary

**Backend URL:** `https://inventra-backend-eavj.onrender.com`

**Frontend VITE_API_URL should be:**
```
https://inventra-backend-eavj.onrender.com/api
```

NOT
```
https://inventra-backend-eavj.onrender.com
```

The `/api` is required because your backend routes all start with `/api/`

---

## After Fix

Your login will work at:
```
https://inventra-backend-eavj.onrender.com/api/auth/login
```

Instead of the broken:
```
https://inventra-backend-eavj.onrender.com//auth/login
```

