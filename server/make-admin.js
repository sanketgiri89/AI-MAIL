// ===== Eclatrecon AI Mail - Make Admin Utility (Supabase) =====
const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function makeAllAdmin() {
    const { data: users, error } = await supabase
        .from('users')
        .update({ is_admin: true })
        .neq('id', '00000000-0000-0000-0000-000000000000') // update all
        .select('email, name, is_admin');

    if (error) {
        console.error('Error:', error.message);
        return;
    }

    console.log('Users updated:', users);
    console.log('Done - all users are now admin');
}

makeAllAdmin();
