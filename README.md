<p align="center">
  <img src="https://img.shields.io/badge/version-1.3.0-ec5b13?style=for-the-badge&labelColor=0a0a0a" alt="Version 1.3.0" />
  <img src="https://img.shields.io/badge/license-MIT-green?style=for-the-badge&labelColor=0a0a0a" alt="MIT License" />
  <img src="https://img.shields.io/badge/node-%3E%3D18.0.0-339933?style=for-the-badge&logo=node.js&labelColor=0a0a0a" alt="Node.js" />
  <img src="https://img.shields.io/badge/PostgreSQL-14+-336791?style=for-the-badge&logo=postgresql&labelColor=0a0a0a" alt="PostgreSQL" />
  <img src="https://img.shields.io/badge/PRs-welcome-ec5b13?style=for-the-badge&labelColor=0a0a0a" alt="PRs Welcome" />
</p>

<h1 align="center">
  <br />
  Eclatrecon AI Mail
  <br />
  <sub>Self-Hosted AI-Powered Email Platform</sub>
</h1>

<p align="center">
  A production-ready, self-hosted email client and marketing platform with AI capabilities, team collaboration, campaign management, and a full developer API — all deployable on a single VPS.
</p>

<p align="center">
  <a href="#-features">Features</a> •
  <a href="#-tech-stack">Tech Stack</a> •
  <a href="#-quick-start">Quick Start</a> •
  <a href="#-installation">Installation</a> •
  <a href="#-configuration">Configuration</a> •
  <a href="#-architecture">Architecture</a> •
  <a href="#-api-reference">API</a> •
  <a href="#-contributing">Contributing</a> •
  <a href="#-license">License</a>
</p>

---

## 📖 Overview

Eclatrecon AI Mail is a comprehensive, open-source email platform built for individuals and teams who want full control over their email infrastructure. It replaces the need for separate tools like Gmail, Mailchimp, Calendly, and Trello by unifying email, marketing, productivity, and AI-driven insights into a single self-hosted application.

**Who is this for?**
- Developers who want to self-host their email client
- Small teams that need shared mailboxes and collaboration
- Marketers who need campaign management with subscriber lists
- Businesses that require audit trails, DLP rules, and GDPR compliance
- Anyone who values data sovereignty over SaaS lock-in

---

## ✨ Features

### 📬 Core Email
| Feature | Description |
|---------|-------------|
| **Multi-Account Inbox** | Connect unlimited IMAP/SMTP accounts with a unified inbox view |
| **Email Threading** | Conversation-grouped email threads with smart date formatting |
| **Compose & Send** | Rich text editor with To/CC/BCC, file attachments, and draft saving |
| **IMAP Auto-Sync** | Background sync every 5 minutes with real-time push via Socket.IO |
| **Full-Text Search** | PostgreSQL-powered search across subject, body, and sender fields |
| **Folder Management** | Inbox, Sent, Drafts, Spam, Trash, Starred, and custom folders |
| **Email Rules** | Auto-sort, auto-label, and auto-forward rules |

### 🤖 AI-Powered
| Feature | Description |
|---------|-------------|
| **AI Email Analysis** | Analyze email content for sentiment, urgency, and action items |
| **Smart Reply Drafts** | AI-generated reply suggestions based on email context |
| **Auto-Categorization** | Automatic email labeling (Work, Priority, Newsletter, etc.) |
| **Meeting Extraction** | Detect and extract meeting requests from email content |

### 📢 Marketing & Campaigns
| Feature | Description |
|---------|-------------|
| **Campaign Builder** | Create and schedule bulk email campaigns with merge tags |
| **Subscriber Management** | Import, segment, and manage subscriber lists |
| **A/B Testing** | Split-test subject lines and content with auto-winner selection |
| **Drip Sequences** | Multi-step automated email workflows with configurable delays |
| **Open & Click Tracking** | Per-recipient tracking with real-time analytics |
| **Lead Scraper** | Apify-powered lead generation from Google Maps, LinkedIn, and more |

