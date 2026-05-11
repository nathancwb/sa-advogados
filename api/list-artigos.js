const fs = require('fs');
const path = require('path');

module.exports = function handler(req, res) {
  try {
    const dirPath = path.join(process.cwd(), 'content', 'artigos');
    const files = fs.readdirSync(dirPath).filter(f => f.endsWith('.json'));
    
    // Ler todos os JSONs para retornar os dados completos ou apenas os slugs
    const artigos = files.map(f => {
      const slug = f.replace('.json', '');
      const data = JSON.parse(fs.readFileSync(path.join(dirPath, f), 'utf8'));
      return { ...data, slug };
    });

    // Ordenar por data (opcional, pode ser feito no frontend ou aqui)
    // Para simplificar, retorna os dados para o frontend fazer o que precisar
    res.status(200).json(artigos);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao listar artigos' });
  }
}
