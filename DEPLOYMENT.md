# 🚀 Eclatrecon AI Mail — Full VPS Deployment & Operations Guide

> **Last Updated:** April 9, 2026
> **Domain:** mail.eclatrecon.in
> **Stack:** Node.js 18 + PostgreSQL + PM2

---

## 📁 Project Structure

```
/www/mail/mail/
├── landing.html          # Public landing page (served at /)
├── login.html            # Login page
├── signup.html           # Signup page
├── index.html            # Main email client (served at /app)
├── admin.html            # Admin panel (served at /admin)
├── marketing.html        # Campaign/marketing dashboard
├── ai-tools.html         # AI tools page
├── setup.html            # Account setup wizard
├── docs.html             # API documentation
├── forgot-password.html  # Password reset page
├── 404.html              # Custom 404 page
├── favicon.svg           # App icon
├── css/                  # Frontend stylesheets
├── js/                   # Frontend JavaScript
└── server/               # ⭐ Backend (Node.js)
    ├── .env              # Environment variables (NEVER commit this)
    ├── package.json      # Dependencies
    ├── uploads/          # Email attachments storage
    └── src/
        ├── index.js              # 🟢 Main entry point (Express + Socket.IO)
        ├── config/
        │   ├── database.js       # PostgreSQL connection pool + Supabase-compatible wrapper
        │   ├── initDb.js         # DB initialization helper
        │   ├── migrate.js        # ⭐ Database schema (ALL 55 tables)
        │   └── seed-admin.js     # ⭐ Admin user + default data seeder
        ├── middleware/
        │   └── auth.js           # JWT authentication middleware
        ├── routes/               # 16 API route files
        │   ├── auth.js           # Signup, login, 2FA, sessions
        │   ├── emails.js         # CRUD, send, sync, search, tracking pixel
        │   ├── manage.js         # Folders, labels, contacts, mail accounts, rules
        │   ├── admin.js          # User management, system stats
        │   ├── campaigns.js      # Bulk email campaigns, A/B testing
        │   ├── billing.js        # Plans, subscriptions
        │   ├── teams.js          # Shared mailboxes, delegation
        │   ├── security.js       # DLP rules, IP whitelist, audit
        │   ├── productivity.js   # Calendar, tasks, notes, reminders
        │   ├── features.js       # Signatures, templates, scheduled, snooze
        │   ├── analytics.js      # Email analytics, open rates
        │   ├── integrations.js   # Webhooks, API keys
        │   ├── apify.js          # Lead scraping via Apify
        │   ├── ai.js             # AI email tools (OpenRouter)
        │   ├── dataManagement.js # Import/export, GDPR
        │   └── publicApi.js      # Public REST API (API key auth)
        └── services/
            ├── imap.js           # ⭐ IMAP sync (auto every 5 min)
            ├── pop3.js           # POP3 sync service
            ├── smtp.js           # Outgoing email via SMTP
            ├── bulkSender.js     # Campaign bulk sender
            ├── platformEmail.js  # System emails (password reset, welcome)
            ├── webhooks.js       # Webhook dispatcher
            └── ai.js             # AI service (OpenRouter integration)
```

---

## 🔧 Prerequisites

| Requirement | Version | Check Command |
|---|---|---|
| **Node.js** | 18+ | `node -v` |
| **npm** | 9+ | `npm -v` |
| **PostgreSQL** | 14+ | `pg_isready -h 127.0.0.1` |
| **PM2** | Latest | `npx pm2 -v` |

---

## 🛠️ Fresh VPS Setup (Step by Step)

### Step 1: Install Dependencies

```bash
# Ubuntu/Debian
apt update && apt install -y curl git

# Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt install -y nodejs

# Install PostgreSQL (if not already via panel like aaPanel)
apt install -y postgresql postgresql-contrib
```

### Step 2: Set Up PostgreSQL

```bash
# Switch to postgres user
sudo -u postgres psql

# Inside psql, run:
CREATE USER eclatrecon_mail WITH PASSWORD 'YOUR_STRONG_PASSWORD';
CREATE DATABASE eclatrecon_mail OWNER eclatrecon_mail;
GRANT ALL PRIVILEGES ON DATABASE eclatrecon_mail TO eclatrecon_mail;
\q
```

### Step 3: Configure pg_hba.conf

Find the file:
```bash
find / -name pg_hba.conf 2>/dev/null
```

