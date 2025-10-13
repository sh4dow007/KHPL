# 🧪 Local Testing Guide

## Prerequisites ✅
- ✅ Python 3.9.6 installed
- ✅ Node.js v20.19.4 installed  
- ✅ Yarn 1.22.22 installed
- ✅ Backend dependencies installed
- ✅ Frontend dependencies installed

## 📋 Manual Setup Steps

### Step 1: Create Environment Files

**1. Create `backend/.env` file:**
```bash
MONGO_URL=mongodb+srv://mlmuser:yourpassword@cluster0.xxxxx.mongodb.net/mlm_hierarchy?retryWrites=true&w=majority
DB_NAME=mlm_hierarchy
JWT_SECRET_KEY=local-development-secret-key-change-in-production
CORS_ORIGINS=http://localhost:3000
PORT=8000
```

**2. Create `frontend/.env.local` file:**
```bash
REACT_APP_BACKEND_URL=http://localhost:8000
```

### Step 2: Test Backend Setup

```bash
cd backend
python3 test_setup.py
```

**Expected output:**
```
🔍 Testing imports...
✅ All imports successful

🔍 Testing environment variables...
✅ Environment variables loaded

🔍 Testing MongoDB connection...
✅ MongoDB connection successful

🎉 Backend setup is ready!
```

### Step 3: Test Frontend Setup

```bash
cd frontend
./test_setup.sh
```

**Expected output:**
```
🔍 Testing frontend setup...
✅ node_modules found
✅ .env.local found
✅ Frontend setup is ready!
```

## 🚀 Running the Application Locally

### Terminal 1: Start Backend
```bash
cd backend
python3 -m uvicorn server:app --reload --host 0.0.0.0 --port 8000
```

**Expected output:**
```
INFO:     Uvicorn running on http://0.0.0.0:8000 (Press CTRL+C to quit)
INFO:     Started reloader process
INFO:     Started server process
INFO:     Waiting for application startup.
INFO:     Application startup complete.
```

### Terminal 2: Start Frontend
```bash
cd frontend
yarn start
```

**Expected output:**
```
Compiled successfully!

You can now view mlm-frontend in the browser.

  Local:            http://localhost:3000
  On Your Network:  http://192.168.x.x:3000
```

## 🧪 Testing the Application

### 1. Open Browser
Go to `http://localhost:3000`

### 2. Test Login
- **Email**: `owner@mlmapp.com`
- **Password**: `defaultpassword123`

### 3. Test Features
- ✅ Login with default credentials
- ✅ View dashboard with statistics
- ✅ Add team members (invite system)
- ✅ View team hierarchy tree
- ✅ Test 2-member limit
- ✅ Test Aadhaar ID validation

### 4. Test API Endpoints
Visit these URLs to test backend:
- `http://localhost:8000/api/auth/me` (should return 401 without token)
- `http://localhost:8000/docs` (FastAPI documentation)

## 🐛 Troubleshooting

### Backend Issues
- **MongoDB Connection Error**: Check your connection string in `.env`
- **Port Already in Use**: Change PORT in `.env` to 8001
- **Import Errors**: Run `pip3 install -r requirements.txt`

### Frontend Issues
- **Build Errors**: Run `yarn install` again
- **CORS Errors**: Check CORS_ORIGINS in backend `.env`
- **API Connection**: Check REACT_APP_BACKEND_URL in frontend `.env.local`

### Common Solutions
```bash
# Clear node_modules and reinstall
cd frontend
rm -rf node_modules yarn.lock
yarn install

# Clear Python cache
cd backend
find . -name "__pycache__" -delete
pip3 install -r requirements.txt
```

## ✅ Success Checklist

- [ ] Backend starts without errors
- [ ] Frontend starts without errors  
- [ ] Can login with default credentials
- [ ] Dashboard loads with statistics
- [ ] Can invite team members
- [ ] Team hierarchy tree displays
- [ ] 2-member limit works
- [ ] Aadhaar ID validation works

## 🎉 Ready for Deployment!

Once all tests pass locally, you're ready to deploy to production using the Fly.io deployment guide!
