module.exports = async function handler(req, res) {
  const { code } = req.query;

  if (!code) {
    res.status(400).send('Missing code parameter');
    return;
  }

  const { host } = req.headers;
  const protocol = host.includes('localhost') ? 'http' : 'https';
  const redirectUri = `${protocol}://${host}/api/callback`;

  try {
    const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        client_id: (process.env.GH_CLIENT_ID || '').trim(),
        client_secret: (process.env.GH_CLIENT_SECRET || '').trim(),
        code,
        redirect_uri: redirectUri,
      }),
    });

    const data = await tokenRes.json();

    if (data.error) {
      res.status(400).send(`GitHub OAuth error: ${data.error_description || data.error}`);
      return;
    }

    const token = data.access_token;

    res.setHeader('Content-Type', 'text/html');
    res.send(`<!DOCTYPE html>
<html>
<head><title>Autorizando...</title></head>
<body>
<script>
(function() {
  function receiveMessage(e) {
    window.opener.postMessage(
      'authorization:github:success:' + JSON.stringify({token: ${JSON.stringify(token)}, provider: 'github'}),
      e.origin
    );
  }
  window.addEventListener('message', receiveMessage, false);
  window.opener.postMessage('authorizing:github', '*');
})();
</script>
<p style="font-family:sans-serif;text-align:center;padding:40px;">Autorizando, pode fechar essa janela...</p>
</body>
</html>`);
  } catch (err) {
    console.error(err);
    res.status(500).send('Internal server error durante autenticação');
  }
};
