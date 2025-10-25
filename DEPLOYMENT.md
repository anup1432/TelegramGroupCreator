# Deployment Guide - Render & MongoDB Atlas

## Required Setup Before Deploying

### 1. MongoDB Atlas Setup (IMPORTANT)

Your app uses MongoDB Atlas for the database. Follow these steps:

#### A. Create MongoDB Atlas Account
1. Go to https://www.mongodb.com/cloud/atlas/register
2. Create a free account
3. Create a new M0 (free) cluster

#### B. Configure Network Access (CRITICAL)
**This is the most important step - without this, your app won't connect!**

1. In MongoDB Atlas, go to **Network Access** (in the Security menu)
2. Click **"Add IP Address"**
3. Click **"Allow Access from Anywhere"** (adds `0.0.0.0/0`)
   - This is required for both Replit and Render to connect
   - It's safe for development/small apps as we use username/password authentication
4. Click **Confirm**

#### C. Create Database User
1. Go to **Database Access** (in the Security menu)
2. Click **"Add New Database User"**
3. Choose **Password** authentication
4. Set username (e.g., `admin`) and a strong password
5. Set **Built-in Role** to "Atlas admin" or "Read and write to any database"
6. Click **Add User**

#### D. Get Connection String
1. Go to **Database** and click **"Connect"**
2. Choose **"Connect your application"**
3. Copy the connection string (looks like: `mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/`)
4. **Replace `<password>` with your actual database user password**
5. **Add database name** at the end: `mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/telegram-groups`

**Final connection string format:**
```
mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/telegram-groups
```

### 2. Deploying to Render

#### Step 1: Push Code to GitHub
```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin YOUR_GITHUB_REPO_URL
git push -u origin main
```

#### Step 2: Create Render Web Service
1. Go to https://render.com and sign in
2. Click **"New +"** → **"Web Service"**
3. Connect your GitHub repository
4. Configure:
   - **Name**: Your app name
   - **Environment**: `Node`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm run start`
   - **Plan**: Free

#### Step 3: Add Environment Variable
In Render dashboard:
1. Go to **Environment** tab
2. Add environment variable:
   - **Key**: `MONGODB_URL`
   - **Value**: Your MongoDB connection string from above
3. Click **Save Changes**

#### Step 4: Deploy
- Render will automatically deploy your app
- Wait 3-5 minutes for the first deploy
- Your app will be available at `https://your-app-name.onrender.com`

### 3. Testing Deployment

1. Visit your Render URL
2. Try to register a new account
3. Login with credentials: `admin` / `admin123` (default admin account)

## Environment Variables Required

### For Production (Render):
- `MONGODB_URL` - Your MongoDB Atlas connection string

### For Development (Replit):
- `MONGODB_URL` - Your MongoDB Atlas connection string (same one)

## Default Admin Credentials

After first deployment, you can login with:
- **Username**: `admin`
- **Password**: `admin123`

**Important**: Change this password after first login!

## Troubleshooting

### "Could not connect to MongoDB Atlas cluster"
- Check that you added `0.0.0.0/0` to Network Access in MongoDB Atlas
- Verify your connection string has the correct password
- Make sure the database user exists and has correct permissions

### App crashes on Render
- Check Render logs for errors
- Verify MONGODB_URL environment variable is set correctly
- Make sure MongoDB Atlas Network Access allows connections from anywhere

### "Invalid MongoDB connection string"
- Connection string must start with `mongodb+srv://`
- Must include username and password
- Should end with database name (e.g., `/telegram-groups`)

## Support

If you encounter issues:
1. Check Render logs
2. Check MongoDB Atlas Metrics to see if connections are being attempted
3. Verify all environment variables are set correctly
