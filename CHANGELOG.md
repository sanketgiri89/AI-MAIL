# 📋 Nothing Mail — Changelog & Update Log

> Every feature, fix, and update documented here. This file is updated with every release.

---

## 🔖 Update 10 — Apify Lead Scraper Integration (March 14, 2026)

### ✨ New Features
- **Lead Scraper Page** — Full UI to scrape leads from any website, Google Maps, LinkedIn, Yellow Pages, Instagram, Twitter
- **8 Built-in Scrapers** — Website Contacts, Google Maps, LinkedIn Profiles, LinkedIn Search, Yellow Pages, Instagram, Twitter/X, Custom Actor
- **User API Key Management** — Each user saves their own Apify API token in settings
- **Auto-Import to Lists** — Scraped leads automatically imported to subscriber lists for instant campaign use
- **Quick Campaign** — One-click campaign creation directly from scraped leads with merge tag support
- **Leads Table** — View, search, filter leads across all jobs with email/name/company/phone data
- **CSV Export** — Export all leads as CSV for external use
- **Job Management** — Start, monitor, refresh, view, delete scrape jobs with real-time status tracking
- **Bulk Import** — Import all leads across all jobs into any subscriber list
- **Documentation Panel** — Built-in how-it-works guide on the Lead Scraper page

### 📁 Database Tables
- `apify_settings` — Per-user API token and preferences
- `apify_scrape_jobs` — Scrape job tracking (actor, source, status, results)
- `apify_scraped_leads` — Individual leads (email, name, company, phone, website, address, LinkedIn, raw data)

### 📁 Files Changed
- `server/src/routes/apify.js` — **[NEW]** 15+ endpoints for scrape jobs, leads, import, quick campaign, CSV export
- `server/src/config/initDb.js` — Added 3 new tables
- `server/src/index.js` — Mounted `/api/apify` routes
- `js/api.js` — Added 13 Apify API methods
- `js/router.js` — Added `lead-scraper` route
- `js/pages-features.js` — Added Lead Scraper page renderer (~400 lines) + action handlers
- `index.html` — Added LEAD GEN sidebar section with Lead Scraper link

### 🔄 Pipeline Flow
```
Apify Scrape → Scraped Leads → Import to Subscriber List → Use in Campaigns/Drips
```

---

## 🔖 Update 9 — Frontend Feature Integration (March 13, 2026)

### ✨ New Features
- **API Keys Page** — Generate API keys with permissions (read/write/send/full) + expiry, copy key, revoke
- **Webhooks Page** — Create hooks with event selection, toggle active/paused, delete, copy webhook secret
- **Billing Page** — Usage progress bars, 3 plan cards (Free/Pro/Enterprise) with working Subscribe button, feature lists
- **Integrations Page** — n8n endpoint URLs + test button, Slack/Discord webhook config, REST API links

### 🔧 Fixes & Improvements
- Added **15+ new API methods** to `api.js` — subscribePlan, getApiKeys, createApiKey, deleteApiKey, getWebhooks, createWebhook, deleteWebhook, toggleWebhook, getWebhookLogs, n8nTrigger, n8nSendEmail, notifySlack, notifyDiscord
- Added **DEVELOPER** section to sidebar with API Keys and Webhooks links
- Added `api-keys` and `webhooks` route cases to `router.js`
- Mounted `publicApi.js` at `/api/v1` (API key auth) and `/api/developer` (JWT auth) in `index.js`

### ✅ Verified
- `GET /api/developer/keys` — Returns keys array
- `GET /api/developer/webhooks` — Returns webhooks array
- `GET /api/billing/plans` — Returns 3 plans (Free $0, Pro $9.99, Enterprise $29.99)
- `GET /api/billing/usage` — Returns usage data (emails, API calls, storage, accounts)
- `GET /api/integrations/status` — Returns integration statuses (n8n, Slack, Discord, Zapier)
- `POST /api/billing/subscribe` — Plan switching works

---

## 🔖 Update 8 — Integrations (Phase 8)

