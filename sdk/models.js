function createTrafficEvent(partial = {}) {
  return {
    timestamp: partial.timestamp || Date.now(),
    adapter: partial.adapter || 'unknown',
    rxBytesPerSec: Number(partial.rxBytesPerSec || 0),
    txBytesPerSec: Number(partial.txBytesPerSec || 0),
    rxPacketsPerSec: Number(partial.rxPacketsPerSec || 0),
    txPacketsPerSec: Number(partial.txPacketsPerSec || 0),
    dropped: Number(partial.dropped || 0)
  };
}

function createConnectionRecord(partial = {}) {
  return {
    timestamp: partial.timestamp || Date.now(),
    protocol: partial.protocol || 'tcp',
    sourceAddress: partial.sourceAddress || '',
    sourcePort: Number(partial.sourcePort || 0),
    destinationAddress: partial.destinationAddress || '',
    destinationPort: Number(partial.destinationPort || 0),
    bytes: Number(partial.bytes || 0),
    service: partial.service || 'unknown',
    program: partial.program || 'Unknown',
    pid: partial.pid || null,
    state: partial.state || '',
    direction: partial.direction || 'unknown',
    host: partial.host || partial.destinationAddress || partial.sourceAddress || '',
    hostDisplay: partial.hostDisplay || partial.host || partial.destinationAddress || partial.sourceAddress || '',
    hostDetail: partial.hostDetail || '',
    hostKey: partial.hostKey || partial.host || partial.destinationAddress || partial.sourceAddress || '',
    hostType: partial.hostType || '',
    hostUrl: partial.hostUrl || '',
    country: partial.country || '',
    domain: partial.domain || ''
  };
}

function createNotification(partial = {}) {
  return {
    id: partial.id || `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    timestamp: partial.timestamp || Date.now(),
    severity: partial.severity || 'info',
    title: partial.title || 'Notification',
    message: partial.message || '',
    host: partial.host || '',
    program: partial.program || '',
    service: partial.service || '',
    bytes: Number(partial.bytes || 0),
    meta: partial.meta || {}
  };
}

module.exports = {
  createTrafficEvent,
  createConnectionRecord,
  createNotification
};
