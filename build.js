const fs = require('fs');
const path = require('path');

// Ler configurações salvas pelo CMS
const settingsPath = path.join(__dirname, 'content', 'settings.json');
let settings = {};

try {
  const rawData = fs.readFileSync(settingsPath, 'utf8');
  settings = JSON.parse(rawData);
} catch (e) {
  console.log('Sem configurações de SEO dinâmicas ou erro ao ler settings.json. Usando padrão do HTML.');
  process.exit(0);
}

const seo = settings.seo || {};

// Função para atualizar SEO num arquivo HTML
function updateSeo(filePath) {
  try {
    let html = fs.readFileSync(filePath, 'utf8');

    // 1. Title
    if (seo.title) {
      html = html.replace(/<title>.*?<\/title>/i, `<title>${seo.title}</title>`);
      html = html.replace(/<meta property="og:title" content=".*?"/i, `<meta property="og:title" content="${seo.title}"`);
      html = html.replace(/<meta name="twitter:title" content=".*?"/i, `<meta name="twitter:title" content="${seo.title}"`);
    }

    // 2. Description
    if (seo.description) {
      html = html.replace(/<meta name="description" content=".*?"/gi, `<meta name="description" content="${seo.description}">`);
      html = html.replace(/<meta property="og:description" content=".*?"/gi, `<meta property="og:description" content="${seo.description}">`);
      html = html.replace(/<meta name="twitter:description" content=".*?"/gi, `<meta name="twitter:description" content="${seo.description}">`);
    }

    // 3. Keywords
    if (seo.keywords) {
      html = html.replace(/<meta name="keywords" content=".*?"/gi, `<meta name="keywords" content="${seo.keywords}">`);
    }

    // 4. Open Graph Image
    if (seo.og_image) {
      html = html.replace(/<meta property="og:image" content=".*?"/gi, `<meta property="og:image" content="https://www.saadvogados.com${seo.og_image}">`);
      html = html.replace(/<meta name="twitter:image" content=".*?"/gi, `<meta name="twitter:image" content="https://www.saadvogados.com${seo.og_image}">`);
    }

    // 5. Favicon
    if (seo.favicon) {
      // Remover a barra inicial do favicon, se houver, pois Vercel joga assets de upload em /assets/...
      const faviconPath = seo.favicon.startsWith('/') ? seo.favicon.substring(1) : seo.favicon;
      
      html = html.replace(/<link rel="icon" type="image\/png" href=".*?"/gi, `<link rel="icon" type="image/png" href="${faviconPath}"`);
      html = html.replace(/<link rel="apple-touch-icon" href=".*?"/gi, `<link rel="apple-touch-icon" href="${faviconPath}"`);
    }

    fs.writeFileSync(filePath, html, 'utf8');
    console.log(`SEO atualizado com sucesso em: ${path.basename(filePath)}`);
  } catch (e) {
    console.log(`Erro ao processar ${filePath}: ${e.message}`);
  }
}

// Atualizar os HTMLs
const htmlFiles = ['index.html', 'artigos.html', 'artigo-interno.html'];
htmlFiles.forEach(file => {
  const filePath = path.join(__dirname, file);
  if (fs.existsSync(filePath)) {
    updateSeo(filePath);
  }
});
