// ===== Eclatrecon AI Mail — Database Client =====
// Uses local PostgreSQL (Supabase-compatible wrapper — same API, 50-100x faster)
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '..', '..', '.env') });
const { supabase, pool } = require('./database');

// Helper: ensure uploads directory exists
function ensureUploadsDir() {
    const fs = require('fs');
    const uploadDir = path.join(__dirname, '..', 'uploads');
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
}

async function initializeDatabase() {
    ensureUploadsDir();
    // Test connection
    try {
        const result = await pool.query('SELECT NOW() as time');
        console.log('✅ PostgreSQL connected —', result.rows[0].time);
    } catch (err) {
        console.error('❌ PostgreSQL connection failed:', err.message);
        console.error('   Run: node src/config/migrate.js');
    }
}

module.exports = { supabase, initializeDatabase, ensureUploadsDir };
