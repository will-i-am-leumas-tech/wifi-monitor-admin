function safeJsonParse(text, fallback = null) {
  try {
    return JSON.parse(text);
  } catch {
    return fallback;
  }
}

function stableSort(rows, compare) {
  return rows
    .map((value, index) => ({ value, index }))
    .sort((a, b) => compare(a.value, b.value) || a.index - b.index)
    .map((item) => item.value);
}

function pruneArray(rows, max) {
  return rows.slice(0, Math.max(0, max));
}

function nowIso() {
  return new Date().toISOString();
}

module.exports = {
  safeJsonParse,
  stableSort,
  pruneArray,
  nowIso
};
