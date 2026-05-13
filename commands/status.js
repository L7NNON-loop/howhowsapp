const { getStats } = require('../database');
const { calcAccuracy } = require('../utils/formatters');

module.exports = async ({ sock, message }) => {
  const stats = await getStats();
  const accuracy = calcAccuracy(Number(stats.greens || 0), Number(stats.total || 0));
  const text = [
    '📊 STATUS NEXUS AI',
    '',
    `✅ Greens: ${stats.greens || 0}`,
    `🛑 Loss: ${stats.loss || 0}`,
    `📡 Total de sinais: ${stats.total || 0}`,
    `🎯 Assertividade: ${accuracy}%`
  ].join('\n');

  await sock.sendMessage(message.key.remoteJid, { text });
};
