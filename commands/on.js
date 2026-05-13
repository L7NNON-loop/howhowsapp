const { setGroupSignalState, authorizeGroup } = require('../database');

module.exports = async ({ sock, message }) => {
  const groupId = message.key.remoteJid;
  const metadata = await sock.groupMetadata(groupId);

  await authorizeGroup(groupId, metadata.subject || 'Grupo VIP');
  await setGroupSignalState(groupId, true);

  await sock.sendMessage(groupId, {
    text: '✅ Sinais ativados neste grupo e grupo autorizado na whitelist.'
  });
};
