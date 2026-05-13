const axios = require('axios');
const settings = require('../config/settings');

async function fetchCandles() {
  const { data } = await axios.get(settings.apiUrl, { timeout: 15000 });
  const source = Array.isArray(data?.valores)
    ? data.valores
    : Array.isArray(data)
      ? data
      : Array.isArray(data?.data)
        ? data.data
        : Array.isArray(data?.candles)
          ? data.candles
          : null;

  if (!source) {
    throw new Error('Resposta inválida da API de velas.');
  }

  const normalized = source
    .map((item) => {
      if (typeof item === 'number' || typeof item === 'string') return Number(item);
      if (Array.isArray(item)) return Number(item[0]);
      if (item && typeof item === 'object') {
        return Number(item.valor ?? item.value ?? item.candle ?? item.multiplier ?? item.x);
      }
      return Number.NaN;
    })
    .filter((n) => Number.isFinite(n) && n > 0);

  if (normalized.length === 0) {
    throw new Error('API retornou velas, mas sem valores numéricos válidos.');
  }

  return normalized;
}

module.exports = { fetchCandles };
