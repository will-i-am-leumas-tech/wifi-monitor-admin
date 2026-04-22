const KNOWN_HOST_SERVICES = [
  {
    id: 'youtube',
    name: 'YouTube',
    url: 'https://www.youtube.com',
    domains: [
      'youtube.com',
      'youtu.be',
      'youtube-nocookie.com',
      'youtube.googleapis.com',
      'youtubei.googleapis.com',
      'googlevideo.com',
      'ytimg.com',
      'ggpht.com'
    ]
  },
  {
    id: 'netflix',
    name: 'Netflix',
    url: 'https://www.netflix.com',
    domains: [
      'netflix.com',
      'nflxvideo.net',
      'nflximg.net',
      'nflxso.net',
      'nflxext.com',
      'nflxsearch.net'
    ]
  },
  {
    id: 'disney-plus',
    name: 'Disney+',
    url: 'https://www.disneyplus.com',
    domains: ['disneyplus.com', 'disney-plus.net', 'dssott.com', 'bamgrid.com']
  },
  {
    id: 'hulu',
    name: 'Hulu',
    url: 'https://www.hulu.com',
    domains: ['hulu.com', 'huluim.com']
  },
  {
    id: 'prime-video',
    name: 'Prime Video',
    url: 'https://www.primevideo.com',
    domains: ['primevideo.com', 'pv-cdn.net', 'aiv-cdn.net']
  },
  {
    id: 'twitch',
    name: 'Twitch',
    url: 'https://www.twitch.tv',
    domains: ['twitch.tv', 'ttvnw.net', 'jtvnw.net']
  },
  {
    id: 'spotify',
    name: 'Spotify',
    url: 'https://open.spotify.com',
    domains: ['spotify.com', 'spotifycdn.com', 'scdn.co']
  },
  {
    id: 'facebook',
    name: 'Facebook',
    url: 'https://www.facebook.com',
    domains: ['facebook.com', 'fbcdn.net', 'fbsbx.com']
  },
  {
    id: 'instagram',
    name: 'Instagram',
    url: 'https://www.instagram.com',
    domains: ['instagram.com', 'cdninstagram.com']
  },
  {
    id: 'tiktok',
    name: 'TikTok',
    url: 'https://www.tiktok.com',
    domains: ['tiktok.com', 'tiktokcdn.com', 'tiktokv.com', 'byteoversea.com']
  },
  {
    id: 'google',
    name: 'Google',
    url: 'https://www.google.com',
    domains: ['google.com', 'googleapis.com', 'gstatic.com', '1e100.net']
  },
  {
    id: 'cloudflare',
    name: 'Cloudflare',
    url: 'https://www.cloudflare.com',
    domains: ['cloudflare.com', 'cloudflare-dns.com']
  }
];

const SERVICE_LABELS = {
  domain: 'DNS',
  ftp: 'FTP',
  'ftp-data': 'FTP data',
  http: 'HTTP',
  'http-alt': 'HTTP',
  https: 'HTTPS',
  imap: 'IMAP',
  imaps: 'IMAPS',
  mdns: 'mDNS',
  mysql: 'MySQL',
  netbios: 'NetBIOS',
  ntp: 'NTP',
  pop3: 'POP3',
  pop3s: 'POP3S',
  postgres: 'Postgres',
  rdp: 'Remote Desktop',
  redis: 'Redis',
  smtp: 'SMTP',
  smtps: 'SMTPS',
  ssh: 'SSH',
  ssdp: 'SSDP',
  submission: 'Mail submission'
};

function isIpAddress(value) {
  const clean = String(value || '').trim().replace(/^\[|\]$/g, '').replace(/%.*$/, '');
  if (/^(?:\d{1,3}\.){3}\d{1,3}$/.test(clean)) {
    return clean.split('.').every((part) => Number(part) >= 0 && Number(part) <= 255);
  }
  return clean.includes(':') && /^[0-9a-f:.]+$/i.test(clean);
}

function isUnspecifiedAddress(value) {
  const clean = String(value || '').trim().replace(/^\[|\]$/g, '').replace(/%.*$/, '');
  return !clean || clean === '*' || clean === '0' || clean === '0.0.0.0' || clean === '::' || clean === '::0';
}

function isDomainHost(value) {
  const clean = String(value || '').trim().toLowerCase();
  return /^[a-z0-9_](?:[a-z0-9_-]{0,61}[a-z0-9_])?(?:\.[a-z0-9_](?:[a-z0-9_-]{0,61}[a-z0-9_])?)+$/.test(clean);
}

function extractWrappedHost(value) {
  const match = String(value || '').trim().match(/^([a-z][a-z0-9+.-]*)\s+\(([^)]+)\)$/i);
  if (!match) return null;
  return {
    service: match[1].toLowerCase(),
    host: match[2]
  };
}

