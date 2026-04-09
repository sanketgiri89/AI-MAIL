// ===== Eclatrecon AI Mail - Apify Lead Scraper Routes (Supabase) =====
const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { supabase } = require('../config/initDb');
const { authMiddleware } = require('../middleware/auth');

router.use(authMiddleware);

// ===== APIFY SETTINGS =====
router.get('/settings', async (req, res) => {
    try {
        const { data: settings } = await supabase.from('apify_settings').select('*').eq('user_id', req.userId).single();
        res.json({ settings: settings || { apify_token: '', default_actor: 'website-contacts', auto_import: true } });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/settings', async (req, res) => {
    try {
        const { apify_token, default_actor, auto_import } = req.body;
        const { data: existing } = await supabase.from('apify_settings').select('id').eq('user_id', req.userId).single();
        if (existing) {
            await supabase.from('apify_settings').update({ apify_token: apify_token || '', default_actor: default_actor || 'website-contacts', auto_import: auto_import !== undefined ? !!auto_import : true, updated_at: new Date().toISOString() }).eq('user_id', req.userId);
        } else {
            await supabase.from('apify_settings').insert({ id: uuidv4(), user_id: req.userId, apify_token: apify_token || '', default_actor: default_actor || 'website-contacts', auto_import: auto_import !== undefined ? !!auto_import : true });
        }
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// ===== SCRAPE ACTORS =====
router.get('/actors', (req, res) => {
    const actors = [
        { id: 'website-contacts', name: 'Website Contact Scraper', description: 'Scrape emails, phones, social links from any website', actorId: 'vdrmota/contact-info-scraper', icon: 'language', fields: ['url'] },
        { id: 'google-maps', name: 'Google Maps Scraper', description: 'Scrape businesses from Google Maps by keyword + location', actorId: 'compass/crawler-google-places', icon: 'map', fields: ['keyword', 'location', 'maxResults'] },
        { id: 'linkedin-search', name: '🔍 LinkedIn Lead Search', description: 'Search LinkedIn leads by job title + location', actorId: 'google+linkedin', icon: 'person_search', fields: ['keyword', 'location', 'maxResults'] },
        { id: 'linkedin-profiles', name: '🟢 LinkedIn Profile Scraper', description: 'Scrape LinkedIn profiles + email from profile URLs', actorId: 'dev_fusion/linkedin-profile-scraper', icon: 'work', fields: ['url'] },
        { id: 'linkedin-profile-detail', name: '🟢 LinkedIn Profile Details + Email', description: 'Get detailed profile data with email from LinkedIn URLs', actorId: 'apimaestro/linkedin-profile-detail', icon: 'badge', fields: ['url'] },
        { id: 'yellow-pages', name: 'Yellow Pages Scraper', description: 'Scrape business listings from Yellow Pages', actorId: 'canadesk/yellow-pages-scraper', icon: 'menu_book', fields: ['keyword', 'location', 'maxResults'] },
        { id: 'instagram', name: 'Instagram Profile Scraper', description: 'Scrape Instagram profile data and contact info', actorId: 'apify/instagram-profile-scraper', icon: 'photo_camera', fields: ['url'] },
        { id: 'twitter', name: 'Twitter/X Profile Scraper', description: 'Scrape Twitter profile data and bio info', actorId: 'apidojo/twitter-scraper-lite', icon: 'tag', fields: ['url'] },
        { id: 'custom', name: 'Custom Apify Actor', description: 'Use any Apify actor by providing the actor ID', actorId: '', icon: 'extension', fields: ['actorId', 'inputJson'] },
    ];
    res.json({ actors });
});

// ===== SCRAPE JOBS =====
router.post('/scrape', async (req, res) => {
    try {
        const { actor_type, source, keyword, location, max_results, custom_actor_id, custom_input, list_id, create_list_name } = req.body;
        const { data: settings } = await supabase.from('apify_settings').select('apify_token, auto_import').eq('user_id', req.userId).single();
        const token = req.body.apify_token || settings?.apify_token;
        if (!token) return res.status(400).json({ error: 'Apify API token is required.' });

        const jobId = uuidv4();
        let actorId = '', input = {};
        switch (actor_type) {
            case 'website-contacts': actorId = 'vdrmota/contact-info-scraper'; input = { startUrls: [{ url: source }], maxRequestsPerStartUrl: parseInt(max_results) || 100 }; break;
            case 'google-maps': actorId = 'compass/crawler-google-places'; input = { searchStringsArray: [keyword], locationQuery: location || '', maxCrawledPlacesPerSearch: parseInt(max_results) || 50 }; break;
            case 'linkedin-search':
                actorId = 'apify/google-search-scraper';
                const searchQuery = `site:linkedin.com/in ${keyword ? '"' + keyword + '"' : ''} ${location ? '"' + location + '"' : ''}`.trim();
                input = { queries: searchQuery, maxPagesPerQuery: Math.min(Math.ceil((parseInt(max_results) || 10) / 10), 5), resultsPerPage: 10, languageCode: 'en' };
                break;
            case 'linkedin-profiles': actorId = 'dev_fusion/linkedin-profile-scraper'; input = { profileUrls: source.split(/[,\n]/).map(u => u.trim()).filter(Boolean) }; break;
            case 'linkedin-profile-detail': actorId = 'apimaestro/linkedin-profile-detail'; input = { profileUrls: source.split(/[,\n]/).map(u => u.trim()).filter(Boolean) }; break;
            case 'yellow-pages': actorId = 'canadesk/yellow-pages-scraper'; input = { search: keyword, location: location || '', maxItems: parseInt(max_results) || 50 }; break;
            case 'instagram': actorId = 'apify/instagram-profile-scraper'; input = { usernames: [source.replace(/.*instagram\.com\//, '').replace(/\/.*/, '')] }; break;
            case 'twitter': actorId = 'apidojo/twitter-scraper-lite'; input = { startUrls: [{ url: source }] }; break;
            case 'custom': actorId = custom_actor_id; try { input = JSON.parse(custom_input || '{}'); } catch (e) { input = {}; } break;
            default: return res.status(400).json({ error: 'Invalid actor type' });
        }

        let targetListId = list_id || null;
        if (create_list_name && !list_id) {
            const newListId = uuidv4();
            await supabase.from('subscriber_lists').insert({ id: newListId, user_id: req.userId, name: create_list_name, description: `Auto-created from Apify scrape (${actor_type})` });
            targetListId = newListId;
        }

        await supabase.from('apify_scrape_jobs').insert({ id: jobId, user_id: req.userId, actor_type, actor_id: actorId, source_url: source || '', keyword: keyword || '', location: location || '', max_results: parseInt(max_results) || 50, target_list_id: targetListId, input_json: JSON.stringify(input), status: 'running' });

        try {
            const fetch = (await import('node-fetch')).default;
            const apiActorId = actorId.replace('/', '~');
            const apiUrl = `https://api.apify.com/v2/acts/${apiActorId}/runs?token=${token}`;
            const runRes = await fetch(apiUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(input) });
            const runData = await runRes.json();
            if (runData.data?.id) {
                await supabase.from('apify_scrape_jobs').update({ apify_run_id: runData.data.id }).eq('id', jobId);
                pollApifyResults(jobId, runData.data.id, token, req.userId, targetListId, settings?.auto_import, actor_type);
            } else {
                await supabase.from('apify_scrape_jobs').update({ status: 'failed', error: JSON.stringify(runData) }).eq('id', jobId);
            }
        } catch (fetchErr) {
            await supabase.from('apify_scrape_jobs').update({ status: 'completed', leads_count: 0, error: 'Apify API call failed: ' + fetchErr.message }).eq('id', jobId);
        }

        res.json({ success: true, jobId, targetListId });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// Poll Apify run for results
async function pollApifyResults(jobId, runId, token, userId, targetListId, autoImport, actorType) {
    const maxPolls = 120; let polls = 0;
    const interval = setInterval(async () => {
        polls++;
        if (polls > maxPolls) { clearInterval(interval); return; }
        try {
            const fetch = (await import('node-fetch')).default;
            const statusRes = await fetch(`https://api.apify.com/v2/actor-runs/${runId}?token=${token}`);
            const statusData = await statusRes.json();
            const runStatus = statusData.data?.status;

            if (runStatus === 'SUCCEEDED') {
                clearInterval(interval);
                const datasetId = statusData.data?.defaultDatasetId;
                if (!datasetId) return;
                const itemsRes = await fetch(`https://api.apify.com/v2/datasets/${datasetId}/items?token=${token}&limit=1000`);
                const items = await itemsRes.json();

                // LinkedIn Search 2-step
                if (actorType === 'linkedin-search') {
                    const linkedinUrls = [];
                    if (Array.isArray(items)) {
                        for (const item of items) {
                            const results = item.organicResults || item.results || [];
                            for (const r of results) { const url = r.url || r.link || ''; if (url.includes('linkedin.com/in/')) linkedinUrls.push(url); }
                            if (item.url && item.url.includes('linkedin.com/in/')) linkedinUrls.push(item.url);
                        }
                    }
                    if (linkedinUrls.length > 0) {
                        await supabase.from('apify_scrape_jobs').update({ error: `Step 1 done: found ${linkedinUrls.length} LinkedIn profiles. Step 2: scraping profiles...` }).eq('id', jobId);
                        const step2Res = await fetch(`https://api.apify.com/v2/acts/dev_fusion~linkedin-profile-scraper/runs?token=${token}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ profileUrls: linkedinUrls }) });
                        const step2Data = await step2Res.json();
                        if (step2Data.data?.id) { pollApifyResults(jobId, step2Data.data.id, token, userId, targetListId, autoImport, 'linkedin-profiles'); }
                        else { await supabase.from('apify_scrape_jobs').update({ status: 'failed', error: 'Step 2 failed: ' + JSON.stringify(step2Data) }).eq('id', jobId); }
                    } else {
                        await supabase.from('apify_scrape_jobs').update({ status: 'completed', leads_count: 0, error: 'No LinkedIn profiles found.' }).eq('id', jobId);
                    }
                    return;
                }

                // Normal flow: process items as leads
                let leadCount = 0, errorMsg = '';
                for (const item of (Array.isArray(items) ? items : [])) {
                    if (item.error) { errorMsg = typeof item.error === 'string' ? item.error : (item.error.message || JSON.stringify(item.error)); continue; }
                    const email = item.email || item.emails?.[0] || item.mail || item.contactEmail || item.business_email || item.personal_email || '';
                    const name = item.name || item.full_name || item.fullName || item.title || item.displayName || '';
                    const firstName = item.firstName || item.first_name || name.split(' ')[0] || '';
                    const lastName = item.lastName || item.last_name || name.split(' ').slice(1).join(' ') || '';
                    const company = item.company || item.companyName || item.organization || item.businessName || item.company_name || item.headline || '';
                    const phone = item.phone || item.phones?.[0] || item.telephone || item.mobile_number || item.mobile || '';
                    const website = item.website || item.url || item.link || item.company_website || '';
                    const sourceUrl = item.sourceUrl || item.inputUrl || item.profile_url || '';
                    const address = item.address || item.fullAddress || item.street || item.location || item.city || '';
                    const linkedinUrl = item.linkedInUrl || item.linkedin || item.linkedin_url || item.profile_url || item.linkedinProfileUrl || '';

                    if (email || name || phone) {
                        const leadId = uuidv4();
                        await supabase.from('apify_scraped_leads').insert({ id: leadId, job_id: jobId, user_id: userId, email, first_name: firstName, last_name: lastName, company, phone, website, source_url: sourceUrl, address, linkedin_url: linkedinUrl, raw_data: JSON.stringify(item) });
                        leadCount++;
                        if (autoImport && targetListId && email) {
                            await supabase.from('subscribers').upsert({ id: uuidv4(), list_id: targetListId, email, first_name: firstName, last_name: lastName, company, status: 'active' }, { onConflict: 'list_id,email' });
                        }
                    }
                }

                if (targetListId) {
                    const { count } = await supabase.from('subscribers').select('id', { count: 'exact', head: true }).eq('list_id', targetListId);
                    await supabase.from('subscriber_lists').update({ subscriber_count: count || 0 }).eq('id', targetListId);
                }

                await supabase.from('apify_scrape_jobs').update({ status: 'completed', leads_count: leadCount, error: errorMsg || null, completed_at: new Date().toISOString() }).eq('id', jobId);
            } else if (['FAILED', 'ABORTED', 'TIMED-OUT'].includes(runStatus)) {
                clearInterval(interval);
                await supabase.from('apify_scrape_jobs').update({ status: 'failed', error: statusData.data?.statusMessage || runStatus }).eq('id', jobId);
            }
        } catch (err) { console.error('Apify poll error:', err.message); }
    }, 5000);
}

// List jobs
router.get('/jobs', async (req, res) => {
    try {
        const { data: jobs } = await supabase.from('apify_scrape_jobs').select('*').eq('user_id', req.userId).order('created_at', { ascending: false });
        res.json({ jobs: jobs || [] });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/jobs/:id', async (req, res) => {
    try {
        const { data: job } = await supabase.from('apify_scrape_jobs').select('*').eq('id', req.params.id).eq('user_id', req.userId).single();
        if (!job) return res.status(404).json({ error: 'Job not found' });
        const { data: leads } = await supabase.from('apify_scraped_leads').select('*').eq('job_id', req.params.id).order('created_at', { ascending: false });
        res.json({ job, leads: leads || [] });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/jobs/:id', async (req, res) => {
    try {
        await supabase.from('apify_scraped_leads').delete().eq('job_id', req.params.id).eq('user_id', req.userId);
        await supabase.from('apify_scrape_jobs').delete().eq('id', req.params.id).eq('user_id', req.userId);
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// ===== LEADS =====
router.get('/leads', async (req, res) => {
    try {
        const { search, job_id, has_email, limit = 100, offset = 0 } = req.query;
        let query = supabase.from('apify_scraped_leads').select('*', { count: 'exact' }).eq('user_id', req.userId);
        if (search) query = query.or(`email.ilike.%${search}%,first_name.ilike.%${search}%,last_name.ilike.%${search}%,company.ilike.%${search}%`);
        if (job_id) query = query.eq('job_id', job_id);
        if (has_email === '1') query = query.neq('email', '').not('email', 'is', null);
        const { data: leads, count: total } = await query.order('created_at', { ascending: false }).range(parseInt(offset), parseInt(offset) + parseInt(limit) - 1);
        const { count: withEmail } = await supabase.from('apify_scraped_leads').select('id', { count: 'exact', head: true }).eq('user_id', req.userId).neq('email', '').not('email', 'is', null);
        res.json({ leads: leads || [], total: total || 0, withEmail: withEmail || 0 });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/leads', async (req, res) => {
    try {
        const { email, first_name, last_name, company, phone, website, source_url, address, linkedin_url } = req.body;
        if (!email && !first_name && !last_name) return res.status(400).json({ error: 'At least email or name is required' });
        let { data: manualJob } = await supabase.from('apify_scrape_jobs').select('id').eq('user_id', req.userId).eq('actor_type', 'manual').single();
        if (!manualJob) {
            const manualJobId = uuidv4();
            await supabase.from('apify_scrape_jobs').insert({ id: manualJobId, user_id: req.userId, actor_type: 'manual', actor_id: 'manual', source_url: '', keyword: '', location: '', max_results: 0, input_json: '{}', status: 'completed', leads_count: 0 });
            manualJob = { id: manualJobId };
        }
        const leadId = uuidv4();
        await supabase.from('apify_scraped_leads').insert({ id: leadId, job_id: manualJob.id, user_id: req.userId, email: email || '', first_name: first_name || '', last_name: last_name || '', company: company || '', phone: phone || '', website: website || '', source_url: source_url || '', address: address || '', linkedin_url: linkedin_url || '', raw_data: '{}' });
        const { data: job } = await supabase.from('apify_scrape_jobs').select('leads_count').eq('id', manualJob.id).single();
        await supabase.from('apify_scrape_jobs').update({ leads_count: (job?.leads_count || 0) + 1 }).eq('id', manualJob.id);
        res.status(201).json({ id: leadId, email, first_name, last_name, company });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/leads/:id', async (req, res) => {
    try {
        await supabase.from('apify_scraped_leads').delete().eq('id', req.params.id).eq('user_id', req.userId);
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// ===== IMPORT LEADS TO LIST =====
router.post('/import', async (req, res) => {
    try {
        const { job_id, lead_ids, list_id, create_list_name, filter_has_email } = req.body;
        let targetListId = list_id;
        if (create_list_name && !list_id) {
            const newListId = uuidv4();
            await supabase.from('subscriber_lists').insert({ id: newListId, user_id: req.userId, name: create_list_name, description: 'Imported from Apify scrape' });
            targetListId = newListId;
        }
        if (!targetListId) return res.status(400).json({ error: 'Target list required' });

        let leads = [];
        if (lead_ids && lead_ids.length > 0) {
            const { data } = await supabase.from('apify_scraped_leads').select('*').in('id', lead_ids).eq('user_id', req.userId);
            leads = data || [];
        } else if (job_id) {
            let query = supabase.from('apify_scraped_leads').select('*').eq('job_id', job_id).eq('user_id', req.userId);
            if (filter_has_email) query = query.neq('email', '').not('email', 'is', null);
            const { data } = await query;
            leads = data || [];
        } else {
            const { data } = await supabase.from('apify_scraped_leads').select('*').eq('user_id', req.userId).neq('email', '').not('email', 'is', null);
            leads = data || [];
        }

        let imported = 0, skipped = 0;
        for (const lead of leads) {
            if (!lead.email) { skipped++; continue; }
            const { error } = await supabase.from('subscribers').insert({ id: uuidv4(), list_id: targetListId, email: lead.email, first_name: lead.first_name || '', last_name: lead.last_name || '', company: lead.company || '', status: 'active' });
            if (!error) imported++; else skipped++;
        }

        const { count } = await supabase.from('subscribers').select('id', { count: 'exact', head: true }).eq('list_id', targetListId);
        await supabase.from('subscriber_lists').update({ subscriber_count: count || 0 }).eq('id', targetListId);
        if (job_id) await supabase.from('apify_scrape_jobs').update({ status: 'imported' }).eq('id', job_id).eq('user_id', req.userId);

        res.json({ success: true, imported, skipped, totalInList: count || 0, listId: targetListId });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// ===== QUICK CAMPAIGN =====
router.post('/quick-campaign', async (req, res) => {
    try {
        const { job_id, lead_ids, campaign_name, subject, body_html, body_text, list_id, create_list_name } = req.body;
        if (!campaign_name || !subject) return res.status(400).json({ error: 'Campaign name and subject required' });
        let targetListId = list_id;
        if (create_list_name && !list_id) {
            const newListId = uuidv4();
            await supabase.from('subscriber_lists').insert({ id: newListId, user_id: req.userId, name: create_list_name, description: 'Quick campaign from Apify leads' });
            targetListId = newListId;
        }

        let leads = [];
        if (lead_ids && lead_ids.length > 0) {
            const { data } = await supabase.from('apify_scraped_leads').select('*').in('id', lead_ids).eq('user_id', req.userId);
            leads = data || [];
        } else if (job_id) {
            const { data } = await supabase.from('apify_scraped_leads').select('*').eq('job_id', job_id).eq('user_id', req.userId).neq('email', '').not('email', 'is', null);
            leads = data || [];
        }
        if (!leads.length) return res.status(400).json({ error: 'No leads with emails found' });

        if (!targetListId) {
            const newListId = uuidv4();
            await supabase.from('subscriber_lists').insert({ id: newListId, user_id: req.userId, name: `${campaign_name} — Leads`, description: 'Auto-created for quick campaign' });
            targetListId = newListId;
        }

        let imported = 0;
        for (const lead of leads) {
            if (!lead.email) continue;
            const { error } = await supabase.from('subscribers').insert({ id: uuidv4(), list_id: targetListId, email: lead.email, first_name: lead.first_name || '', last_name: lead.last_name || '', company: lead.company || '', status: 'active' });
            if (!error) imported++;
        }

        const { count } = await supabase.from('subscribers').select('id', { count: 'exact', head: true }).eq('list_id', targetListId);
        await supabase.from('subscriber_lists').update({ subscriber_count: count || 0 }).eq('id', targetListId);

        const campaignId = uuidv4();
        await supabase.from('campaigns').insert({ id: campaignId, user_id: req.userId, name: campaign_name, subject, body_html: body_html || '', body_text: body_text || '', list_id: targetListId, status: 'draft', throttle_per_minute: 50, track_opens: true, track_clicks: true });

        res.json({ success: true, campaignId, listId: targetListId, imported, totalInList: count || 0 });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// ===== STATS =====
router.get('/stats', async (req, res) => {
    try {
        const { count: totalJobs } = await supabase.from('apify_scrape_jobs').select('id', { count: 'exact', head: true }).eq('user_id', req.userId);
        const { count: totalLeads } = await supabase.from('apify_scraped_leads').select('id', { count: 'exact', head: true }).eq('user_id', req.userId);
        const { count: leadsWithEmail } = await supabase.from('apify_scraped_leads').select('id', { count: 'exact', head: true }).eq('user_id', req.userId).neq('email', '').not('email', 'is', null);
        const { count: jobsImported } = await supabase.from('apify_scrape_jobs').select('id', { count: 'exact', head: true }).eq('user_id', req.userId).eq('status', 'imported');
        const { data: recentJobs } = await supabase.from('apify_scrape_jobs').select('*').eq('user_id', req.userId).order('created_at', { ascending: false }).limit(5);
        res.json({ totalJobs: totalJobs || 0, totalLeads: totalLeads || 0, leadsWithEmail: leadsWithEmail || 0, jobsImported: jobsImported || 0, recentJobs: recentJobs || [] });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// ===== REFRESH JOB STATUS =====
router.post('/jobs/:id/refresh', async (req, res) => {
    try {
        const { data: job } = await supabase.from('apify_scrape_jobs').select('*').eq('id', req.params.id).eq('user_id', req.userId).single();
        if (!job) return res.status(404).json({ error: 'Job not found' });
        if (job.status !== 'running') return res.json({ status: job.status, leads_count: job.leads_count });
        const { data: settings } = await supabase.from('apify_settings').select('apify_token').eq('user_id', req.userId).single();
        const token = settings?.apify_token;
        if (!token || !job.apify_run_id) return res.json({ status: job.status });
        const fetch = (await import('node-fetch')).default;
        const statusRes = await fetch(`https://api.apify.com/v2/actor-runs/${job.apify_run_id}?token=${token}`);
        const statusData = await statusRes.json();
        res.json({ status: statusData.data?.status || job.status, apiStatus: statusData.data?.status });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// ===== EXPORT LEADS (CSV) =====
router.get('/export', async (req, res) => {
    try {
        const { job_id, has_email } = req.query;
        let query = supabase.from('apify_scraped_leads').select('*').eq('user_id', req.userId);
        if (job_id) query = query.eq('job_id', job_id);
        if (has_email === '1') query = query.neq('email', '').not('email', 'is', null);
        const { data: leads } = await query.order('created_at', { ascending: false });
        const headers = ['Email', 'First Name', 'Last Name', 'Company', 'Phone', 'Website', 'Address', 'LinkedIn', 'Source URL'];
        let csv = headers.join(',') + '\n';
        for (const l of (leads || [])) {
            csv += [l.email, l.first_name, l.last_name, l.company, l.phone, l.website, l.address, l.linkedin_url, l.source_url].map(v => `"${(v || '').replace(/"/g, '""')}"`).join(',') + '\n';
        }
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="leads_${Date.now()}.csv"`);
        res.send(csv);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
