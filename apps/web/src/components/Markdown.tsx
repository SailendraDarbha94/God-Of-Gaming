import ReactMarkdown, { type Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';

/**
 * Promotion bodies are authored in the Supabase dashboard, so the renderer is deliberately narrow:
 * no raw HTML (`skipHtml`), a short allow-list of elements, and only safe URL protocols (the
 * react-markdown default). Headings start at h2 because the page already has its h1.
 */
const ALLOWED_ELEMENTS = [
  'p',
  'a',
  'strong',
  'em',
  'del',
  'br',
  'code',
  'pre',
  'hr',
  'blockquote',
  'ul',
  'ol',
  'li',
  'h1',
  'h2',
  'h3',
  'h4',
  'table',
  'thead',
  'tbody',
  'tr',
  'th',
  'td',
];

const components: Components = {
  h1: 'h2',
  a: ({ href, children }) => {
    const external = typeof href === 'string' && /^https?:/i.test(href);
    return (
      <a
        href={href}
        rel={external ? 'noopener noreferrer' : undefined}
        target={external ? '_blank' : undefined}
      >
        {children}
      </a>
    );
  },
};

export function Markdown({ source }: { source: string }) {
  return (
    <div className="prose-dark">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        allowedElements={ALLOWED_ELEMENTS}
        unwrapDisallowed
        skipHtml
        components={components}
      >
        {source}
      </ReactMarkdown>
    </div>
  );
}