### 📅 Productivity Suite
| Feature | Description |
|---------|-------------|
| **Calendar** | Event management with iCal import/export and attendee tracking |
| **Tasks (Kanban)** | Todo/In-Progress/Done task boards |
| **Notes** | Quick note-taking with pin and search |
| **Reminders** | Time-based reminders with recurring schedule support |
| **Email Snooze** | Temporarily hide emails and resurface them at a set time |
| **Scheduled Send** | Queue emails to be sent at a future date and time |
| **Email Templates** | Create and reuse email templates |
| **Signatures** | Multiple signature management per account |

### 👥 Team Collaboration
| Feature | Description |
|---------|-------------|
| **Shared Mailboxes** | Team-shared inboxes with role-based access |
| **Email Delegation** | Delegate send-as permissions to team members |
| **Internal Comments** | Add private comments on email threads for team context |
| **Real-Time Collision Detection** | Socket.IO alerts when two teammates reply to the same thread |
| **Shared Labels** | Team-wide label taxonomy |

### 🔒 Security & Compliance
| Feature | Description |
|---------|-------------|
| **Two-Factor Auth (2FA)** | TOTP-based two-factor authentication with QR code setup |
| **DLP Rules** | Data Loss Prevention — block sensitive content from leaving |
| **IP Whitelisting** | Restrict account access to approved IP addresses |
| **Audit Trail** | Full audit log of every account action |
| **GDPR Compliance** | Data export and deletion request handling |
| **Email Expiry** | Self-destructing messages with configurable TTL |
| **JWT Sessions** | Stateless, token-based authentication with configurable expiry |

### 🔌 Developer & Integration
| Feature | Description |
|---------|-------------|
| **REST API** | Full public API with API key authentication |
| **Webhooks** | Event-driven webhook system for external integrations |
| **n8n / Zapier** | Automation platform connectors via webhook triggers |
| **Slack & Discord** | Push email notifications to team channels |
| **Data Export** | JSON and MBOX export for migration and backup |
| **API Documentation** | Built-in interactive API docs page |

### 🎨 UI/UX
| Feature | Description |
|---------|-------------|
| **Dark Mode** | Premium dark theme with glassmorphism effects (default) |
| **Light Mode** | Full light theme support via toggle |
| **Mobile-Responsive** | Bottom navigation bar, slide-out sidebar, touch-optimized lists |
| **Desktop Layout** | Three-column Outlook-style layout with collapsible panels |
| **Real-Time Updates** | Socket.IO push notifications for new emails and events |

---

## 🛠 Tech Stack

### Backend

| Technology | Purpose | Version |
|------------|---------|---------|
| **Node.js** | Runtime environment | ≥ 18.x |
| **Express.js** | HTTP framework and routing | 4.18.x |
| **PostgreSQL** | Primary database (55 tables) | ≥ 14.x |
| **Socket.IO** | Real-time bidirectional communication | 4.7.x |
| **ImapFlow** | IMAP protocol client for email sync | 1.0.x |
| **Nodemailer** | SMTP email sending | 6.9.x |
| **Mailparser** | Email message parsing (MIME) | 3.6.x |
| **jsonwebtoken** | JWT-based authentication | 9.0.x |
| **bcryptjs** | Password hashing (bcrypt) | 2.4.x |
| **speakeasy** | TOTP-based 2FA generation and verification | 2.0.x |
| **qrcode** | QR code generation for 2FA setup | 1.5.x |
| **multer** | Multipart file upload handling | 1.4.x |
| **pg** | PostgreSQL native driver for Node.js | 8.20.x |
| **node-fetch** | HTTP client for external API calls | 2.7.x |
| **uuid** | RFC4122 UUID generation | 9.0.x |
| **dotenv** | Environment variable management | 16.4.x |
| **PM2** | Production process manager | Latest |

### Frontend

| Technology | Purpose |
|------------|---------|
| **HTML5** | Document structure and semantics |
| **Vanilla JavaScript** | Client-side logic (SPA architecture) |
| **CSS3** | Styling with custom properties and glassmorphism |
| **Material Symbols** | Google's icon system |
| **Public Sans** | Primary typeface (Google Fonts) |
| **Hash Router** | Client-side SPA routing (`router.js`) |

