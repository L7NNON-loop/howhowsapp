#!/usr/bin/env node
const { spawn } = require('child_process');

const action = process.argv[2];

function run(cmd, args = []) {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, { stdio: 'inherit' });
    child.on('close', (code) => (code === 0 ? resolve() : reject(new Error(`${cmd} saiu com código ${code}`))));
  });
}

async function main() {
  if (action !== 'start') {
    console.log('Uso: aviator start');
    process.exit(1);
  }

  console.log('🔄 Atualizando projeto do GitHub...');
  await run('git', ['pull', '--rebase']);

  console.log('📦 Instalando dependências...');
  await run('npm', ['install']);

  console.log('🚀 Iniciando bot...');
  await run('node', ['index.js']);
}

main().catch((err) => {
  console.error('❌ Erro ao executar comando aviator start:', err.message);
  process.exit(1);
});
