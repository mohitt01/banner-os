const { getDb } = require('./db');

async function seed() {
  const db = getDb();

  // Clear existing banners via delete
  const existing = await db.getBanners('default');
  for (const b of existing) {
    await db.deleteBanner(b.id);
  }

  const futureDate = new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10);
  const pastDate = new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10);

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

  for (const b of banners) {
    await db.createBanner({ tenant_id: 'default', ...b });
  }

  const all = await db.getBanners('default');
  console.log(`Seeded ${all.length} banners.`);
}

seed();
