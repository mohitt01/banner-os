import MarkdownIt from 'markdown-it';
import { useMemo, useEffect, useRef } from 'react';

const md = MarkdownIt({ html: true, linkify: true, typographer: true });

export default function MarkdownPage({ content }) {
  const ref = useRef(null);
  const html = useMemo(() => {
    const baseUrl = window.location.origin;
    const processedContent = content.replace(/https:\/\/your-domain\.com/g, baseUrl);
    return md.render(processedContent);
  }, [content]);

  useEffect(() => {
    if (!ref.current) return;
    const pres = ref.current.querySelectorAll('pre');
    pres.forEach((pre) => {
      if (pre.querySelector('.copy-btn')) return;
      pre.style.position = 'relative';
      const btn = document.createElement('button');
      btn.className = 'copy-btn';
      btn.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
        </svg>
      `;
      btn.addEventListener('click', () => {
        const code = pre.querySelector('code');
        navigator.clipboard.writeText(code ? code.textContent : pre.textContent);
        btn.classList.add('copied');
        btn.innerHTML = `
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
        `;
        setTimeout(() => {
          btn.classList.remove('copied');
          btn.innerHTML = `
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
            </svg>
          `;
        }, 1000);
      });
      pre.appendChild(btn);
    });
  }, [html]);

  return (
    <div
      ref={ref}
      className="prose prose-sm prose-indigo max-w-none"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
