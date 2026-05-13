const settings = require('../config/settings');

function analyzeCandles(candles) {
  if (!candles || candles.length < 3) return null;

  const recent = candles.slice(0, Math.min(12, candles.length));
  const low = recent.filter((v) => v < 1.4).length;
  const medium = recent.filter((v) => v >= 1.4 && v < 2).length;
  const high = recent.filter((v) => v >= 2).length;

  const volatility = Math.max(...recent) - Math.min(...recent);
  const trendPower = (high * 2 + medium) - low;

  const baseTarget = 2 + Math.max(0, trendPower * 0.12) + Math.min(1.5, volatility * 0.08);
  const target = clamp(Number(baseTarget.toFixed(2)), settings.minTarget, settings.maxTarget);

  const protectionBase = 1.3 + Math.max(0, (low / recent.length) * 0.4);
  const protection = clamp(Number(protectionBase.toFixed(2)), settings.minProtection, target - 0.05);

  const confidence = clamp(Math.round(65 + trendPower * 3 - low + Math.min(10, volatility * 2)), 70, 97);

  return {
    after: Number(recent[0].toFixed(2)),
    target,
    protection,
    confidence
  };
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

module.exports = { analyzeCandles };
