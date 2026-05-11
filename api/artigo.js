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
  const jsonPath = path.join(process.cwd(), 'content', 'artigos', `${slug}.json`);
  const htmlPath = path.join(process.cwd(), 'artigo-interno.html');

  if (!fs.existsSync(jsonPath) || !fs.existsSync(htmlPath)) {
    return res.status(404).send('Página não encontrada');
  }

  const article = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
  let html = fs.readFileSync(htmlPath, 'utf8');

  html = html.replace(/<title>.*?<\/title>/i, `<title>${article.title} | SA Advogados</title>`);
  html = html.replace(/<meta name="description" content=".*?">/i, `<meta name="description" content="${article.excerpt}">`);
  html = html.replace(/<meta property="og:title" content=".*?">/i, `<meta property="og:title" content="${article.title} | SA Advogados">`);
  html = html.replace(/<meta property="og:description" content=".*?">/i, `<meta property="og:description" content="${article.excerpt}">`);
  if (article.thumbnail) {
    html = html.replace(/<meta property="og:image" content=".*?">/i, `<meta property="og:image" content="${article.thumbnail}">`);
    html = html.replace(/<meta name="twitter:image" content=".*?">/i, `<meta name="twitter:image" content="${article.thumbnail}">`);
    html = html.replace(/<figure class="post-thumbnail">[\s\S]*?<\/figure>/i, `<figure class="post-thumbnail"><img src="${article.thumbnail}" alt="${article.title}"></figure>`);
  }

  html = html.replace(/<h1 class="post-title">.*?<\/h1>/i, `<h1 class="post-title">${article.title}</h1>`);
  html = html.replace(/<span class="blog-tag">.*?<\/span>/i, `<span class="blog-tag">${article.category || 'Artigo'}</span>`);
  html = html.replace(/<div class="meta-item">\s*<i class="ri-user-line"><\/i>\s*<span>Por .*?<\/span>\s*<\/div>/i, `<div class="meta-item"><i class="ri-user-line"></i><span>Por ${article.author || 'Equipe SA'}</span></div>`);
  html = html.replace(/<div class="meta-item">\s*<i class="ri-calendar-line"><\/i>\s*<span>.*?<\/span>\s*<\/div>/i, `<div class="meta-item"><i class="ri-calendar-line"></i><span>${article.date}</span></div>`);
  
  const contentHtml = markdownToHtml(article.content || '');
  html = html.replace(/<div class="post-content editorial-content">[\s\S]*?<div class="post-footer">/i, `<div class="post-content editorial-content">${contentHtml}</div>\n<div class="post-footer">`);

  // Update Breadcrumbs
  html = html.replace(/"position": 3, "name": ".*?", "item": "https:\/\/www\.saadvogados\.com\/artigo-interno"/g, `"position": 3, "name": "${article.title.replace(/"/g, '\\"')}", "item": "https://www.saadvogados.com/artigos/${slug}"`);

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.send(html);
}
