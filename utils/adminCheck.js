async function isGroupAdmin(sock, message) {
  const remoteJid = message.key.remoteJid;
  if (!remoteJid?.endsWith('@g.us')) return false;

  const sender = message.key.participant || message.participant;
  const metadata = await sock.groupMetadata(remoteJid);
  const participant = metadata.participants.find((p) => p.id === sender);

  return participant?.admin === 'admin' || participant?.admin === 'superadmin';
}

module.exports = { isGroupAdmin };
