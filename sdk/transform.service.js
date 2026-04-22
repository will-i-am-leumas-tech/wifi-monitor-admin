const { computeTotals, buildTopHosts, buildTopPrograms, buildTopServices, buildTopCountries, buildTrafficSeries } = require('./aggregate.service');
const { deriveHostLabel } = require('./host-label.service');

function toInspectRow(raw) {
  const hostLabel = deriveHostLabel(raw);
  return {
    timestamp: raw.timestamp || Date.now(),
    sourceAddress: raw.sourceAddress || '',
    sourcePort: Number(raw.sourcePort || 0),
    destinationAddress: raw.destinationAddress || '',
    destinationPort: Number(raw.destinationPort || 0),
    protocol: raw.protocol || 'tcp',
    service: raw.service || 'unknown',
    bytes: Number(raw.bytes || 0),
    program: raw.program || 'Unknown',
    host: hostLabel.host,
    hostDisplay: hostLabel.hostDisplay,
    hostDetail: hostLabel.hostDetail,
    hostKey: hostLabel.hostKey,
    hostType: hostLabel.hostType,
    hostUrl: hostLabel.hostUrl,
    hostRaw: raw.host || raw.domain || raw.destinationAddress || raw.sourceAddress || '',
    state: raw.state || '',
    direction: raw.direction || 'unknown',
    country: raw.country || '',
    domain: raw.domain || ''
  };
}

function toOverviewPayload(store) {
  const history = store.trafficHistory || [];
  const rows = store.inspectRows || [];
  const totals = computeTotals(history);
  return {
    adapter: store.primaryAdapter,
    activeFilters: store.activeFilters || {},
    totals,
    graphSeries: buildTrafficSeries(history),
    topHosts: buildTopHosts(rows),
    topServices: buildTopServices(rows),
    topPrograms: buildTopPrograms(rows),
    topCountries: buildTopCountries(rows),
    devices: store.devices || [],
    settings: store.settings,
    adapters: store.adapters || []
  };
}

function toNotificationPayload(item) {
  return {
    id: item.id,
    timestamp: item.timestamp,
    severity: item.severity,
    title: item.title,
    message: item.message,
    host: item.host,
    service: item.service,
    program: item.program,
    bytes: item.bytes
  };
}

module.exports = {
  toInspectRow,
  toOverviewPayload,
  toNotificationPayload
};