### ✨ New Features
- **n8n Connector** — Trigger workflows, send emails, sync contacts and tasks via n8n
- **Slack Notifications** — Send email notifications to Slack channels via webhooks
- **Discord Notifications** — Send email notifications to Discord channels via webhooks
- **Zapier-Style Hooks** — Webhook-based triggers for automation platforms
- **Cloud Storage Stubs** — Placeholder integrations for Google Drive, Dropbox, OneDrive

### 📁 Files
- `server/src/integrations.js` — Full integrations backend

---

## 🔖 Update 7 — Billing & Plans (Phase 7)

### ✨ New Features
- **Plans System** — Auto-seeded plans: Free ($0), Pro ($9.99), Enterprise ($29.99)
- **Subscriptions** — Subscribe, upgrade, downgrade plans
- **Usage Tracking** — Track email sends, API calls, storage, and connected accounts
- **Stripe Webhook Stub** — Ready for Stripe payment integration

### 📁 Database Tables
- `plans`, `subscriptions`, `usage_records`

### 📁 Files
- `server/src/billing.js` — Billing backend

---

## 🔖 Update 6 — Data Management (Phase 6)

### ✨ New Features
- **Backup & Restore** — Export/import all data as JSON
- **MBOX/EML Migration** — Import emails from MBOX and EML file formats
- **Data Retention Cleanup** — Automated cleanup of old data based on retention policies

### 📁 Files
- `server/src/dataManagement.js` — Data management backend

---

## 🔖 Update 5 — Analytics & Reporting (Phase 5)

### ✨ New Features
- **Analytics Dashboard** — Daily sent/received email counts, response time tracking
- **Busiest Hours** — Visualize your most active email hours
- **Top Senders** — See who emails you the most
- **SLA Tracking** — Monitor response time compliance
- **Attachment Analytics** — Track attachment sizes, types, and frequency

### 📁 Database Tables
- `email_analytics`

### 📁 Files
- `server/src/analytics.js` — Analytics backend

---

## 🔖 Update 4 — Security & Compliance (Phase 4)

### ✨ New Features
- **DLP Rules** — Data Loss Prevention rules to block sensitive content from being sent
- **IP Whitelist** — Restrict account access to specific IP addresses
- **Phishing Detection** — Automatic detection and flagging of phishing emails
- **Email Expiry** — Set auto-expiry on sent emails (self-destructing messages)
- **Audit Trail** — Full audit log of all account actions
- **GDPR Compliance** — Data export and data deletion requests for GDPR

### 📁 Database Tables
- `ip_whitelist`, `dlp_rules`, `email_expiry`, `audit_trail`, `gdpr_requests`

### 📁 Files
- `server/src/security.js` — Security backend

---

## 🔖 Update 3 — Productivity Suite (Phase 3)

### ✨ New Features
- **Calendar** — Full CRUD, ICS import/export, month grid view, event attendance
- **Tasks / Kanban** — Todo/In-Progress/Done columns, drag-and-drop task management
- **Notes** — Rich text notes with pinning, card grid layout
- **Reminders** — Set reminders for emails and tasks
- **Email Snooze** — Snooze emails to reappear later

### 📁 Database Tables
- `calendar_events`, `event_attendees`, `tasks`, `notes`, `reminders`, `snoozed_emails`

### 📁 Files
- `server/src/productivity.js` — Productivity backend

---

## 🔖 Update 2 — Send-From Selector & Team Collaboration (Phase 2)

### ✨ New Features
- **Send-From Selector** — Choose which email address to send from
- **Shared Mailboxes** — Create and manage shared team mailboxes with member roles
- **Email Delegation** — Delegate emails to team members
- **Email Comments** — Add internal comments/notes on emails for team collaboration
- **Shared Labels** — Create labels shared across team members
- **Real-Time Collision Detection** — Socket.IO powered alerts when multiple people are replying to the same thread

### 📁 Database Tables
- `shared_mailboxes`, `shared_mailbox_members`, `email_comments`, `shared_labels`, `email_delegations`

### 📁 Files
- `server/src/teams.js` — Teams backend

---

## 🔖 Update 1 — Bulk Email & Mail Merge (Phase 1)

