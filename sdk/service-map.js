const { KNOWN_SERVICES } = require('./constants');

function portToService(port, protocol = 'tcp', overrides = {}) {
  const proto = String(protocol || 'tcp').toLowerCase();
  const cleanPort = Number(port || 0);
  if (overrides[cleanPort]) return overrides[cleanPort];
  const table = KNOWN_SERVICES[proto] || {};
  return table[cleanPort] || (cleanPort ? `port-${cleanPort}` : 'unknown');
}

module.exports = { portToService };
