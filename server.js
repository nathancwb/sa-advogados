const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = process.env.PORT || 3000;
const PUBLIC_DIR = __dirname;

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.md': 'text/markdown; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.xml': 'application/xml; charset=utf-8'
};

const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url, true);
  let pathname = parsedUrl.pathname;

  // Global header: Vary: Accept, Accept-Encoding (essential for acceptmarkdown.com compliance)
  res.setHeader('Vary', 'Accept, Accept-Encoding');

  const acceptHeader = req.headers['accept'] || '';
  const wantsMarkdown = acceptHeader.includes('text/markdown') || acceptHeader.includes('text/x-markdown');

  // Roteamento dinâmico de artigos: /artigos/:slug
  if (pathname.startsWith('/artigos/') && !pathname.endsWith('.html') && !pathname.endsWith('.md')) {
    const slug = pathname.replace('/artigos/', '').replace(/\/$/, '');
    if (slug) {
      req.query = { slug };
      const artigoHandler = require('./api/artigo.js');
      return artigoHandler(req, res);
    }
  }

  // Roteamento dinâmico de notícias: /noticias/:slug
  if (pathname.startsWith('/noticias/') && !pathname.endsWith('.html') && !pathname.endsWith('.md')) {
    const slug = pathname.replace('/noticias/', '').replace(/\/$/, '');
    if (slug) {
      req.query = { slug };
      const noticiaHandler = require('./api/noticia.js');
      return noticiaHandler(req, res);
    }
  }

  // Negociação de conteúdo Markdown para rotas estáticas
  if (wantsMarkdown) {
    let mdTarget = null;
    if (pathname === '/' || pathname === '') mdTarget = 'index.md';
    else if (pathname === '/sobre' || pathname === '/about') mdTarget = 'sobre.md';
    else if (pathname === '/contato' || pathname === '/contact') mdTarget = 'contato.md';
    else if (pathname === '/privacidade' || pathname === '/privacy') mdTarget = 'privacidade.md';
    else if (pathname === '/termos' || pathname === '/terms') mdTarget = 'termos.md';
    else if (pathname === '/artigos') mdTarget = 'artigos.md';
    else if (pathname === '/noticias') mdTarget = 'noticias.md';

    if (mdTarget) {
      const mdFilePath = path.join(PUBLIC_DIR, mdTarget);
      if (fs.existsSync(mdFilePath)) {
        res.writeHead(200, { 'Content-Type': 'text/markdown; charset=utf-8' });
        return res.end(fs.readFileSync(mdFilePath, 'utf8'));
      }
    }
  }

  // Normalização de rotas HTML
  let filePath = path.join(PUBLIC_DIR, pathname);

  if (pathname === '/' || pathname === '') {
    filePath = path.join(PUBLIC_DIR, 'index.html');
  } else if (pathname === '/sobre' || pathname === '/about') {
    filePath = path.join(PUBLIC_DIR, 'sobre.html');
  } else if (pathname === '/contato' || pathname === '/contact') {
    filePath = path.join(PUBLIC_DIR, 'contato.html');
  } else if (pathname === '/privacidade' || pathname === '/privacy') {
    filePath = path.join(PUBLIC_DIR, 'privacidade.html');
  } else if (pathname === '/termos' || pathname === '/terms') {
    filePath = path.join(PUBLIC_DIR, 'termos.html');
  } else if (pathname === '/artigos') {
    filePath = path.join(PUBLIC_DIR, 'artigos.html');
  } else if (pathname === '/noticias') {
    filePath = path.join(PUBLIC_DIR, 'noticias.html');
  } else if (pathname === '/videos') {
    filePath = path.join(PUBLIC_DIR, 'videos.html');
  }

  // Se não tem extensão e não é diretório, tenta adicionar .html
  if (!path.extname(filePath) && !fs.existsSync(filePath)) {
    if (fs.existsSync(filePath + '.html')) {
      filePath = filePath + '.html';
    }
  }

  // Se o arquivo existe
  if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': contentType });
    return res.end(fs.readFileSync(filePath));
  }

  // 404 Response amigável a agentes e humanos
  res.writeHead(404, {
    'Content-Type': wantsMarkdown ? 'text/markdown; charset=utf-8' : 'text/html; charset=utf-8'
  });

  if (wantsMarkdown) {
    const md404 = path.join(PUBLIC_DIR, '404.md');
    if (fs.existsSync(md404)) {
      return res.end(fs.readFileSync(md404, 'utf8'));
    }
    return res.end('# 404 — Página Não Encontrada\n\nConsulte o sitemap em https://www.saadvogados.com/sitemap.xml');
  }

  const html404 = path.join(PUBLIC_DIR, '404.html');
  if (fs.existsSync(html404)) {
    return res.end(fs.readFileSync(html404, 'utf8'));
  }
  return res.end('<!DOCTYPE html><html><head><title>404 Not Found</title></head><body><h1>404 Not Found</h1></body></html>');
});

server.listen(PORT, () => {
  console.log(`🚀 SA Advogados Server running at http://localhost:${PORT}/`);
});
