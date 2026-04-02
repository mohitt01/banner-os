import { useState } from 'react';
import { Download, Copy, Check, ChevronDown, ChevronUp } from 'lucide-react';
import MarkdownPage from '../components/MarkdownPage';

// Import skill files for ZIP download and merged prompt
import skillMd from '@skill/SKILL.md?raw';
import decisionRulesMd from '@skill/references/decision-rules.md?raw';
import antiPatternsMd from '@skill/references/anti-patterns.md?raw';
import examplesMd from '@skill/references/examples.md?raw';
import checklistMd from '@skill/references/validation-checklist.md?raw';
import clientScriptMd from '@skill/references/client-script.md?raw';
import clientScriptJs from '@skill/scripts/banneros-client.js?raw';

// Import MCP server README
import mcpReadme from '@mcp/README.md?raw';

// --- Skill ZIP download (no external deps) ---

const SKILL_FILES = [
  { path: 'banneros-integration/SKILL.md', content: skillMd },
  { path: 'banneros-integration/references/decision-rules.md', content: decisionRulesMd },
  { path: 'banneros-integration/references/anti-patterns.md', content: antiPatternsMd },
  { path: 'banneros-integration/references/examples.md', content: examplesMd },
  { path: 'banneros-integration/references/validation-checklist.md', content: checklistMd },
  { path: 'banneros-integration/references/client-script.md', content: clientScriptMd },
  { path: 'banneros-integration/scripts/banneros-client.js', content: clientScriptJs },
];

function crc32(data) {
  let crc = 0xFFFFFFFF;
  for (let i = 0; i < data.length; i++) {
    crc ^= data[i];
    for (let j = 0; j < 8; j++) crc = (crc >>> 1) ^ (crc & 1 ? 0xEDB88320 : 0);
  }
  return (crc ^ 0xFFFFFFFF) >>> 0;
}