Add this line (if not present):
```
host    eclatrecon_mail  eclatrecon_mail    127.0.0.1/32    md5
```

Then restart PostgreSQL:
```bash
systemctl restart postgresql
# OR if using aaPanel/custom install:
/www/server/pgsql/bin/pg_ctl restart -D /www/server/pgsql/data
```

### Step 4: Upload Project Files

```bash
# Upload your project to the server
# Example using rsync from local machine:
rsync -avz ./mail/ root@YOUR_VPS_IP:/www/mail/mail/
```

### Step 5: Install Node Packages

```bash
cd /www/mail/mail/server
npm install
```

### Step 6: Configure Environment Variables

```bash
nano /www/mail/mail/server/.env
```

```env
# ===== SERVER =====
PORT=3001
NODE_ENV=production

# ===== JWT =====
JWT_SECRET=CHANGE_THIS_TO_A_RANDOM_64_CHAR_STRING
JWT_EXPIRES_IN=7d

# ===== POSTGRESQL =====
PG_HOST=127.0.0.1
PG_PORT=5432
PG_DATABASE=eclatrecon_mail
PG_USER=eclatrecon_mail
PG_PASSWORD=YOUR_DB_PASSWORD

# ===== PLATFORM SMTP (system emails: password reset, welcome) =====
PLATFORM_SMTP_HOST=smtp.yourdomain.com
PLATFORM_SMTP_PORT=465
PLATFORM_SMTP_USER=noreply@yourdomain.com
PLATFORM_SMTP_PASS=YOUR_SMTP_PASSWORD
PLATFORM_SMTP_FROM="App Name <noreply@yourdomain.com>"

# ===== DOMAIN =====
APP_DOMAIN=https://mail.yourdomain.com
FRONTEND_URL=https://mail.yourdomain.com

# ===== FILE UPLOAD =====
UPLOAD_DIR=./uploads
MAX_ATTACHMENT_SIZE=25000000

# ===== AI (Optional) =====
OPENROUTER_API_KEY=
OPENROUTER_DEFAULT_MODEL=meta-llama/llama-3.1-8b-instruct:free
```

### Step 7: Run Database Migration

```bash
cd /www/mail/mail/server

# Create all 55 tables
node src/config/migrate.js

# Create admin user + default plans
node src/config/seed-admin.js
```

### Step 8: Start the Application

```bash
# Start with PM2
npx pm2 start /www/mail/mail/server/src/index.js \
  --name eclatrecon-mail \
  --interpreter /usr/bin/node

# Save PM2 config (auto-restart on reboot)
npx pm2 save
npx pm2 startup
```

### Step 9: Set Up Reverse Proxy (Nginx)

```nginx
server {
    listen 80;
    server_name mail.yourdomain.com;

    location / {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;

        # Important for file uploads
        client_max_body_size 50M;
    }
}
```

Then:
```bash
nginx -t && systemctl reload nginx
```

### Step 10: Verify Everything Works

```bash
# Test login
curl -s -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"sanket@eclatrecon.in","password":"Sanket620@"}'

# Should return a JWT token
```

---

## ⚡ Daily Operations Commands

### Application Management

```bash
# Check status
npx pm2 status

# View logs (live)
npx pm2 logs eclatrecon-mail

# View last 50 lines
npx pm2 logs eclatrecon-mail --lines 50

# Restart app
npx pm2 restart eclatrecon-mail

# Stop app
npx pm2 stop eclatrecon-mail

# Delete and re-add
npx pm2 delete eclatrecon-mail
npx pm2 start /www/mail/mail/server/src/index.js --name eclatrecon-mail --interpreter /usr/bin/node
npx pm2 save
```

### Database Management

```bash
# Connect to database
sudo -u postgres /www/server/pgsql/bin/psql -d eclatrecon_mail -U eclatrecon_mail -h 127.0.0.1

# Check table count
sudo -u postgres /www/server/pgsql/bin/psql -d eclatrecon_mail -c "SELECT count(*) FROM pg_tables WHERE schemaname='public';"

# Check user count
sudo -u postgres /www/server/pgsql/bin/psql -d eclatrecon_mail -c "SELECT count(*) FROM users;"

# Check email count
sudo -u postgres /www/server/pgsql/bin/psql -d eclatrecon_mail -c "SELECT count(*) FROM emails;"

# Check mail accounts
sudo -u postgres /www/server/pgsql/bin/psql -d eclatrecon_mail -c "SELECT email, last_sync, sync_enabled FROM mail_accounts;"
```

