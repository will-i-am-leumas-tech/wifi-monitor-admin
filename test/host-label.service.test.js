const test = require('node:test');
const assert = require('node:assert/strict');
const { deriveHostLabel, normalizeHost } = require('../sdk/host-label.service');

test('host label detects YouTube video CDN domains', () => {
  const label = deriveHostLabel({
    domain: 'rr2---sn-ab5l6n6e.googlevideo.com',
    destinationAddress: '142.250.190.14',
    direction: 'outgoing',
    service: 'https'
  });

  assert.equal(label.hostDisplay, 'YouTube');
  assert.equal(label.hostDetail, 'rr2---sn-ab5l6n6e.googlevideo.com');
  assert.equal(label.hostKey, 'service:youtube');
  assert.equal(label.hostUrl, 'https://www.youtube.com');
});

test('host label detects Netflix CDN domains', () => {
  const label = deriveHostLabel({
    domain: 'ipv4_1.lagg0.c047.dfw001.ix.nflxvideo.net',
    destinationAddress: '198.45.48.22',
    direction: 'outgoing',
    service: 'https'
  });

  assert.equal(label.hostDisplay, 'Netflix');
  assert.equal(label.hostKey, 'service:netflix');
});

test('host label falls back to service name for unresolved IPs', () => {
  const label = deriveHostLabel({
    host: 'https (203.0.113.10)',
    destinationAddress: '203.0.113.10',
    direction: 'outgoing',
    service: 'https'
  });

  assert.equal(label.hostDisplay, 'HTTPS service');
  assert.equal(label.hostDetail, '203.0.113.10');
  assert.equal(label.hostKey, 'ip:203.0.113.10');
});

test('host label does not treat existing display labels as domains', () => {
  const label = deriveHostLabel({
    host: 'HTTPS service',
    domain: '203.0.113.10',
    destinationAddress: '203.0.113.10',
    direction: 'outgoing',
    service: 'https'
  });

  assert.equal(label.hostDisplay, 'HTTPS service');
  assert.equal(label.hostDetail, '203.0.113.10');
  assert.equal(label.hostKey, 'ip:203.0.113.10');
  assert.equal(label.hostUrl, '');
});

test('host label ignores wildcard remote addresses', () => {
  const label = deriveHostLabel({
    sourceAddress: '127.0.0.53%lo',
    destinationAddress: '0',
    direction: 'outgoing',
    service: 'domain'
  });

  assert.equal(label.hostDisplay, 'DNS service');
  assert.equal(label.hostDetail, '127.0.0.53');
  assert.equal(label.hostKey, 'ip:127.0.0.53');
});

test('normalizeHost accepts URLs and hostnames', () => {
  assert.equal(normalizeHost('https://www.youtube.com/watch?v=abc'), 'www.youtube.com');
  assert.equal(normalizeHost('Example.COM.'), 'example.com');
  assert.equal(normalizeHost('::1'), '::1');
});
