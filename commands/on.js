const { setGroupSignalState, authorizeGroup } = require('../database');

module.exports = async ({ sock, message, signalService }) => {
  const groupId = message.key.remoteJid;
  const metadata = await sock.groupMetadata(groupId);

  await authorizeGroup(groupId, metadata.subject || 'Grupo VIP');
  await setGroupSignalState(groupId, true);

  await sock.sendMessage(groupId, {
    text: '✅ Sinais ativados neste grupo e grupo autorizado na whitelist.\n⏳ Vou tentar enviar uma entrada imediata...'
  });

  try {
    const immediate = await signalService.triggerImmediateSignalForGroup(groupId);
    if (!immediate.sent) {
      await sock.sendMessage(groupId, { text: `⚠️ Ainda não consegui gerar entrada agora: ${immediate.reason}` });
    }
  } catch (err) {
    await sock.sendMessage(groupId, { text: '⚠️ Ativado com sucesso, mas falhou o envio imediato. Vou continuar monitorando novas velas.' });
  }
};
