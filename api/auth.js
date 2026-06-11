// Tela de login do painel (e-mail + senha).
// Substitui o antigo fluxo de OAuth do GitHub: a dona do site entra apenas
// com e-mail e senha; nenhuma conta ou permissão do GitHub é necessária.
// As credenciais ficam em variáveis de ambiente da Vercel (ADMIN_EMAIL /
// ADMIN_PASSWORD_HASH) e a chave do repositório em GITHUB_TOKEN.

module.exports = function handler(req, res) {
  const hasError = /(?:[?&])error=1\b/.test(req.url || '') ||
    (req.query && req.query.error === '1');

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Robots-Tag', 'noindex, nofollow');
  res.end(`<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="robots" content="noindex, nofollow" />
  <title>Entrar — Painel SA Advogados</title>
  <style>
    * { box-sizing: border-box; }
    body {
      margin: 0; min-height: 100vh; display: flex; align-items: center;
      justify-content: center; background: #0f1b2d;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
      color: #1a2332; padding: 24px;
    }
    .card {
      width: 100%; max-width: 380px; background: #fff; border-radius: 14px;
      padding: 40px 32px; box-shadow: 0 20px 60px rgba(0,0,0,.35);
    }
    .brand { text-align: center; margin-bottom: 28px; }
    .brand h1 {
      font-size: 22px; letter-spacing: 2px; margin: 0; color: #0f1b2d; font-weight: 700;
    }
    .brand span { display: block; font-size: 12px; color: #8a94a6; margin-top: 6px; letter-spacing: 1px; }
    label { display: block; font-size: 13px; font-weight: 600; margin: 16px 0 6px; color: #44506a; }
    input {
      width: 100%; padding: 12px 14px; border: 1px solid #d4dae6; border-radius: 8px;
      font-size: 15px; transition: border-color .15s;
    }
    input:focus { outline: none; border-color: #c9a24b; box-shadow: 0 0 0 3px rgba(201,162,75,.15); }
    button {
      width: 100%; margin-top: 24px; padding: 13px; border: 0; border-radius: 8px;
      background: #c9a24b; color: #0f1b2d; font-size: 15px; font-weight: 700;
      cursor: pointer; transition: background .15s;
    }
    button:hover { background: #b8923f; }
    .error {
      background: #fdecec; color: #b3261e; font-size: 13px; padding: 10px 12px;
      border-radius: 8px; margin-bottom: 4px; text-align: center;
    }
    .foot { text-align: center; font-size: 11px; color: #aeb6c4; margin-top: 22px; }
  </style>
</head>
<body>
  <form class="card" method="POST" action="/api/login" autocomplete="on">
    <div class="brand">
      <h1>SA ADVOGADOS</h1>
      <span>PAINEL DE CONTEÚDO</span>
    </div>
    ${hasError ? '<div class="error">E-mail ou senha incorretos.</div>' : ''}
    <label for="email">E-mail</label>
    <input id="email" name="email" type="email" required autofocus autocomplete="username" />
    <label for="password">Senha</label>
    <input id="password" name="password" type="password" required autocomplete="current-password" />
    <button type="submit">Entrar</button>
    <div class="foot">Acesso restrito</div>
  </form>
</body>
</html>`);
};
