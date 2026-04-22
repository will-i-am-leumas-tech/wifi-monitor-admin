const test = require('node:test');
const assert = require('node:assert/strict');
const { formatBytes, formatBits, formatPackets, formatRelativeTime } = require('../sdk/formatter');

test('formatters handle values', () => {
  assert.equal(formatBytes(1024), '1 KB');
  assert.equal(formatBits(125), '1 Kb');
  assert.equal(formatPackets(10), '10 pkts');
  assert.match(formatRelativeTime(Date.now() - 2000), /s ago/);
});
