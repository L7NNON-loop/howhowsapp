const settings = require('../config/settings');

function analyzeCandles(candles) {
  if (!Array.isArray(candles) || candles.length === 0) return null;

  const recent = candles.slice(0, Math.min(30, candles.length));
  const latest = Number(recent[0]) || settings.minTarget;

  const low = recent.filter((v) => v < 1.4).length;
  const mid = recent.filter((v) => v >= 1.4 && v < 2.5).length;
  const high = recent.filter((v) => v >= 2.5).length;

  const avg = recent.reduce((acc, v) => acc + v, 0) / recent.length;
  const variance = recent.reduce((acc, v) => acc + (v - avg) ** 2, 0) / recent.length;
  const volatility = Math.sqrt(variance);

  const streakLow = countStreak(recent, (v) => v < 1.4);
  const streakHigh = countStreak(recent, (v) => v >= 2.5);

  const lowRate = low / recent.length;
  const highRate = high / recent.length;

  // Score de mercado: positivo = ambiente mais favorável, negativo = defensivo.
  const marketScore =
    (highRate * 40) +
    ((mid / recent.length) * 20) -
    (lowRate * 42) -
    (streakLow * 2.2) +
    (streakHigh * 1.8) -
    (volatility * 3.5);

  const conservativeBias = latest < 1.3 ? 0.2 : 0;

  const targetRaw =
    2.0 +
    clamp((marketScore / 100) * 2.6, -0.25, 2.8) +
    clamp((avg - 1.8) * 0.22, -0.2, 0.9) -
    conservativeBias;

  const target = clamp(round2(targetRaw), settings.minTarget, settings.maxTarget);

  const protectionRaw =
    1.3 +
    clamp(lowRate * 0.6, 0.05, 0.45) +
    clamp(streakLow * 0.03, 0, 0.18) -
    clamp(highRate * 0.18, 0, 0.15);

  const protection = clamp(round2(protectionRaw), settings.minProtection, target - 0.05);

  const confidenceRaw =
    78 +
    clamp(marketScore * 0.22, -18, 15) +
    clamp((highRate - lowRate) * 20, -10, 8) -
    clamp(volatility * 4, 0, 9);

  const confidence = clamp(Math.round(confidenceRaw), 85, 96);

  return {
    after: round2(latest),
    target,
    protection,
    confidence,
    sampleSize: recent.length
  };
}

function countStreak(values, predicate) {
  let streak = 0;
  for (const v of values) {
    if (!predicate(v)) break;
    streak += 1;
  }
  return streak;
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function round2(value) {
  return Number(value.toFixed(2));
}

module.exports = { analyzeCandles };