function downloadSkillZip() {
  const encoder = new TextEncoder();
  const files = SKILL_FILES.map(f => ({ name: f.path, data: encoder.encode(f.content) }));
  const parts = [];
  const centralDir = [];
  let offset = 0;

  for (const file of files) {
    const nameBytes = encoder.encode(file.name);
    const header = new Uint8Array(30 + nameBytes.length);
    const hv = new DataView(header.buffer);
    hv.setUint32(0, 0x04034b50, true);
    hv.setUint16(4, 20, true);
    hv.setUint16(8, 0, true);
    hv.setUint32(14, crc32(file.data), true);
    hv.setUint32(18, file.data.length, true);
    hv.setUint32(22, file.data.length, true);
    hv.setUint16(26, nameBytes.length, true);
    header.set(nameBytes, 30);
    parts.push(header, file.data);

    const cd = new Uint8Array(46 + nameBytes.length);
    const cv = new DataView(cd.buffer);
    cv.setUint32(0, 0x02014b50, true);
    cv.setUint16(4, 20, true);
    cv.setUint16(6, 20, true);
    cv.setUint32(16, crc32(file.data), true);
    cv.setUint32(20, file.data.length, true);
    cv.setUint32(24, file.data.length, true);
    cv.setUint16(28, nameBytes.length, true);
    cv.setUint32(42, offset, true);
    cd.set(nameBytes, 46);
    centralDir.push(cd);
    offset += header.length + file.data.length;
  }

  const cdOffset = offset;
  let cdSize = 0;
  for (const cd of centralDir) { parts.push(cd); cdSize += cd.length; }

  const end = new Uint8Array(22);
  const ev = new DataView(end.buffer);
  ev.setUint32(0, 0x06054b50, true);
  ev.setUint16(8, files.length, true);
  ev.setUint16(10, files.length, true);
  ev.setUint32(12, cdSize, true);
  ev.setUint32(16, cdOffset, true);
  parts.push(end);

  const blob = new Blob(parts, { type: 'application/zip' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'banneros-integration-skill.zip';
  a.click();
  URL.revokeObjectURL(url);
}

// --- Merged prompt (SKILL.md body + all references, self-contained) ---

function stripFrontmatter(md) {
  return md.replace(/^---[\s\S]*?---\s*/, '');
}

function stripFileLinks(md) {
  // Replace all markdown links to references/ and scripts/ files with inline text.
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

const MERGED_PROMPT = [
  stripFileLinks(stripFrontmatter(skillMd)),
  decisionRulesMd,
  antiPatternsMd,
  examplesMd,
  checklistMd,
  clientScriptMd,
].join('\n\n---\n\n');

// --- Component ---

function CopyButton({ text, label }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button
      onClick={handleCopy}
      className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
    >
      {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
      {copied ? 'Copied!' : label}
    </button>
  );
}

function Collapsible({ title, children, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors text-sm font-medium text-gray-700"
      >
        {title}
        {open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
      </button>
      {open && <div className="px-4 py-3 border-t border-gray-200">{children}</div>}
    </div>
  );
}

export default function AIAgentGuide({ markdown }) {
  return (
    <div>
      {/* Page intro from content/ai-agent-guide.md */}
      <MarkdownPage content={markdown} />

      {/* --- Option 1: Download Skill --- */}
      <div className="mt-10 p-6 bg-indigo-50 rounded-xl border border-indigo-100">
        <h2 className="text-lg font-semibold text-gray-900 mb-1">Option 1: Install the Agent Skill</h2>
        <p className="text-sm text-gray-600 mb-4">
          For IDEs that support <a href="https://agentskills.io" className="text-indigo-600 hover:underline">Agent Skills</a> (Claude Code, compatible agents).
          Download the skill and copy it into your project.
        </p>
        <div className="flex items-center gap-3 mb-3">
          <button
            onClick={downloadSkillZip}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
          >
            <Download className="w-4 h-4" />
            Download banneros-skill.zip
          </button>
        </div>
        <p className="text-xs text-gray-500">
          Then unzip into your project: <code className="bg-white px-1.5 py-0.5 rounded text-xs">.skills/banneros-integration/</code>
        </p>
        <Collapsible title="What's inside the ZIP?">
          <ul className="text-xs text-gray-600 space-y-1">
            <li><strong>SKILL.md</strong> — Main skill file the agent reads first</li>
            <li><strong>references/decision-rules.md</strong> — Page-specific caching, fallback, and limit rules</li>
            <li><strong>references/anti-patterns.md</strong> — Bad/good code examples for common mistakes</li>
            <li><strong>references/examples.md</strong> — Full integration code for React, Next.js, Vue 3, Vanilla JS</li>
            <li><strong>references/validation-checklist.md</strong> — Pre-PR checklist and testing instructions</li>
            <li><strong>references/client-script.md</strong> — Full command reference for the client script</li>
            <li><strong>scripts/banneros-client.js</strong> — CLI to operate BannerOS APIs directly (no MCP needed)</li>
          </ul>
        </Collapsible>
      </div>

      {/* --- Option 2: Copy Prompt --- */}
      <div className="mt-6 p-6 bg-gray-50 rounded-xl border border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900 mb-1">Option 2: Copy the Prompt Guide</h2>
        <p className="text-sm text-gray-600 mb-4">
          If your AI doesn't support skills, copy the full integration guide and paste it into your AI's context — system prompt, project instructions, or directly in chat.
        </p>
        <div className="flex items-center gap-3 mb-3">
          <CopyButton text={MERGED_PROMPT} label="Copy full prompt guide to clipboard" />
          <span className="text-xs text-gray-500">
            {Math.round(MERGED_PROMPT.length / 1024)}KB — merges SKILL.md + all references into one document
          </span>
        </div>
        <Collapsible title="Preview merged prompt">
          <pre className="text-xs text-gray-600 max-h-64 overflow-y-auto whitespace-pre-wrap font-mono bg-white p-3 rounded border border-gray-100">
            {MERGED_PROMPT.slice(0, 3000)}
            {MERGED_PROMPT.length > 3000 && '\n\n... (truncated — copy for full content)'}
          </pre>
        </Collapsible>
      </div>

      {/* --- Option 3: MCP Server --- */}
      <div className="mt-6 p-6 bg-gray-50 rounded-xl border border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900 mb-1">Option 3: Use the MCP Server</h2>
        <p className="text-sm text-gray-600 mb-4">
          For IDEs that support MCP (Windsurf, Claude Code, Cursor). The MCP server gives your AI access to the skill content via tools and resources, plus the ability to configure and operate BannerOS.
        </p>
        <Collapsible title="MCP Server setup & details" defaultOpen={false}>
          <div className="prose-custom">
            <MarkdownPage content={mcpReadme} />
          </div>
        </Collapsible>
      </div>
    </div>
  );
}
