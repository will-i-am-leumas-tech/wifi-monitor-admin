const test = require('node:test');
const assert = require('node:assert/strict');
const { parseProcNetworkDev } = require('../sdk/adapter.service');

test('parses /proc/net/dev counters for lightweight traffic fallback', () => {
  const rows = parseProcNetworkDev(`
Inter-|   Receive                                                |  Transmit
 face |bytes    packets errs drop fifo frame compressed multicast|bytes    packets errs drop fifo colls carrier compressed
    lo: 100 1 0 0 0 0 0 0 200 2 0 0 0 0 0 0
  eth0: 12345 12 0 1 0 0 0 0 67890 67 0 2 0 0 0 0
`);

  assert.equal(rows.length, 2);
  assert.equal(rows[1].iface, 'eth0');
  assert.equal(rows[1].rx_bytes, 12345);
  assert.equal(rows[1].tx_bytes, 67890);
  assert.equal(rows[1].rx_dropped, 1);
  assert.equal(rows[1].tx_dropped, 2);
});
