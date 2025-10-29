# 🚀 Render Deployment Checklist

## Pre-Deployment Steps

### ✅ 1. Code Preparation
- [x] Remove unnecessary files
- [x] Update .gitignore
- [x] Create deployment documentation
- [ ] Push code to GitHub
- [ ] Test locally before deploying

### ✅ 2. MongoDB Atlas Setup
- [ ] Create MongoDB Atlas account
- [ ] Create a cluster (free tier is fine)
- [ ] Create database user
- [ ] Get connection string
- [ ] Configure network access (allow 0.0.0.0/0 for Render)

### ✅ 3. Generate Secrets
```bash
# Generate JWT Secret
openssl rand -base64 32
```

## Render Deployment Steps

### Backend Deployment

1. **Create Web Service**
   - [ ] Go to https://dashboard.render.com
   - [ ] Click "New +" → "Web Service"
   - [ ] Connect your GitHub repository

2. **Configure Backend Service**
   - [ ] Name: `inventra-backend`
   - [ ] Region: Oregon (US West)
   - [ ] Branch: `main`
   - [ ] Root Directory: `backend`
   - [ ] Runtime: Node
   - [ ] Build Command: `npm install`
   - [ ] Start Command: `node src/server.js`

3. **Add Environment Variables** (Backend)
   - [ ] `NODE_ENV` = `production`
   - [ ] `PORT` = `5000`
   - [ ] `MONGODB_URI` = Your MongoDB connection string
   - [ ] `JWT_SECRET` = Generated secret
   - [ ] `FRONTEND_URL` = (leave for now, update after frontend deploys)

4. **Deploy Backend**
   - [ ] Click "Create Web Service"
   - [ ] Wait for deployment to complete
   - [ ] Note the backend URL (e.g., `https://inventra-backend.onrender.com`)

### Frontend Deployment

1. **Create Static Site**
   - [ ] Go to Render dashboard
   - [ ] Click "New +" → "Static Site"
   - [ ] Connect your GitHub repository

2. **Configure Frontend Service**
   - [ ] Name: `inventra-frontend`
   - [ ] Branch: `main`
   - [ ] Root Directory: (leave empty)
   - [ ] Build Command: `npm install && npm run build`
   - [ ] Publish Directory: `dist`

3. **Add Environment Variable** (Frontend)
   - [ ] `VITE_API_URL` = `https://inventra-backend.onrender.com/api`

4. **Deploy Frontend**
   - [ ] Click "Create Static Site"
   - [ ] Wait for deployment to complete
   - [ ] Note the frontend URL (e.g., `https://inventra-frontend.onrender.com`)

### Post-Deployment Steps

1. **Update Backend Environment**
   - [ ] Go to backend service settings
   - [ ] Update `FRONTEND_URL` to your frontend URL
   - [ ] Save and redeploy

2. **Test the Application**
   - [ ] Visit your frontend URL
   - [ ] Test login functionality
   - [ ] Test signup functionality
   - [ ] Verify API connectivity

3. **Optional: Custom Domain**
   - [ ] Add custom domain in service settings
   - [ ] Update DNS records
   - [ ] Update environment variables

## 🎉 Deployment Complete!

Your app is now live at: `https://your-app.onrender.com`

## 📝 Notes

- Free tier services spin down after 15 minutes of inactivity
- First request may take longer to wake up the service
- For production, consider upgrading to paid plan for always-on service
- Monitor logs in Render dashboard for any issues

## 🆘 Common Issues

1. **CORS Errors**: Make sure FRONTEND_URL in backend matches your frontend domain
2. **Database Connection**: Verify MongoDB network access allows 0.0.0.0/0
3. **Build Failures**: Check build logs for specific error messages
4. **API Errors**: Verify VITE_API_URL points to correct backend URL

