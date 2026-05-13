const { setGroupSignalState } = require('../database');

module.exports = async ({ sock, message }) => {
  const groupId = message.key.remoteJid;
  await setGroupSignalState(groupId, true);
  await sock.sendMessage(groupId, { text: '✅ Sinais ativados neste grupo.' });
};
