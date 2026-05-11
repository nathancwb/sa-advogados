const fs = require('fs');
const path = require('path');

function markdownToHtml(md) {
  if (!md) return '';
  let html = md;
  html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>');
  html = html.replace(/^## (.*$)/gim, '<h2>$1</h2>');
  html = html.replace(/^# (.*$)/gim, '<h1>$1</h1>');
  html = html.replace(/^\> (.*$)/gim, '<blockquote>$1</blockquote>');
  html = html.replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>');
  html = html.replace(/\*(.*?)\*/gim, '<em>$1</em>');
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/gim, '<a href="$2">$1</a>');
  html = html.replace(/^(\*|\-) (.*$)/gim, '<li>$2</li>');
  html = html.split('\n\n').map(p => {
    if (!p.trim().startsWith('<h') && !p.trim().startsWith('<blockquote') && !p.trim().startsWith('<li')) {
      return `<p>${p}</p>`;
    }
    return p;
  }).join('\n');
  return html;
}

module.exports = function handler(req, res) {
  const { slug } = req.query;
  const jsonPath = path.join(process.cwd(), 'content', 'noticias', `${slug}.json`);
  const htmlPath = path.join(process.cwd(), 'noticia-interna.html');

  if (!fs.existsSync(jsonPath) || !fs.existsSync(htmlPath)) {
    return res.status(404).send('Notícia não encontrada');
  }

  const news = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
  let html = fs.readFileSync(htmlPath, 'utf8');

  html = html.replace(/<title>.*?<\/title>/i, `<title>${news.title} | SA Advogados</title>`);
  html = html.replace(/<meta name="description" content=".*?">/i, `<meta name="description" content="${news.excerpt}">`);
  html = html.replace(/<meta property="og:title" content=".*?">/i, `<meta property="og:title" content="${news.title} | SA Advogados">`);
  html = html.replace(/<meta property="og:description" content=".*?">/i, `<meta property="og:description" content="${news.excerpt}">`);
  if (news.thumbnail) {
    html = html.replace(/<meta property="og:image" content=".*?">/i, `<meta property="og:image" content="${news.thumbnail}">`);
    html = html.replace(/<meta name="twitter:image" content=".*?">/i, `<meta name="twitter:image" content="${news.thumbnail}">`);
    html = html.replace(/<figure class="post-thumbnail">[\s\S]*?<\/figure>/i, `<figure class="post-thumbnail"><img src="${news.thumbnail}" alt="${news.title}"></figure>`);
  } else {
    html = html.replace(/<figure class="post-thumbnail">[\s\S]*?<\/figure>/i, '');
  }

  html = html.replace(/<h1 class="post-title">.*?<\/h1>/i, `<h1 class="post-title">${news.title}</h1>`);
  html = html.replace(/<span class="blog-tag">.*?<\/span>/i, `<span class="blog-tag">${news.source ? 'Fonte: ' + news.source : 'Notícia'}</span>`);
  
  // Replace author with source or empty
  html = html.replace(/<div class="meta-item">\s*<i class="ri-user-line"><\/i>\s*<span>Por .*?<\/span>\s*<\/div>/i, '');
  html = html.replace(/<div class="meta-item">\s*<i class="ri-calendar-line"><\/i>\s*<span>.*?<\/span>\s*<\/div>/i, `<div class="meta-item"><i class="ri-calendar-line"></i><span>${news.date}</span></div>`);
  
  const contentHtml = markdownToHtml(news.content || '');
  html = html.replace(/<div class="post-content editorial-content">[\s\S]*?<div class="post-footer">/i, `<div class="post-content editorial-content">${contentHtml}</div>\n<div class="post-footer">`);

  // Update back link
  html = html.replace(/<a href="artigos" class="back-link">.*?<\/a>/i, `<a href="/noticias" class="back-link"><i class="ri-arrow-left-line"></i> Voltar para Notícias</a>`);

  // Update Breadcrumbs
  html = html.replace(/"name": "Artigos", "item": "https:\/\/www\.saadvogados\.com\/artigos"/g, `"name": "Notícias", "item": "https://www.saadvogados.com/noticias"`);
  html = html.replace(/"position": 3, "name": ".*?", "item": "https:\/\/www\.saadvogados\.com\/artigo-interno"/g, `"position": 3, "name": "${news.title.replace(/"/g, '\\"')}", "item": "https://www.saadvogados.com/noticias/${slug}"`);

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.send(html);
}