### Full Database Reset (DESTRUCTIVE)

```bash
# ⚠️ THIS DELETES EVERYTHING
cd /www/mail/mail/server
node src/config/migrate.js     # Drops + recreates all 55 tables
node src/config/seed-admin.js  # Creates admin user + plans
npx pm2 restart eclatrecon-mail
```

---

## 🔥 Troubleshooting Guide

### Problem: "EADDRINUSE: address already in use :::3001"

Port 3001 is already taken by another process.

```bash
# Kill whatever is using port 3001
fuser -k 3001/tcp

# Wait 2 seconds, then start
sleep 2
npx pm2 delete all 2>/dev/null
npx pm2 start /www/mail/mail/server/src/index.js --name eclatrecon-mail --interpreter /usr/bin/node
npx pm2 save
```

### Problem: "No space left on device"

Disk is full. This is CRITICAL — PostgreSQL will stop working.

```bash
# Check disk space
df -h /

# Clear temp files
rm -rf /tmp/*

# Clear old logs
truncate -s 0 /www/wwwlogs/*.log
truncate -s 0 /root/.pm2/logs/*.log

# Clear journal logs
journalctl --vacuum-size=50M

# Clear apt cache
apt-get clean

# Find large files
du -sh /www/wwwlogs/ /tmp/ /var/log/ /www/mail/mail/server/uploads/ 2>/dev/null

# Nuclear option: find files > 100MB
find / -type f -size +100M 2>/dev/null | head -20
```

### Problem: "PostgreSQL connection refused"

```bash
# Check if PostgreSQL is running
sudo -u postgres /www/server/pgsql/bin/pg_isready -h 127.0.0.1

# If not running, start it
/www/server/pgsql/bin/pg_ctl start -D /www/server/pgsql/data

# Check it's listening
ss -tlnp | grep 5432

# Verify pg_hba.conf has the right entry
grep eclatrecon /www/server/pgsql/data/pg_hba.conf
# Should show: host eclatrecon_mail eclatrecon_mail 127.0.0.1/32 md5
```

### Problem: "column X does not exist"

Schema mismatch between routes and database. Fix:

```bash
cd /www/mail/mail/server

# Re-run migration (drops + recreates all tables)
# ⚠️ THIS DELETES ALL DATA
node src/config/migrate.js
node src/config/seed-admin.js
npx pm2 restart eclatrecon-mail
```

### Problem: Emails not syncing

```bash
# Check PM2 logs for IMAP errors
npx pm2 logs eclatrecon-mail --lines 50

# Manually trigger sync via API
TOKEN=$(curl -s -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"sanket@eclatrecon.in","password":"Sanket620@"}' | grep -o '"token":"[^"]*"' | cut -d'"' -f4)

curl -s -X POST http://localhost:3001/api/emails/sync \
  -H "Authorization: Bearer $TOKEN"

# Check mail accounts in database
sudo -u postgres /www/server/pgsql/bin/psql -d eclatrecon_mail -c \
  "SELECT email, imap_host, imap_port, sync_enabled, last_sync FROM mail_accounts;"
```

### Problem: PM2 not auto-starting after reboot

```bash
npx pm2 save
npx pm2 startup

# Follow the command it outputs (usually looks like):
# sudo env PATH=... pm2 startup systemd -u root --hp /root
```

---

## 🏗️ Architecture Overview

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   Browser/App   │────▶│   Nginx (80/443)  │────▶│  Node.js :3001  │
│   (Frontend)    │◀────│   Reverse Proxy   │◀────│  Express Server │
└─────────────────┘     └──────────────────┘     └────────┬────────┘
                                                          │
                        ┌─────────────────────────────────┼──────────────┐
                        │                                 │              │
                  ┌─────▼──────┐  ┌──────────────┐  ┌────▼─────┐  ┌────▼────┐
                  │ PostgreSQL │  │  IMAP Sync   │  │ Socket.IO│  │   PM2   │
                  │  (55 tables)│  │ (every 5min) │  │ (realtime)│  │ (daemon)│
                  └────────────┘  └──────────────┘  └──────────┘  └─────────┘
