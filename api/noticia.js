const fs = require('fs');
const path = require('path');

const SITE = 'https://www.saadvogados.com';

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

function escAttr(str) {
  return String(str || '').replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function parsePtDate(str) {
  if (!str) return null;
  const meses = {
    janeiro: '01', fevereiro: '02', marco: '03', abril: '04', maio: '05', junho: '06',
    julho: '07', agosto: '08', setembro: '09', outubro: '10', novembro: '11', dezembro: '12'
  };
  const norm = String(str).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  const m = norm.match(/(\d{1,2})\s*de\s*([a-z]+)\s*,?\s*(\d{4})/);
  if (!m) return null;
  const dia = m[1].padStart(2, '0');
  const mes = meses[m[2]];
  if (!mes) return null;
  return `${m[3]}-${mes}-${dia}`;
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

  const url = `${SITE}/noticias/${slug}`;
  const isoDate = parsePtDate(news.date);
  const image = news.thumbnail || `${SITE}/og.jpg`;
  const source = news.source || '';

  // --- TÍTULO E META DESCRIÇÃO ---
  html = html.replace(/<title>.*?<\/title>/i, `<title>${escAttr(news.title)} | SA Advogados</title>`);
  html = html.replace(/<meta name="description" content=".*?">/i, `<meta name="description" content="${escAttr(news.excerpt)}">`);
  html = html.replace(/<meta name="author" content=".*?">/i, `<meta name="author" content="SA Advogados">`);

  // --- CANONICAL + OG:URL (corrige colisão de canonical entre todas as notícias) ---
  html = html.replace(/<link rel="canonical"[^>]*>/i, `<link rel="canonical" href="${url}">`);
  html = html.replace(/<meta property="og:url" content=".*?">/i, `<meta property="og:url" content="${url}">`);

  // --- OPEN GRAPH / TWITTER ---
  html = html.replace(/<meta property="og:title" content=".*?">/i, `<meta property="og:title" content="${escAttr(news.title)} | SA Advogados">`);
  html = html.replace(/<meta property="og:description" content=".*?">/i, `<meta property="og:description" content="${escAttr(news.excerpt)}">`);
  html = html.replace(/<meta property="og:image" content=".*?">/i, `<meta property="og:image" content="${escAttr(image)}">`);
  html = html.replace(/<meta name="twitter:title" content=".*?">/i, `<meta name="twitter:title" content="${escAttr(news.title)} | SA Advogados">`);
  html = html.replace(/<meta name="twitter:description" content=".*?">/i, `<meta name="twitter:description" content="${escAttr(news.excerpt)}">`);
  html = html.replace(/<meta name="twitter:image" content=".*?">/i, `<meta name="twitter:image" content="${escAttr(image)}">`);

  // --- META ESPECÍFICAS (notícia) ---
  html = html.replace(/<meta property="article:author" content=".*?">/i, `<meta property="article:author" content="${escAttr(source || 'SA Advogados')}">`);
  html = html.replace(/<meta property="article:section" content=".*?">/i, `<meta property="article:section" content="Notícias">`);
  if (isoDate) {
    html = html.replace(/<meta property="article:published_time" content=".*?">/i, `<meta property="article:published_time" content="${isoDate}T08:00:00-03:00">`);
  }

  // --- JSON-LD reconstruído (NewsArticle) ---
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'NewsArticle',
        '@id': `${url}#article`,
        headline: news.title,
        description: news.excerpt,
        image: image,
        ...(isoDate ? { datePublished: `${isoDate}T08:00:00-03:00`, dateModified: `${isoDate}T08:00:00-03:00` } : {}),
        inLanguage: 'pt-BR',
        mainEntityOfPage: url,
        url: url,
        articleSection: 'Notícias',
        isPartOf: { '@id': `${SITE}/#website` },
        publisher: { '@id': `${SITE}/#organization` },
        author: { '@id': `${SITE}/#organization` },
        ...(source ? { sourceOrganization: { '@type': 'Organization', name: source } } : {})
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Início', item: `${SITE}/` },
          { '@type': 'ListItem', position: 2, name: 'Notícias', item: `${SITE}/noticias` },
          { '@type': 'ListItem', position: 3, name: news.title, item: url }
        ]
      }
    ]
  };
  html = html.replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>/i,
    `<script type="application/ld+json">\n${JSON.stringify(jsonLd, null, 2)}\n</script>`);

  // --- CONTEÚDO VISÍVEL ---
  if (news.thumbnail) {
    html = html.replace(/<figure class="post-thumbnail">[\s\S]*?<\/figure>/i, `<figure class="post-thumbnail"><img src="${escAttr(news.thumbnail)}" alt="${escAttr(news.title)}"></figure>`);
  } else {
    html = html.replace(/<figure class="post-thumbnail">[\s\S]*?<\/figure>/i, '');
  }

  html = html.replace(/<h1 class="post-title">.*?<\/h1>/i, `<h1 class="post-title">${escAttr(news.title)}</h1>`);
  html = html.replace(/<span class="blog-tag">.*?<\/span>/i, `<span class="blog-tag">${source ? 'Fonte: ' + escAttr(source) : 'Notícia'}</span>`);

  // Notícia não tem autor pessoal: remove o item "Por ..."
  html = html.replace(/<div class="meta-item">\s*<i class="ri-user-line"><\/i>\s*<span>Por .*?<\/span>\s*<\/div>/i, '');
  html = html.replace(/<div class="meta-item">\s*<i class="ri-calendar-line"><\/i>\s*<span>.*?<\/span>\s*<\/div>/i, `<div class="meta-item"><i class="ri-calendar-line"></i><span>${escAttr(news.date)}</span></div>`);

  const contentHtml = markdownToHtml(news.content || '');
  html = html.replace(/<div class="post-content editorial-content">[\s\S]*?<div class="post-footer">/i, `<div class="post-content editorial-content">${contentHtml}</div>\n<div class="post-footer">`);

  // Link de volta para Notícias
  html = html.replace(/<a href="artigos" class="back-link">[\s\S]*?<\/a>/i, `<a href="/noticias" class="back-link"><i class="ri-arrow-left-line"></i> Voltar para Notícias</a>`);

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=86400');
  res.send(html);
}
