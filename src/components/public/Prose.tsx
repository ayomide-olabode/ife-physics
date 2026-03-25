import { sanitizeRichHtml } from '@/lib/security/sanitizeHtml';

interface ProseProps {
  html: string;
  className?: string;
}

/**
 * Styled prose wrapper for rendering HTML content (news body, program descriptions, etc.)
 * Uses @tailwindcss/typography with brand overrides. No rounded corners on images.
 */
export function Prose({ html, className = '' }: ProseProps) {
  const sanitized = sanitizeRichHtml(html || '');

  return (
    <div
      className={`prose prose-gray max-w-none
        prose-headings:font-serif prose-headings:text-brand-navy
        prose-a:text-brand-navy prose-a:underline
        prose-img:rounded-none
        prose-strong:text-brand-navy
        ${className}`}
      dangerouslySetInnerHTML={{ __html: sanitized }}
    />
  );
}
