require('dotenv').config();

module.exports = {
  botName: 'NEXUS AI',
  platformName: 'Placard',
  authorizedNumber: '258867983175',
  commandPrefix: '.',
  checkIntervalMs: Number(process.env.CHECK_INTERVAL_MS || 8000),
  messageDelayMs: Number(process.env.MESSAGE_DELAY_MS || 1500),
  minTarget: 2.0,
  maxTarget: 10.0,
  minProtection: 1.3,
  confidenceThreshold: Number(process.env.CONFIDENCE_THRESHOLD || 60),
  apiUrl: process.env.CANDLES_API_URL || 'https://app.sscashout.online/api/velas'
};
