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

// Escapa valores que vão dentro de atributos HTML (title, content="...")
function escAttr(str) {
  return String(str || '').replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// Converte data por extenso em pt-BR ("15 de Março, 2026") para ISO ("2026-03-15").
// Retorna null se não conseguir interpretar.
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
  const jsonPath = path.join(process.cwd(), 'content', 'artigos', `${slug}.json`);
  const htmlPath = path.join(process.cwd(), 'artigo-interno.html');

  if (!fs.existsSync(jsonPath) || !fs.existsSync(htmlPath)) {
    return res.status(404).send('Página não encontrada');
  }

  const article = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
  let html = fs.readFileSync(htmlPath, 'utf8');

  const url = `${SITE}/artigos/${slug}`;
  const isoDate = parsePtDate(article.date);
  const image = article.thumbnail || `${SITE}/og.jpg`;
  const author = article.author || 'Equipe SA Advogados';
  const category = article.category || 'Artigo';

  // --- TÍTULO E META DESCRIÇÃO ---
  html = html.replace(/<title>.*?<\/title>/i, `<title>${escAttr(article.title)} | SA Advogados</title>`);
  html = html.replace(/<meta name="description" content=".*?">/i, `<meta name="description" content="${escAttr(article.excerpt)}">`);
  html = html.replace(/<meta name="author" content=".*?">/i, `<meta name="author" content="${escAttr(author)} — SA Advogados">`);

  // --- CANONICAL + OG:URL (corrige colisão de canonical entre todos os artigos) ---
  html = html.replace(/<link rel="canonical"[^>]*>/i, `<link rel="canonical" href="${url}">`);
  html = html.replace(/<meta property="og:url" content=".*?">/i, `<meta property="og:url" content="${url}">`);

  // --- OPEN GRAPH / TWITTER ---
  html = html.replace(/<meta property="og:title" content=".*?">/i, `<meta property="og:title" content="${escAttr(article.title)} | SA Advogados">`);
  html = html.replace(/<meta property="og:description" content=".*?">/i, `<meta property="og:description" content="${escAttr(article.excerpt)}">`);
  html = html.replace(/<meta property="og:image" content=".*?">/i, `<meta property="og:image" content="${escAttr(image)}">`);
  html = html.replace(/<meta name="twitter:title" content=".*?">/i, `<meta name="twitter:title" content="${escAttr(article.title)} | SA Advogados">`);
  html = html.replace(/<meta name="twitter:description" content=".*?">/i, `<meta name="twitter:description" content="${escAttr(article.excerpt)}">`);
  html = html.replace(/<meta name="twitter:image" content=".*?">/i, `<meta name="twitter:image" content="${escAttr(image)}">`);

  // --- META ESPECÍFICAS DE ARTIGO ---
  html = html.replace(/<meta property="article:author" content=".*?">/i, `<meta property="article:author" content="${escAttr(author)}">`);
  html = html.replace(/<meta property="article:section" content=".*?">/i, `<meta property="article:section" content="${escAttr(category)}">`);
  if (isoDate) {
    html = html.replace(/<meta property="article:published_time" content=".*?">/i, `<meta property="article:published_time" content="${isoDate}T08:00:00-03:00">`);
  }

  // --- JSON-LD reconstruído com os dados reais do artigo ---
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Article',
        '@id': `${url}#article`,
        headline: article.title,
        description: article.excerpt,
        image: image,
        ...(isoDate ? { datePublished: `${isoDate}T08:00:00-03:00`, dateModified: `${isoDate}T08:00:00-03:00` } : {}),
        inLanguage: 'pt-BR',
        mainEntityOfPage: url,
        url: url,
        articleSection: category,
        isPartOf: { '@id': `${SITE}/#website` },
        publisher: { '@id': `${SITE}/#organization` },
        author: {
          '@type': 'Person',
          name: author,
          worksFor: { '@id': `${SITE}/#organization` }
        },
        speakable: { '@type': 'SpeakableSpecification', cssSelector: ['.lead', '.post-title'] }
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Início', item: `${SITE}/` },
          { '@type': 'ListItem', position: 2, name: 'Artigos', item: `${SITE}/artigos` },
          { '@type': 'ListItem', position: 3, name: article.title, item: url }
        ]
      }
    ]
  };
  html = html.replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>/i,
    `<script type="application/ld+json">\n${JSON.stringify(jsonLd, null, 2)}\n</script>`);

  // --- CONTEÚDO VISÍVEL ---
  if (article.thumbnail) {
    html = html.replace(/<figure class="post-thumbnail">[\s\S]*?<\/figure>/i, `<figure class="post-thumbnail"><img src="${escAttr(article.thumbnail)}" alt="${escAttr(article.title)}"></figure>`);
  } else {
    html = html.replace(/<figure class="post-thumbnail">[\s\S]*?<\/figure>/i, '');
  }

  html = html.replace(/<h1 class="post-title">.*?<\/h1>/i, `<h1 class="post-title">${escAttr(article.title)}</h1>`);
  html = html.replace(/<span class="blog-tag">.*?<\/span>/i, `<span class="blog-tag">${escAttr(category)}</span>`);
  html = html.replace(/<div class="meta-item">\s*<i class="ri-user-line"><\/i>\s*<span>Por .*?<\/span>\s*<\/div>/i, `<div class="meta-item"><i class="ri-user-line"></i><span>Por ${escAttr(author)}</span></div>`);
  html = html.replace(/<div class="meta-item">\s*<i class="ri-calendar-line"><\/i>\s*<span>.*?<\/span>\s*<\/div>/i, `<div class="meta-item"><i class="ri-calendar-line"></i><span>${escAttr(article.date)}</span></div>`);

  const contentHtml = markdownToHtml(article.content || '');
  html = html.replace(/<div class="post-content editorial-content">[\s\S]*?<div class="post-footer">/i, `<div class="post-content editorial-content">${contentHtml}</div>\n<div class="post-footer">`);

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=86400');
  res.send(html);
}
