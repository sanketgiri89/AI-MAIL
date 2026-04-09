// ===== Eclatrecon AI Mail — PostgreSQL Migration Script =====
// Creates ALL tables with columns matching every route file exactly.
// Run once: node src/config/migrate.js

const { pool } = require('./database');

const TABLES_SQL = `
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ===== DROP ALL EXISTING TABLES (fresh start) =====
DROP TABLE IF EXISTS apify_scraped_leads CASCADE;
DROP TABLE IF EXISTS apify_scrape_jobs CASCADE;
DROP TABLE IF EXISTS apify_settings CASCADE;
DROP TABLE IF EXISTS ab_tests CASCADE;
DROP TABLE IF EXISTS user_preferences CASCADE;
DROP TABLE IF EXISTS subscriptions CASCADE;
DROP TABLE IF EXISTS plans CASCADE;
DROP TABLE IF EXISTS ip_whitelist CASCADE;
DROP TABLE IF EXISTS dlp_rules CASCADE;
DROP TABLE IF EXISTS gdpr_requests CASCADE;
DROP TABLE IF EXISTS audit_trail CASCADE;
DROP TABLE IF EXISTS audit_logs CASCADE;
DROP TABLE IF EXISTS api_keys CASCADE;
DROP TABLE IF EXISTS webhook_logs CASCADE;
DROP TABLE IF EXISTS webhooks CASCADE;
DROP TABLE IF EXISTS integrations CASCADE;
DROP TABLE IF EXISTS email_delegations CASCADE;
DROP TABLE IF EXISTS shared_mailbox_members CASCADE;
DROP TABLE IF EXISTS shared_mailboxes CASCADE;
DROP TABLE IF EXISTS email_comments CASCADE;
DROP TABLE IF EXISTS notes CASCADE;
DROP TABLE IF EXISTS tasks CASCADE;
DROP TABLE IF EXISTS event_attendees CASCADE;
DROP TABLE IF EXISTS calendar_events CASCADE;
DROP TABLE IF EXISTS email_expiry CASCADE;
DROP TABLE IF EXISTS reminders CASCADE;
DROP TABLE IF EXISTS snoozed_emails CASCADE;
DROP TABLE IF EXISTS scheduled_emails CASCADE;
DROP TABLE IF EXISTS signatures CASCADE;
DROP TABLE IF EXISTS email_templates CASCADE;
DROP TABLE IF EXISTS drip_enrollments CASCADE;
DROP TABLE IF EXISTS drip_steps CASCADE;
DROP TABLE IF EXISTS drip_sequences CASCADE;
DROP TABLE IF EXISTS campaign_links CASCADE;
DROP TABLE IF EXISTS campaign_recipients CASCADE;
DROP TABLE IF EXISTS campaigns CASCADE;
DROP TABLE IF EXISTS subscribers CASCADE;
DROP TABLE IF EXISTS subscriber_lists CASCADE;
DROP TABLE IF EXISTS contact_group_members CASCADE;
DROP TABLE IF EXISTS contact_groups CASCADE;
DROP TABLE IF EXISTS contacts CASCADE;
DROP TABLE IF EXISTS folders CASCADE;
DROP TABLE IF EXISTS shared_labels CASCADE;
DROP TABLE IF EXISTS email_labels CASCADE;
DROP TABLE IF EXISTS labels CASCADE;
DROP TABLE IF EXISTS attachments CASCADE;
DROP TABLE IF EXISTS emails CASCADE;
DROP TABLE IF EXISTS forwarding_rules CASCADE;
DROP TABLE IF EXISTS auto_replies CASCADE;
DROP TABLE IF EXISTS email_rules CASCADE;
DROP TABLE IF EXISTS login_history CASCADE;
DROP TABLE IF EXISTS password_resets CASCADE;
DROP TABLE IF EXISTS sessions CASCADE;
DROP TABLE IF EXISTS mail_accounts CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- ===== USERS & AUTH =====
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    email TEXT UNIQUE NOT NULL,
    name TEXT,
    display_name TEXT,
    password_hash TEXT NOT NULL,
    avatar TEXT,
    phone TEXT,
    location TEXT,
    job_title TEXT,
    is_admin BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    timezone TEXT DEFAULT 'UTC',
    language TEXT DEFAULT 'en',
    theme TEXT DEFAULT 'dark',
    storage_used BIGINT DEFAULT 0,
    storage_limit BIGINT DEFAULT 15737418240,
    team_id TEXT,
    team_role TEXT DEFAULT 'owner',
    totp_enabled BOOLEAN DEFAULT FALSE,
    totp_secret TEXT,
    two_factor_enabled BOOLEAN DEFAULT FALSE,
    two_factor_secret TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    last_login TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS sessions (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
    token TEXT UNIQUE NOT NULL,
    device TEXT,
    ip_address TEXT,
    user_agent TEXT,
    device_info JSONB,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS password_resets (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
    token TEXT UNIQUE NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    used BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS login_history (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
    ip_address TEXT,
    user_agent TEXT,
    device_info JSONB,
    status TEXT DEFAULT 'success',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===== MAIL ACCOUNTS =====
CREATE TABLE IF NOT EXISTS mail_accounts (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    label TEXT,
    display_name TEXT,
    username TEXT,
    password_encrypted TEXT,
    smtp_host TEXT,
    smtp_port INTEGER DEFAULT 587,
    imap_host TEXT,
    imap_port INTEGER DEFAULT 993,
    pop3_host TEXT,
    pop3_port INTEGER DEFAULT 995,
    incoming_protocol TEXT DEFAULT 'imap',
    encryption TEXT DEFAULT 'tls',
    is_primary BOOLEAN DEFAULT FALSE,
    sync_enabled BOOLEAN DEFAULT TRUE,
    last_sync TIMESTAMPTZ,
    last_uid INTEGER DEFAULT 0,
    status TEXT DEFAULT 'active',
    provider TEXT,
    oauth_token TEXT,
    oauth_refresh TEXT,
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===== EMAILS =====
-- Column names match exactly what routes use (from_address, to_addresses, etc.)
CREATE TABLE IF NOT EXISTS emails (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
    account_id TEXT REFERENCES mail_accounts(id) ON DELETE SET NULL,
    message_id TEXT,
    thread_id TEXT,
    from_address TEXT,
    from_name TEXT,
    to_addresses TEXT,
    cc_addresses TEXT,
    bcc_addresses TEXT,
    reply_to TEXT,
    subject TEXT,
    body_text TEXT,
    body_html TEXT,
    snippet TEXT,
    folder_type TEXT DEFAULT 'inbox',
    folder_id TEXT,
    is_read BOOLEAN DEFAULT FALSE,
    is_starred BOOLEAN DEFAULT FALSE,
    is_draft BOOLEAN DEFAULT FALSE,
    has_attachments BOOLEAN DEFAULT FALSE,
    importance TEXT DEFAULT 'normal',
    in_reply_to TEXT,
    headers JSONB,
    raw_size INTEGER DEFAULT 0,
    uid INTEGER,
    track_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMPTZ,
    read_receipt_at TIMESTAMPTZ,
    read_receipt_ip TEXT,
    read_receipt_ua TEXT,
    received_at TIMESTAMPTZ DEFAULT NOW(),
    sent_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    search_vector TSVECTOR
);

CREATE INDEX IF NOT EXISTS idx_emails_user_folder ON emails(user_id, folder_type);
CREATE INDEX IF NOT EXISTS idx_emails_account ON emails(account_id);
CREATE INDEX IF NOT EXISTS idx_emails_thread ON emails(thread_id);
CREATE INDEX IF NOT EXISTS idx_emails_created ON emails(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_emails_received ON emails(received_at DESC);

CREATE TABLE IF NOT EXISTS attachments (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    email_id TEXT REFERENCES emails(id) ON DELETE CASCADE,
    filename TEXT,
    original_name TEXT,
    mime_type TEXT,
    size INTEGER DEFAULT 0,
    path TEXT,
    url TEXT,
    cid TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS email_labels (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    email_id TEXT REFERENCES emails(id) ON DELETE CASCADE,
    label_id TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(email_id, label_id)
);

CREATE TABLE IF NOT EXISTS labels (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    color TEXT DEFAULT '#6366f1',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- shared_labels: used by teams.js — name, color, created_by
CREATE TABLE IF NOT EXISTS shared_labels (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    name TEXT NOT NULL,
    color TEXT DEFAULT '#ec5b13',
    created_by TEXT REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===== FOLDERS =====
-- Routes use: name, type, icon, sort_order, color, parent_id
CREATE TABLE IF NOT EXISTS folders (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    type TEXT DEFAULT 'custom',
    icon TEXT DEFAULT 'folder',
    color TEXT DEFAULT '#6366f1',
    parent_id TEXT,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===== CONTACTS =====
CREATE TABLE IF NOT EXISTS contacts (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
    email TEXT,
    name TEXT,
    first_name TEXT,
    last_name TEXT,
    phone TEXT,
    company TEXT,
    title TEXT,
    avatar TEXT,
    notes TEXT,
    tags TEXT,
    group_id TEXT,
    frequency INTEGER DEFAULT 0,
    last_contacted TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- contact_groups: routes use description
CREATE TABLE IF NOT EXISTS contact_groups (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT DEFAULT '',
    color TEXT DEFAULT '#6366f1',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS contact_group_members (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    group_id TEXT,
    contact_id TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(group_id, contact_id)
);

-- ===== CAMPAIGNS & MARKETING =====
CREATE TABLE IF NOT EXISTS subscriber_lists (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    subscriber_count INTEGER DEFAULT 0,
    tags TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- subscribers: routes insert custom_1 through custom_5
CREATE TABLE IF NOT EXISTS subscribers (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
    list_id TEXT,
    email TEXT NOT NULL,
    first_name TEXT,
    last_name TEXT,
    company TEXT,
    phone TEXT,
    tags TEXT,
    custom_fields JSONB DEFAULT '{}',
    custom_1 TEXT DEFAULT '',
    custom_2 TEXT DEFAULT '',
    custom_3 TEXT DEFAULT '',
    custom_4 TEXT DEFAULT '',
    custom_5 TEXT DEFAULT '',
    status TEXT DEFAULT 'active',
    subscribed_at TIMESTAMPTZ DEFAULT NOW(),
    unsubscribed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- campaigns: routes use ab_test_enabled, is_follow_up, parent_campaign_id
CREATE TABLE IF NOT EXISTS campaigns (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
    account_id TEXT,
    name TEXT NOT NULL,
    subject TEXT,
    body_html TEXT,
    body_text TEXT,
    from_name TEXT,
    reply_to TEXT,
    list_id TEXT,
    status TEXT DEFAULT 'draft',
    throttle_per_minute INTEGER DEFAULT 50,
    track_opens BOOLEAN DEFAULT TRUE,
    track_clicks BOOLEAN DEFAULT TRUE,
    unsubscribe_text TEXT DEFAULT 'Unsubscribe',
    ab_test_enabled BOOLEAN DEFAULT FALSE,
    is_follow_up BOOLEAN DEFAULT FALSE,
    parent_campaign_id TEXT,
    schedule_at TIMESTAMPTZ,
    sent_count INTEGER DEFAULT 0,
    failed_count INTEGER DEFAULT 0,
    open_count INTEGER DEFAULT 0,
    click_count INTEGER DEFAULT 0,
    bounce_count INTEGER DEFAULT 0,
    unsubscribe_count INTEGER DEFAULT 0,
    total_recipients INTEGER DEFAULT 0,
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS campaign_recipients (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    campaign_id TEXT,
    subscriber_id TEXT,
    email TEXT,
    first_name TEXT,
    last_name TEXT,
    company TEXT,
    status TEXT DEFAULT 'pending',
    tracking_id TEXT UNIQUE,
    sent_at TIMESTAMPTZ,
    opened_at TIMESTAMPTZ,
    clicked_at TIMESTAMPTZ,
    bounced_at TIMESTAMPTZ,
    unsubscribed_at TIMESTAMPTZ,
    open_count INTEGER DEFAULT 0,
    click_count INTEGER DEFAULT 0,
    error TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_recipients_campaign ON campaign_recipients(campaign_id);
CREATE INDEX IF NOT EXISTS idx_recipients_tracking ON campaign_recipients(tracking_id);

-- campaign_links: routes use unique_clicks
CREATE TABLE IF NOT EXISTS campaign_links (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    campaign_id TEXT,
    original_url TEXT,
    click_count INTEGER DEFAULT 0,
    unique_clicks INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===== DRIP SEQUENCES =====
CREATE TABLE IF NOT EXISTS drip_sequences (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    list_id TEXT,
    account_id TEXT,
    status TEXT DEFAULT 'draft',
    trigger_type TEXT DEFAULT 'manual',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS drip_steps (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    sequence_id TEXT,
    step_order INTEGER DEFAULT 1,
    subject TEXT,
    body_html TEXT,
    body_text TEXT,
    delay_hours INTEGER DEFAULT 24,
    delay_type TEXT DEFAULT 'hours',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS drip_enrollments (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    sequence_id TEXT,
    subscriber_id TEXT,
    current_step INTEGER DEFAULT 0,
    status TEXT DEFAULT 'active',
    next_send_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===== TEMPLATES =====
CREATE TABLE IF NOT EXISTS email_templates (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    subject TEXT,
    body_html TEXT,
    body_text TEXT,
    category TEXT DEFAULT 'general',
    is_shared BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===== SIGNATURES =====
-- Routes use: name, body_html, body_text, is_default
CREATE TABLE IF NOT EXISTS signatures (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    body_html TEXT,
    body_text TEXT DEFAULT '',
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===== SCHEDULED & SNOOZE =====
-- Routes use: to_addresses, cc_addresses, bcc_addresses
CREATE TABLE IF NOT EXISTS scheduled_emails (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
    account_id TEXT,
    to_addresses TEXT,
    cc_addresses TEXT,
    bcc_addresses TEXT,
    subject TEXT,
    body_html TEXT,
    body_text TEXT,
    send_at TIMESTAMPTZ NOT NULL,
    status TEXT DEFAULT 'pending',
    error TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS snoozed_emails (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    email_id TEXT,
    user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
    snooze_until TIMESTAMPTZ NOT NULL,
    original_folder TEXT DEFAULT 'inbox',
    status TEXT DEFAULT 'snoozed',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- reminders: routes use title, is_recurring, recurrence_interval
CREATE TABLE IF NOT EXISTS reminders (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
    email_id TEXT,
    title TEXT,
    remind_at TIMESTAMPTZ NOT NULL,
    note TEXT,
    is_recurring BOOLEAN DEFAULT FALSE,
    recurrence_interval TEXT,
    recurrence TEXT,
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS email_expiry (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    email_id TEXT,
    user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
    expires_at TIMESTAMPTZ NOT NULL,
    action TEXT DEFAULT 'delete',
    status TEXT DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===== RULES & AUTO-REPLIES =====
-- email_rules: routes insert condition_operator
CREATE TABLE IF NOT EXISTS email_rules (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    condition_field TEXT,
    condition_type TEXT,
    condition_operator TEXT,
    condition_value TEXT,
    action_type TEXT,
    action_value TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    priority INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- auto_replies: routes insert body (not body_html)
CREATE TABLE IF NOT EXISTS auto_replies (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
    subject TEXT,
    body TEXT,
    body_html TEXT,
    is_active BOOLEAN DEFAULT FALSE,
    start_date TIMESTAMPTZ,
    end_date TIMESTAMPTZ,
    exclude_contacts BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- forwarding_rules: routes use condition_from, condition_subject
CREATE TABLE IF NOT EXISTS forwarding_rules (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
    name TEXT,
    forward_to TEXT,
    condition_from TEXT,
    condition_subject TEXT,
    condition_field TEXT,
    condition_value TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    keep_copy BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===== PRODUCTIVITY =====
-- calendar_events: routes use ical_uid
CREATE TABLE IF NOT EXISTS calendar_events (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ,
    all_day BOOLEAN DEFAULT FALSE,
    location TEXT,
    color TEXT DEFAULT '#6366f1',
    reminder_minutes INTEGER DEFAULT 15,
    recurrence TEXT,
    email_id TEXT,
    ical_uid TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- event_attendees: routes use rsvp
CREATE TABLE IF NOT EXISTS event_attendees (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    event_id TEXT,
    email TEXT,
    name TEXT,
    status TEXT DEFAULT 'pending',
    rsvp TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- tasks: routes use position, completed_at, P3 priority
CREATE TABLE IF NOT EXISTS tasks (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    due_date TIMESTAMPTZ,
    priority TEXT DEFAULT 'P3',
    status TEXT DEFAULT 'pending',
    position INTEGER DEFAULT 0,
    completed_at TIMESTAMPTZ,
    email_id TEXT,
    labels TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- notes: routes use body (not content), updated_at
CREATE TABLE IF NOT EXISTS notes (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
    email_id TEXT,
    title TEXT,
    body TEXT,
    content TEXT,
    color TEXT DEFAULT '#6366f1',
    is_pinned BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- email_comments: routes use body, mentions
CREATE TABLE IF NOT EXISTS email_comments (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    email_id TEXT,
    user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
    body TEXT,
    content TEXT,
    mentions TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===== TEAMS =====
-- shared_mailboxes: routes use created_by, email UNIQUE
CREATE TABLE IF NOT EXISTS shared_mailboxes (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    email TEXT UNIQUE,
    name TEXT NOT NULL,
    description TEXT,
    account_id TEXT,
    created_by TEXT REFERENCES users(id) ON DELETE CASCADE,
    member_count INTEGER DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS shared_mailbox_members (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    mailbox_id TEXT,
    user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
    role TEXT DEFAULT 'member',
    can_send BOOLEAN DEFAULT TRUE,
    can_delete BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(mailbox_id, user_id)
);

CREATE TABLE IF NOT EXISTS email_delegations (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    delegator_id TEXT REFERENCES users(id) ON DELETE CASCADE,
    delegate_id TEXT,
    delegate_email TEXT,
    delegate_name TEXT,
    delegator_email TEXT,
    delegator_name TEXT,
    can_send_as BOOLEAN DEFAULT FALSE,
    can_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(delegator_id, delegate_id)
);

-- ===== INTEGRATIONS & API =====
CREATE TABLE IF NOT EXISTS integrations (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
    service TEXT NOT NULL,
    config JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS webhooks (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
    name TEXT,
    url TEXT NOT NULL,
    events TEXT,
    secret TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS webhook_logs (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    webhook_id TEXT,
    event TEXT,
    payload JSONB,
    response_status INTEGER,
    response_body TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS api_keys (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
    name TEXT,
    key TEXT UNIQUE NOT NULL,
    permissions TEXT DEFAULT 'read',
    is_active BOOLEAN DEFAULT TRUE,
    last_used TIMESTAMPTZ,
    request_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===== SECURITY & COMPLIANCE =====
CREATE TABLE IF NOT EXISTS audit_logs (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    user_id TEXT,
    action TEXT NOT NULL,
    details TEXT,
    ip_address TEXT,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS audit_trail (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    user_id TEXT,
    entity_type TEXT,
    entity_id TEXT,
    action TEXT,
    old_value JSONB,
    new_value JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- dlp_rules: routes use created_by
CREATE TABLE IF NOT EXISTS dlp_rules (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    created_by TEXT,
    user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
    name TEXT,
    pattern TEXT,
    action TEXT DEFAULT 'warn',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ip_whitelist: routes use created_by
CREATE TABLE IF NOT EXISTS ip_whitelist (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    created_by TEXT,
    user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
    ip_address TEXT NOT NULL,
    label TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS gdpr_requests (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
    request_type TEXT NOT NULL,
    status TEXT DEFAULT 'pending',
    details TEXT,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===== BILLING & PLANS =====
-- plans: routes use max_storage_mb, max_api_calls_per_hour, features as TEXT
CREATE TABLE IF NOT EXISTS plans (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    name TEXT NOT NULL,
    display_name TEXT,
    price_monthly NUMERIC DEFAULT 0,
    price_yearly NUMERIC DEFAULT 0,
    max_emails_per_day INTEGER DEFAULT 100,
    max_storage_mb INTEGER DEFAULT 500,
    max_storage BIGINT DEFAULT 1073741824,
    max_accounts INTEGER DEFAULT 1,
    max_campaigns INTEGER DEFAULT 5,
    max_subscribers INTEGER DEFAULT 500,
    max_api_calls_per_hour INTEGER DEFAULT 100,
    features TEXT DEFAULT '',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS subscriptions (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
    plan_id TEXT,
    status TEXT DEFAULT 'active',
    billing_cycle TEXT DEFAULT 'monthly',
    current_period_start TIMESTAMPTZ,
    current_period_end TIMESTAMPTZ,
    payment_method TEXT,
    stripe_subscription_id TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===== USER PREFERENCES =====
CREATE TABLE IF NOT EXISTS user_preferences (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    user_id TEXT REFERENCES users(id) ON DELETE CASCADE UNIQUE,
    notifications JSONB DEFAULT '{}',
    display JSONB DEFAULT '{}',
    compose JSONB DEFAULT '{}',
    privacy JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===== A/B TESTS =====
-- Routes use variant, subject, body_html, body_text (not variant_a/b JSONB)
CREATE TABLE IF NOT EXISTS ab_tests (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
    campaign_id TEXT,
    name TEXT,
    variant TEXT,
    subject TEXT,
    body_html TEXT,
    body_text TEXT,
    variant_a JSONB,
    variant_b JSONB,
    winner TEXT,
    status TEXT DEFAULT 'draft',
    metric TEXT DEFAULT 'opens',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===== APIFY / LEAD SCRAPER =====
CREATE TABLE IF NOT EXISTS apify_settings (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    user_id TEXT REFERENCES users(id) ON DELETE CASCADE UNIQUE,
    apify_token TEXT,
    auto_import BOOLEAN DEFAULT FALSE,
    default_actor TEXT DEFAULT 'website-contacts',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS apify_scrape_jobs (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
    actor_type TEXT,
    actor_id TEXT,
    source_url TEXT,
    keyword TEXT,
    location TEXT,
    max_results INTEGER DEFAULT 50,
    status TEXT DEFAULT 'pending',
    apify_run_id TEXT,
    leads_count INTEGER DEFAULT 0,
    list_id TEXT,
    list_name TEXT,
    error TEXT,
    custom_input JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS apify_scraped_leads (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
    job_id TEXT,
    email TEXT,
    first_name TEXT,
    last_name TEXT,
    company TEXT,
    phone TEXT,
    website TEXT,
    title TEXT,
    linkedin_url TEXT,
    location TEXT,
    actor_type TEXT,
    raw_data JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===== INDEXES =====
CREATE INDEX IF NOT EXISTS idx_subscribers_list ON subscribers(list_id, status);
CREATE INDEX IF NOT EXISTS idx_contacts_user ON contacts(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_user ON audit_logs(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token);
CREATE INDEX IF NOT EXISTS idx_mail_accounts_user ON mail_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_folders_user ON folders(user_id, type);
CREATE INDEX IF NOT EXISTS idx_labels_user ON labels(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_user ON tasks(user_id, status);
CREATE INDEX IF NOT EXISTS idx_notes_user ON notes(user_id);
CREATE INDEX IF NOT EXISTS idx_calendar_user ON calendar_events(user_id, start_time);
`;

async function migrate() {
    console.log('🚀 Starting PostgreSQL migration...');
    console.log(`   Database: ${process.env.PG_DATABASE || 'eclatrecon_mail'}`);
    console.log(`   Host: ${process.env.PG_HOST || '127.0.0.1'}`);

    try {
        await pool.query(TABLES_SQL);
        console.log('✅ All tables created successfully!');

        // Verify
        const result = await pool.query(`
            SELECT tablename FROM pg_tables 
            WHERE schemaname = 'public' 
            ORDER BY tablename
        `);
        console.log(`📊 Tables in database: ${result.rows.length}`);
        result.rows.forEach(r => console.log(`   ✓ ${r.tablename}`));

        console.log('\n✅ Migration complete! Your database is ready.');
    } catch (err) {
        console.error('❌ Migration failed:', err.message);
        console.error(err);
    } finally {
        await pool.end();
    }
}

migrate();
