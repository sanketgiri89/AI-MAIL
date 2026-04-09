// Create admin user - Run once: node src/config/create-admin.js
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '..', '..', '.env') });
const bcrypt = require('bcryptjs');
const { pool } = require('./database');

async function createAdmin() {
    const email = 'admin@gmail.com';
    const password = 'admin123@';
    const name = 'admin';

    try {
        const hash = await bcrypt.hash(password, 12);
        
        const result = await pool.query(`
            INSERT INTO users (id, email, name, display_name, password_hash, is_admin, is_active, created_at, updated_at)
            VALUES (uuid_generate_v4()::text, $1, $2, $2, $3, TRUE, TRUE, NOW(), NOW())
            ON CONFLICT (email) DO UPDATE SET password_hash = $3, is_admin = TRUE
            RETURNING id, email, name, is_admin
        `, [email, name, hash]);

        console.log('✅ Admin account created!');
        console.log('   Email:', result.rows[0].email);
        console.log('   Name:', result.rows[0].name);
        console.log('   Admin:', result.rows[0].is_admin);
        console.log('   ID:', result.rows[0].id);
    } catch (err) {
        console.error('❌ Error:', err.message);
    } finally {
        await pool.end();
    }
}

createAdmin();
