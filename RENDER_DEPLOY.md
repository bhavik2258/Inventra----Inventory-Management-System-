# 🚀 Render Deployment Guide for Inventra

## Prerequisites
1. GitHub account
2. Render account (sign up at https://render.com)
3. MongoDB Atlas account

## Step-by-Step Deployment

### Step 1: Prepare Your Code
1. Push your code to GitHub
2. Make sure all files are committed

### Step 2: Deploy Backend Service

1. Go to https://dashboard.render.com
2. Click "New +" → "Web Service"
3. Connect your GitHub repository
4. Configure:
   - **Name**: `inventra-backend`
   - **Region**: Oregon (US West)
   - **Branch**: `main` (or your main branch)
   - **Root Directory**: `backend`
   - **Runtime**: Node
   - **Build Command**: `npm install`
   - **Start Command**: `node src/server.js`
5. Add Environment Variables:
   - `NODE_ENV` = `production`
   - `PORT` = `5000`
   - `MONGODB_URI` = Your MongoDB connection string
   - `JWT_SECRET` = A random secret string (e.g., generate with `openssl rand -base64 32`)
   - `FRONTEND_URL` = Your frontend URL (will update after frontend deployment)
6. Click "Create Web Service"

### Step 3: Deploy Frontend Service

1. Click "New +" → "Static Site"
2. Connect your GitHub repository
3. Configure:
   - **Name**: `inventra-frontend`
   - **Branch**: `main`
   - **Root Directory**: (leave empty)
   - **Build Command**: `npm install && npm run build`
   - **Publish Directory**: `dist`
4. Add Environment Variable:
   - `VITE_API_URL` = Your backend URL (e.g., `https://inventra-backend.onrender.com/api`)
5. Click "Create Static Site"

### Step 4: Update Environment Variables

After frontend is deployed:
1. Go to backend service
2. Update `FRONTEND_URL` to your frontend URL (e.g., `https://inventra-frontend.onrender.com`)

### Step 5: Configure MongoDB

1. Go to MongoDB Atlas
2. Add your Render service IP to Network Access (or use 0.0.0.0/0 for all)
3. Copy your connection string and use it in `MONGODB_URI`

## Environment Variables Summary

### Backend (.env in backend folder)
```
NODE_ENV=production
PORT=5000
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/inventra
JWT_SECRET=your-secret-key-here
FRONTEND_URL=https://inventra-frontend.onrender.com
```

### Frontend
```
VITE_API_URL=https://inventra-backend.onrender.com/api
```

## Quick Deploy Commands

```bash
# Generate JWT secret
openssl rand -base64 32

# Test locally before deploying
cd backend && npm install && node src/server.js

# Build frontend locally
npm run build
```

## Troubleshooting

1. **Build fails**: Check build logs in Render dashboard
2. **CORS errors**: Ensure FRONTEND_URL is set correctly in backend
3. **Database connection fails**: Check MongoDB network access settings
4. **Frontend shows API errors**: Verify VITE_API_URL is correct

