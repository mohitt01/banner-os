const { getDb } = require('./db');
const { v4: uuidv4 } = require('uuid');

function seed() {
  const db = getDb();

  // Clear existing data
  db.exec('DELETE FROM impressions');
  db.exec('DELETE FROM banners');

  const now = new Date().toISOString();
  const futureDate = new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10);
  const pastDate = new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10);
  const farFuture = new Date(Date.now() + 90 * 86400000).toISOString().slice(0, 10);

  const banners = [
    {
      title: 'Summer Sale — 30% off Pro Plans',
      body: 'Upgrade to Pro and unlock advanced analytics, priority support, and custom integrations. Use code SUMMER30.',
      type: 'promotional',
      status: 'active',
      priority: 100,
      targeting_rules: { platforms: ['web'], user_segments: ['free'], countries: ['US', 'GB', 'CA'] },
      cta_text: 'Upgrade Now',
      cta_url: '/pricing',
      start_date: pastDate,
      end_date: futureDate,
    },
    {
      title: 'Scheduled Maintenance — April 5th',
      body: 'Routine maintenance on April 5th, 2:00\u20134:00 AM UTC. Expect brief downtime.',
      type: 'support',
      status: 'active',
      priority: 200,
      targeting_rules: {},
      start_date: pastDate,
      end_date: futureDate,
    },
    {
      title: 'API Rate Limits Changing',
      body: 'Free-tier rate limits change from 1000 to 500 req/hr next month. Upgrade to Pro for unlimited.',
      type: 'support',
      status: 'active',
      priority: 150,
      targeting_rules: { user_segments: ['free'], platforms: ['web'] },
      cta_text: 'View Details',
      cta_url: '/docs/rate-limits',
    },
    {
      title: 'Welcome to the Platform!',
      body: 'Get started by creating your first project in the dashboard.',
      type: 'informational',
      status: 'active',
      priority: 50,
      targeting_rules: { user_segments: ['new'], page_paths: ['/dashboard'] },
      cta_text: 'Create Project',
      cta_url: '/projects/new',
    },
    {
      title: 'Tip: Keyboard Shortcuts',
      body: 'Press Cmd+K (or Ctrl+K) to open the command palette for faster navigation.',
      type: 'informational',
      status: 'active',
      priority: 20,
      targeting_rules: { platforms: ['web', 'desktop'], is_authenticated: true },
    },
    {
      title: 'Holiday Special — Free Trial Extended',
      body: 'We\'re extending free trials to 30 days for the holiday season!',
      type: 'promotional',
      status: 'inactive',
      priority: 90,
      targeting_rules: { user_segments: ['free'] },
      cta_text: 'Learn More',
      cta_url: '/pricing',
      end_date: pastDate,
    },
  ];

  const insert = db.prepare(`
    INSERT INTO banners (id, tenant_id, title, body, type, status, priority, targeting_rules, style, cta_text, cta_url, start_date, end_date, created_at, updated_at)
    VALUES (?, 'default', ?, ?, ?, ?, ?, ?, '{}', ?, ?, ?, ?, ?, ?)
  `);

  const insertMany = db.transaction((items) => {
    for (const b of items) {
      insert.run(
        uuidv4(),
        b.title,
        b.body,
        b.type,
        b.status,
        b.priority,
        JSON.stringify(b.targeting_rules || {}),
        b.cta_text || null,
        b.cta_url || null,
        b.start_date || null,
        b.end_date || null,
        now,
        now,
      );
    }
  });

  insertMany(banners);

  const bannerCount = db.prepare('SELECT COUNT(*) as c FROM banners').get().c;
  console.log(`Seeded ${bannerCount} banners.`);
}

seed();
