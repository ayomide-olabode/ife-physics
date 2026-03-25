import sanitizeHtml from 'sanitize-html';

const sanitizeOptions: sanitizeHtml.IOptions = {
  allowedTags: [
    'a',
    'p',
    'br',
    'strong',
    'em',
    'u',
    's',
    'blockquote',
    'ul',
    'ol',
    'li',
    'h1',
    'h2',
    'h3',
    'h4',
    'h5',
    'h6',
    'hr',
    'code',
    'pre',
    'img',
  ],
  allowedAttributes: {
    a: ['href', 'name', 'target', 'rel'],
    img: ['src', 'alt', 'title', 'width', 'height', 'loading'],
  },
  allowedSchemes: ['http', 'https', 'mailto'],
  allowProtocolRelative: false,
  allowedSchemesAppliedToAttributes: ['href', 'src'],
  transformTags: {
    a: (tagName, attribs) => {
      const relTokens = new Set(
        String(attribs.rel || '')
          .split(/\s+/)
          .map((token) => token.trim())
          .filter(Boolean),
      );
      relTokens.add('noopener');
      relTokens.add('noreferrer');
      return {
        tagName,
        attribs: {
          ...attribs,
          rel: Array.from(relTokens).join(' '),
        },
      };
    },
  },
};

export function sanitizeRichHtml(html: string): string {
  return sanitizeHtml(html, sanitizeOptions);
}
