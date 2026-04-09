<p align="center">
  <img src="https://capsule-render.vercel.app/api?type=waving&color=0:0a0a0a,50:ec5b13,100:ff8c42&height=220&section=header&text=Eclatrecon%20AI%20Mail&fontSize=42&fontColor=ffffff&animation=fadeIn&fontAlignY=35&desc=Self-Hosted%20AI-Powered%20Email%20Platform&descSize=18&descAlignY=55&descColor=ffffff" width="100%" />
</p>

<p align="center">
  <a href="https://mail.eclatrecon.in">
    <img src="https://img.shields.io/badge/🌐_Live_Demo-mail.eclatrecon.in-ec5b13?style=for-the-badge&labelColor=0a0a0a" alt="Live Demo" />
  </a>
</p>

<p align="center">
  <img src="https://readme-typing-svg.demolab.com?font=Fira+Code&weight=600&size=22&duration=3000&pause=1000&color=EC5B13&center=true&vCenter=true&multiline=true&repeat=true&width=700&height=100&lines=📬+Unified+Inbox+with+Multi-Account+IMAP+Sync;🤖+AI-Powered+Email+Analysis+%26+Smart+Replies;📢+Campaign+Management+%26+Drip+Sequences;🔒+Enterprise+Security+with+2FA+%26+DLP+Rules;🛠️+Full+REST+API+for+Developers" alt="Typing SVG" />
</p>

<p align="center">
  <img src="https://img.shields.io/badge/version-1.3.0-ec5b13?style=flat-square&labelColor=0a0a0a" alt="Version" />
  <img src="https://img.shields.io/badge/license-MIT-22c55e?style=flat-square&labelColor=0a0a0a" alt="License" />
  <img src="https://img.shields.io/badge/node-%3E%3D18.0-339933?style=flat-square&logo=node.js&labelColor=0a0a0a" alt="Node" />
  <img src="https://img.shields.io/badge/PostgreSQL-14+-336791?style=flat-square&logo=postgresql&logoColor=white&labelColor=0a0a0a" alt="PostgreSQL" />
  <img src="https://img.shields.io/badge/Socket.IO-4.7-010101?style=flat-square&logo=socketdotio&labelColor=0a0a0a" alt="Socket.IO" />
  <img src="https://img.shields.io/badge/Express-4.18-000000?style=flat-square&logo=express&labelColor=0a0a0a" alt="Express" />
  <img src="https://img.shields.io/badge/PRs-welcome-ec5b13?style=flat-square&labelColor=0a0a0a" alt="PRs Welcome" />
</p>

<p align="center">
  <a href="https://mail.eclatrecon.in">Live Demo</a> •
  <a href="#-quick-start">Quick Start</a> •
  <a href="#-features">Features</a> •
  <a href="#-installation">Installation</a> •
  <a href="#-api-reference">API Docs</a> •
  <a href="#-contributing">Contributing</a>
</p>

---

<br/>

## 🎯 What is Eclatrecon AI Mail?

**Eclatrecon AI Mail** is a production-ready, self-hosted email platform that combines a modern email client with AI-powered insights, marketing campaign tools, team collaboration, and a full developer API — deployable on any VPS in under 10 minutes.

> **Think of it as:** Gmail + Mailchimp + Trello + AI — self-hosted, open source, and under your control.

<br/>

<table>
<tr>
<td width="50%">

### 🚀 Why Eclatrecon AI Mail?

- **Full Data Ownership** — Your emails, your server, your rules
- **Zero SaaS Lock-in** — No monthly fees to third-party providers
- **All-in-One** — Email, marketing, CRM, tasks, and AI in one platform
- **Developer-Friendly** — Full REST API with webhook integrations
- **Lightweight** — Runs on a $5/month VPS (1 CPU, 1GB RAM)

</td>
<td width="50%">

### 📊 By the Numbers

