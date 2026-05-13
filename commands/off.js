const { setGroupSignalState } = require('../database');

module.exports = async ({ sock, message }) => {
  const groupId = message.key.remoteJid;
  await setGroupSignalState(groupId, false);
  await sock.sendMessage(groupId, { text: '⏸️ Sinais pausados neste grupo.' });
};
