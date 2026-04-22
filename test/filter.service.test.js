const test = require('node:test');
const assert = require('node:assert/strict');
const { applyInspectFilters, sortRows, paginate } = require('../sdk/filter.service');

test('filters, sorting, and pagination work', () => {
  const rows = [
    { host: 'github.com', hostDisplay: 'GitHub', hostDetail: 'github.com', program: 'Chrome', service: 'https', protocol: 'tcp', bytes: 10 },
    { host: '8.8.8.8', program: 'System', service: 'domain', protocol: 'udp', bytes: 20 }
  ];
  assert.equal(applyInspectFilters(rows, { host: 'git' }).length, 1);
  assert.equal(applyInspectFilters(rows, { host: 'github.com' }).length, 1);
  assert.equal(applyInspectFilters(rows, { protocol: 'udp' }).length, 1);
  assert.equal(sortRows(rows, 'bytes', 'desc')[0].bytes, 20);
  assert.equal(paginate(rows, 1, 1).rows.length, 1);
});
