const test = require('node:test');
const assert = require('node:assert/strict');
const { evaluateAlerts } = require('../sdk/alert.service');

test('alert rules create threshold, favorite, and blocklist alerts', () => {
  const alerts = evaluateAlerts({
    settings: {
      thresholdBytesPerSecond: 100,
      favorites: ['github.com'],
      blocklist: ['8.8.8.8']
    },
    currentRate: 200000,
    previousRate: 40,
    rows: [
      { host: 'github.com', bytes: 50 },
      { host: '8.8.8.8', bytes: 10 }
    ]
  });
  assert.ok(alerts.some((a) => a.title.includes('threshold')));
  assert.ok(alerts.some((a) => a.title.includes('favorites')));
  assert.ok(alerts.some((a) => a.title.includes('blocklisted')));
  assert.ok(alerts.some((a) => a.title.includes('spike')));
});
