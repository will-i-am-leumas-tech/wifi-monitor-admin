const si = require('systeminformation');
const fs = require('node:fs/promises');

const ADAPTER_CACHE_TTL_MS = 5000;
let adapterCache = null;
let adapterCacheAt = 0;

function parseProcNetworkDev(text) {
  return String(text || '')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.includes(':'))
    .map((line) => {
      const [ifacePart, valuesPart] = line.split(':');
      const values = String(valuesPart || '').trim().split(/\s+/).map(Number);
      return {
        iface: String(ifacePart || '').trim(),
        rx_bytes: Number(values[0] || 0),
        rx_packets: Number(values[1] || 0),
        rx_dropped: Number(values[3] || 0),
        tx_bytes: Number(values[8] || 0),
        tx_packets: Number(values[9] || 0),
        tx_dropped: Number(values[11] || 0)
      };
    })
    .filter((item) => item.iface);
}

async function readProcNetworkDev() {
  try {
    return parseProcNetworkDev(await fs.readFile('/proc/net/dev', 'utf8'));
  } catch {
    return [];
  }
}

function isLoopback(iface) {
  return iface === 'lo' || iface.startsWith('Loopback');
}

function inferAdapterType(iface) {
  if (/^(wl|wifi|wlan)/i.test(iface)) return 'wireless';
  if (/^(en|eth)/i.test(iface)) return 'wired';
  return 'unknown';
}

async function listAdapters() {
  if (adapterCache && Date.now() - adapterCacheAt < ADAPTER_CACHE_TTL_MS) return adapterCache;
  let adapters = [];
  try {
    const interfaces = await si.networkInterfaces();
    adapters = interfaces
      .filter((item) => !item.internal)
      .map((item) => ({
        iface: item.iface,
        ip4: item.ip4,
        mac: item.mac,
        type: item.type,
        operstate: item.operstate,
        default: Boolean(item.default)
      }));
  } catch {
    const rows = await readProcNetworkDev();
    adapters = rows
      .filter((item) => !isLoopback(item.iface))
      .map((item, index) => ({
        iface: item.iface,
        ip4: '',
        mac: '',
        type: inferAdapterType(item.iface),
        operstate: 'up',
        default: index === 0
      }));
  }
  adapterCache = adapters;
  adapterCacheAt = Date.now();
  return adapters;
}

async function getPrimaryAdapter() {
  const adapters = await listAdapters();
  const preferred = adapters.find((item) => item.default) || adapters.find((item) => item.operstate === 'up') || adapters[0];
  return preferred ? preferred.iface : 'unknown';
}

async function getProcNetworkStats(adapter) {
  const rows = await readProcNetworkDev();
  const candidates = rows.filter((item) => !isLoopback(item.iface));
  if (!candidates.length) return null;
  const selected = candidates.find((item) => item.iface === adapter)
    || candidates.sort((a, b) => ((b.rx_bytes + b.tx_bytes) - (a.rx_bytes + a.tx_bytes)))[0];
  return selected || null;
}

function clearAdapterCache() {
  adapterCache = null;
  adapterCacheAt = 0;
}

module.exports = {
  listAdapters,
  getPrimaryAdapter,
  getProcNetworkStats,
  parseProcNetworkDev,
  clearAdapterCache
};
