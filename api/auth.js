module.exports = function handler(req, res) {
  const { host } = req.headers;
  const protocol = host.includes('localhost') ? 'http' : 'https';
  const redirectUri = `${protocol}://${host}/api/callback`;

  const clientId = (process.env.GH_CLIENT_ID || '').trim();

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    scope: 'repo,user',
  });

  res.redirect(`https://github.com/login/oauth/authorize?${params}`);
};
