const { exec } = require('node:child_process');
const { promisify } = require('node:util');
const os = require('node:os');
const fs = require('node:fs/promises');

const execAsync = promisify(exec);
const DEVICE_CACHE_TTL_MS = 10000;
let cachedDevices = [];
let cachedDevicesAt = 0;
let pendingDevices = null;

function cleanMac(value) {
  const text = String(value || '').trim().toLowerCase().replace(/-/g, ':');
  return /^([0-9a-f]{2}:){5}[0-9a-f]{2}$/.test(text) ? text : '';
}

function cleanIp(value) {
  return String(value || '').trim().replace(/[()]/g, '').replace(/%.*$/, '');
}

function isUsefulIp(ip) {
  const clean = cleanIp(ip);
  return Boolean(clean)
    && clean !== '0.0.0.0'
    && clean !== '::'
    && clean !== 'ff02::1'
    && !clean.startsWith('224.')
    && !clean.startsWith('239.')
    && !clean.toLowerCase().startsWith('ff');
}

function parseIpNeigh(stdout) {
  return String(stdout || '').split(/\r?\n/).map((line) => {
    const parts = line.trim().split(/\s+/).filter(Boolean);
    if (!parts.length) return null;
    const lladdrIndex = parts.indexOf('lladdr');
    const devIndex = parts.indexOf('dev');
    const mac = lladdrIndex >= 0 ? cleanMac(parts[lladdrIndex + 1]) : '';
    const state = parts[parts.length - 1] || '';
    const ip = cleanIp(parts[0]);
    if (!isUsefulIp(ip) || !mac) return null;
    return {
      ip,
      mac,
      interface: devIndex >= 0 ? parts[devIndex + 1] || '' : '',
      state,
      isRouter: parts.includes('router')
    };
  }).filter(Boolean);
}

function parseArpTable(stdout) {
  const rows = [];
  for (const line of String(stdout || '').split(/\r?\n/)) {
    const windows = line.trim().match(/^(\d+\.\d+\.\d+\.\d+)\s+([0-9a-f-]{17})\s+(\w+)/i);
    if (windows) {
      rows.push({
        ip: cleanIp(windows[1]),
        mac: cleanMac(windows[2]),
        interface: '',
        state: windows[3]
      });
      continue;
    }

    const unix = line.match(/\(([^)]+)\)\s+at\s+([0-9a-f:]{17})\s+.*\s+on\s+(\S+)/i);
    if (unix) {
      rows.push({
        ip: cleanIp(unix[1]),
        mac: cleanMac(unix[2]),
        interface: unix[3] || '',
        state: 'reachable'
      });
    }
  }
  return rows.filter((item) => isUsefulIp(item.ip) && item.mac);
}

function parseDefaultGateway(stdout) {
  const line = String(stdout || '').split(/\r?\n/).find((item) => /^default\s+/i.test(item.trim()));
  if (!line) return '';
  const match = line.match(/\bvia\s+(\S+)/);
  return match ? cleanIp(match[1]) : '';
}

async function getDefaultGateway() {
  if (process.platform === 'win32') return '';
  try {
    const { stdout } = await execAsync('ip route show default', { timeout: 350, maxBuffer: 512 * 1024 });
    return parseDefaultGateway(stdout);
  } catch {
    return '';
  }
}

async function getHostMap() {
  const map = new Map();
  try {
    const hosts = await fs.readFile('/etc/hosts', 'utf8');
    for (const line of hosts.split(/\r?\n/)) {
      const clean = line.replace(/#.*/, '').trim();
      if (!clean) continue;
      const [ip, ...names] = clean.split(/\s+/);
      if (ip && names[0]) map.set(cleanIp(ip), names[0]);
    }
  } catch {
    // Hostnames are optional.
  }

  for (const [name, entries] of Object.entries(os.networkInterfaces())) {
    for (const entry of entries || []) {
      if (entry.address) map.set(cleanIp(entry.address), os.hostname() || name);
    }
  }
  return map;
}

async function readNeighborRows() {
  try {
    if (process.platform !== 'win32') {
      const { stdout } = await execAsync('ip neigh show', { timeout: 650, maxBuffer: 2 * 1024 * 1024 });
      const rows = parseIpNeigh(stdout);
      if (rows.length) return rows;
    }
  } catch {
    // Fall back to arp below.
  }

  try {
    const command = process.platform === 'win32' ? 'arp -a' : 'arp -a';
    const { stdout } = await execAsync(command, { timeout: 900, maxBuffer: 2 * 1024 * 1024 });
    return parseArpTable(stdout);
  } catch {
    return [];
  }
}

function inferDeviceType(device, gateway) {
  const name = String(device.hostname || '').toLowerCase();
  const ip = cleanIp(device.ip);
  if (device.isRouter || ip === gateway || /router|gateway|modem|firewall|dns|ap-|access[-\s]?point/.test(name)) return 'Router';
  if (/iphone|android|pixel|galaxy|phone/.test(name)) return 'Phone';
  if (/ipad|tablet|kindle/.test(name)) return 'Tablet';
  if (/macbook|imac|mac-mini|desktop|laptop|windows|thinkpad|surface|pc-|workstation/.test(name)) return 'Computer';
  if (/tv|roku|chromecast|firetv|appletv|xbox|playstation|nintendo/.test(name)) return 'Media';
  if (/printer|hp-|brother|canon|epson/.test(name)) return 'Printer';
  if (/camera|ring|nest|wyze|arlo|thermostat|homepod|echo|alexa|iot|plug|bulb/.test(name)) return 'Smart device';
  return 'Network device';
}

function statusRank(state) {
  const clean = String(state || '').toUpperCase();
  if (clean === 'REACHABLE') return 0;
  if (clean === 'STALE') return 1;
  if (clean === 'DELAY' || clean === 'PROBE') return 2;
  if (clean === 'PERMANENT') return 3;
  return 4;
}

async function collectDevices({ force = false } = {}) {
  if (!force && Date.now() - cachedDevicesAt < DEVICE_CACHE_TTL_MS) return cachedDevices;
  if (pendingDevices) return pendingDevices;

  pendingDevices = (async () => {
    const [rows, hostMap, gateway] = await Promise.all([
      readNeighborRows(),
      getHostMap(),
      getDefaultGateway()
    ]);
    const byKey = new Map();
    for (const row of rows) {
      const key = row.mac || row.ip;
      if (!key) continue;
      const existing = byKey.get(key);
      if (existing && statusRank(existing.state) <= statusRank(row.state)) continue;
      const hostname = hostMap.get(row.ip) || '';
      byKey.set(key, {
        ip: row.ip,
        mac: row.mac,
        hostname,
        interface: row.interface || '',
        state: row.state || 'unknown',
        type: inferDeviceType({ ...row, hostname }, gateway),
        isRouter: Boolean(row.isRouter || row.ip === gateway),
        lastSeen: Date.now()
      });
    }
    cachedDevices = Array.from(byKey.values()).sort((a, b) => {
      if (a.isRouter !== b.isRouter) return a.isRouter ? -1 : 1;
      return a.ip.localeCompare(b.ip, undefined, { numeric: true });
    });
    cachedDevicesAt = Date.now();
    return cachedDevices;
  })().finally(() => {
    pendingDevices = null;
  });

  return pendingDevices;
}

module.exports = {
  collectDevices,
  cleanMac,
  inferDeviceType,
  parseArpTable,
  parseDefaultGateway,
  parseIpNeigh
};
