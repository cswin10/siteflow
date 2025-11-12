# SiteFlow Deployment Guide

This guide walks you through deploying SiteFlow to production.

---

## Quick Deployment Steps

1. Set up Supabase project
2. Run database migrations
3. Configure environment variables
4. Deploy to Vercel or Netlify
5. Test authentication and features

---

## Step 1: Set Up Supabase

### Create a New Project

1. Go to [supabase.com](https://supabase.com)
2. Click "New Project"
3. Fill in:
   - **Name**: siteflow-production
   - **Database Password**: Generate a strong password
   - **Region**: Choose closest to your users (e.g., London for UK)
4. Wait for project to be created (~2 minutes)

### Run Database Migrations

**Option A: Using Supabase SQL Editor (Recommended)**

1. Navigate to SQL Editor in Supabase dashboard
2. Click "New Query"
3. Copy content from `supabase/migrations/20250101000001_initial_schema.sql`
4. Click "Run"
5. Repeat for:
   - `20250101000002_rls_policies.sql`
   - `20250101000003_views_and_functions.sql`

**Option B: Using Supabase CLI**

```bash
# Install Supabase CLI
npm install -g supabase

# Link to your project
supabase link --project-ref your-project-ref

# Push migrations
supabase db push
```

### Load Demo Data (Optional)

For testing, load sample data:
```bash
# Copy content from supabase/seed.sql
# Run in SQL Editor
```

### Configure Storage Buckets

1. Navigate to Storage in Supabase dashboard
2. Create three buckets:

**job-photos**
- Public bucket: ✅
- Allowed MIME types: `image/*`
- Max file size: 10MB
- RLS Policies:
  ```sql
  -- Anyone can view
  CREATE POLICY "Public read access"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'job-photos');

  -- Authenticated users can upload
  CREATE POLICY "Authenticated users can upload"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'job-photos' AND auth.role() = 'authenticated');
  ```

**compliance-documents**
- Public bucket: ❌ (Private)
- Allowed MIME types: `image/*,application/pdf`
- Max file size: 20MB
- RLS Policies:
  ```sql
  -- Only managers and admins can access
  CREATE POLICY "Managers can access compliance docs"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'compliance-documents'
    AND auth.uid() IN (
      SELECT id FROM profiles WHERE role IN ('admin', 'site_manager')
    )
  );
  ```

**profile-avatars**
- Public bucket: ✅
- Allowed MIME types: `image/*`
- Max file size: 2MB

### Get API Credentials

1. Go to Project Settings > API
2. Copy:
   - **Project URL** (NEXT_PUBLIC_SUPABASE_URL)
   - **anon public** key (NEXT_PUBLIC_SUPABASE_ANON_KEY)
   - **service_role** key (SUPABASE_SERVICE_ROLE_KEY) - keep this secret!

---

## Step 2: Set Up Twilio (Optional)

1. Sign up at [twilio.com](https://twilio.com)
2. Get a phone number (UK: +44, US: +1)
3. Copy credentials:
   - Account SID
   - Auth Token
   - Phone Number

**Cost Estimate:**
- UK SMS: £0.04 per message
- US SMS: $0.0075 per message

---

## Step 3: Deploy to Vercel

### Via Vercel Dashboard

1. Go to [vercel.com](https://vercel.com)
2. Click "New Project"
3. Import your Git repository
4. Framework Preset: **Next.js** (auto-detected)
5. Add Environment Variables:

   ```
   NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
   SUPABASE_SERVICE_ROLE_KEY=eyJ...
   TWILIO_ACCOUNT_SID=AC...
   TWILIO_AUTH_TOKEN=...
   TWILIO_PHONE_NUMBER=+44...
   NEXT_PUBLIC_APP_URL=https://siteflow.app
   ```

6. Click "Deploy"

### Via Vercel CLI

```bash
npm install -g vercel

# Login
vercel login

# Deploy
vercel --prod

# Set environment variables
vercel env add NEXT_PUBLIC_SUPABASE_URL production
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production
# ... repeat for all variables
```

---

## Step 4: Deploy to Netlify (Alternative)

1. Go to [netlify.com](https://netlify.com)
2. Click "Add new site" > "Import an existing project"
3. Connect to Git provider
4. Build settings:
   - Build command: `npm run build`
   - Publish directory: `.next`
5. Add environment variables (same as above)
6. Click "Deploy site"

---

## Step 5: Post-Deployment Testing

### Test Authentication

1. Visit your deployed site
2. Click "Sign Up"
3. Create a test account
4. Verify email confirmation works
5. Check that you're redirected to dashboard
6. Test logout/login

### Test User Roles

Create test accounts for each role:
- admin@test.com (Admin)
- manager@test.com (Site Manager)
- worker@test.com (Worker)
- client@test.com (Client)

Manually update roles in Supabase:
```sql
UPDATE profiles
SET role = 'admin'
WHERE email = 'admin@test.com';
```

### Test Navigation

- Dashboard loads without errors
- Sidebar navigation works
- Mobile menu works
- User menu works

### Test API Connections

- Check browser console for errors
- Verify Supabase connection (check Network tab)
- Test creating a job (if implemented)
- Test file uploads (if implemented)

---

## Step 6: Configure Custom Domain

### Vercel

1. Go to Project Settings > Domains
2. Add your domain (e.g., `siteflow.app`)
3. Follow DNS configuration instructions
4. Update `NEXT_PUBLIC_APP_URL` environment variable

### Netlify

1. Go to Domain Settings
2. Add custom domain
3. Configure DNS
4. Enable HTTPS (automatic)

---

## Security Checklist

- [ ] All environment variables are set correctly
- [ ] Service role key is kept secret (not in client-side code)
- [ ] RLS policies are enabled on all tables
- [ ] Storage buckets have proper access policies
- [ ] HTTPS is enabled (automatic with Vercel/Netlify)
- [ ] Email verification is enabled in Supabase Auth
- [ ] Rate limiting is configured (optional but recommended)
- [ ] Error tracking is set up (e.g., Sentry)

---

## Performance Optimization

### Enable Caching

In `next.config.ts`, add:
```typescript
const nextConfig = {
  experimental: {
    optimizeCss: true,
  },
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
  },
};
```

### Set Up CDN

- Vercel automatically uses Edge Network
- Netlify automatically uses CDN
- Consider Cloudflare for additional caching

### Database Indexing

Ensure all indexes are created (should be done by migrations):
```sql
-- Check indexes
SELECT * FROM pg_indexes WHERE tablename IN (
  'jobs', 'tasks', 'profiles', 'compliance_logs'
);
```

---

## Monitoring & Maintenance

### Set Up Error Tracking

**Using Sentry:**
```bash
npm install @sentry/nextjs

# Initialize
npx @sentry/wizard@latest -i nextjs
```

**Using LogRocket:**
```bash
npm install logrocket
npm install logrocket-react
```

### Database Backups

Supabase automatically backs up your database daily (Pro plan).

For additional backups:
```bash
# Using pg_dump
pg_dump -h db.xxx.supabase.co -U postgres -d postgres > backup.sql
```

### Performance Monitoring

- Vercel Analytics (free for Pro plan)
- Google Analytics
- Supabase Dashboard (query performance)

---

## Troubleshooting

### Build Failures

**Error: "Type error: Cannot find module '@/types'"**
- Check `tsconfig.json` paths configuration
- Run `npm install`
- Clear `.next` folder

**Error: "NEXT_PUBLIC_SUPABASE_URL is not defined"**
- Check environment variables in deployment platform
- Ensure variables are prefixed correctly
- Restart build

### Runtime Errors

**"Failed to fetch" from Supabase**
- Check CORS settings in Supabase
- Verify API URL is correct
- Check RLS policies aren't blocking requests

**Authentication not working**
- Check Site URL in Supabase Auth settings
- Add redirect URLs for production domain
- Verify email templates are configured

### Database Issues

**RLS blocking queries**
```sql
-- Temporarily disable RLS for debugging
ALTER TABLE jobs DISABLE ROW LEVEL SECURITY;

-- Remember to re-enable!
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
```

**Slow queries**
- Check query performance in Supabase
- Add indexes if needed
- Use `EXPLAIN ANALYZE` in SQL editor

---

## Cost Estimation

### Monthly Costs (Small Team - 10 users)

- **Vercel**: $20/month (Pro) or Free (Hobby - limited)
- **Supabase**: $25/month (Pro) or Free (up to 500MB database)
- **Twilio**: £10-50/month (depending on SMS usage)
- **Domain**: £10/year
- **n8n** (optional): $20-50/month or self-hosted free

**Total**: £55-125/month

### Scaling Costs (100 users)

- **Vercel**: $20/month (same)
- **Supabase**: $25-100/month (depends on data)
- **Twilio**: £50-200/month
- **Total**: £95-320/month

---

## Next Steps After Deployment

1. **Onboard first users** - Create accounts for your team
2. **Create sample jobs** - Test the full workflow
3. **Set up n8n workflows** - Automate notifications
4. **Gather feedback** - Track what works and what doesn't
5. **Iterate** - Build additional features based on usage

---

## Support

For deployment issues:
- Vercel: [vercel.com/docs](https://vercel.com/docs)
- Supabase: [supabase.com/docs](https://supabase.com/docs)
- SiteFlow: [support@dizzyotter.com](mailto:support@dizzyotter.com)

---

**Congratulations! 🎉 SiteFlow is now live!**
