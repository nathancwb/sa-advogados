const fs = require('fs');
const path = require('path');

module.exports = function handler(req, res) {
  try {
    const dirPath = path.join(process.cwd(), 'content', 'videos');
    if (!fs.existsSync(dirPath)) {
      return res.status(200).json([]);
    }
    const files = fs.readdirSync(dirPath).filter(f => f.endsWith('.json'));
    
    const videos = files.map(f => {
      const slug = f.replace('.json', '');
      const data = JSON.parse(fs.readFileSync(path.join(dirPath, f), 'utf8'));
      return { ...data, slug };
    });

    res.status(200).json(videos);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao listar vídeos' });
  }
}