### ✨ New Features
- **Subscriber Lists** — Create and manage subscriber lists and contacts
- **Campaign Builder** — Full campaign creation with templates, scheduling, and merge tags
- **Open & Click Tracking** — Track email opens and link clicks per recipient
- **A/B Testing** — Split test email variants (subject lines, content) and auto-pick winners
- **Drip Sequences** — Multi-step automated email workflows with delays
- **Bounce Detection** — Automatic bounce detection and handling
- **Campaign Scheduler** — Schedule campaigns to send at a specific date/time
- **Drip Worker** — Background worker to process drip sequence steps
- **Marketing Dashboard** — Full UI with 4 tabs and 5 modals for managing all marketing features

### 📁 Database Tables
- `subscriber_lists`, `subscribers`, `campaigns`, `campaign_recipients`, `campaign_links`, `ab_tests`, `drip_sequences`, `drip_steps`, `drip_enrollments`

### 📁 Files
- `server/src/bulkSender.js` — Throttled send engine with merge tags
- `server/src/campaigns.js` — 30+ campaign endpoints
- `marketing.html` — Full marketing dashboard

---

## 🔖 Update 0 — Core App Setup (Initial Release)

### ✨ Core Features
- **Email Inbox** — View, read, and manage emails with folder navigation
- **Compose Email** — Rich email composition with attachments
- **Email Folders** — Inbox, Sent, Drafts, Trash, Starred, Archive
- **User Authentication** — Login, Signup, Forgot Password with JWT tokens
- **Admin Panel** — User management, system settings, monitoring
- **Documentation** — Full API documentation page
- **Setup Wizard** — Guided initial setup flow
- **Responsive UI** — Dark theme with modern glassmorphism design

### 📁 Files
- `index.html` — Main email client SPA
- `login.html` — Login page
- `signup.html` — Signup page
- `forgot-password.html` — Password recovery
- `admin.html` — Admin panel
- `docs.html` — API documentation
- `setup.html` — Setup wizard
- `css/styles.css` — Global stylesheet
- `js/router.js` — SPA router
- `js/pages.js` — Page renderers
- `js/api.js` — API client
- `js/data.js` — Data layer
- `js/admin-panel.js` — Admin panel logic

---

## ⚙️ Background Workers (Running Every 60 Seconds)

| Worker | Purpose |
|--------|---------|
| **Scheduled Email Sender** | Sends emails scheduled for a future time |
| **Campaign Scheduler** | Auto-starts scheduled campaigns |
| **Drip Sequence Worker** | Processes drip step enrollments |
| **Snooze Un-snoozer** | Moves snoozed emails back to inbox |
| **Reminder Notifier** | Triggers reminder notifications |
| **Email Expiry Cleanup** | Deletes expired self-destructing emails |

---

## 🔖 Frontend Pages Summary

| Page | Route | Features |
|------|-------|----------|
| **Inbox** | `/` | Email list, read, reply, forward, star, archive, delete |
| **Calendar** | `/calendar` | Month grid, event list, add/edit events |
| **Tasks** | `/tasks` | Kanban board (Todo/In-Progress/Done) |
| **Notes** | `/notes` | Card grid with pinning, add/edit |
| **Reminders** | `/reminders` | List with add form |
| **Signatures** | `/signatures` | Card list, create/edit |
| **Templates** | `/templates` | Card list, create |
| **Scheduled** | `/scheduled` | Pending emails list, cancel |
| **Forwarding** | `/forwarding` | Rules list, add rule |
| **Analytics** | `/analytics` | Dashboard with stat cards |
| **Security** | `/security` | DLP rules, IP whitelist, GDPR |
| **Billing** | `/billing` | Plan cards, subscription, usage |
| **Integrations** | `/integrations` | n8n, Slack, Discord, Zapier |
| **Backup** | `/backup` | Export/import data |
| **API Keys** | `/api-keys` | Generate, copy, revoke API keys |
| **Webhooks** | `/webhooks` | Create, toggle, delete webhooks |
| **Lead Scraper** | `/lead-scraper` | Apify scraping, lead management, import, quick campaign, CSV export |
| **Marketing** | `marketing.html` | Campaigns, lists, A/B tests, drips |

---

> **Last Updated:** March 14, 2026  
> **Project:** Nothing Mail  
> **Admin:** sanketgiri8901@gmail.com
