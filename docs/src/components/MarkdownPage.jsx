import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import CodeBlock from './CodeBlock';

export default function MarkdownPage({ content }) {
  return (
    <div className="prose-custom">
      <Markdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw]}
        components={{
          h1: ({ children }) => <h1 className="text-3xl font-bold text-gray-900 mb-2">{children}</h1>,
          h2: ({ children }) => <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-3 pb-2 border-b border-gray-100">{children}</h2>,
          h3: ({ children }) => <h3 className="text-base font-semibold text-gray-800 mt-5 mb-2">{children}</h3>,
          p: ({ children }) => <p className="text-sm text-gray-700 leading-relaxed mb-3">{children}</p>,
          ul: ({ children }) => <ul className="list-disc pl-5 space-y-1 text-sm text-gray-700 mb-3">{children}</ul>,
          ol: ({ children }) => <ol className="list-decimal pl-5 space-y-1 text-sm text-gray-700 mb-3">{children}</ol>,
          li: ({ children }) => <li>{children}</li>,
          strong: ({ children }) => <strong className="font-semibold text-gray-900">{children}</strong>,
          a: ({ href, children }) => <a href={href} className="text-indigo-600 hover:underline">{children}</a>,
          code: ({ className, children, ...props }) => {
            const match = /language-(\w+)/.exec(className || '');
            if (match) {
              return <CodeBlock language={match[1]}>{String(children).replace(/\n$/, '')}</CodeBlock>;
            }
            return <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs font-mono text-indigo-700">{children}</code>;
          },
          pre: ({ children }) => <>{children}</>,
          table: ({ children }) => (
            <div className="overflow-hidden border border-gray-200 rounded-lg my-4">
              <table className="w-full text-sm">{children}</table>
            </div>
          ),
          thead: ({ children }) => <thead className="bg-gray-50">{children}</thead>,
          th: ({ children }) => <th className="text-left px-4 py-2 text-xs font-medium text-gray-500 uppercase">{children}</th>,
          td: ({ children }) => <td className="px-4 py-2 text-xs text-gray-700 border-t border-gray-100">{children}</td>,
          hr: () => <hr className="my-8 border-gray-200" />,
          blockquote: ({ children }) => <blockquote className="border-l-4 border-indigo-200 pl-4 my-4 text-sm text-gray-600 italic">{children}</blockquote>,
        }}
      >
        {content}
      </Markdown>
    </div>
  );
}
