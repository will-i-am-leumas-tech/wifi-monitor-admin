const si = require('systeminformation');
const { createTrafficEvent } = require('./models');
const store = require('./store');
const { listAdapters, getPrimaryAdapter, getProcNetworkStats } = require('./adapter.service');
const { collectConnections } = require('./connection.service');
const { collectDevices } = require('./device.service');
const { enrichConnection, resolveEnrichments } = require('./enrich.service');
const { getProcessMap, resolveProcessName } = require('./process.service');
const { toOverviewPayload, toInspectRow, toNotificationPayload } = require('./transform.service');
const { evaluateAlerts } = require('./alert.service');
const { broadcast } = require('./stream.service');
const { COLLECT_INTERVAL_MS } = require('./constants');

let timer = null;
let prevNetworkStats = {};
let prevRate = 0;

// EMA smoothing state
const ALPHA = 0.25; // Smoothing factor (0 to 1). Lower is smoother, higher is more reactive.
let emaState = {
  rxBytes: 0,
  txBytes: 0,
  rxPackets: 0,
  txPackets: 0
};

function withTimeout(promise, ms, fallback) {
  let timer;
  return Promise.race([
    promise,
    new Promise((resolve) => {
      timer = setTimeout(() => resolve(fallback), ms);
    })
  ]).finally(() => clearTimeout(timer));
}

function isUnspecifiedAddress(address) {
  const clean = String(address || '').trim().replace(/^\[|\]$/g, '').replace(/%.*$/, '');
  return !clean || clean === '*' || clean === '0' || clean === '0.0.0.0' || clean === '::' || clean === '::0';
}

function isTrafficConnection(connection) {
  if (!connection) return false;
  const state = String(connection.state || '').toUpperCase();
  if (state === 'LISTEN') return false;
  return !isUnspecifiedAddress(connection.remote?.address);
}

async function readAdapterStat(adapter) {
  try {
    const statsList = await si.networkStats(adapter && adapter !== 'unknown' ? adapter : undefined);
    const stat = Array.isArray(statsList) ? statsList[0] : null;
    if (stat) return stat;
  } catch {
    // Fall through to /proc fallback below.
  }
  return getProcNetworkStats(adapter);
}

async function collectAdapterStats(adapter) {
  const stat = await readAdapterStat(adapter);
  if (!stat) return createTrafficEvent({ adapter });

  const previous = prevNetworkStats[adapter] || {
    rx_bytes: stat.rx_bytes,
    tx_bytes: stat.tx_bytes,
    rx_packets: stat.rx_packets,
    tx_packets: stat.tx_packets,
    ms: Date.now()
  };

  const now = Date.now();
  const elapsedSeconds = Math.max(0.1, (now - previous.ms) / 1000);
  
  const rawRxBytes = Math.max(0, (stat.rx_bytes - previous.rx_bytes) / elapsedSeconds);
  const rawTxBytes = Math.max(0, (stat.tx_bytes - previous.tx_bytes) / elapsedSeconds);
  const rawRxPackets = Math.max(0, (stat.rx_packets - previous.rx_packets) / elapsedSeconds);
  const rawTxPackets = Math.max(0, (stat.tx_packets - previous.tx_packets) / elapsedSeconds);

  // Apply EMA smoothing
  emaState.rxBytes = (rawRxBytes * ALPHA) + (emaState.rxBytes * (1 - ALPHA));
  emaState.txBytes = (rawTxBytes * ALPHA) + (emaState.txBytes * (1 - ALPHA));
  emaState.rxPackets = (rawRxPackets * ALPHA) + (emaState.rxPackets * (1 - ALPHA));
  emaState.txPackets = (rawTxPackets * ALPHA) + (emaState.txPackets * (1 - ALPHA));

  const point = createTrafficEvent({
    timestamp: now,
    adapter,
    rxBytesPerSec: Math.round(emaState.rxBytes),
    txBytesPerSec: Math.round(emaState.txBytes),
    rxPacketsPerSec: Math.round(emaState.rxPackets),
    txPacketsPerSec: Math.round(emaState.txPackets),
    dropped: Number(stat.rx_dropped || 0) + Number(stat.tx_dropped || 0)
  });

  prevNetworkStats[adapter] = {
    rx_bytes: stat.rx_bytes,
    tx_bytes: stat.tx_bytes,
    rx_packets: stat.rx_packets,
    tx_packets: stat.tx_packets,
    ms: now
  };

  const knownKeys = new Set([adapter]);
  Object.keys(prevNetworkStats).forEach((key) => {
    if (!knownKeys.has(key) && Object.keys(prevNetworkStats).length > 8) delete prevNetworkStats[key];
  });

  return point;
}

