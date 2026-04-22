function computeTotals(history) {
  const latest = history.length > 0 ? history[history.length - 1] : { rxBytesPerSec: 0, txBytesPerSec: 0, dropped: 0, rxPacketsPerSec: 0, txPacketsPerSec: 0 };
  
  const totals = history.reduce((acc, item) => {
    acc.incoming += Number(item.rxBytesPerSec || 0);
    acc.outgoing += Number(item.txBytesPerSec || 0);
    acc.dropped += Number(item.dropped || 0);
    acc.packets += Number(item.rxPacketsPerSec || 0) + Number(item.txPacketsPerSec || 0);
    return acc;
  }, { incoming: 0, outgoing: 0, dropped: 0, packets: 0 });

  return {
    ...totals,
    currentIncoming: Number(latest.rxBytesPerSec || 0),
    currentOutgoing: Number(latest.txBytesPerSec || 0),
    currentDropped: Number(latest.dropped || 0),
    currentPackets: Number(latest.rxPacketsPerSec || 0) + Number(latest.txPacketsPerSec || 0)
  };
}

function rankBy(rows, key, valueKey = 'bytes', limit = 8) {
  const map = new Map();
  for (const row of rows) {
    const name = row[key] || 'unknown';
    map.set(name, (map.get(name) || 0) + Number(row[valueKey] || 0));
  }
  return Array.from(map.entries())
    .map(([name, bytes]) => ({ name, bytes }))
    .sort((a, b) => b.bytes - a.bytes)
    .slice(0, limit);
}

function buildTopHosts(rows) {
  const map = new Map();
  for (const row of rows) {
    const key = row.hostKey || row.host || row.domain || row.destinationAddress || 'unknown';
    if (!map.has(key)) {
      map.set(key, {
        name: row.hostDisplay || row.host || row.domain || row.destinationAddress || 'unknown',
        detail: row.hostDetail || '',
        url: row.hostUrl || '',
        type: row.hostType || '',
        key,
        bytes: 0
      });
    }
    const item = map.get(key);
    item.bytes += Number(row.bytes || 0);
    if (!item.detail && row.hostDetail) item.detail = row.hostDetail;
    if (!item.url && row.hostUrl) item.url = row.hostUrl;
  }
  return Array.from(map.values())
    .sort((a, b) => b.bytes - a.bytes)
    .slice(0, 8);
}

function buildTopServices(rows) {
  return rankBy(rows, 'service');
}

function buildTopPrograms(rows) {
  return rankBy(rows, 'program');
}

function buildTrafficSeries(history) {
  return history.map((item) => ({
    timestamp: item.timestamp,
    incoming: Number(item.rxBytesPerSec || 0),
    outgoing: Number(item.txBytesPerSec || 0)
  }));
}

function buildTopCountries(rows) {
  return rankBy(rows, 'country');
}

module.exports = {
  computeTotals,
  buildTopHosts,
  buildTopServices,
  buildTopPrograms,
  buildTopCountries,
  buildTrafficSeries
};
