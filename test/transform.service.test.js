const test = require('node:test');
const assert = require('node:assert/strict');
const { toInspectRow, toOverviewPayload, toNotificationPayload } = require('../sdk/transform.service');

test('transform helpers shape data for UI', () => {
  const row = toInspectRow({ sourceAddress: '1.1.1.1', destinationAddress: '2.2.2.2', bytes: 4 });
  assert.equal(row.bytes, 4);
  assert.equal(row.host, '2.2.2.2');
  const videoRow = toInspectRow({ domain: 'rr1.googlevideo.com', destinationAddress: '142.250.1.1', service: 'https', bytes: 10 });
  assert.equal(videoRow.hostDisplay, 'YouTube');
  assert.equal(videoRow.hostDetail, 'rr1.googlevideo.com');
  const overview = toOverviewPayload({
    primaryAdapter: 'eth0',
    activeFilters: {},
    trafficHistory: [{ timestamp: 1, rxBytesPerSec: 2, txBytesPerSec: 3 }],
    inspectRows: [{ host: 'a', service: 'https', program: 'Chrome', bytes: 10 }],
    settings: {},
    adapters: []
  });
  assert.equal(overview.adapter, 'eth0');
  assert.equal(overview.topHosts[0].name, 'a');
  const note = toNotificationPayload({ id: '1', timestamp: 1, severity: 'info', title: 'x', message: 'y', bytes: 1 });
  assert.equal(note.id, '1');
});
