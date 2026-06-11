// Valida e-mail + senha e, em caso de sucesso, entrega ao Sveltia CMS a chave
// do repositório (GITHUB_TOKEN) usando o mesmo handshake de postMessage que o
// fluxo de OAuth usava. A dona do site nunca lida com o GitHub.
//
// Variáveis de ambiente necessárias na Vercel:
//   ADMIN_EMAIL          e-mail de login da dona do site
//   ADMIN_PASSWORD_HASH  hash da senha no formato "saltHex:hashHex"
//                        (gere com: node scripts/gerar-senha.js "aSenha")
//   GITHUB_TOKEN         fine-grained PAT do repositório (Contents: read/write)

const crypto = require('crypto');

function readBody(req) {
  return new Promise((resolve) => {
    let data = '';
    req.on('data', (chunk) => {
      data += chunk;
      if (data.length > 100000) { req.destroy(); resolve(''); }
    });
    req.on('end', () => resolve(data));
    req.on('error', () => resolve(''));
  });
}

function parseForm(str) {
  const out = {};
  for (const pair of String(str).split('&')) {
    if (!pair) continue;
    const idx = pair.indexOf('=');
    const k = idx === -1 ? pair : pair.slice(0, idx);
    const v = idx === -1 ? '' : pair.slice(idx + 1);
    try {
      out[decodeURIComponent(k)] = decodeURIComponent(v.replace(/\+/g, ' '));
    } catch (e) { /* ignora pares malformados */ }
  }
  return out;
}

function verifyPassword(password, stored) {
  if (!stored || stored.indexOf(':') === -1) return false;
  const [saltHex, hashHex] = stored.split(':');
  let salt, expected, derived;
  try {
    salt = Buffer.from(saltHex, 'hex');
    expected = Buffer.from(hashHex, 'hex');
    if (expected.length === 0) return false;
    derived = crypto.scryptSync(String(password), salt, expected.length);
  } catch (e) {
    return false;
  }
  return derived.length === expected.length && crypto.timingSafeEqual(derived, expected);
}

function fail(res) {
  res.statusCode = 302;
  res.setHeader('Location', '/api/auth?error=1');
  res.end();
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.statusCode = 302;
    res.setHeader('Location', '/api/auth');
    return res.end();
  }

  const token = (process.env.GITHUB_TOKEN || '').trim();
  const adminEmail = (process.env.ADMIN_EMAIL || '').trim().toLowerCase();
  const passHash = (process.env.ADMIN_PASSWORD_HASH || '').trim();

  if (!token || !adminEmail || !passHash) {
    res.statusCode = 500;
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.end(
      '<p style="font-family:sans-serif;max-width:520px;margin:60px auto;line-height:1.6">' +
      'Login ainda não configurado. Defina <code>ADMIN_EMAIL</code>, ' +
      '<code>ADMIN_PASSWORD_HASH</code> e <code>GITHUB_TOKEN</code> nas variáveis ' +
      'de ambiente da Vercel e faça um novo deploy.</p>'
    );
  }

  const body = parseForm(await readBody(req));
  const email = String(body.email || '').trim().toLowerCase();
  const password = String(body.password || '');

  const emailOk = email.length > 0 && email === adminEmail;
  const passOk = verifyPassword(password, passHash);

  if (!emailOk || !passOk) {
    return fail(res);
  }

  // Sucesso: handshake do Sveltia/Decap CMS (mesmo protocolo do OAuth).
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Robots-Tag', 'noindex, nofollow');
  res.end(`<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="utf-8" /><title>Entrando…</title></head>
<body>
<script>
(function () {
  function receiveMessage(e) {
    window.opener.postMessage(
      'authorization:github:success:' + ${JSON.stringify(JSON.stringify({ token, provider: 'github' }))},
      e.origin
    );
    window.removeEventListener('message', receiveMessage, false);
  }
  window.addEventListener('message', receiveMessage, false);
  window.opener.postMessage('authorizing:github', '*');
})();
</script>
<p style="font-family:sans-serif;text-align:center;padding:40px">Entrando…</p>
</body>
</html>`);
};
