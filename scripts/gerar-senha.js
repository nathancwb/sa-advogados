#!/usr/bin/env node
// Gera o hash da senha para a variável de ambiente ADMIN_PASSWORD_HASH.
//
// Uso:
//   node scripts/gerar-senha.js "a-senha-escolhida"
//
// Copie a linha gerada e cole no valor de ADMIN_PASSWORD_HASH na Vercel.
// A senha em si NUNCA é salva em lugar nenhum — só o hash.

const crypto = require('crypto');

const senha = process.argv[2];
if (!senha) {
  console.error('Uso: node scripts/gerar-senha.js "a-senha-escolhida"');
  process.exit(1);
}

const salt = crypto.randomBytes(16);
const hash = crypto.scryptSync(senha, salt, 32);
const valor = `${salt.toString('hex')}:${hash.toString('hex')}`;

console.log('\nADMIN_PASSWORD_HASH=' + valor + '\n');
console.log('Cole o valor acima (depois do "=") na variável ADMIN_PASSWORD_HASH na Vercel.');
