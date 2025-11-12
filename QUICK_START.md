# SiteFlow - Quick Start Guide

## 🚀 Get Your App Running in 10 Minutes

### Step 1: Set Up Supabase (5 minutes)

1. **Create a Supabase Project**
   - Go to [supabase.com](https://supabase.com)
   - Click "New Project"
   - Name: `siteflow`
   - Database Password: Choose a strong password (save it!)
   - Region: Europe West (London)
   - Wait ~2 minutes for provisioning

2. **Run the Database Setup**
   - In Supabase, click **SQL Editor** (left sidebar)
   - Click **New Query**
   - Open the file `supabase/setup.sql` from this project
   - Copy **ALL** the content
   - Paste into Supabase and click **Run**
   - Wait for "Success" message

3. **Get Your API Keys**
   - Go to **Project Settings** (gear icon) > **API**
   - Copy these three values:
     - **Project URL** (e.g., `https://xxxxx.supabase.co`)
     - **anon public** key (starts with `eyJ...`)
     - **service_role** key (starts with `eyJ...`)

### Step 2: Configure Your App (2 minutes)

1. **Create environment file**
   ```bash
   cp .env.local.example .env.local
   ```

2. **Edit `.env.local`** and paste your Supabase credentials:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
   SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
   ```

3. **Save the file**

### Step 3: Run the App (1 minute)

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### Step 4: Create Your First Account

1. Click **"Get Started"** or **"Sign Up"**
2. Fill in:
   - Email: `admin@test.com`
   - Password: `test123`
   - Full Name: Your name
   - Role: **Site Manager**
3. Click **"Create account"**
4. You'll be redirected to the dashboard

## 🎉 You're Done!

You now have access to:

- ✅ **Jobs** - Create and manage construction projects
- ✅ **Site Diary** - Record daily activities
- ✅ **Compliance** - Track safety and certifications
- ✅ **Team** - View workers and assignments
- ✅ **Alerts** - Monitor SMS notifications

## 📊 Optional: Load Demo Data

Want to see the app with sample data?

1. In Supabase SQL Editor, create a new query
2. Open `supabase/seed.sql`
3. Copy all content and paste
4. Click **Run**
5. Refresh your dashboard

You'll now see:
- 4 sample jobs
- Multiple tasks
- Diary entries
- Compliance logs
- SMS alert history

## 🔧 Optional: Enable SMS Alerts

If you want to send SMS notifications:

1. Sign up at [twilio.com](https://twilio.com/try-twilio)
2. Get a phone number
3. Copy your Account SID, Auth Token, and Phone Number
4. Add to `.env.local`:
   ```env
   TWILIO_ACCOUNT_SID=ACxxxx
   TWILIO_AUTH_TOKEN=your_token
   TWILIO_PHONE_NUMBER=+447700900000
   ```
5. Restart your dev server

## 🚀 Deploy to Production

When you're ready to deploy:

```bash
# Option 1: Vercel (recommended)
vercel deploy

# Option 2: Netlify
netlify deploy
```

See `docs/deployment-guide.md` for detailed instructions.

## ❓ Troubleshooting

**Can't log in?**
- Check `.env.local` has correct Supabase URL and keys
- Make sure you restarted the dev server after adding env vars

**Dashboard is blank?**
- This is normal without data
- Load the demo data from `seed.sql`
- Or create your first job manually

**"Row Level Security" errors?**
- Make sure you ran the entire `setup.sql` file
- Check Supabase > Database > Policies tab

## 📖 Learn More

- **Full Documentation**: See `README.md`
- **Deployment Guide**: See `docs/deployment-guide.md`
- **n8n Automation**: See `docs/n8n-workflows.md`
- **Database Schema**: See `supabase/schema.md`

## 🎯 What You Can Do Now

### As Site Manager:
1. Go to **Jobs** → **New Job**
2. Create a construction project
3. Add tasks to the job
4. Go to **Site Diary** → **New Entry**
5. Record daily activities
6. Go to **Compliance** → **New Log**
7. Track safety checks

### Test All Features:
- ✅ Create multiple jobs
- ✅ Add tasks and update status
- ✅ Record site diary entries
- ✅ Log compliance checks
- ✅ View team members
- ✅ Check SMS alerts (if Twilio configured)

---

**Need help?** Open an issue or contact support@dizzyotter.com

**Ready to deploy?** Follow the deployment guide in `docs/deployment-guide.md`