function normalizeHost(value) {
  const wrapped = extractWrappedHost(value);
  const raw = wrapped ? wrapped.host : value;
  const text = String(raw || '').trim();
  if (!text) return '';

  try {
    const parsed = new URL(text);
    return parsed.hostname.toLowerCase().replace(/\.$/, '');
  } catch {
    const withoutWrappers = text
      .replace(/^\[|\]$/g, '')
      .replace(/%.*$/, '')
      .replace(/\/.*$/, '')
      .toLowerCase()
      .replace(/\.$/, '');
    return withoutWrappers.indexOf(':') === withoutWrappers.lastIndexOf(':')
      ? withoutWrappers.replace(/:\d+$/, '')
      : withoutWrappers;
  }
}

function getRemoteAddress(raw = {}) {
  if (raw.remoteAddress && !isUnspecifiedAddress(raw.remoteAddress)) return raw.remoteAddress;
  const preferred = raw.direction === 'incoming' ? raw.sourceAddress : raw.destinationAddress;
  const alternate = raw.direction === 'incoming' ? raw.destinationAddress : raw.sourceAddress;
  if (!isUnspecifiedAddress(preferred)) return preferred || '';
  if (!isUnspecifiedAddress(alternate)) return alternate || '';
  return preferred || alternate || raw.remoteAddress || '';
}

function serviceLabel(service) {
  const clean = String(service || '').toLowerCase();
  if (!clean || clean === 'unknown') return '';
  if (SERVICE_LABELS[clean]) return SERVICE_LABELS[clean];
  if (clean.startsWith('port-')) return `Port ${clean.slice(5)}`;
  return clean.toUpperCase();
}

function serviceProtocol(service) {
  const clean = String(service || '').toLowerCase();
  if (clean === 'https' || clean === 'http') return clean;
  return '';
}

function matchesDomain(host, domain) {
  return host === domain || host.endsWith(`.${domain}`);
}

function findKnownService(candidates) {
  for (const candidate of candidates) {
    if (!candidate || isIpAddress(candidate) || !isDomainHost(candidate)) continue;
    for (const service of KNOWN_HOST_SERVICES) {
      if (service.domains.some((domain) => matchesDomain(candidate, domain))) {
        return { ...service, matchedHost: candidate };
      }
    }
  }
  return null;
}

function fallbackUrl(host, service) {
  if (!host || isIpAddress(host) || !isDomainHost(host)) return '';
  const protocol = serviceProtocol(service) || 'https';
  return `${protocol}://${host}`;
}

function deriveHostLabel(raw = {}) {
  const remoteAddress = normalizeHost(getRemoteAddress(raw));
  const wrapped = extractWrappedHost(raw.host);
  const host = normalizeHost(raw.host);
  const domain = normalizeHost(raw.domain);
  const detail = normalizeHost(raw.hostDetail);
  const candidates = [domain, detail, host].filter(Boolean);
  const knownService = findKnownService(candidates);

  if (knownService) {
    return {
      host: knownService.name,
      hostDisplay: knownService.name,
      hostDetail: knownService.matchedHost,
      hostKey: `service:${knownService.id}`,
      hostType: 'service',
      hostUrl: knownService.url
    };
  }

  const bestDomain = candidates.find((candidate) => candidate && !isIpAddress(candidate) && isDomainHost(candidate));
  if (bestDomain) {
    return {
      host: bestDomain,
      hostDisplay: bestDomain,
      hostDetail: remoteAddress && remoteAddress !== bestDomain ? remoteAddress : '',
      hostKey: `domain:${bestDomain}`,
      hostType: 'domain',
      hostUrl: fallbackUrl(bestDomain, raw.service)
    };
  }

  const bestAddress = [remoteAddress, host, domain].find((candidate) => candidate && !isUnspecifiedAddress(candidate)) || '';
  const label = serviceLabel(wrapped?.service || raw.service);
  if (label && bestAddress) {
    return {
      host: `${label} service`,
      hostDisplay: `${label} service`,
      hostDetail: bestAddress,
      hostKey: `ip:${bestAddress}`,
      hostType: 'service-port',
      hostUrl: ''
    };
  }

  return {
    host: bestAddress || 'Unknown',
    hostDisplay: bestAddress || 'Unknown',
    hostDetail: '',
    hostKey: bestAddress ? `ip:${bestAddress}` : 'unknown',
    hostType: bestAddress && isIpAddress(bestAddress) ? 'ip' : 'unknown',
    hostUrl: ''
  };
}

module.exports = {
  deriveHostLabel,
  isIpAddress,
  isUnspecifiedAddress,
  normalizeHost,
  isDomainHost,
  serviceLabel
};
