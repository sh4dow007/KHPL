# KHPL Deployment Guide - Render.com + Netlify

## 🚀 Complete Deployment Guide

This guide will help you deploy your KHLP application to production using:
- **Backend**: Render.com (Free tier)
- **Frontend**: Netlify (Free tier)
- **Database**: MongoDB Atlas (Already configured)

## 📋 Prerequisites

✅ MongoDB Atlas account and cluster (Already set up)
✅ GitHub repository with your code
✅ Render.com account (Free)
✅ Netlify account (Free)

## 🔧 Backend Deployment (Render.com)

### Step 1: Create Render Account
1. Go to [render.com](https://render.com)
2. Sign up with GitHub
3. Connect your GitHub account

### Step 2: Deploy Backend
1. Click **"New +"** → **"Web Service"**
2. Connect your GitHub repository
3. Select your repository: `KHPL`
4. Configure the service:
   - **Name**: `khlp-backend`
   - **Environment**: `Python 3`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `python -m uvicorn server:app --host 0.0.0.0 --port $PORT`
   - **Python Version**: `3.11`

### Step 3: Set Environment Variables
In Render dashboard, go to **Environment** tab and add:

```bash
MONGO_URL=mongodb+srv://adityakaushal001_db_user:yJvNt1L8VZh6BuYs@cluster0.wvbvwif.mongodb.net/khlp_database?retryWrites=true&w=majority
DB_NAME=khlp_database
JWT_SECRET_KEY=your-production-jwt-secret-key-change-this-to-something-secure
OWNER_EMAIL=aditya.kaushal001@gmail.com
OWNER_PASSWORD=Password@123
CORS_ORIGINS=https://your-frontend-url.netlify.app
PORT=10000
```

### Step 4: Deploy
1. Click **"Create Web Service"**
2. Wait for deployment (5-10 minutes)
3. Note your backend URL: `https://khlp-backend.onrender.com`

## 🌐 Frontend Deployment (Netlify)

### Step 1: Create Netlify Account
1. Go to [netlify.com](https://netlify.com)
2. Sign up with GitHub
3. Connect your GitHub account

### Step 2: Deploy Frontend
1. Click **"New site from Git"**
2. Choose **"Deploy with GitHub"**
3. Select your repository: `KHPL`
4. Configure build settings:
   - **Base directory**: `frontend`
   - **Build command**: `yarn build`
   - **Publish directory**: `frontend/build`

### Step 3: Set Environment Variables
In Netlify dashboard, go to **Site settings** → **Environment variables**:

```bash
REACT_APP_BACKEND_URL=https://khlp-backend.onrender.com
```

### Step 4: Deploy
1. Click **"Deploy site"**
2. Wait for deployment (3-5 minutes)
3. Note your frontend URL: `https://your-site-name.netlify.app`

## 🔄 Update Backend CORS

After getting your Netlify URL, update the backend environment variable:

```bash
CORS_ORIGINS=https://your-site-name.netlify.app
```

## ✅ Testing Production

1. **Test Backend**: Visit `https://khlp-backend.onrender.com/api/auth/me`
2. **Test Frontend**: Visit your Netlify URL
3. **Test Login**: Use `aditya.kaushal001@gmail.com` / `Password@123`

## 🎯 Custom Domain (Optional)

### Backend Custom Domain
1. In Render dashboard → **Settings** → **Custom Domains**
2. Add your domain (e.g., `api.yourdomain.com`)
3. Update DNS records as instructed

### Frontend Custom Domain
1. In Netlify dashboard → **Domain management**
2. Add your domain (e.g., `yourdomain.com`)
3. Update DNS records as instructed

## 📊 Monitoring

- **Render**: Built-in metrics and logs
- **Netlify**: Built-in analytics and logs
- **MongoDB Atlas**: Built-in monitoring

## 🔒 Security Notes

- Change `JWT_SECRET_KEY` to a secure random string
- Consider changing owner password in production
- Enable MongoDB Atlas IP whitelisting
- Use HTTPS (automatically provided by Render/Netlify)

## 🆘 Troubleshooting

### Backend Issues
- Check Render logs for errors
- Verify environment variables
- Test MongoDB connection

### Frontend Issues
- Check Netlify build logs
- Verify environment variables
- Test API connectivity

### Database Issues
- Check MongoDB Atlas connection
- Verify network access settings
- Check user permissions

## 🎉 Success!

Your KHPL application is now live in production! 🚀
