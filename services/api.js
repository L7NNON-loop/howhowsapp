const axios = require('axios');
const settings = require('../config/settings');

async function fetchCandles() {
  const { data } = await axios.get(settings.apiUrl, { timeout: 15000 });
  if (!data?.ok || !Array.isArray(data.valores)) {
    throw new Error('Resposta inválida da API de velas.');
  }
  return data.valores.map(Number).filter((n) => Number.isFinite(n));
}

module.exports = { fetchCandles };