```

### How IMAP Auto-Sync Works

1. **Server boots** → `imapService.startAutoSync()` is called
2. **After 10 seconds** → First sync runs for ALL accounts in `mail_accounts` table
3. **Every 5 minutes** → Syncs all accounts with `sync_enabled = true`
4. **Per account:** Connects to IMAP server, fetches all messages, skips duplicates (by `message_id`), saves new emails to `emails` table
5. **IDLE mode:** Also listens for real-time new email notifications when a user is connected via Socket.IO

### How the Database Wrapper Works

The app was originally built for Supabase. Instead of rewriting all 16 route files, we created a **drop-in replacement** (`database.js`) that mimics the Supabase `.from().select().eq().single()` API but runs raw PostgreSQL queries underneath.

**This means:** All route files use `supabase.from('table')...` but it's actually hitting local PostgreSQL.

### Background Workers (every 60 seconds)

The server runs these workers automatically:
- **Scheduled Email Sender** — Sends emails at their `send_at` time
- **Campaign Scheduler** — Auto-starts campaigns at scheduled time
- **Drip Sequence Worker** — Sends drip email steps
- **Snooze Un-snoozer** — Restores snoozed emails to inbox
- **Reminder Worker** — Fires reminder notifications via Socket.IO
- **Email Expiry Worker** — Auto-deletes expired emails

---

## 📋 All 55 Database Tables

| # | Table | Purpose |
|---|---|---|
| 1 | `users` | User accounts (email, password, settings) |
| 2 | `sessions` | Active login sessions |
| 3 | `password_resets` | Password reset tokens |
| 4 | `login_history` | Login attempt log |
| 5 | `mail_accounts` | IMAP/SMTP configurations per user |
| 6 | `emails` | All email messages |
| 7 | `attachments` | Email file attachments |
| 8 | `email_labels` | Many-to-many email ↔ label |
| 9 | `labels` | User-created labels |
| 10 | `shared_labels` | Team shared labels |
| 11 | `folders` | Inbox, Sent, Drafts, Spam, Trash, custom |
| 12 | `contacts` | Address book |
| 13 | `contact_groups` | Contact groups |
| 14 | `contact_group_members` | Group membership |
| 15 | `subscriber_lists` | Marketing subscriber lists |
| 16 | `subscribers` | Individual subscribers |
| 17 | `campaigns` | Bulk email campaigns |
| 18 | `campaign_recipients` | Per-recipient tracking |
| 19 | `campaign_links` | Click tracking per link |
| 20 | `drip_sequences` | Automated email sequences |
| 21 | `drip_steps` | Individual steps in a sequence |
| 22 | `drip_enrollments` | Subscriber enrollment in sequences |
| 23 | `email_templates` | Reusable email templates |
| 24 | `signatures` | Email signatures |
| 25 | `scheduled_emails` | Emails scheduled for future send |
| 26 | `snoozed_emails` | Temporarily hidden emails |
| 27 | `reminders` | Email reminders |
| 28 | `email_expiry` | Auto-delete email timers |
| 29 | `email_rules` | Inbox auto-sort rules |
| 30 | `auto_replies` | Vacation auto-responder |
| 31 | `forwarding_rules` | Auto-forward rules |
| 32 | `calendar_events` | Calendar events |
| 33 | `event_attendees` | Event attendee list |
| 34 | `tasks` | To-do tasks |
| 35 | `notes` | Quick notes |
| 36 | `email_comments` | Internal comments on emails |
| 37 | `shared_mailboxes` | Shared team mailboxes |
| 38 | `shared_mailbox_members` | Shared mailbox access |
| 39 | `email_delegations` | Send-as delegation |
| 40 | `integrations` | Third-party integrations |
| 41 | `webhooks` | Outgoing webhook configs |
| 42 | `webhook_logs` | Webhook delivery logs |
| 43 | `api_keys` | Public API keys |
| 44 | `audit_logs` | User action audit trail |
| 45 | `audit_trail` | Detailed change tracking |
| 46 | `dlp_rules` | Data loss prevention rules |
| 47 | `ip_whitelist` | Allowed IP addresses |
| 48 | `gdpr_requests` | GDPR data requests |
| 49 | `plans` | Billing plans (Free, Pro, Enterprise) |
| 50 | `subscriptions` | User plan subscriptions |
| 51 | `user_preferences` | UI/notification preferences |
| 52 | `ab_tests` | A/B test variants |
| 53 | `apify_settings` | Apify API configuration |
| 54 | `apify_scrape_jobs` | Lead scraping jobs |
| 55 | `apify_scraped_leads` | Scraped lead data |

---

## 🔑 Important Rules & Gotchas

### ⚠️ NEVER Do These

1. **Never edit `database.js`** unless you know the Supabase API — it's the translation layer between route files and PostgreSQL
2. **Never add a column to a route file** without adding it to `migrate.js` first — you'll get `column does not exist` errors
3. **Never run `migrate.js` on production** without backing up — it DROP + recreates all tables
4. **Never let disk hit 100%** — PostgreSQL crashes and corrupts data. Set up monitoring.

### ✅ Always Do These

1. **Back up before migration:** `pg_dump eclatrecon_mail > backup_$(date +%Y%m%d).sql`
2. **Check disk space weekly:** `df -h /`
3. **Rotate PM2 logs:** `npx pm2 flush` (clears all logs)
4. **Monitor with:** `npx pm2 monit`

### Schema Change Workflow

If you need to add a new feature that requires new columns:

1. Add the column to `migrate.js` in the correct `CREATE TABLE` block
2. For production (without data loss), run ALTER instead:
   ```sql
   ALTER TABLE table_name ADD COLUMN IF NOT EXISTS column_name TEXT DEFAULT '';
   ```
3. Update the relevant route file to use the new column
4. Restart: `npx pm2 restart eclatrecon-mail`

---

## 📊 API Endpoints Reference

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/signup` | No | Create account |
| POST | `/api/auth/login` | No | Login (returns JWT) |
| GET | `/api/auth/me` | JWT | Current user info |
| PUT | `/api/auth/profile` | JWT | Update profile |
| GET | `/api/emails?folder=inbox` | JWT | List emails |
| POST | `/api/emails/send` | JWT | Send email |
| POST | `/api/emails/sync` | JWT | Manual IMAP sync |
| GET | `/api/emails/counts` | JWT | Folder counts |
| POST | `/api/emails/search` | JWT | Full-text search |
| GET | `/api/accounts` | JWT | List mail accounts |
| POST | `/api/accounts` | JWT | Add mail account |
| GET | `/api/contacts` | JWT | List contacts |
| GET | `/api/campaigns` | JWT | List campaigns |
| POST | `/api/campaigns` | JWT | Create campaign |
| GET | `/api/admin/users` | Admin | List all users |
| GET | `/api/admin/stats` | Admin | System statistics |
| GET | `/api/health` | No | Health check |

