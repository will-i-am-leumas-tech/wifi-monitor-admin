const test = require('node:test');
const assert = require('node:assert/strict');
const { portToService } = require('../sdk/service-map');
const { parseLinuxSs } = require('../sdk/connection.service');

test('service mapping resolves common ports', () => {
  assert.equal(portToService(443, 'tcp'), 'https');
  assert.equal(portToService(53, 'udp'), 'domain');
  assert.equal(portToService(9999, 'tcp'), 'port-9999');
});

test('linux ss parser handles UDP state column', () => {
  const rows = parseLinuxSs('udp UNCONN 0 0 127.0.0.54:53 0.0.0.0:* users:(("systemd-resolve",pid=123,fd=12))');
  assert.equal(rows.length, 1);
  assert.equal(rows[0].local.address, '127.0.0.54');
  assert.equal(rows[0].local.port, 53);
  assert.equal(rows[0].remote.address, '0.0.0.0');
  assert.equal(rows[0].remote.port, 0);
  assert.equal(rows[0].state, 'UNCONN');
  assert.equal(rows[0].pid, 123);
});
