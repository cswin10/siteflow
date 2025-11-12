# SiteFlow

**Construction Site Management Made Simple**

SiteFlow is a lightweight, mobile-first web application designed for subcontractors and site managers in the construction industry. Replace outdated workflows (paper diaries, WhatsApp threads, spreadsheets) with a real-time dashboard that tracks job progress, compliance, and communication.

Built by [Dizzy Otter](https://dizzyotter.com) for small-to-mid-sized construction teams who need operational clarity and accountability without enterprise complexity.

---

## Features

### Core Modules

- **Job Tracker** - Create jobs, assign tasks, upload progress photos, and mark completion status
- **Site Diary** - Daily log system with voice-to-text support and PDF/CSV export
- **Compliance Log** - PPE verification, CSCS card uploads, insurance tracking, and site access records
- **SMS Alerts** - Automated Twilio notifications for job updates, safety reminders, and urgent alerts
- **Client Portal** - Read-only dashboard for clients to view progress, photos, and compliance
- **Dashboard Analytics** - Active jobs, overdue tasks, compliance gaps, and recent activity

### User Roles

- **Admin** - Full access to all features and settings
- **Site Manager** - Create/edit jobs, manage logs, assign workers
- **Worker** - View assigned tasks, submit updates
- **Client** - Read-only access to their projects

---

## Tech Stack

- **Frontend**: Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS v4
- **Backend**: Supabase (PostgreSQL, Auth, Storage)
- **SMS**: Twilio
- **Automation**: n8n (optional - for compliance reminders, daily summaries)
- **Hosting**: Vercel / Netlify

---

## Quick Start

### Prerequisites

- Node.js 18+ and npm
- Supabase account ([supabase.com](https://supabase.com))
- Twilio account ([twilio.com](https://twilio.com)) - optional for SMS features

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/your-org/siteflow.git
   cd siteflow
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Set up environment variables**

   Copy `.env.local.example` to `.env.local` and fill in your credentials:

   ```bash
   cp .env.local.example .env.local
   ```

   Required variables:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

   # Optional - for SMS features
   TWILIO_ACCOUNT_SID=your_twilio_account_sid
   TWILIO_AUTH_TOKEN=your_twilio_auth_token
   TWILIO_PHONE_NUMBER=your_twilio_phone_number
   ```

4. **Set up Supabase database**

   Run the migrations in your Supabase SQL editor (or using the CLI):

   ```bash
   # If using Supabase CLI
   supabase db push

   # Or manually run each migration file in order:
   # 1. supabase/migrations/20250101000001_initial_schema.sql
   # 2. supabase/migrations/20250101000002_rls_policies.sql
   # 3. supabase/migrations/20250101000003_views_and_functions.sql
   ```

5. **Load demo data (optional)**

   Run `supabase/seed.sql` to populate the database with sample data for testing.

6. **Start the development server**

   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Database Schema

The complete database schema includes:

- **profiles** - User accounts with role-based access
- **jobs** - Construction projects/sites
- **tasks** - Individual work items with assignments
- **job_assignments** - Worker-to-job mappings
- **site_diary_entries** - Daily site logs
- **compliance_logs** - Compliance tracking (PPE, CSCS, insurance)
- **compliance_items** - Individual checklist items
- **file_uploads** - Document and photo metadata
- **sms_alerts** - SMS notification history
- **job_updates** - Activity timeline

See `supabase/schema.md` for detailed documentation.

---

## Deployment

### Deploy to Vercel

1. Push your code to GitHub
2. Import your repository in [Vercel](https://vercel.com)
3. Add environment variables in Vercel dashboard
4. Deploy!

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/your-org/siteflow)

### Deploy to Netlify

1. Push your code to GitHub
2. Connect your repository in [Netlify](https://netlify.com)
3. Add environment variables
4. Deploy!

### Production Checklist

- [ ] Set up Supabase production project
- [ ] Run migrations on production database
- [ ] Configure Supabase Storage buckets:
  - `job-photos` (public read)
  - `compliance-documents` (private)
  - `profile-avatars` (public read)
- [ ] Set up Twilio account and verify phone number
- [ ] Configure custom domain
- [ ] Set up n8n workflows (optional)
- [ ] Test all authentication flows
- [ ] Test SMS sending
- [ ] Set up monitoring/error tracking

---

## Project Structure

```
siteflow/
├── app/                      # Next.js App Router
│   ├── (auth)/              # Auth pages (login, signup)
│   ├── dashboard/           # Dashboard and main app pages
│   ├── jobs/                # Job management pages
│   ├── diary/               # Site diary pages
│   ├── compliance/          # Compliance pages
│   └── layout.tsx           # Root layout
├── components/
│   ├── auth/                # Authentication components
│   ├── layout/              # Layout components (header, sidebar)
│   └── ui/                  # Reusable UI components
├── lib/
│   ├── supabase/            # Supabase client utilities
│   └── auth-helpers.ts      # Authentication helpers
├── middleware.ts            # Next.js middleware for auth
├── supabase/
│   ├── migrations/          # Database migrations
│   ├── schema.md            # Schema documentation
│   └── seed.sql             # Demo data
├── types/                   # TypeScript type definitions
└── .env.local.example       # Environment variable template
```

---

## Twilio SMS Integration

SiteFlow can send automated SMS alerts for:

- Job status updates
- Task assignments
- Overdue tasks
- Compliance alerts
- Safety reminders

To enable SMS:

1. Sign up for Twilio and get a phone number
2. Add credentials to `.env.local`
3. SMS API routes are in `app/api/sms/`

---

## n8n Automation Workflows (Optional)

For advanced automation, set up n8n workflows:

### Recommended Workflows

1. **Daily Compliance Reminders** - Check for upcoming compliance deadlines and send SMS/email
2. **Overdue Task Alerts** - Notify managers of overdue tasks every morning
3. **Weekly Summary Reports** - Generate and email weekly progress reports to clients
4. **Safety Check Reminders** - Prompt site managers to complete daily safety checks

See `docs/n8n-workflows.md` for detailed setup instructions.

---

## Development

### Running Tests

```bash
npm test
```

### Type Checking

```bash
npm run type-check
```

### Linting

```bash
npm run lint
```

### Code Formatting

```bash
npm run format
```

---

## Contributing

This project is currently maintained by Dizzy Otter. For feature requests or bug reports, please open an issue.

---

## License

Copyright © 2025 Dizzy Otter. All rights reserved.

---

## Roadmap

### Phase 1 (MVP - Current)
- [x] Authentication and user management
- [x] Dashboard with analytics
- [x] Job tracking
- [x] Site diary
- [x] Compliance logging
- [x] Basic SMS alerts

### Phase 2 (Planned)
- [ ] Voice-to-text for diary entries
- [ ] PDF export for site diaries
- [ ] Advanced file upload with preview
- [ ] Mobile app (React Native)
- [ ] Offline mode
- [ ] Advanced analytics and reporting

### Phase 3 (Future)
- [ ] Integration with accounting software
- [ ] Multi-language support
- [ ] White-label options
- [ ] API for third-party integrations
- [ ] Advanced scheduling and Gantt charts

---

## Support

For support, contact [support@dizzyotter.com](mailto:support@dizzyotter.com)

---

**Built with ❤️ by Dizzy Otter**
