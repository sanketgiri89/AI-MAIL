// ===== Eclatrecon AI Mail — Export data from Supabase & Import to Local PostgreSQL =====
// Run: node src/config/export-supabase.js
// This connects to Supabase, exports all data, then imports into local PostgreSQL

const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '..', '..', '.env') });
const { pool } = require('./database');

// Supabase connection (direct PostgreSQL, not the REST API)
const { Pool: PgPool } = require('pg');

// ----- CONFIGURE YOUR SUPABASE DIRECT CONNECTION HERE -----
// Get this from Supabase Dashboard → Settings → Database → Connection string
const SUPABASE_DB_URL = process.env.SUPABASE_DB_URL || '';

const TABLES = [
    'users', 'sessions', 'password_resets', 'login_history',
    'mail_accounts', 'emails', 'attachments', 'email_labels', 'labels', 'shared_labels',
    'folders', 'contacts', 'contact_groups', 'contact_group_members',
    'subscriber_lists', 'subscribers', 'campaigns', 'campaign_recipients', 'campaign_links',
    'drip_sequences', 'drip_steps', 'drip_enrollments',
    'email_templates', 'signatures',
    'scheduled_emails', 'snoozed_emails', 'reminders', 'email_expiry',
    'email_rules', 'auto_replies', 'forwarding_rules',
    'calendar_events', 'event_attendees', 'tasks', 'notes', 'email_comments',
    'shared_mailboxes', 'shared_mailbox_members', 'email_delegations',
    'integrations', 'webhooks', 'webhook_logs', 'api_keys',
    'audit_logs', 'audit_trail', 'dlp_rules', 'ip_whitelist', 'gdpr_requests',
    'plans', 'subscriptions', 'user_preferences', 'ab_tests',
    'apify_settings', 'apify_scrape_jobs', 'apify_scraped_leads'
];

// Tables that must be imported first (due to foreign key constraints)
const PRIORITY_ORDER = [
    'users', 'plans',
    'mail_accounts', 'folders', 'labels', 'contact_groups', 'subscriber_lists',
    'drip_sequences', 'shared_mailboxes',
    // Everything else after
];

async function exportAndImport() {
    if (!SUPABASE_DB_URL) {
        console.log('====================================================');
        console.log('  SUPABASE DATA EXPORT & IMPORT');
        console.log('====================================================');
        console.log('');
        console.log('To export your Supabase data, you need the direct');
        console.log('PostgreSQL connection string from Supabase:');
        console.log('');
        console.log('1. Go to: https://supabase.com/dashboard');
        console.log('2. Select your project');
        console.log('3. Go to Settings → Database');
        console.log('4. Copy the "URI" connection string');
        console.log('5. Set it in .env as:');
        console.log('   SUPABASE_DB_URL=postgresql://postgres:YOUR_PASSWORD@db.xxxx.supabase.co:5432/postgres');
        console.log('');
        console.log('Then run this script again:');
        console.log('   node src/config/export-supabase.js');
        console.log('');
        console.log('====================================================');
        console.log('');
        console.log('ALTERNATIVE: Manual export via Supabase SQL Editor:');
        console.log('');
        
        for (const table of TABLES) {
            console.log(`-- Export ${table}:`);
            console.log(`-- Run in Supabase SQL Editor: SELECT * FROM ${table};`);
            console.log(`-- Then download as CSV`);
        }
        
        process.exit(0);
    }

    const supaPool = new PgPool({ connectionString: SUPABASE_DB_URL, ssl: { rejectUnauthorized: false } });

    console.log('🚀 Starting Supabase → Local PostgreSQL migration...');
    console.log('');

    // Order tables: priority first, then rest
    const orderedTables = [...PRIORITY_ORDER];
    for (const t of TABLES) {
        if (!orderedTables.includes(t)) orderedTables.push(t);
    }

    let totalRows = 0;

    for (const table of orderedTables) {
        try {
            // Check if table exists in Supabase
            const checkResult = await supaPool.query(`
                SELECT EXISTS (
                    SELECT FROM information_schema.tables 
                    WHERE table_schema = 'public' AND table_name = $1
                )
            `, [table]);

            if (!checkResult.rows[0].exists) {
                console.log(`⏭️  ${table} — not found in Supabase, skipping`);
                continue;
            }

            // Export from Supabase
            const { rows } = await supaPool.query(`SELECT * FROM "${table}"`);
            
            if (rows.length === 0) {
                console.log(`📭 ${table} — empty, skipping`);
                continue;
            }

            // Disable FK checks temporarily for this table
            await pool.query(`ALTER TABLE "${table}" DISABLE TRIGGER ALL`);

            // Clear existing data in local table
            await pool.query(`DELETE FROM "${table}"`);

            // Insert in batches of 100
            const batchSize = 100;
            let inserted = 0;

            for (let i = 0; i < rows.length; i += batchSize) {
                const batch = rows.slice(i, i + batchSize);
                const keys = Object.keys(batch[0]);
                const colNames = keys.map(k => `"${k}"`).join(', ');

                let pIdx = 0;
                const allParams = [];
                const valueSets = batch.map(row => {
                    const placeholders = keys.map(k => {
                        pIdx++;
                        const val = row[k];
                        if (typeof val === 'object' && val !== null && !(val instanceof Date)) {
                            allParams.push(JSON.stringify(val));
                        } else {
                            allParams.push(val);
                        }
                        return `$${pIdx}`;
                    });
                    return `(${placeholders.join(', ')})`;
                });

                try {
                    await pool.query(
                        `INSERT INTO "${table}" (${colNames}) VALUES ${valueSets.join(', ')} ON CONFLICT DO NOTHING`,
                        allParams
                    );
                    inserted += batch.length;
                } catch (err) {
                    console.error(`   ⚠️  Batch error in ${table}: ${err.message}`);
                }
            }

            // Re-enable FK checks
            await pool.query(`ALTER TABLE "${table}" ENABLE TRIGGER ALL`);

            console.log(`✅ ${table} — ${inserted} rows imported`);
            totalRows += inserted;

        } catch (err) {
            console.error(`❌ ${table} — Error: ${err.message}`);
        }
    }

    console.log('');
    console.log(`🎉 Migration complete! ${totalRows} total rows imported.`);
    
    await supaPool.end();
    await pool.end();
}

exportAndImport().catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
});
