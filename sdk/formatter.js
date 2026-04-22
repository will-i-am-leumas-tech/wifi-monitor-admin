function formatUnit(value, base, units) {
  let current = Number(value || 0);
  let idx = 0;
  while (current >= base && idx < units.length - 1) {
    current /= base;
    idx += 1;
  }
  const fixed = current >= 100 || Number.isInteger(current) ? current.toFixed(0) : current.toFixed(1);
  return `${fixed} ${units[idx]}`;
}

function formatBytes(value) {
  return formatUnit(value, 1024, ['B', 'KB', 'MB', 'GB', 'TB']);
}

function formatBits(value) {
  return formatUnit(Number(value || 0) * 8, 1000, ['b', 'Kb', 'Mb', 'Gb', 'Tb']);
}

function formatPackets(value) {
  return `${Number(value || 0).toLocaleString()} pkts`;
}

function formatRelativeTime(ts) {
  const delta = Math.max(0, Date.now() - Number(ts || 0));
  const seconds = Math.floor(delta / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  return `${hours}h ago`;
}

module.exports = {
  formatBytes,
  formatBits,
  formatPackets,
  formatRelativeTime
};
