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

function sendOutput(res, statusCode, body, contentType = 'text/html; charset=utf-8') {
  res.setHeader('Content-Type', contentType);
  if (typeof res.status === 'function') {
    res.status(statusCode);
  } else {
    res.statusCode = statusCode;
  }
  if (typeof res.send === 'function') {
    return res.send(body);
  }
  return res.end(body);
}

module.exports = function handler(req, res) {
  const { slug } = req.query || {};
  const jsonPath = path.join(process.cwd(), 'content', 'noticias', `${slug}.json`);
  const htmlPath = path.join(process.cwd(), 'noticia-interna.html');

  // Accept Negotiation Header (acceptmarkdown.com)
  res.setHeader('Vary', 'Accept, Accept-Encoding');

  const acceptHeader = req.headers['accept'] || '';
  const wantsMarkdown = acceptHeader.includes('text/markdown') || acceptHeader.includes('text/x-markdown');

  if (!fs.existsSync(jsonPath)) {
    if (wantsMarkdown) {
      return sendOutput(res, 404, `# 404 — Notícia Não Encontrada\n\nA notícia solicitada \`${slug}\` não foi localizada.\n\nConsulte o índice completo em [noticias.md](https://www.saadvogados.com/noticias.md) ou no [sitemap.xml](https://www.saadvogados.com/sitemap.xml).`, 'text/markdown; charset=utf-8');
    }
    const errorPage = path.join(process.cwd(), '404.html');
    if (fs.existsSync(errorPage)) {
      return sendOutput(res, 404, fs.readFileSync(errorPage, 'utf8'), 'text/html; charset=utf-8');
    }
    return sendOutput(res, 404, 'Notícia não encontrada', 'text/plain; charset=utf-8');
  }

  const news = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
  const url = `${SITE}/noticias/${slug}`;
  const isoDate = parsePtDate(news.date);
  const image = news.thumbnail || `${SITE}/og.jpg`;
  const source = news.source || 'Comunicação SA Advogados';

  // Se o agente solicitou Markdown explicitamente
  if (wantsMarkdown) {
    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=86400');
    const mdOutput = `# ${news.title}\n\n> **Fonte:** ${source} | **Data:** ${news.date}\n> **Link Canônico:** ${url}\n\n${news.excerpt ? `**Resumo:** ${news.excerpt}\n\n---\n\n` : ''}${news.content || ''}\n\n---\n\n## Sobre a SA Advogados\nEscritório de advocacia referência em Florianópolis/SC e Porto Velho/RO.\n- **WhatsApp:** [+55 (48) 99138-1200](https://api.whatsapp.com/send?phone=5548991381200)\n- **E-mail:** [comercial@saadvogados.com](mailto:comercial@saadvogados.com)\n- **Site:** [https://www.saadvogados.com](https://www.saadvogados.com)`;
    return sendOutput(res, 200, mdOutput, 'text/markdown; charset=utf-8');
  }

  if (!fs.existsSync(htmlPath)) {
    return sendOutput(res, 404, 'Template não encontrado', 'text/plain; charset=utf-8');
  }

  let html = fs.readFileSync(htmlPath, 'utf8');

  // --- TÍTULO E META DESCRIÇÃO ---
  html = html.replace(/<title>.*?<\/title>/i, `<title>${escAttr(news.title)} | SA Advogados</title>`);
  html = html.replace(/<meta name="description" content=".*?">/i, `<meta name="description" content="${escAttr(news.excerpt)}">`);

  // --- CANONICAL + OG:URL + ALTERNATE MARKDOWN ---
  html = html.replace(/<link rel="canonical"[^>]*>/i, `<link rel="canonical" href="${url}">\n    <link rel="alternate" type="text/markdown" href="${url}">`);
  html = html.replace(/<meta property="og:url" content=".*?">/i, `<meta property="og:url" content="${url}">`);

  // --- OPEN GRAPH / TWITTER ---
  html = html.replace(/<meta property="og:title" content=".*?">/i, `<meta property="og:title" content="${escAttr(news.title)} | SA Advogados">`);
  html = html.replace(/<meta property="og:description" content=".*?">/i, `<meta property="og:description" content="${escAttr(news.excerpt)}">`);
  html = html.replace(/<meta property="og:image" content=".*?">/i, `<meta property="og:image" content="${escAttr(image)}">`);
  html = html.replace(/<meta name="twitter:title" content=".*?">/i, `<meta name="twitter:title" content="${escAttr(news.title)} | SA Advogados">`);
  html = html.replace(/<meta name="twitter:description" content=".*?">/i, `<meta name="twitter:description" content="${escAttr(news.excerpt)}">`);
  html = html.replace(/<meta name="twitter:image" content=".*?">/i, `<meta name="twitter:image" content="${escAttr(image)}">`);

  if (isoDate) {
    html = html.replace(/<meta property="article:published_time" content=".*?">/i, `<meta property="article:published_time" content="${isoDate}T08:00:00-03:00">`);
  }

  // --- JSON-LD com contactPoint e Organization ---
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'NewsArticle',
        '@id': `${url}#news`,
        headline: news.title,
        description: news.excerpt,
        image: image,
        ...(isoDate ? { datePublished: `${isoDate}T08:00:00-03:00`, dateModified: `${isoDate}T08:00:00-03:00` } : {}),
        inLanguage: 'pt-BR',
        mainEntityOfPage: url,
        url: url,
        isPartOf: { '@id': `${SITE}/#website` },
        publisher: { '@id': `${SITE}/#organization` },
        author: {
          '@type': 'Organization',
          name: 'SA Advogados',
          url: `${SITE}/`
        }
      },
      {
        '@type': ['Organization', 'LegalService', 'LocalBusiness'],
        '@id': `${SITE}/#organization`,
        name: 'SA Advogados',
        url: `${SITE}/`,
        logo: `${SITE}/assets/img/LOGOTIPO.png`,
        email: 'comercial@saadvogados.com',
        telephone: '+55-48-99138-1200',
        contactPoint: [
          {
            '@type': 'ContactPoint',
            telephone: '+55-48-99138-1200',
            contactType: 'customer service',
            email: 'comercial@saadvogados.com',
            areaServed: 'BR',
            availableLanguage: ['Portuguese', 'English']
          },
          {
            '@type': 'ContactPoint',
            telephone: '+55-48-99138-1200',
            contactType: 'legal inquiries',
            email: 'comercial@saadvogados.com',
            areaServed: 'BR',
            availableLanguage: ['Portuguese', 'English']
          }
        ],
        address: [
          {
            '@type': 'PostalAddress',
            streetAddress: 'Av. Pref. Osmar Cunha, 416, Sala 1108',
            addressLocality: 'Florianópolis',
            addressRegion: 'SC',
            postalCode: '88015-100',
            addressCountry: 'BR',
            name: 'Matriz — Florianópolis/SC'
          },
          {
            '@type': 'PostalAddress',
            streetAddress: 'Av. Sete de Setembro, 1925',
            addressLocality: 'Porto Velho',
            addressRegion: 'RO',
            postalCode: '76804-123',
            addressCountry: 'BR',
            name: 'Filial — Porto Velho/RO'
          }
        ]
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
  html = html.replace(/<div class="meta-item">\s*<i class="ri-newspaper-line"><\/i>\s*<span>Fonte: .*?<\/span>\s*<\/div>/i, `<div class="meta-item"><i class="ri-newspaper-line"></i><span>Fonte: ${escAttr(source)}</span></div>`);
  html = html.replace(/<div class="meta-item">\s*<i class="ri-calendar-line"><\/i>\s*<span>.*?<\/span>\s*<\/div>/i, `<div class="meta-item"><i class="ri-calendar-line"></i><span>${escAttr(news.date)}</span></div>`);

  const contentHtml = markdownToHtml(news.content || '');
  html = html.replace(/<div class="post-content editorial-content">[\s\S]*?<div class="post-footer">/i, `<div class="post-content editorial-content">${contentHtml}</div>\n<div class="post-footer">`);

  res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=86400');
  return sendOutput(res, 200, html, 'text/html; charset=utf-8');
};
