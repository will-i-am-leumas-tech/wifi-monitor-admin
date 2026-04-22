const test = require('node:test');
const assert = require('node:assert/strict');
const {
  inferDeviceType,
  parseArpTable,
  parseDefaultGateway,
  parseIpNeigh
} = require('../sdk/device.service');

test('parses linux ip neighbor rows into connected devices', () => {
  const rows = parseIpNeigh(`
192.168.1.1 dev wlan0 lladdr aa:bb:cc:dd:ee:ff router REACHABLE
192.168.1.42 dev wlan0 lladdr 10:20:30:40:50:60 STALE
192.168.1.99 dev wlan0 FAILED
`);

  assert.equal(rows.length, 2);
  assert.equal(rows[0].ip, '192.168.1.1');
  assert.equal(rows[0].interface, 'wlan0');
  assert.equal(rows[0].isRouter, true);
  assert.equal(rows[1].mac, '10:20:30:40:50:60');
});

test('parses arp table output variants', () => {
  const rows = parseArpTable(`
  192.168.1.25          08-00-27-aa-bb-cc     dynamic
? (192.168.1.40) at 00:11:22:33:44:55 [ether] on eth0
`);

  assert.equal(rows.length, 2);
  assert.equal(rows[0].mac, '08:00:27:aa:bb:cc');
  assert.equal(rows[1].ip, '192.168.1.40');
  assert.equal(rows[1].interface, 'eth0');
});

test('infers device type from gateway and hostnames', () => {
  assert.equal(parseDefaultGateway('default via 192.168.1.1 dev wlan0'), '192.168.1.1');
  assert.equal(inferDeviceType({ ip: '192.168.1.1', hostname: '' }, '192.168.1.1'), 'Router');
  assert.equal(inferDeviceType({ ip: '192.168.1.20', hostname: 'sam-iphone' }, '192.168.1.1'), 'Phone');
  assert.equal(inferDeviceType({ ip: '192.168.1.30', hostname: 'living-room-roku' }, '192.168.1.1'), 'Media');
});
