const { ref, get, set, update, child, push } = require('firebase/database');
const { db } = require('../config/firebase');

const rootRef = ref(db);

async function ensureBaseStructure() {
  const groupsRef = child(rootRef, 'grupos');
  const statusRef = child(rootRef, 'botStatus');
  const statsRef = child(rootRef, 'estatisticas/global');

  const [groupsSnap, statusSnap, statsSnap] = await Promise.all([
    get(groupsRef),
    get(statusRef),
    get(statsRef)
  ]);

  if (!groupsSnap.exists()) {
    await set(groupsRef, {
      slot1: { id: '120363425136994613@g.us', ativo: true, nome: 'Sala VIP Principal' },
      slot2: { id: '120000000000002@g.us', ativo: false, nome: 'SLOT 2' },
      slot3: { id: '120000000000003@g.us', ativo: false, nome: 'SLOT 3' },
      slot4: { id: '120000000000004@g.us', ativo: false, nome: 'SLOT 4' },
      slot5: { id: '120000000000005@g.us', ativo: false, nome: 'SLOT 5' }
    });
  }

  if (!statusSnap.exists()) {
    await set(statusRef, { running: true, updatedAt: Date.now() });
  }

  if (!statsSnap.exists()) {
    await set(statsRef, { greens: 0, loss: 0, total: 0, updatedAt: Date.now() });
  }
}

async function getAuthorizedGroups() {
  const snap = await get(child(rootRef, 'grupos'));
  if (!snap.exists()) return [];
  return Object.values(snap.val()).filter((g) => g?.id && g?.ativo);
}

async function authorizeGroup(groupId, groupName = 'Grupo') {
  const groupsRef = child(rootRef, 'grupos');
  const snap = await get(groupsRef);
  const groups = snap.exists() ? snap.val() : {};

  const existingKey = Object.keys(groups).find((k) => groups[k]?.id === groupId);
  if (existingKey) {
    await update(child(rootRef, `grupos/${existingKey}`), { ativo: true, nome: groupName });
    return;
  }

  const freeSlot = ['slot1', 'slot2', 'slot3', 'slot4', 'slot5'].find((slot) => !groups[slot] || !groups[slot]?.id || groups[slot]?.ativo === false);
  if (freeSlot) {
    await update(groupsRef, { [freeSlot]: { id: groupId, ativo: true, nome: groupName } });
    return;
  }

  const customKey = `grupo_${Date.now()}`;
  await update(groupsRef, { [customKey]: { id: groupId, ativo: true, nome: groupName } });
}

async function setGroupSignalState(groupId, active) {
  await update(child(rootRef, `statusGrupos/${sanitizeKey(groupId)}`), { active, updatedAt: Date.now() });
}

async function isGroupSignalActive(groupId) {
  const snap = await get(child(rootRef, `statusGrupos/${sanitizeKey(groupId)}/active`));
  return snap.exists() ? Boolean(snap.val()) : false;
}

async function saveSignalHistory(payload) {
  const historyRef = child(rootRef, 'historico');
  await push(historyRef, { ...payload, createdAt: Date.now() });
}

async function incrementStat(field) {
  const statsPath = child(rootRef, 'estatisticas/global');
  const snap = await get(statsPath);
  const data = snap.exists() ? snap.val() : { greens: 0, loss: 0, total: 0 };
  data[field] = Number(data[field] || 0) + 1;
  if (field === 'greens' || field === 'loss') data.total = Number(data.total || 0) + 1;
  data.updatedAt = Date.now();
  await set(statsPath, data);
}

async function getStats() {
  const snap = await get(child(rootRef, 'estatisticas/global'));
  return snap.exists() ? snap.val() : { greens: 0, loss: 0, total: 0 };
}

function sanitizeKey(value) {
  return String(value).replace(/[.#$\[\]/]/g, '_');
}

module.exports = {
  ensureBaseStructure,
  getAuthorizedGroups,
  authorizeGroup,
  setGroupSignalState,
  isGroupSignalActive,
  saveSignalHistory,
  incrementStat,
  getStats
};
