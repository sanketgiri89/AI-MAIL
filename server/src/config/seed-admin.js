// ===== Eclatrecon AI Mail — Seed Admin User & Default Data =====
// Run after migrate.js: node src/config/seed-admin.js

const { pool } = require('./database');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

async function seedAdmin() {
    console.log('🌱 Seeding admin user and default data...');

    try {
        // ===== 1. Create Admin User =====
        const adminEmail = 'sanket@eclatrecon.in';
        const adminPassword = 'Sanket620@';
        const adminName = 'Sanket Giri';
        const userId = uuidv4();
        const passwordHash = await bcrypt.hash(adminPassword, 12);

        // Check if admin already exists
        const existing = await pool.query('SELECT id FROM users WHERE email = $1', [adminEmail]);
        if (existing.rows.length > 0) {
            console.log('⚠️  Admin user already exists, updating...');
            await pool.query(
                'UPDATE users SET password_hash = $1, is_admin = true, name = $2 WHERE email = $3',
                [passwordHash, adminName, adminEmail]
            );
            const existingId = existing.rows[0].id;
            console.log(`✅ Admin user updated: ${adminEmail} (ID: ${existingId})`);

            // Seed plans and exit
            await seedPlans();
            await pool.end();
            return;
        }

        await pool.query(`
            INSERT INTO users (id, email, password_hash, name, display_name, is_admin, storage_limit, timezone, language, theme)
            VALUES ($1, $2, $3, $4, $5, true, 15737418240, 'Asia/Kolkata', 'en', 'dark')
        `, [userId, adminEmail, passwordHash, adminName, adminName]);

        console.log(`✅ Admin user created: ${adminEmail}`);
        console.log(`   ID: ${userId}`);

        // ===== 2. Create Default Folders =====
        const folders = [
            { name: 'Inbox', type: 'inbox', icon: 'inbox', sort_order: 0 },
            { name: 'Sent', type: 'sent', icon: 'send', sort_order: 1 },
            { name: 'Drafts', type: 'drafts', icon: 'drafts', sort_order: 2 },
            { name: 'Spam', type: 'spam', icon: 'report', sort_order: 3 },
            { name: 'Trash', type: 'trash', icon: 'delete', sort_order: 4 }
        ];

        for (const f of folders) {
            await pool.query(
                'INSERT INTO folders (id, user_id, name, type, icon, sort_order) VALUES ($1, $2, $3, $4, $5, $6)',
                [uuidv4(), userId, f.name, f.type, f.icon, f.sort_order]
            );
        }
        console.log('✅ Default folders created (Inbox, Sent, Drafts, Spam, Trash)');

        // ===== 3. Create Default Labels =====
        const labels = [
            { name: 'High Priority', color: '#ff3b30' },
            { name: 'Newsletters', color: '#3b82f6' },
            { name: 'Work', color: '#10b981' }
        ];

        for (const l of labels) {
            await pool.query(
                'INSERT INTO labels (id, user_id, name, color) VALUES ($1, $2, $3, $4)',
                [uuidv4(), userId, l.name, l.color]
            );
        }
        console.log('✅ Default labels created');

        // ===== 4. Create Audit Log =====
        await pool.query(
            'INSERT INTO audit_logs (id, user_id, action, details) VALUES ($1, $2, $3, $4)',
            [uuidv4(), userId, 'admin_seed', 'Admin account and default data seeded']
        );

        // ===== 5. Seed Plans =====
        await seedPlans();

        console.log('\n🎉 Seeding complete!');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log(`   Email:    ${adminEmail}`);
        console.log(`   Password: ${adminPassword}`);
        console.log(`   Admin:    ✅ Yes`);
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    } catch (err) {
        console.error('❌ Seeding failed:', err.message);
        console.error(err);
    } finally {
        await pool.end();
    }
}

async function seedPlans() {
    // Check if plans exist
    const existingPlans = await pool.query('SELECT id FROM plans LIMIT 1');
    if (existingPlans.rows.length > 0) {
        console.log('⚠️  Plans already exist, skipping...');
        return;
    }

    const plans = [
        {
            name: 'Free', price_monthly: 0,
            max_storage_mb: 500, max_emails_per_day: 50,
            max_api_calls_per_hour: 100, max_accounts: 1,
            features: 'Basic email,5 labels,2 contacts groups'
        },
        {
            name: 'Pro', price_monthly: 9.99,
            max_storage_mb: 5000, max_emails_per_day: 500,
            max_api_calls_per_hour: 1000, max_accounts: 5,
            features: 'All Free features,Campaigns,Templates,Calendar,Tasks,API access'
        },
        {
            name: 'Enterprise', price_monthly: 29.99,
            max_storage_mb: 50000, max_emails_per_day: 5000,
            max_api_calls_per_hour: 10000, max_accounts: 20,
            features: 'All Pro features,Shared mailboxes,Delegation,DLP,SLA tracking,Priority support'
        }
    ];

    for (const p of plans) {
        await pool.query(`
            INSERT INTO plans (id, name, price_monthly, max_storage_mb, max_emails_per_day, max_api_calls_per_hour, max_accounts, features)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        `, [uuidv4(), p.name, p.price_monthly, p.max_storage_mb, p.max_emails_per_day, p.max_api_calls_per_hour, p.max_accounts, p.features]);
    }
    console.log('✅ Default plans created (Free, Pro, Enterprise)');
}

seedAdmin();
