const test = require('node:test');
const assert = require('node:assert/strict');
const { isTrafficConnection } = require('../sdk/collector.service');

test('traffic connection filter drops passive listeners', () => {
  assert.equal(isTrafficConnection({
    protocol: 'tcp',
    state: 'LISTEN',
    local: { address: '127.0.0.1', port: 3000 },
    remote: { address: '0.0.0.0', port: 0 }
  }), false);

  assert.equal(isTrafficConnection({
    protocol: 'tcp',
    state: 'ESTAB',
    local: { address: '172.26.1.2', port: 50222 },
    remote: { address: '142.250.190.14', port: 443 }
  }), true);
});
