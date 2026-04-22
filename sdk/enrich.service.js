const dns = require('node:dns').promises;
const { portToService } = require('./service-map');
const { createConnectionRecord } = require('./models');
const { deriveHostLabel } = require('./host-label.service');

const MAX_CACHE_SIZE = 1000;
const dnsCache = new Map();
const geoCache = new Map();
const pendingDNS = new Map();
const pendingGeo = new Map();
let rateLimitedUntil = 0;
const ENABLE_GEO_LOOKUPS = process.env.LEUMAS_WIFI_GEO === '1';

function isPrivateAddress(address) {
  const clean = String(address || '').trim().replace(/^\[|\]$/g, '').replace(/%.*$/, '');
  return /^(0$|0\.0\.0\.0$|\*$|::$|127\.|10\.|192\.168\.|169\.254\.|172\.(1[6-9]|2\d|3[0-1])\.|::1$|fe80:|fc[0-9a-f]{2}:|fd[0-9a-f]{2}:)/i.test(clean);
}

function inferDirection(local, remote) {
  if (isPrivateAddress(local) && isPrivateAddress(remote)) return 'unknown';
  if (isPrivateAddress(local) && !isPrivateAddress(remote)) return 'outgoing';
  if (!isPrivateAddress(local) && isPrivateAddress(remote)) return 'incoming';
  return 'unknown';
}

function manageCache(cache) {
  if (cache.size > MAX_CACHE_SIZE) {
    const firstKey = cache.keys().next().value;
    cache.delete(firstKey);
  }
}

async function resolveDomain(ip) {
  if (!ip || isPrivateAddress(ip)) return ip;
  if (dnsCache.has(ip)) return dnsCache.get(ip);
  if (pendingDNS.has(ip)) return pendingDNS.get(ip);
  
  const promise = (async () => {
    try {
      const hostnames = await dns.reverse(ip);
      const domain = hostnames[0] || ip;
      dnsCache.set(ip, domain);
      manageCache(dnsCache);
      return domain;
    } catch {
      dnsCache.set(ip, ip);
      manageCache(dnsCache);
      return ip;
    } finally {
      pendingDNS.delete(ip);
    }
  })();

  pendingDNS.set(ip, promise);
  return promise;
}

async function resolveCountry(ip) {
  if (!ENABLE_GEO_LOOKUPS) return '';
  if (!ip || isPrivateAddress(ip)) return '';
  if (geoCache.has(ip)) return geoCache.get(ip);
  if (pendingGeo.has(ip)) return pendingGeo.get(ip);
  if (Date.now() < rateLimitedUntil) return '';

  const promise = (async () => {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 2000);
      const res = await fetch(`http://ip-api.com/json/${ip}?fields=status,country,countryCode`, { signal: controller.signal });
      clearTimeout(timeout);
      
      if (res.status === 429) {
        rateLimitedUntil = Date.now() + 60000; // Backoff 1 minute
        return '';
      }

      if (res.ok) {
        const data = await res.json();
        if (data.status === 'success') {
          const country = data.countryCode || '';
          geoCache.set(ip, country);
          manageCache(geoCache);
          return country;
        }
      }
      return '';
    } catch {
      return '';
    } finally {
      pendingGeo.delete(ip);
    }
  })();

  pendingGeo.set(ip, promise);
  return promise;
}

function enrichConnection(connection) {
  const sourceAddress = connection.local?.address || '';
  const destinationAddress = connection.remote?.address || '';
  const sourcePort = connection.local?.port || 0;
  const destinationPort = connection.remote?.port || 0;
  const protocol = connection.protocol || 'tcp';
  const direction = inferDirection(sourceAddress, destinationAddress);
  const portForService = destinationPort || sourcePort;
  const service = portToService(portForService, protocol);
  
  const remoteIp = direction === 'outgoing' ? destinationAddress : sourceAddress;
  
  const cachedDomain = dnsCache.get(remoteIp);
  const cachedCountry = geoCache.get(remoteIp);

  const host = cachedDomain && cachedDomain !== remoteIp
    ? cachedDomain
    : (service && !service.startsWith('port-') ? `${service} (${remoteIp})` : remoteIp);
  const hostLabel = deriveHostLabel({
    sourceAddress,
    destinationAddress,
    direction,
    service,
    host,
    domain: cachedDomain || ''
  });

  return createConnectionRecord({
    protocol,
    sourceAddress,
    sourcePort,
    destinationAddress,
    destinationPort,
    bytes: 0,
    service,
    pid: connection.pid || null,
    state: connection.state || '',
    direction,
    host: hostLabel.host,
    hostDisplay: hostLabel.hostDisplay,
    hostDetail: hostLabel.hostDetail,
    hostKey: hostLabel.hostKey,
    hostType: hostLabel.hostType,
    hostUrl: hostLabel.hostUrl,
    domain: cachedDomain || remoteIp,
    country: cachedCountry || ''
  });
}

async function resolveEnrichments(record) {
  const ip = record.direction === 'outgoing' ? record.destinationAddress : record.sourceAddress;
  if (ip && !isPrivateAddress(ip)) {
    const [domain, country] = await Promise.all([
      resolveDomain(ip),
      resolveCountry(ip)
    ]);
    record.domain = domain;
    record.country = country;
    const hostLabel = deriveHostLabel(record);
    record.host = hostLabel.host;
    record.hostDisplay = hostLabel.hostDisplay;
    record.hostDetail = hostLabel.hostDetail;
    record.hostKey = hostLabel.hostKey;
    record.hostType = hostLabel.hostType;
    record.hostUrl = hostLabel.hostUrl;
  }
  return record;
}

module.exports = {
  isPrivateAddress,
  inferDirection,
  enrichConnection,
  resolveEnrichments
};
