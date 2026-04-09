// ===== Eclatrecon AI Mail - Email Data Store =====
const EmailData = {
    emails: [
        {
            id: '1', from: 'Glyph Systems', initials: 'G2', time: '10:45 AM',
            subject: 'Arrival of Glyph 2.0 interface',
            preview: 'The new OS update features red glowing accents across the entire notification system, bringing more utility...',
            body: `<p>Hi Team,</p><p>We're thrilled to announce the rollout of <strong>Glyph 2.0</strong>, the next generation of our notification interface. This update introduces several key improvements:</p><p><strong>Key features:</strong></p><ul style="list-style:disc;padding-left:1.5rem;margin-bottom:1rem;"><li>New notification prioritizer with AI-driven sorting</li><li>Customizable glyph light patterns per contact</li><li>Red glowing accents across the entire notification system</li><li>Enhanced haptic feedback mapping</li></ul><p>The rollout begins next Monday. Please ensure your testing environments are updated.</p><p>Best regards,<br/>Glyph Systems Team</p>`,
            folder: 'inbox', starred: true, unread: true, priority: true,
            avatarType: 'initials', avatarColor: 'from-primary/30 to-primary/10', textColor: 'text-primary'
        },
        {
            id: '2', from: 'Carl Pei', initials: 'CP', time: '09:12 AM',
            subject: 'Feedback on the new transparent case',
            preview: 'Hi Team, I\'ve noticed some minor scuffing on the prototype...',
            body: `<p>Hi Team,</p><p>I've been testing the latest transparent case prototype for the past week. Here's my feedback:</p><p><strong>Positives:</strong></p><ul style="list-style:disc;padding-left:1.5rem;margin-bottom:1rem;"><li>The material clarity is exceptional</li><li>Weight distribution feels natural</li><li>The glyph lights shine through beautifully</li></ul><p><strong>Issues found:</strong></p><ul style="list-style:disc;padding-left:1.5rem;margin-bottom:1rem;"><li>Minor scuffing after 3 days of use</li><li>The bottom edge needs reinforcement</li></ul><p>Let's discuss in tomorrow's standup.</p><p>Carl</p>`,
            folder: 'inbox', starred: false, unread: true, priority: true,
            avatarType: 'image', avatarUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuDLEgOzMrX05_K_0Okv5CLDAh5zgJzsJqHx6Ul4BSL96Pj-hNhtc-1EsKyiT9mF4CzBGIfte4bAhSpLnYjJedG6D92XRMZJL_JgVe0Jl1BmhvHhpyEYOKANpdn-myjJ4hfPAuTsy06I3WbfTJAo7V2tW9yRAZ8auJYkNXsujiYd5eP30nrycUxZDgUWhAkU6EX0vsyVspEq2q7N4UsI5u7B18pA9F63E7_sF9UABnbPlZiktJfYPqw2dqfljbs7JvyaOCl7OzQ8RhY"
        },
        {
            id: '3', from: 'Newsletter Weekly', initials: 'N', time: 'Yesterday',
            subject: 'Your weekly tech digest is here',
            preview: 'Explore the latest in dot-matrix typography trends and minimal design...',
            body: `<p>Hello!</p><p>Welcome to your weekly tech digest. This week's highlights:</p><p><strong>🎨 Design Trends</strong><br/>Dot-matrix typography is making a comeback in modern UI design. Several major brands are adopting monospaced fonts for their dashboard interfaces.</p><p><strong>📱 Hardware News</strong><br/>The transparent phone movement continues to gain momentum. Industry analysts predict 15% market share by 2027.</p><p><strong>🤖 AI Update</strong><br/>New language models are being integrated directly into email clients, offering smart reply suggestions and priority sorting.</p><p>Read more on our website.</p>`,
            folder: 'inbox', starred: false, unread: false, priority: false,
            avatarType: 'initials', avatarColor: '', textColor: ''
        },
        {
            id: '4', from: 'Nothing Design Team', initials: 'ND', time: 'Jan 24',
            subject: 'Final assets for the Phone (3) launch',
            preview: 'Attached are the high-res renders for the launch event...',
            body: `<p>Hi everyone,</p><p>The final assets for the Phone (3) launch are ready. You'll find all high-resolution renders, marketing materials, and press kit documents in the shared drive.</p><p><strong>Included:</strong></p><ul style="list-style:disc;padding-left:1.5rem;margin-bottom:1rem;"><li>Product renders (8K resolution)</li><li>Lifestyle photography set</li><li>Press release documents</li><li>Social media templates</li></ul><p>Please review by EOD Friday. Launch is confirmed for February 15.</p><p>—Design Team</p>`,
            folder: 'inbox', starred: false, unread: false, priority: false,
            avatarType: 'image', avatarUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuB-o5gNjs7fGbet7xlVeAEWEcsYKddsDbfKxnVoKJbCINAlh-cVBBzso1vNYOyx95YgHgRXduHP_j9MLttEmO3Sr5sH4EmdX-Fez3-IILkLW5mbXC_-YRn_HGAm1ol85dfdG_S-9h1aJ1kGidQKEmDZFltaWi1GIFTHkJK43uZNNAb1lERndV51S7n5uGgYLTFQU-JuskgTUM-jwWkkve0QnRTfXwaJXXgI-ZeJOL3MoxDgwOjyS-2lzCKHxY2vvXiTPRcnc8xcpTc"
        },
        {
            id: '5', from: 'GitHub', initials: 'GH', time: 'Jan 23',
            subject: '[nothing-os] PR #1842 merged to main',
            preview: 'Your pull request "Add glyph notification handler" has been merged...',
            body: `<p>Your pull request has been merged.</p><p><strong>PR #1842: Add glyph notification handler</strong></p><p>Merged by: @build-bot<br/>Branch: feature/glyph-handler → main<br/>Commits: 14<br/>Files changed: 23</p><p>CI Status: ✅ All checks passed</p>`,
            folder: 'inbox', starred: true, unread: false, priority: false,
            avatarType: 'initials', avatarColor: 'from-blue-500/20 to-blue-600/10', textColor: 'text-blue-400'
        },
        {
            id: '6', from: 'Stripe', initials: 'S', time: 'Jan 22',
            subject: 'Your January invoice is ready',
            preview: 'Your subscription invoice for Nothing Cloud Pro is now available...',
            body: `<p>Hi,</p><p>Your invoice for January 2026 is ready.</p><p><strong>Invoice Summary:</strong></p><table style="border-collapse:collapse;width:100%;margin:1rem 0;"><tr style="border-bottom:1px solid rgba(255,255,255,0.1);"><td style="padding:0.5rem 0;">Nothing Cloud Pro</td><td style="padding:0.5rem 0;text-align:right;">$29.99</td></tr><tr style="border-bottom:1px solid rgba(255,255,255,0.1);"><td style="padding:0.5rem 0;">API calls (12,450)</td><td style="padding:0.5rem 0;text-align:right;">$4.50</td></tr><tr><td style="padding:0.5rem 0;font-weight:bold;">Total</td><td style="padding:0.5rem 0;text-align:right;font-weight:bold;color:#ec5b13;">$34.49</td></tr></table><p>Payment will be charged to your card ending in 4242.</p>`,
            folder: 'inbox', starred: false, unread: false, priority: false,
            avatarType: 'initials', avatarColor: 'from-emerald-500/20 to-emerald-600/10', textColor: 'text-emerald-400'
        },
        {
            id: '7', from: 'You', initials: 'ME', time: 'Jan 21',
            subject: 'Re: Q1 Planning Document',
            preview: 'I\'ve reviewed the document and added my comments in section 3...',
            body: `<p>Hi Team,</p><p>I've reviewed the Q1 planning document and added my comments. Key points:</p><ul style="list-style:disc;padding-left:1.5rem;"><li>Budget allocation looks good</li><li>Timeline for Glyph 2.0 needs adjustment</li><li>Marketing campaign should start 2 weeks earlier</li></ul><p>Let me know your thoughts.</p>`,
            folder: 'sent', starred: false, unread: false, priority: false,
            avatarType: 'initials', avatarColor: 'from-primary/30 to-primary/10', textColor: 'text-primary'
        },
        {
            id: '8', from: 'You', initials: 'ME', time: 'Jan 20',
            subject: 'Partnership proposal draft',
            preview: 'Here\'s the initial draft for the partnership...',
            body: `<p>Draft content for the partnership proposal...</p>`,
            folder: 'drafts', starred: false, unread: false, priority: false,
            avatarType: 'initials', avatarColor: 'from-primary/30 to-primary/10', textColor: 'text-primary'
        }
    ],

    getByFolder(folder) {
        if (folder === 'inbox') return this.emails.filter(e => e.folder === 'inbox');
        if (folder === 'starred') return this.emails.filter(e => e.starred);
        return this.emails.filter(e => e.folder === folder);
    },

    getById(id) {
        return this.emails.find(e => e.id === id);
    },

    getFolderCount(folder) {
        return this.getByFolder(folder).filter(e => e.unread).length;
    }
};
