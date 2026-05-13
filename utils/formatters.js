function nowTime() {
  return new Date().toLocaleTimeString('pt-BR', { hour12: false, timeZone: 'Africa/Maputo' });
}

function confidenceBar(confidence) {
  const filled = Math.max(1, Math.min(5, Math.round(confidence / 20)));
  return `${'🟩'.repeat(filled)}${'⬜'.repeat(5 - filled)}`;
}

function calcAccuracy(greens, total) {
  if (!total) return 0;
  return Math.round((greens / total) * 100);
}

module.exports = { nowTime, confidenceBar, calcAccuracy };