**All JWT-protected routes require header:** `Authorization: Bearer <token>`

---

## 🔄 Backup & Restore

### Create Backup

```bash
# Database backup
sudo -u postgres /www/server/pgsql/bin/pg_dump eclatrecon_mail > /root/backup_eclatrecon_$(date +%Y%m%d_%H%M).sql

# Full project backup (including uploads)
tar -czf /root/eclatrecon_mail_full_$(date +%Y%m%d).tar.gz /www/mail/mail/
```

### Restore Backup

```bash
# Restore database
sudo -u postgres /www/server/pgsql/bin/psql -d eclatrecon_mail < /root/backup_eclatrecon_YYYYMMDD_HHMM.sql

# Restart app
npx pm2 restart eclatrecon-mail
```

### Automated Daily Backup (Cron)

```bash
crontab -e

# Add this line (runs daily at 3 AM):
0 3 * * * /usr/bin/pg_dump -U postgres eclatrecon_mail > /root/backups/eclatrecon_$(date +\%Y\%m\%d).sql 2>&1
```

---

## 🚨 Emergency Quick-Fix Commands

```bash
# 🔴 App crashed? Quick restart:
fuser -k 3001/tcp; sleep 2; npx pm2 restart eclatrecon-mail

# 🔴 Disk full? Emergency cleanup:
rm -rf /tmp/*; truncate -s 0 /www/wwwlogs/*.log; npx pm2 flush; apt-get clean

# 🔴 Database connection failed? Restart PostgreSQL:
/www/server/pgsql/bin/pg_ctl restart -D /www/server/pgsql/data

# 🔴 Complete fresh start (DELETES ALL DATA):
fuser -k 3001/tcp
cd /www/mail/mail/server
node src/config/migrate.js
node src/config/seed-admin.js
npx pm2 delete all; npx pm2 start /www/mail/mail/server/src/index.js --name eclatrecon-mail --interpreter /usr/bin/node; npx pm2 save
```

---

*Generated for Eclatrecon AI Mail v1.0 — Sanket Giri (sanket@eclatrecon.in)*
