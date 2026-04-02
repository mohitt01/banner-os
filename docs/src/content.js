/**
 * Auto-discovers all markdown files in content/ via Vite's glob import.
 * Parses YAML frontmatter to extract title, slug, icon, order, and special flag.
 * Exports a sorted array of page descriptors + their raw markdown body.
 */

const modules = import.meta.glob('../pages/*.md', { query: '?raw', import: 'default', eager: true });

function parseFrontmatter(raw) {
  const match = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) return { meta: {}, body: raw };

  const meta = {};
  for (const line of match[1].split('\n')) {
    const idx = line.indexOf(':');
    if (idx === -1) continue;
    const key = line.slice(0, idx).trim();
    let val = line.slice(idx + 1).trim();
    if (val === 'true') val = true;
    else if (val === 'false') val = false;
    else if (/^\d+$/.test(val)) val = parseInt(val, 10);
    meta[key] = val;
  }
  return { meta, body: match[2] };
}

const pages = Object.entries(modules)
  .map(([path, raw]) => {
    const { meta, body } = parseFrontmatter(raw);
    const filename = path.split('/').pop().replace('.md', '');
    return {
      filename,
      slug: meta.slug || `/${filename}`,
      title: meta.title || filename,
      icon: meta.icon || 'FileText',
      order: meta.order ?? 50,
      special: meta.special || false,
      body,
    };
  })
  .sort((a, b) => a.order - b.order);

export default pages;