async function collectTick() {
  const adapters = await listAdapters().catch(() => []);
  store.setAdapters(adapters);
  const preferredAdapter = adapters.find((item) => item.default)
    || adapters.find((item) => item.operstate === 'up')
    || adapters[0];
  const adapter = preferredAdapter?.iface || await getPrimaryAdapter().catch(() => 'unknown');
  store.setPrimaryAdapter(adapter);

  const event = await collectAdapterStats(adapter).catch(() => createTrafficEvent({ adapter }));
  store.addTrafficPoint(event);

  const [rawConnections, processMap, devices] = await Promise.all([
    withTimeout(collectConnections(), 750, []),
    withTimeout(getProcessMap(), 500, new Map()),
    withTimeout(collectDevices(), 900, store.getState().devices || [])
  ]);
  store.setDevices(devices);
  const trafficConnections = rawConnections.filter(isTrafficConnection);
  const rows = [];
  const totalConnectionRate = Number(event.rxBytesPerSec || 0) + Number(event.txBytesPerSec || 0);
  const bytesPerConnection = totalConnectionRate > 0
    ? Math.max(1, Math.round(totalConnectionRate / Math.max(trafficConnections.length || 1, 1)))
    : 0;
  
  // Create records and trigger background enrichment
  for (const connection of trafficConnections) {
    const enriched = enrichConnection(connection);
    enriched.program = resolveProcessName(connection.pid, processMap);
    enriched.bytes = bytesPerConnection;
    const row = toInspectRow(enriched);
    rows.push(row);

    // Trigger enrichment in background (non-blocking) with proper error handling
    resolveEnrichments(enriched).then((resolved) => {
      // Once resolved, update the row in place
      row.host = resolved.host || row.host;
      row.hostDisplay = resolved.hostDisplay || row.hostDisplay;
      row.hostDetail = resolved.hostDetail || row.hostDetail;
      row.hostKey = resolved.hostKey || row.hostKey;
      row.hostType = resolved.hostType || row.hostType;
      row.hostUrl = resolved.hostUrl || row.hostUrl;
      row.country = resolved.country || row.country;
    }).catch((err) => {
      // Log enrichment failures but don't crash the collector
      console.error('Enrichment failed:', err.message);
    });
  }
  
  store.setInspectRows(rows);

  const alerts = evaluateAlerts({
    settings: store.getState().settings,
    currentRate: event.rxBytesPerSec + event.txBytesPerSec,
    previousRate: prevRate,
    rows
  });
  prevRate = event.rxBytesPerSec + event.txBytesPerSec;

  for (const alert of alerts) {
    store.addNotification(alert);
    broadcast('notification:new', toNotificationPayload(alert));
  }

  try {
    broadcast('overview:update', toOverviewPayload(store.getState()));
    broadcast('inspect:update', rows.slice(0, 50));
  } catch (err) {
    console.error('Broadcast failed:', err.message);
  }
}

function startCollector(intervalMs = COLLECT_INTERVAL_MS) {
  if (timer) return timer;
  collectTick().catch(() => {});
  timer = setInterval(() => {
    collectTick().catch((error) => {
      store.addNotification({
        id: `${Date.now()}-collector-error`,
        timestamp: Date.now(),
        severity: 'warning',
        title: 'Collector warning',
        message: error.message || 'Collector tick failed',
        bytes: 0,
        host: '',
        service: '',
        program: ''
      });
    });
  }, intervalMs);
  return timer;
}

function stopCollector() {
  if (timer) clearInterval(timer);
  timer = null;
}

module.exports = {
  startCollector,
  stopCollector,
  collectTick,
  isTrafficConnection
};
