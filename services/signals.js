const settings = require('../config/settings');
const fs = require('fs');
const path = require('path');
const delay = require('../utils/delay');
const { nowTime, confidenceBar } = require('../utils/formatters');
const { fetchCandles } = require('./api');
const { analyzeCandles } = require('./algorithm');
const { getAuthorizedGroups, isGroupSignalActive, saveSignalHistory, incrementStat } = require('../database');

class SignalService {
  constructor(sock, logger) {
    this.sock = sock;
    this.logger = logger;
    this.lastCandle = null;
    this.pendingSignal = null;
    this.running = false;
  }

  start() {
    if (this.running) return;
    this.running = true;
    this.loop();
  }

  stop() {
    this.running = false;
  }

  async loop() {
    while (this.running) {
      try {
        const candles = await fetchCandles();
        const newest = candles[0];

        if (this.lastCandle === null) {
          this.lastCandle = newest;
          await this.generateAndSendSignal(candles);
          continue;
        }

        if (newest !== this.lastCandle) {
          await this.resolvePreviousSignal(newest);
          await this.generateAndSendSignal(candles);
        }

        this.lastCandle = newest;
      } catch (err) {
        this.logger.error({ err: err.message }, 'Erro no monitor de sinais');
      }
      await delay(settings.checkIntervalMs);
    }
  }

  async generateAndSendSignal(candles) {
    const signal = analyzeCandles(candles);
    if (!signal) return;

    this.pendingSignal = { ...signal, createdAt: Date.now() };
    await saveSignalHistory({ type: 'signal', ...signal });

    const groups = await getAuthorizedGroups();
    for (const group of groups) {
      if (!(await isGroupSignalActive(group.id))) continue;
      const msg = this.buildSignalMessage(signal);
      await this.sock.sendMessage(group.id, { text: msg });
      await delay(settings.messageDelayMs);
    }
  }

  async resolvePreviousSignal(currentCandle) {
    if (!this.pendingSignal) return;

    if (currentCandle >= this.pendingSignal.target) {
      await incrementStat('greens');
      const groups = await getAuthorizedGroups();
      for (const group of groups) {
        if (!(await isGroupSignalActive(group.id))) continue;
        const msg = [
          '✅ GREEN CONFIRMADO! Excelente entrada.',
          '',
          `🎯 Multiplicador final: ${currentCandle.toFixed(2)}x`,
          `🎯 Alvo previsto: ${this.pendingSignal.target.toFixed(2)}x`,
          `🛡 Proteção usada: ${this.pendingSignal.protection.toFixed(2)}x`
        ].join('\n');
        const greenImagePath = path.resolve(__dirname, '..', 'green.png');
        if (fs.existsSync(greenImagePath)) {
          await this.sock.sendMessage(group.id, {
            image: fs.readFileSync(greenImagePath),
            caption: msg
          });
        } else {
          await this.sock.sendMessage(group.id, { text: msg });
        }
        await delay(settings.messageDelayMs);
      }
      await saveSignalHistory({ type: 'green', currentCandle, signal: this.pendingSignal });
    } else if (currentCandle <= this.pendingSignal.protection) {
      await incrementStat('loss');
      await saveSignalHistory({ type: 'loss', currentCandle, signal: this.pendingSignal });
    }

    this.pendingSignal = null;
  }


  async triggerImmediateSignalForGroup(groupId) {
    const candles = await fetchCandles();
    const signal = analyzeCandles(candles);
    if (!signal) return { sent: false, reason: 'Não foi possível analisar as velas recebidas da API.' };

    this.pendingSignal = { ...signal, createdAt: Date.now() };
    await saveSignalHistory({ type: 'signal_manual', ...signal, groupId });

    if (!(await isGroupSignalActive(groupId))) return { sent: false, reason: 'Grupo não está ativo para sinais.' };

    await this.sock.sendMessage(groupId, { text: this.buildSignalMessage(signal) });
    return { sent: true, signal };
  }

  buildSignalMessage(signal) {
    return [
      '🎰 NEXUS AI 🎰',
      '━━━━━━━━━━━━━━',
      '✅ ENTRADA CONFIRMADA ✅',
      '',
      '🚀 Aviator',
      '',
      `📊 Após: ${signal.after.toFixed(2)}x`,
      `🎯 Sacar em: ${signal.target.toFixed(2)}x`,
      `🛡 Proteção: ${signal.protection.toFixed(2)}x`,
      `📊 Confiança: ${signal.confidence}%`,
      confidenceBar(signal.confidence),
      '',
      `🕐 Enviado às: ${nowTime()}`,
      `💫 Plataforma: ${settings.platformName}`
    ].join('\n');
  }
}

module.exports = { SignalService };