### Infrastructure

| Component | Role |
|-----------|------|
| **Nginx** | Reverse proxy and SSL termination |
| **PM2** | Process management with auto-restart |
| **Let's Encrypt** | Free SSL certificate provisioning |
| **Cron** | Automated database backup scheduling |

---

## ⚡ Quick Start

Get the platform running in under 5 minutes on a machine with Node.js and PostgreSQL installed:

```bash
# 1. Clone the repository
git clone https://github.com/sanketgiri89/ai-mail.git
cd ai-mail

# 2. Install dependencies
cd server && npm install

# 3. Configure environment
cp .env.example .env
# Edit .env with your PostgreSQL credentials and SMTP settings

# 4. Set up the database
node src/config/migrate.js
node src/config/seed-admin.js

# 5. Start the server
npm start
```

Open `http://localhost:3001` in your browser. Login with the credentials displayed after seeding.

---

## 📦 Installation

### Prerequisites

| Software | Minimum Version | Check |
|----------|----------------|-------|
| Node.js | 18.0.0 | `node -v` |
| npm | 9.0.0 | `npm -v` |
| PostgreSQL | 14.0 | `psql --version` |
| Git | 2.x | `git --version` |

### Step 1 — Clone the Repository

```bash
git clone https://github.com/sanketgiri89/ai-mail.git
cd ai-mail
```

### Step 2 — Install Dependencies

```bash
cd server
npm install
```

### Step 3 — Create the PostgreSQL Database

```bash
# Connect as the postgres superuser
sudo -u postgres psql

# Inside the psql prompt:
CREATE USER eclatrecon_mail WITH PASSWORD 'your_strong_password_here';
CREATE DATABASE eclatrecon_mail OWNER eclatrecon_mail;
GRANT ALL PRIVILEGES ON DATABASE eclatrecon_mail TO eclatrecon_mail;
\q
```

Ensure your `pg_hba.conf` allows local password connections:

```
# Add this line if not present:
host    eclatrecon_mail  eclatrecon_mail    127.0.0.1/32    md5
```

Restart PostgreSQL after editing:

```bash
sudo systemctl restart postgresql
```

### Step 4 — Configure Environment Variables

```bash
cp .env.example .env
nano .env   # or use your preferred editor
```

