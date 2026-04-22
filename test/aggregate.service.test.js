const test = require('node:test');
const assert = require('node:assert/strict');
const { computeTotals, buildTopHosts, buildTopServices, buildTopPrograms, buildTrafficSeries } = require('../sdk/aggregate.service');

test('aggregate totals and ranking work', () => {
  const history = [
    { rxBytesPerSec: 10, txBytesPerSec: 5, dropped: 1, rxPacketsPerSec: 1, txPacketsPerSec: 2 },
    { rxBytesPerSec: 20, txBytesPerSec: 15, dropped: 0, rxPacketsPerSec: 4, txPacketsPerSec: 5 }
  ];
  const totals = computeTotals(history);
  assert.equal(totals.incoming, 30);
  assert.equal(totals.outgoing, 20);
  assert.equal(totals.dropped, 1);
  assert.equal(totals.packets, 12);

  const rows = [
    { host: 'a', hostDisplay: 'a', hostKey: 'domain:a', service: 'https', program: 'Chrome', bytes: 40 },
    { host: 'b', service: 'https', program: 'Chrome', bytes: 10 },
    { host: 'a', hostDisplay: 'a', hostKey: 'domain:a', service: 'dns', program: 'Slack', bytes: 5 }
  ];
  assert.equal(buildTopHosts(rows)[0].name, 'a');
  assert.equal(buildTopHosts(rows)[0].bytes, 45);
  assert.equal(buildTopServices(rows)[0].name, 'https');
  assert.equal(buildTopPrograms(rows)[0].name, 'Chrome');
  assert.equal(buildTrafficSeries([{ timestamp: 1, rxBytesPerSec: 7, txBytesPerSec: 3 }])[0].incoming, 7);
});
