module.exports = async ({ sock, message }) => {
  const groupId = message.key.remoteJid;
  await sock.sendMessage(groupId, { text: `🆔 ID do grupo: ${groupId}` });
};
