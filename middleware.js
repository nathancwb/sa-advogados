// Vercel Edge Middleware for Accept: text/markdown Content Negotiation
// Reference: acceptmarkdown.com

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _vercel (Vercel internals)
     * - static files (assets, favicon, etc.)
     */
    '/((?!_vercel|assets|favicon.png|og.jpg|.*\\..*).*)',
    '/',
    '/sobre',
    '/contato',
    '/privacidade',
    '/termos',
    '/about',
    '/contact',
    '/privacy',
    '/terms',
    '/artigos',
    '/noticias'
  ],
};

export default function middleware(request) {
  const url = new URL(request.url);
  const pathname = url.pathname;
  const accept = request.headers.get('accept') || '';

  // Check if client specifically prefers or requests markdown
  const wantsMarkdown = accept.includes('text/markdown') || accept.includes('text/x-markdown');

  if (wantsMarkdown) {
    let mdTarget = null;
    if (pathname === '/' || pathname === '') {
      mdTarget = '/index.md';
    } else if (pathname === '/sobre' || pathname === '/about') {
      mdTarget = '/sobre.md';
    } else if (pathname === '/contato' || pathname === '/contact') {
      mdTarget = '/contato.md';
    } else if (pathname === '/privacidade' || pathname === '/privacy') {
      mdTarget = '/privacidade.md';
    } else if (pathname === '/termos' || pathname === '/terms') {
      mdTarget = '/termos.md';
    } else if (pathname === '/artigos') {
      mdTarget = '/artigos.md';
    } else if (pathname === '/noticias') {
      mdTarget = '/noticias.md';
    }

    if (mdTarget) {
      url.pathname = mdTarget;
      const response = Response.rewrite(url);
      response.headers.set('Content-Type', 'text/markdown; charset=utf-8');
      response.headers.set('Vary', 'Accept, Accept-Encoding');
      return response;
    }
  }

  // Pass-through for default requests with Vary header guaranteed
  const response = Response.next();
  response.headers.set('Vary', 'Accept, Accept-Encoding');
  return response;
}
