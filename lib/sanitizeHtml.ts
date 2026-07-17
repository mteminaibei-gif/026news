import sanitizeHtml from 'sanitize-html'

const ARTICLE_OPTIONS: sanitizeHtml.IOptions = {
  allowedTags: [
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'p', 'a', 'ul', 'ol', 'li', 'blockquote', 'pre', 'code',
    'strong', 'em', 'b', 'i', 'u', 's', 'sub', 'sup', 'mark', 'small',
    'br', 'hr', 'span', 'div',
    'img', 'figure', 'figcaption',
    'table', 'thead', 'tbody', 'tr', 'th', 'td',
  ],
  allowedAttributes: {
    a: ['href', 'title', 'target', 'rel'],
    img: ['src', 'alt', 'title', 'width', 'height', 'loading'],
    '*': ['class'],
  },
  allowedSchemes: ['http', 'https', 'mailto'],
  allowedSchemesByTag: { img: ['https', 'http'] },
  transformTags: {
    a: sanitizeHtml.simpleTransform('a', { rel: 'noopener noreferrer nofollow', target: '_blank' }),
  },
  // Strip anything that looks like an event handler or script protocol.
  nonTextTags: ['style', 'script', 'textarea', 'option', 'noscript'],
  disallowedTagsMode: 'discard',
}

export function sanitizeArticleHtml(input: string): string {
  if (!input) return ''
  return sanitizeHtml(input, ARTICLE_OPTIONS)
}

export function sanitizePlainText(input: string): string {
  if (!input) return ''
  return sanitizeHtml(input, { allowedTags: [], allowedAttributes: {}, disallowedTagsMode: 'discard' })
}
