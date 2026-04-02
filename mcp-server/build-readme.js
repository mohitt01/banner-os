#!/usr/bin/env node

/**
 * Build script to generate dynamic MCP README tables from docs/pages/
 */

import { readFileSync, readdirSync, writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

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

// Read all doc pages
const pagesDir = resolve(__dirname, '../../docs/pages');
const files = readdirSync(pagesDir)
  .filter(f => f.endsWith('.md'))
  .map(filename => {
    const raw = readFileSync(resolve(pagesDir, filename), 'utf-8');
    const { meta, body } = parseFrontmatter(raw);
    const id = filename.replace('.md', '');
    return {
      id,
      filename,
      title: meta.title || id.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
      description: body.split('\n')[0].replace(/^#+\s*/, '') || `Documentation for ${id}`,
    };
  })
  .sort((a, b) => a.filename.localeCompare(b.filename));

// Generate resources table
const resourcesTable = files.map(f => `| ${f.title} | \`banneros://docs/${f.id}\` | \`docs/pages/${f.filename}\` |`).join('\n');

// Generate content files list
const contentFiles = files.map(f => `- **${f.filename}** — ${f.description}`).join('\n');

// Read current README
const readmePath = resolve(__dirname, '../README.md');
let readme = readFileSync(readmePath, 'utf-8');

// Update resources table
readme = readme.replace(
  /(## Available Resources[\s\S]*?)\| Resource \| URI \| Source File \|[\s\S]*?\|.*\|\s*(\n##)/,
  `$1| Resource | URI | Source File |\n|----------|-----|-------------|\n${resourcesTable}$2`
);

// Update content files list
readme = readme.replace(
  /(## Content Files[\s\S]*?)Documentation files in `docs\/pages\/`:\s*\n[\s\S]*?(?=## Example Usage)/,
  `$1Documentation files in \`docs/pages/\`:\n\n${contentFiles}\n\n## Example Usage`
);

// Write back
writeFileSync(readmePath, readme);
console.log('Updated MCP README.md with dynamic content from docs/pages/');
