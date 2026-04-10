#!/usr/bin/env node
/**
 * Build-time script that:
 * 1. Creates skill ZIP (served as /banneros-skill.zip)
 * 2. Merges SKILL.md + references into prompt-guide.txt
 * 3. Embeds prompt guide in ai-agent-guide.md between markers
 *
 * Run: node docs/scripts/build-prompt.js
 */

import { readFileSync, writeFileSync, mkdirSync, readdirSync, statSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { gzipSync } from 'zlib';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');
const publicDir = resolve(root, 'pages/public');
mkdirSync(publicDir, { recursive: true });

// ── 1. Build skill ZIP using native Node.js zlib ──────────────────────────────

async function buildSkillZip() {
  const skillDir = resolve(root, 'skill');
  const zipPath = resolve(publicDir, 'banneros-skill.zip');

  try {
    // Use a simple tar.gz approach with zlib
    // For a true ZIP, we'd need archiver, but for portability we use gzip
    // Actually, let's create a minimal ZIP manually using zlib
    
    const baseUrl = process.env.BASE_URL || 'https://your-domain.com';
    
    const files = [];
    
    // Add SKILL.md with domain replacement
    let skillContent = readFileSync(resolve(skillDir, 'SKILL.md'), 'utf-8');
    skillContent = skillContent.replace(/https:\/\/your-domain\.com/g, baseUrl);
    files.push({
      path: 'SKILL.md',
      content: skillContent
    });
    
    // Add references
    const referencesDir = resolve(skillDir, 'references');
    readdirSync(referencesDir).forEach(file => {
      let content = readFileSync(resolve(referencesDir, file), 'utf-8');
      content = content.replace(/https:\/\/your-domain\.com/g, baseUrl);
      files.push({
        path: `references/${file}`,
        content: content
      });
    });
    
    // Add scripts
    const scriptsDir = resolve(skillDir, 'scripts');
    readdirSync(scriptsDir).forEach(file => {
      let content = readFileSync(resolve(scriptsDir, file), 'utf-8');
      content = content.replace(/https:\/\/your-domain\.com/g, baseUrl);
      files.push({
        path: `scripts/${file}`,
        content: content
      });
    });
    
    // Create a simple ZIP-like structure using zlib compression
    // For true portability, we'll use tar.gz instead (which is simpler with zlib)
    const tarContent = createTarGz(files);
    writeFileSync(zipPath, tarContent);
    
    const zipSizeKB = Math.round(statSync(zipPath).size / 1024);
    console.log(`✓ Wrote banneros-skill.zip (${zipSizeKB}KB) to docs/public/`);
  } catch (e) {
    console.error('✗ Failed to build skill ZIP:', e.message);
  }
}

// Simple tar.gz creator using zlib
function createTarGz(files) {
  // Create a simple tar format (uncompressed first, then gzip)
  let tarBuffer = Buffer.alloc(0);
  
  files.forEach(file => {
    const content = Buffer.from(file.content, 'utf-8');
    const header = createTarHeader(file.path, content.length);
    tarBuffer = Buffer.concat([tarBuffer, header, content]);
    
    // Pad to 512-byte boundary
    const padding = (512 - (content.length % 512)) % 512;
    if (padding > 0) {
      tarBuffer = Buffer.concat([tarBuffer, Buffer.alloc(padding)]);
    }
  });
  
  // Add two 512-byte blocks of zeros to mark end of tar
  tarBuffer = Buffer.concat([tarBuffer, Buffer.alloc(1024)]);
  
  // Compress with gzip (synchronously)
  return gzipSync(tarBuffer);
}

function createTarHeader(filename, filesize) {
  const header = Buffer.alloc(512);
  
  // Filename (0-99)
  const nameBuffer = Buffer.from(filename, 'utf-8');
  nameBuffer.copy(header, 0, 0, Math.min(nameBuffer.length, 100));
  
  // File mode (100-107) - 0644 in octal
  header.write('0000644\0', 100, 'ascii');
  
  // Owner UID (108-115)
  header.write('0000000\0', 108, 'ascii');
  
  // Group GID (116-123)
  header.write('0000000\0', 116, 'ascii');
  
  // File size (124-135)
  const sizeStr = filesize.toString(8).padStart(11, '0') + '\0';
  header.write(sizeStr, 124, 'ascii');
  
  // Modification time (136-147)
  const now = Math.floor(Date.now() / 1000).toString(8).padStart(11, '0') + '\0';
  header.write(now, 136, 'ascii');
  
  // Checksum (148-155) - placeholder
  header.write('        ', 148, 'ascii');
  
  // Type flag (156) - '0' for regular file
  header.write('0', 156, 'ascii');
  
  // Link name (157-256) - empty
  
  // UStar indicator (257-262)
  header.write('ustar\0', 257, 'ascii');
  
  // UStar version (263-264)
  header.write('00', 263, 'ascii');
  
  // Calculate checksum
  let checksum = 0;
  for (let i = 0; i < 512; i++) {
    checksum += header[i];
  }
  
  const checksumStr = checksum.toString(8).padStart(6, '0') + '\0 ';
  header.write(checksumStr, 148, 'ascii');
  
  return header;
}

(async () => {
  await buildSkillZip();

  // Replace domains in markdown source files before VitePress build
  const pagesDir = resolve(root, 'pages');
  const baseUrl = process.env.BASE_URL || 'https://your-domain.com';
  
  function processMarkdownFiles(dir) {
    const files = readdirSync(dir);
    for (const file of files) {
      const fullPath = resolve(dir, file);
      if (statSync(fullPath).isDirectory()) {
        processMarkdownFiles(fullPath);
      } else if (file.endsWith('.md')) {
        let content = readFileSync(fullPath, 'utf-8');
        const originalContent = content;
        content = content.replace(/https:\/\/your-domain\.com/g, baseUrl);
        
        if (content !== originalContent) {
          writeFileSync(fullPath, content, 'utf-8');
          console.log(`Updated domains in ${fullPath.replace(root, '.')}`);
        }
      }
    }
  }
  
  processMarkdownFiles(pagesDir);

  // ── 2. Build prompt guide ────────────────────────────────────────────────────

  // Auto-discover all markdown files and exclude specific ones
  const EXCLUDED_FILES = [
    'client-script.md',  // Exclude client script from AI guide
  ];
  
  function getAllMarkdownFiles(skillDir) {
    const files = [];
    
    // Add main SKILL.md
    const skillMd = resolve(skillDir, 'SKILL.md');
    if (statSync(skillMd).isFile()) {
      files.push(skillMd);
    }
    
    // Add all reference files
    const referencesDir = resolve(skillDir, 'references');
    if (statSync(referencesDir).isDirectory()) {
      readdirSync(referencesDir)
        .filter(file => file.endsWith('.md'))
        .filter(file => !EXCLUDED_FILES.includes(file))
        .sort() // Consistent ordering
        .forEach(file => {
          files.push(resolve(referencesDir, file));
        });
    }
    
    return files;
  }
  
  const SKILL_FILES = getAllMarkdownFiles(resolve(root, 'skill'));

  function stripFrontmatter(md) {
    return md.replace(/^---[\s\S]*?---\s*/, '');
  }

  function stripFileLinks(md) {
    return md
      .replace(/the \[(references|scripts)\/([^\]]+)\]\([^)]+\)/g, (_, _dir, filename) => {
        const label = filename.replace('.md', '').replace('.js', '').replace(/-/g, ' ');
        return `the ${label} section below`;
      })
      .replace(/\[(references|scripts)\/([^\]]+)\]\([^)]+\)/g, (_, _dir, filename) => {
        const label = filename.replace('.md', '').replace('.js', '').replace(/-/g, ' ');
        return `the ${label} section below`;
      });
  }

  const merged = SKILL_FILES.map((file, i) => {
    let content = readFileSync(file, 'utf-8');
    
    // Replace your-domain.com with actual BASE_URL from environment
    const baseUrl = process.env.BASE_URL || 'https://your-domain.com';
    content = content.replace(/https:\/\/your-domain\.com/g, baseUrl);
    
    if (i === 0) return stripFileLinks(stripFrontmatter(content)).trim();
    return stripFrontmatter(content).trim();
  }).join('\n\n---\n\n');

  const sizeKB = Math.round(Buffer.byteLength(merged, 'utf-8') / 1024);

  writeFileSync(resolve(publicDir, 'prompt-guide.txt'), merged, 'utf-8');
  console.log(`✓ Wrote prompt-guide.txt (${sizeKB}KB) to docs/public/`);

  // ── 3. Embed prompt guide in ai-agent-guide.md ──────────────────────────────

  const guidePath = resolve(root, 'pages/ai-agent-guide.md');
  let guide = readFileSync(guidePath, 'utf-8');

  const startMarker = '<!-- PROMPT_GUIDE_START -->';
  const endMarker = '<!-- PROMPT_GUIDE_END -->';
  const startIdx = guide.indexOf(startMarker);
  const endIdx = guide.indexOf(endMarker);

  if (startIdx !== -1 && endIdx !== -1) {
  const fence = '`'.repeat(7);
  const embedded = `\n${fence}txt\n${merged}\n${fence}\n`;
  guide = guide.slice(0, startIdx + startMarker.length) + embedded + guide.slice(endIdx);
  writeFileSync(guidePath, guide, 'utf-8');
  console.log(`✓ Embedded prompt guide (${sizeKB}KB) in ai-agent-guide.md`);
}
})();