| Metric | Value |
|--------|-------|
| Database Tables | **55** |
| API Endpoints | **80+** |
| Route Modules | **16** |
| Background Workers | **6** |
| Lines of Backend Code | **15,000+** |
| IMAP Auto-Sync | **Every 5 min** |

</td>
</tr>
</table>

<br/>

> 🌐 **Try the live demo:** [mail.eclatrecon.in](https://mail.eclatrecon.in)

<br/>

---

<br/>

## ✨ Features

<table>
<tr>
<td align="center" width="33%">
<h3>📬 Smart Inbox</h3>
<p>Multi-account IMAP sync with unified inbox, email threading, full-text search, and real-time push notifications via Socket.IO</p>
</td>
<td align="center" width="33%">
<h3>🤖 AI Engine</h3>
<p>AI-powered email analysis, smart reply drafts, auto-categorization, meeting extraction, and action item detection</p>
</td>
<td align="center" width="33%">
<h3>📢 Campaigns</h3>
<p>Bulk email campaigns with A/B testing, drip sequences, open & click tracking, merge tags, and subscriber management</p>
</td>
</tr>
<tr>
<td align="center" width="33%">
<h3>👥 Team Collab</h3>
<p>Shared mailboxes, email delegation, internal comments, shared labels, and real-time collision detection</p>
</td>
<td align="center" width="33%">
<h3>📅 Productivity</h3>
<p>Calendar with iCal, Kanban tasks, notes, reminders, email snooze, scheduled send, templates, and signatures</p>
</td>
<td align="center" width="33%">
<h3>🔒 Security</h3>
<p>Two-factor auth (TOTP), DLP rules, IP whitelisting, audit trail, GDPR compliance, and self-destructing emails</p>
</td>
</tr>
<tr>
<td align="center" width="33%">
<h3>🔌 Developer API</h3>
<p>Full REST API with key-based auth, webhooks, n8n/Zapier integration, Slack & Discord notifications</p>
</td>
<td align="center" width="33%">
<h3>🎯 Lead Scraper</h3>
<p>Apify-powered lead generation from Google Maps, LinkedIn, Twitter, Instagram with auto-import to subscriber lists</p>
</td>
<td align="center" width="33%">
<h3>🎨 Modern UI</h3>
<p>Dark mode with glassmorphism, mobile-responsive bottom nav, three-column desktop layout, real-time updates</p>
</td>
</tr>
</table>

<br/>

<details>
<summary><b>📋 Full Feature List (click to expand)</b></summary>

<br/>

### 📬 Core Email
- Multi-account IMAP/SMTP support with unified inbox
- Email threading and conversation view
- Rich text compose with To/CC/BCC and attachments
- IMAP auto-sync every 5 minutes
- PostgreSQL full-text search across subject, body, and sender
- Folder management (Inbox, Sent, Drafts, Spam, Trash, custom)
- Email rules for auto-sort, auto-label, and auto-forward
- Star, archive, move, mark read/unread

### 🤖 AI-Powered
- Email content sentiment and urgency analysis
- AI-generated reply suggestions
- Automatic email categorization (Work, Priority, Newsletter)
- Meeting request detection and extraction

### 📢 Marketing & Campaigns
- Campaign builder with scheduling and merge tags
- Subscriber list import, segmentation, and management
- A/B testing with auto-winner selection
- Multi-step drip sequences with configurable delays
- Per-recipient open and click tracking
- Apify-powered lead scraping from 8+ platforms
- CSV export of leads and subscribers

### 📅 Productivity
- Calendar with iCal import/export and attendee tracking
- Kanban task boards (Todo / In Progress / Done)
- Quick notes with pin and search
- Time-based reminders with recurring support
- Email snooze with auto-resurface
- Scheduled send queue
- Reusable email templates
- Multiple signature management per account

### 👥 Team Collaboration
- Shared team mailboxes with role-based access
- Send-as delegation permissions
- Private internal comments on email threads
- Real-time collision alerts via Socket.IO
- Team-wide shared labels

### 🔒 Security & Compliance
- TOTP-based 2FA with QR code setup
- Data Loss Prevention (DLP) rules
- IP address whitelisting
- Full audit trail logging
- GDPR data export and deletion requests
- Self-destructing messages with configurable TTL
- JWT-based stateless authentication

### 🔌 Developer & Integration
- Full REST API with API key authentication
- Event-driven webhook system
- n8n / Zapier automation connectors
- Slack & Discord notification channels
- JSON and MBOX data export
- Built-in interactive API documentation

### 🎨 UI/UX
- Premium dark theme with glassmorphism (default)
- Light mode via toggle
- Mobile-responsive with bottom navigation
- Three-column Outlook-style desktop layout
- Real-time Socket.IO push notifications
- Material Symbols icons + Public Sans typography

</details>

<br/>

---

<br/>

## 🛠 Tech Stack

<p align="center">
  <img src="https://skillicons.dev/icons?i=nodejs,express,postgresql,js,html,css,nginx&theme=dark" alt="Tech Stack Icons" />
</p>

<br/>

<table>
<tr>
<td width="50%">

### ⚙️ Backend
| Technology | Purpose |
|------------|---------|
| **Node.js** `≥18` | Runtime environment |
| **Express.js** `4.18` | HTTP framework |
| **PostgreSQL** `≥14` | Database (55 tables) |
| **Socket.IO** `4.7` | Real-time communication |
| **ImapFlow** `1.0` | IMAP email sync |
| **Nodemailer** `6.9` | SMTP sending |
| **Mailparser** `3.6` | MIME parsing |
| **jsonwebtoken** `9.0` | JWT authentication |
| **bcryptjs** `2.4` | Password hashing |
| **speakeasy** `2.0` | TOTP 2FA |
| **pg** `8.20` | PostgreSQL driver |
| **PM2** | Process management |

</td>
<td width="50%">

### 🎨 Frontend
| Technology | Purpose |
|------------|---------|
| **HTML5** | Structure & semantics |
| **Vanilla JS** | SPA logic (no framework) |
| **CSS3** | Glassmorphism styling |
| **Material Symbols** | Icon system |
| **Public Sans** | Typography |
| **Hash Router** | Client-side routing |

### 🏗️ Infrastructure
| Component | Role |
|-----------|------|
| **Nginx** | Reverse proxy + SSL |
| **PM2** | Process + auto-restart |
| **Let's Encrypt** | SSL certificates |
| **Cron** | Automated backups |

</td>
</tr>
</table>

<br/>

---

<br/>

## ⚡ Quick Start

Get running in **under 5 minutes** with Node.js and PostgreSQL installed:

```bash
# Clone
git clone https://github.com/sanketgiri89/AI-MAIL.git
cd AI-MAIL

# Install
cd server && npm install

# Configure
cp .env.example .env
# Edit .env with your PostgreSQL and SMTP credentials

# Database
node src/config/migrate.js      # Creates all 55 tables
node src/config/seed-admin.js   # Seeds admin user + defaults

# Launch
npm start
```

> 🌐 Open **http://localhost:3001** and login with the credentials shown after seeding.

<br/>

---

<br/>

## 📦 Installation

### Prerequisites

| Software | Version | Verify |
|----------|---------|--------|
| Node.js | `≥ 18.0` | `node -v` |
| npm | `≥ 9.0` | `npm -v` |
| PostgreSQL | `≥ 14.0` | `psql --version` |
| Git | `≥ 2.x` | `git --version` |

### Step-by-Step

<details>
<summary><b>1️⃣ Clone the Repository</b></summary>

```bash
git clone https://github.com/sanketgiri89/AI-MAIL.git
cd AI-MAIL
```

</details>

<details>
<summary><b>2️⃣ Install Dependencies</b></summary>

```bash
cd server
npm install
```

</details>

<details>
<summary><b>3️⃣ Create PostgreSQL Database</b></summary>

```bash
sudo -u postgres psql
```

```sql
CREATE USER eclatrecon_mail WITH PASSWORD 'your_strong_password';
CREATE DATABASE eclatrecon_mail OWNER eclatrecon_mail;
GRANT ALL PRIVILEGES ON DATABASE eclatrecon_mail TO eclatrecon_mail;
\q
```

Add to `pg_hba.conf`:
```
host    eclatrecon_mail  eclatrecon_mail    127.0.0.1/32    md5
```

```bash
sudo systemctl restart postgresql
```

</details>

<details>
<summary><b>4️⃣ Configure Environment</b></summary>

```bash
cp .env.example .env
nano .env
```

```env
PORT=3001
NODE_ENV=production
JWT_SECRET=your-64-char-random-secret
PG_HOST=127.0.0.1
PG_PORT=5432
PG_DATABASE=eclatrecon_mail
PG_USER=eclatrecon_mail
PG_PASSWORD=your_db_password
PLATFORM_SMTP_HOST=smtp.yourdomain.com
PLATFORM_SMTP_PORT=465
PLATFORM_SMTP_USER=noreply@yourdomain.com
PLATFORM_SMTP_PASS=your_smtp_password
APP_DOMAIN=https://mail.yourdomain.com
FRONTEND_URL=https://mail.yourdomain.com
```

</details>

<details>
<summary><b>5️⃣ Initialize Database</b></summary>

```bash
node src/config/migrate.js      # Creates all 55 tables
node src/config/seed-admin.js   # Seeds admin + plans + folders
```

</details>

<details>
<summary><b>6️⃣ Start the Server</b></summary>

**Development:**
```bash
npm run dev
```

**Production (PM2):**
```bash
npx pm2 start src/index.js --name eclatrecon-mail
npx pm2 save && npx pm2 startup
```

</details>

<details>
<summary><b>7️⃣ Set Up Nginx (Production)</b></summary>

```nginx
server {
    listen 80;
    server_name mail.yourdomain.com;
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
        client_max_body_size 50M;
    }
}
```

</details>

<br/>

---

<br/>

## 🏗 Architecture

```
┌──────────────┐          ┌──────────────────────┐          ┌──────────────────┐
│              │          │                      │          │                  │
│   Browser    │◄────────▶│   Nginx (443/80)     │◄────────▶│  Express :3001   │
│   Frontend   │  HTTPS   │   Reverse Proxy      │   HTTP   │                  │
│              │          │   + SSL              │          │  ┌────────────┐  │
└──────────────┘          └──────────────────────┘          │  │ REST API   │  │
                                                            │  │ 16 modules │  │
                                                            │  ├────────────┤  │
                                                            │  │ Socket.IO  │  │
                                                            │  │ Real-time  │  │
                                                            │  ├────────────┤  │
                                                            │  │ Services   │  │
                                                            │  │ IMAP SMTP  │  │
                                                            │  │ AI  Bulk   │  │
                                                            │  ├────────────┤  │
                                                            │  │ Workers    │  │
                                                            │  │ 6 bg jobs  │  │
                                                            │  └─────┬──────┘  │
                                                            │        │         │
                                                            └────────┼─────────┘
                                                                     │
                                                            ┌────────▼─────────┐
                                                            │   PostgreSQL     │
                                                            │   55 Tables      │
                                                            └──────────────────┘
```

### Background Workers (every 60s)

| Worker | Purpose |
|--------|---------|
| ⏰ Scheduled Sender | Sends emails at their `send_at` time |
| 📢 Campaign Scheduler | Auto-starts scheduled campaigns |
| 💧 Drip Worker | Processes drip sequence steps |
| 😴 Snooze Restorer | Resurfaces snoozed emails |
| 🔔 Reminder Notifier | Fires reminder notifications |
| 💀 Expiry Cleaner | Deletes expired self-destructing emails |

<br/>

---

<br/>

## 📊 Database Schema

<details>
<summary><b>55 Tables organized into 8 domains (click to expand)</b></summary>

<br/>

### 🔐 Core (6 tables)
`users` · `sessions` · `password_resets` · `login_history` · `user_preferences` · `audit_logs`

### 📬 Email (10 tables)
`mail_accounts` · `emails` · `attachments` · `folders` · `labels` · `email_labels` · `email_rules` · `auto_replies` · `forwarding_rules` · `scheduled_emails`

### 📢 Marketing (9 tables)
`subscriber_lists` · `subscribers` · `campaigns` · `campaign_recipients` · `campaign_links` · `ab_tests` · `drip_sequences` · `drip_steps` · `drip_enrollments`

### 📅 Productivity (7 tables)
`calendar_events` · `event_attendees` · `tasks` · `notes` · `reminders` · `snoozed_emails` · `email_expiry`

### 👥 Collaboration (6 tables)
`contacts` · `contact_groups` · `contact_group_members` · `shared_mailboxes` · `shared_mailbox_members` · `email_delegations`

### 🔒 Security (5 tables)
`dlp_rules` · `ip_whitelist` · `audit_trail` · `gdpr_requests` · `email_comments`

### 🔌 Developer (6 tables)
`api_keys` · `webhooks` · `webhook_logs` · `integrations` · `plans` · `subscriptions`

### 🎯 Lead Generation (4 tables)
`apify_settings` · `apify_scrape_jobs` · `apify_scraped_leads` · `email_templates`

</details>

<br/>

---

<br/>

## 📡 API Reference

> Full interactive documentation available at [`/docs`](https://mail.eclatrecon.in/docs) when running.

Authentication: `Authorization: Bearer <jwt_token>`

<details>
<summary><b>🔐 Auth Endpoints</b></summary>

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/api/auth/signup` | — | Create account |
| `POST` | `/api/auth/login` | — | Login → JWT |
| `GET` | `/api/auth/me` | JWT | Current user |
| `PUT` | `/api/auth/profile` | JWT | Update profile |
| `POST` | `/api/auth/forgot-password` | — | Request reset |
| `POST` | `/api/auth/2fa/setup` | JWT | Enable 2FA |

</details>

<details>
<summary><b>📬 Email Endpoints</b></summary>

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/api/emails?folder=inbox` | JWT | List emails |
| `GET` | `/api/emails/:id` | JWT | Get email |
| `POST` | `/api/emails/send` | JWT | Send email |
| `POST` | `/api/emails/sync` | JWT | Manual sync |
| `POST` | `/api/emails/search` | JWT | Full-text search |
| `GET` | `/api/emails/counts` | JWT | Folder counts |

</details>

<details>
<summary><b>📢 Campaign Endpoints</b></summary>

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/api/campaigns` | JWT | List campaigns |
| `POST` | `/api/campaigns` | JWT | Create campaign |
| `POST` | `/api/campaigns/:id/send` | JWT | Start sending |
| `GET` | `/api/campaigns/:id/stats` | JWT | Get analytics |

</details>

<details>
<summary><b>🔑 Public API (API Key Auth)</b></summary>

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/api/v1/emails` | API Key | List emails |
| `POST` | `/api/v1/send` | API Key | Send email |
| `GET` | `/api/v1/contacts` | API Key | Get contacts |

</details>

<br/>

---

<br/>

## 🧰 Essential Commands

```bash
# ─────────── Application ───────────
npm run dev                              # Development (auto-reload)
npm start                                # Production
npx pm2 start src/index.js --name app    # PM2 production
npx pm2 logs app --lines 50             # View logs
npx pm2 monit                           # Resource monitor

# ─────────── Database ────────────
node src/config/migrate.js               # Create/reset tables
node src/config/seed-admin.js            # Seed admin + data
pg_dump -U user dbname > backup.sql      # Backup
psql -U user dbname < backup.sql         # Restore

# ─────────── Troubleshooting ─────
fuser -k 3001/tcp                        # Kill port
df -h /                                  # Check disk
npx pm2 flush                            # Clear logs
sudo systemctl restart postgresql        # Restart DB
```

<br/>

---

<br/>

## ✅ Pros & Cons

<table>
<tr>
<td width="50%">

### ✅ Pros
- 🏠 Full data sovereignty
- 🚫 Zero SaaS subscription fees
- ⚡ Zero build step (vanilla JS)
- 📦 Single-process deployment
- 🗄️ 55-table production schema
- 🤖 Pluggable AI (any LLM via OpenRouter)
- 📡 Real-time via Socket.IO
- 📬 Unlimited IMAP/SMTP accounts
- 📢 Built-in marketing suite
- 🔌 Full REST API
- 💸 Runs on $5/month VPS

</td>
<td width="50%">

### ⚠️ Cons
- No TypeScript (plain JS)
- Single-process (no horizontal scaling)
- No E2E test suite yet
- IMAP pull-based (no JMAP push)
- Email/password auth only (no OAuth SSO)
- Self-managed infrastructure
- No Docker image yet (planned v1.4)

</td>
</tr>
</table>

<br/>

---

<br/>

## 🗺️ Roadmap

| Version | Status | Highlights |
|---------|--------|------------|
| `v1.0` | ✅ Released | Core email, auth, compose, folders |
| `v1.1` | ✅ Released | Campaigns, teams, productivity, security |
| `v1.2` | ✅ Released | Lead scraper, integrations, billing, analytics |
| `v1.3` | ✅ **Current** | PostgreSQL migration, IMAP auto-sync, schema alignment |
| `v1.4` | 🔜 Planned | Docker support, OAuth2 login, JMAP protocol |
| `v1.5` | 🔜 Planned | Plugin system, theme marketplace, PWA |
| `v2.0` | 🔜 Planned | TypeScript rewrite, horizontal scaling, E2E tests |

<br/>

---

<br/>

## 🤝 Contributing

Contributions are welcome! Here's how:

```bash
# Fork → Clone → Branch
git clone https://github.com/sanketgiri89/AI-MAIL.git
cd AI-MAIL/server && npm install
cp .env.example .env       # Configure your local DB
node src/config/migrate.js  # Set up tables
npm run dev                 # Start developing
```

**Guidelines:**
- One feature per PR
- Test against `migrate.js` (ensure clean run)
- Follow code style (2-space indent, single quotes, async/await)
- Document new endpoints

**Help Wanted:**
- [ ] Docker & Docker Compose
- [ ] Unit & integration tests
- [ ] OAuth2 / Google SSO
- [ ] JMAP protocol support
- [ ] i18n (internationalization)
- [ ] WCAG accessibility audit
- [ ] Mobile PWA enhancements

<br/>

---

<br/>

## 📄 License

Distributed under the **MIT License**. See [`LICENSE`](LICENSE) for details.

Free to use for personal and commercial projects.

<br/>

---

<br/>

## 👤 Author

<table>
<tr>
<td align="center">
<b>Sanket Giri</b>
<br/>
<a href="https://github.com/sanketgiri89">GitHub</a> •
<a href="https://eclatrecon.in">Eclatrecon Solutions LLP</a> •
<a href="mailto:sanket@eclatrecon.in">sanket@eclatrecon.in</a>
</td>
</tr>
</table>

<br/>

---

<br/>

<p align="center">
  <b>If this project helps you, please give it a ⭐</b>
  <br/><br/>
  <a href="https://mail.eclatrecon.in">
    <img src="https://img.shields.io/badge/Try_the_Live_Demo-mail.eclatrecon.in-ec5b13?style=for-the-badge&labelColor=0a0a0a" alt="Live Demo" />
  </a>
</p>

<p align="center">
  <img src="https://capsule-render.vercel.app/api?type=waving&color=0:0a0a0a,50:ec5b13,100:ff8c42&height=120&section=footer" width="100%" />
</p>
