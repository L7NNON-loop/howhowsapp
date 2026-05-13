const { getAuthorizedGroups, isGroupSignalActive } = require('../database');

module.exports = async ({ sock, message, signalService }) => {
  const groupId = message.key.remoteJid;
  const groups = await getAuthorizedGroups();
  const authorized = groups.some((g) => g.id === groupId);
  const active = await isGroupSignalActive(groupId);

  const text = [
    '🛠 DEBUG NEXUS AI',
    '',
    `📌 Grupo: ${groupId}`,
    `✅ Autorizado na whitelist: ${authorized ? 'SIM' : 'NÃO'}`,
    `🚦 Sinais ativos no grupo: ${active ? 'SIM' : 'NÃO'}`,
    `📡 Monitor rodando: ${signalService?.running ? 'SIM' : 'NÃO'}`,
    `🕯 Última vela lida: ${signalService?.lastCandle ?? 'N/A'}`,
    `⏳ Sinal pendente: ${signalService?.pendingSignal ? 'SIM' : 'NÃO'}`
  ].join('\n');

  await sock.sendMessage(groupId, { text });
};