See [Configuration](#-configuration) for all available options.

### Step 5 — Run Database Migration

```bash
# Creates all 55 tables with correct schema
node src/config/migrate.js

# Seeds admin user, default folders, labels, and billing plans
node src/config/seed-admin.js
```

### Step 6 — Start the Server

**Development:**

```bash
npm run dev
# Uses --watch for auto-restart on file changes
```

**Production (with PM2):**

```bash
npx pm2 start src/index.js --name eclatrecon-mail
npx pm2 save
npx pm2 startup   # Enable auto-start on system reboot
```

### Step 7 — Access the Application

| URL | Page |
|-----|------|
| `http://localhost:3001` | Landing page |
| `http://localhost:3001/login` | Login |
| `http://localhost:3001/app` | Email client |
| `http://localhost:3001/admin` | Admin panel |
| `http://localhost:3001/marketing` | Campaign dashboard |
| `http://localhost:3001/docs` | API documentation |

---

## ⚙️ Configuration

### Environment Variables

Create a `.env` file in the `server/` directory:

```env
# ──────────────────────── Server ────────────────────────
PORT=3001                          # HTTP port
NODE_ENV=production                # production | development

# ──────────────────────── Authentication ────────────────
JWT_SECRET=your-64-char-random-string-here
JWT_EXPIRES_IN=7d                  # Token lifetime

# ──────────────────────── PostgreSQL ────────────────────
PG_HOST=127.0.0.1
PG_PORT=5432
PG_DATABASE=eclatrecon_mail
PG_USER=eclatrecon_mail
PG_PASSWORD=your_db_password

# ──────────────────────── Platform SMTP ─────────────────
# Used for system emails (password resets, welcome emails)
PLATFORM_SMTP_HOST=smtp.yourdomain.com
PLATFORM_SMTP_PORT=465
PLATFORM_SMTP_USER=noreply@yourdomain.com
PLATFORM_SMTP_PASS=your_smtp_password
PLATFORM_SMTP_FROM="App Name <noreply@yourdomain.com>"

# ──────────────────────── Domain ────────────────────────
APP_DOMAIN=https://mail.yourdomain.com
FRONTEND_URL=https://mail.yourdomain.com

# ──────────────────────── File Upload ───────────────────
UPLOAD_DIR=./uploads
MAX_ATTACHMENT_SIZE=25000000       # 25MB in bytes

# ──────────────────────── AI (Optional) ─────────────────
OPENROUTER_API_KEY=                # Your OpenRouter API key
OPENROUTER_DEFAULT_MODEL=meta-llama/llama-3.1-8b-instruct:free
```

### Nginx Reverse Proxy (Production)

```nginx
server {
    listen 80;
    server_name mail.yourdomain.com;

    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name mail.yourdomain.com;

    ssl_certificate     /etc/letsencrypt/live/mail.yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/mail.yourdomain.com/privkey.pem;

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
        client_max_body_size 50M;
    }
}
```

---

## 🏗 Architecture

```
┌──────────────┐          ┌────────────────────────────────────┐
│   Browser    │◄────────▶│          Nginx (443/80)            │
│  (Frontend)  │  HTTPS   │       Reverse Proxy + SSL          │
└──────────────┘          └──────────────┬─────────────────────┘
                                         │
                                         ▼
                          ┌──────────────────────────────────┐
                          │        Express.js (:3001)         │
                          │                                   │
                          │  ┌──────────┐  ┌──────────────┐  │
                          │  │ REST API │  │  Socket.IO   │  │
                          │  │ 16 route │  │  (real-time) │  │
                          │  │  modules │  │              │  │
                          │  └────┬─────┘  └──────┬───────┘  │
                          │       │               │          │
                          │  ┌────▼───────────────▼───────┐  │
                          │  │     Service Layer           │  │
                          │  │  IMAP · SMTP · AI · Bulk   │  │
                          │  └────────────┬───────────────┘  │
                          │               │                  │
                          └───────────────┼──────────────────┘
                                          │
                          ┌───────────────▼──────────────────┐
                          │       PostgreSQL (55 tables)      │
                          │    Users · Emails · Campaigns     │
                          │    Tasks · Events · Webhooks      │
                          └──────────────────────────────────┘
```

### Key Design Decisions

1. **Vanilla Frontend** — No build step, no bundler, no React. The entire frontend is vanilla HTML/CSS/JS with a custom SPA router. This makes the project trivially deployable with zero toolchain configuration.

2. **Supabase-Compatible Query Layer** — The backend uses a custom wrapper (`database.js`) that mimics the Supabase JS client API (`.from().select().eq().order()`). This means route files written for Supabase work against local PostgreSQL without modification.

3. **Single-Process Architecture** — The Express server, Socket.IO handler, IMAP sync engine, and all background workers run in a single Node.js process managed by PM2. This simplifies deployment while leveraging Node.js's event loop for concurrent I/O.

4. **Background Workers** — Six background workers run on a 60-second interval within the main process, handling scheduled emails, campaign dispatch, drip sequences, snooze management, reminders, and email expiry.

5. **IMAP Auto-Sync** — On server boot, the IMAP service queries all sync-enabled `mail_accounts` records and syncs them every 5 minutes, independent of user Socket.IO connections.

---

## 📊 Database Schema

The application uses **55 PostgreSQL tables** organized into the following domains:

<details>
<summary><b>Core (6 tables)</b></summary>

| Table | Description |
|-------|-------------|
| `users` | User accounts with authentication data |
| `sessions` | Active login sessions |
| `password_resets` | Password reset tokens with expiry |
| `login_history` | Login attempt audit log |
| `user_preferences` | UI and notification preferences |
| `audit_logs` | System-wide audit log |

</details>

<details>
<summary><b>Email (10 tables)</b></summary>

| Table | Description |
|-------|-------------|
| `mail_accounts` | IMAP/SMTP account configurations |
| `emails` | All email messages |
| `attachments` | Email file attachments |
| `folders` | Email folders (system and custom) |
| `labels` | User-created labels |
| `email_labels` | Email-to-label associations |
| `email_rules` | Inbox auto-sort rules |
| `auto_replies` | Vacation auto-responder configs |
| `forwarding_rules` | Email forwarding rules |
| `scheduled_emails` | Queued future-send emails |

</details>

<details>
<summary><b>Marketing (9 tables)</b></summary>

| Table | Description |
|-------|-------------|
| `subscriber_lists` | Subscriber list definitions |
| `subscribers` | Individual subscriber records |
| `campaigns` | Bulk email campaign definitions |
| `campaign_recipients` | Per-recipient delivery tracking |
| `campaign_links` | Click tracking per link |
| `ab_tests` | A/B test variant configurations |
| `drip_sequences` | Automated email sequence definitions |
| `drip_steps` | Individual steps within sequences |
| `drip_enrollments` | Subscriber enrollment tracking |

</details>

<details>
<summary><b>Productivity (7 tables)</b></summary>

| Table | Description |
|-------|-------------|
| `calendar_events` | Calendar events |
| `event_attendees` | Event attendee records |
| `tasks` | Task items with status tracking |
| `notes` | Quick notes |
| `reminders` | Time-based reminders |
| `snoozed_emails` | Snoozed email records |
| `email_expiry` | Email auto-delete timers |

</details>

<details>
<summary><b>Collaboration (6 tables)</b></summary>

| Table | Description |
|-------|-------------|
| `contacts` | Address book entries |
| `contact_groups` | Contact group definitions |
| `contact_group_members` | Group membership |
| `shared_mailboxes` | Shared team mailboxes |
| `shared_mailbox_members` | Mailbox access control |
| `email_delegations` | Send-as delegation permissions |

</details>

<details>
<summary><b>Security (5 tables)</b></summary>

| Table | Description |
|-------|-------------|
| `dlp_rules` | Data Loss Prevention policies |
| `ip_whitelist` | Approved IP addresses |
| `audit_trail` | Detailed change tracking |
| `gdpr_requests` | GDPR data requests |
| `email_comments` | Internal team comments |

</details>

<details>
<summary><b>Developer (6 tables)</b></summary>

| Table | Description |
|-------|-------------|
| `api_keys` | Public API authentication keys |
| `webhooks` | Outgoing webhook configurations |
| `webhook_logs` | Webhook delivery logs |
| `integrations` | Third-party integration configs |
| `plans` | Billing plan definitions |
| `subscriptions` | User plan subscriptions |

</details>

<details>
<summary><b>Lead Generation (4 tables)</b></summary>

| Table | Description |
|-------|-------------|
| `apify_settings` | Per-user Apify API configuration |
| `apify_scrape_jobs` | Scraping job records |
| `apify_scraped_leads` | Extracted lead data |
| `email_templates` | Reusable email templates |

</details>

### Database Commands

```bash
# Run full migration (creates all tables)
node src/config/migrate.js

# Seed admin user and default data
node src/config/seed-admin.js

# Connect to database directly
psql -h 127.0.0.1 -U eclatrecon_mail -d eclatrecon_mail

# Backup database
pg_dump -h 127.0.0.1 -U eclatrecon_mail eclatrecon_mail > backup.sql

# Restore from backup
psql -h 127.0.0.1 -U eclatrecon_mail -d eclatrecon_mail < backup.sql
```

---

## 📡 API Reference

All API endpoints require JWT authentication unless marked as public.

**Authentication header:** `Authorization: Bearer <token>`

### Auth

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/api/auth/signup` | — | Create a new account |
| `POST` | `/api/auth/login` | — | Login and receive JWT |
| `GET` | `/api/auth/me` | JWT | Get current user info |
| `PUT` | `/api/auth/profile` | JWT | Update user profile |
| `POST` | `/api/auth/forgot-password` | — | Request password reset |
| `POST` | `/api/auth/reset-password` | — | Reset password with token |
| `POST` | `/api/auth/2fa/setup` | JWT | Enable 2FA (returns QR code) |
| `POST` | `/api/auth/2fa/verify` | JWT | Verify 2FA code |

### Email

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/api/emails?folder=inbox` | JWT | List emails with optional folder filter |
| `GET` | `/api/emails/:id` | JWT | Get single email with full body |
| `POST` | `/api/emails/send` | JWT | Send email via SMTP |
| `POST` | `/api/emails/sync` | JWT | Trigger manual IMAP sync |
| `POST` | `/api/emails/search` | JWT | Full-text search across emails |
| `GET` | `/api/emails/counts` | JWT | Get unread counts per folder |
| `PUT` | `/api/emails/:id` | JWT | Update email (read/star/folder) |
| `DELETE` | `/api/emails/:id` | JWT | Delete email |

### Accounts

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/api/accounts` | JWT | List connected email accounts |
| `POST` | `/api/accounts` | JWT | Add new IMAP/SMTP account |
| `PUT` | `/api/accounts/:id` | JWT | Update account settings |
| `DELETE` | `/api/accounts/:id` | JWT | Remove connected account |

### Campaigns

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/api/campaigns` | JWT | List all campaigns |
| `POST` | `/api/campaigns` | JWT | Create campaign |
| `POST` | `/api/campaigns/:id/send` | JWT | Start sending campaign |
| `GET` | `/api/campaigns/:id/stats` | JWT | Get campaign analytics |

### Public API (API Key Auth)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/api/v1/emails` | API Key | List emails programmatically |
| `POST` | `/api/v1/send` | API Key | Send email via API |
| `GET` | `/api/v1/contacts` | API Key | Access contact list |

Full API documentation is available at `/docs` when the server is running.

---

## 🧰 CLI Commands Reference

### Application

```bash
# Start (development with auto-reload)
npm run dev

# Start (production)
npm start

# Start with PM2 (production, recommended)
npx pm2 start src/index.js --name eclatrecon-mail
npx pm2 save && npx pm2 startup

# Restart
npx pm2 restart eclatrecon-mail

# View logs
npx pm2 logs eclatrecon-mail --lines 50

# Monitor resources
npx pm2 monit

# Stop
npx pm2 stop eclatrecon-mail
```

### Database

```bash
# Create/reset all tables (⚠️ destructive)
node src/config/migrate.js

# Seed admin + defaults
node src/config/seed-admin.js

# Backup
pg_dump -U eclatrecon_mail eclatrecon_mail > backup_$(date +%Y%m%d).sql

# Restore
psql -U eclatrecon_mail eclatrecon_mail < backup_YYYYMMDD.sql

# Add a column without data loss
psql -U eclatrecon_mail -d eclatrecon_mail \
  -c "ALTER TABLE table_name ADD COLUMN IF NOT EXISTS column_name TEXT DEFAULT '';"
```

### Troubleshooting

```bash
# Port already in use
fuser -k 3001/tcp && sleep 2 && npx pm2 restart eclatrecon-mail

# Disk space issues
df -h / && rm -rf /tmp/* && npx pm2 flush

# PostgreSQL not responding
sudo systemctl restart postgresql
# or: pg_ctl restart -D /path/to/data

# Check database connectivity
pg_isready -h 127.0.0.1 -p 5432
```

---

## ✅ Pros & Cons

### Pros

| Advantage | Detail |
|-----------|--------|
| **Full Data Ownership** | All data stays on your server — no third-party SaaS dependency |
| **Zero Build Step** | Vanilla JS frontend requires no bundler, no Webpack, no npm build |
| **Single Binary Deploy** | One Node.js process handles API, WebSocket, IMAP sync, and workers |
| **55-Table Schema** | Production-grade relational schema covering email, CRM, marketing, and productivity |
| **AI-Ready** | Pluggable AI via OpenRouter — use any LLM model without vendor lock-in |
| **Real-Time** | Socket.IO provides instant email notifications and team collaboration |
| **Multi-Account** | Unified inbox across multiple IMAP/SMTP providers |
| **Marketing Built-In** | Campaign management, subscriber lists, A/B testing, and drip sequences |
| **API-First** | Full REST API with key-based auth for programmatic access |
| **Low Resource** | Runs comfortably on a $5/month VPS (1 CPU, 1GB RAM) |

### Cons

| Limitation | Detail |
|------------|--------|
| **No TypeScript** | Backend is plain JavaScript — no static type checking |
| **Single-Process** | All services run in one process; no horizontal scaling without custom setup |
| **No E2E Tests** | Test suite not included in v1.3 — manual testing recommended |
| **IMAP-Only Sync** | Pull-based sync via IMAP; no native push notification protocol (JMAP) |
| **No OAuth Login** | Authentication is email/password only — no Google/GitHub SSO |
| **Self-Managed** | You handle server maintenance, backups, and security patches |
| **No Docker Image** | Docker support not yet available (planned for v1.4) |

---

## 🗺️ Roadmap

| Version | Status | Features |
|---------|--------|----------|
| **v1.0** | ✅ Released | Core email, auth, compose, folder management |
| **v1.1** | ✅ Released | Campaigns, teams, productivity, security |
| **v1.2** | ✅ Released | Lead scraper, integrations, billing, analytics |
| **v1.3** | ✅ Current | PostgreSQL migration, IMAP auto-sync, full schema alignment |
| **v1.4** | 🔜 Planned | Docker support, OAuth2 login, JMAP protocol |
| **v1.5** | 🔜 Planned | Plugin system, theme marketplace, mobile PWA |
| **v2.0** | 🔜 Planned | TypeScript rewrite, horizontal scaling, E2E test suite |

---

## 🤝 Contributing

Contributions are welcome and appreciated. Here's how to get started:

### Development Setup

```bash
# Fork and clone the repository
git clone https://github.com/sanketgiri89/ai-mail.git
cd ai-mail/server

# Install dependencies
npm install

# Copy environment template
cp .env.example .env
# Edit .env with your local PostgreSQL credentials

# Initialize database
node src/config/migrate.js
node src/config/seed-admin.js

# Start in development mode
npm run dev
```

### Contribution Guidelines

1. **Fork** the repository and create your branch from `main`
2. **Focus** each PR on a single feature or fix
3. **Test** your changes against the migration script (ensure `node src/config/migrate.js` runs clean)
4. **Document** new API endpoints in the route file header comments
5. **Follow** the existing code style (2-space indentation, single quotes, async/await)

### Areas Where Help Is Needed

- [ ] Docker and Docker Compose configuration
- [ ] Unit and integration test suite
- [ ] OAuth2 / Google SSO login
- [ ] JMAP protocol support
- [ ] Internationalization (i18n)
- [ ] Accessibility audit (WCAG compliance)
- [ ] Mobile PWA enhancements

---

## 📄 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

You are free to use, modify, and distribute this software for personal and commercial purposes.

---

## 👤 Author

**Sanket Giri**
- GitHub: [@sanketgiri89](https://github.com/sanketgiri89)
- Organization: [Eclatrecon Solutions LLP](https://eclatrecon.in)
- Email: sanket@eclatrecon.in

---

## 🙏 Acknowledgments

- [ImapFlow](https://github.com/postalsys/imapflow) — IMAP client for Node.js
- [Nodemailer](https://nodemailer.com/) — Email sending for Node.js
- [Socket.IO](https://socket.io/) — Real-time bidirectional communication
- [Express.js](https://expressjs.com/) — Fast, unopinionated web framework
- [PostgreSQL](https://www.postgresql.org/) — The world's most advanced open source database
- [PM2](https://pm2.keymetrics.io/) — Production process manager for Node.js
- [OpenRouter](https://openrouter.ai/) — Unified API for LLM access
- [Apify](https://apify.com/) — Web scraping and automation platform

---

<p align="center">
  <sub>Built with ❤️ by <a href="https://eclatrecon.in">Eclatrecon Solutions LLP</a></sub>
  <br />
  <sub>If this project helps you, consider giving it a ⭐ on GitHub</sub>
</p>
