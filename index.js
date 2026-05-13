const pino = require('pino');
const qrcode = require('qrcode-terminal');
const {
  default: makeWASocket,
  DisconnectReason,
  useMultiFileAuthState,
  fetchLatestBaileysVersion
} = require('@whiskeysockets/baileys');

const settings = require('./config/settings');
const { ensureBaseStructure } = require('./database');
const { isGroupAdmin } = require('./utils/adminCheck');
const { SignalService } = require('./services/signals');

const commandOn = require('./commands/on');
const commandOff = require('./commands/off');
const commandId = require('./commands/id');
const commandStatus = require('./commands/status');
const commandDebug = require('./commands/debug');

const logger = pino({
  transport: {
    target: 'pino-pretty',
    options: { colorize: true, translateTime: true }
  }
});

let hasConnectedBefore = false;
let reconnectTimer = null;

const commands = {
  on: commandOn,
  ativar: commandOn,
  comecar: commandOn,
  off: commandOff,
  parar: commandOff,
  stop: commandOff,
  pausar: commandOff,
  id: commandId,
  status: commandStatus,
  debug: commandDebug
};

async function startBot() {
  await ensureBaseStructure();

  const { state, saveCreds } = await useMultiFileAuthState('auth');
  const { version } = await fetchLatestBaileysVersion();

  const sock = makeWASocket({
    version,
    auth: state,
    printQRInTerminal: false,
    logger: pino({ level: 'silent' })
  });

  const signalService = new SignalService(sock, logger);

  if (reconnectTimer) clearTimeout(reconnectTimer);
  reconnectTimer = setTimeout(() => {
    if (hasConnectedBefore) {
      logger.warn('⌛ 30s sem conectar. Reiniciando sessão para novo QR/pairing code...');
      try {
        sock.end(new Error('Connection timeout, forcing new QR'));
      } catch {
        // noop
      }
    }
  }, 30000);

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('connection.update', async ({ connection, lastDisconnect, qr }) => {
    if (qr) {
      logger.info('Escaneie o QR abaixo para conectar:');
      qrcode.generate(qr, { small: true });

      try {
        const phone = settings.authorizedNumber.replace(/\D/g, '');
        const code = await sock.requestPairingCode(phone);
        logger.info({ code }, `Pairing code para +${phone}:`);
      } catch (err) {
        logger.warn('Pairing code indisponível neste momento.');
      }
    }

    if (connection === 'open') {
      hasConnectedBefore = true;
      if (reconnectTimer) clearTimeout(reconnectTimer);
      logger.info('✅ Bot conectado com sucesso.');
      signalService.start();
    }

    if (connection === 'close') {
      signalService.stop();
      const code = lastDisconnect?.error?.output?.statusCode;
      const shouldReconnect = code !== DisconnectReason.loggedOut;
      logger.warn('Conexão fechada. Tentando reconectar...');

      if (shouldReconnect) {
        setTimeout(() => startBot().catch((err) => logger.error({ err: err.message }, 'Erro ao reconectar')), 1500);
      }
    }
  });

  sock.ev.on('messages.upsert', async ({ messages }) => {
    const message = messages[0];
    if (!message?.message || message.key.fromMe) return;

    const remoteJid = message.key.remoteJid;
    const body = message.message.conversation || message.message.extendedTextMessage?.text || '';
    if (!body.startsWith(settings.commandPrefix)) return;

    const cmd = body.slice(settings.commandPrefix.length).trim().toLowerCase();
    const handler = commands[cmd];
    if (!handler) return;

    if (!remoteJid.endsWith('@g.us')) return;
    if (cmd !== 'id') {
      const admin = await isGroupAdmin(sock, message);
      if (!admin) {
        await sock.sendMessage(remoteJid, { text: '⛔ Apenas administradores podem usar este comando.' });
        return;
      }
    }

    try {
      await handler({ sock, message, signalService });
    } catch (err) {
      logger.error({ err: err.message }, `Erro ao executar comando ${cmd}`);
    }
  });
}

startBot().catch((err) => {
  logger.error({ err: err.message }, 'Falha fatal ao iniciar bot');
});
