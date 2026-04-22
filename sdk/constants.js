module.exports = {
  PORT: 29183,
  COLLECT_INTERVAL_MS: 1000,
  GRAPH_HISTORY_LENGTH: 60,
  MAX_INSPECT_ROWS: 400,
  MAX_NOTIFICATIONS: 100,
  DEFAULT_PAGE_SIZE: 25,
  DEFAULT_THRESHOLD_BYTES_PER_SEC: 150000,
  DEFAULT_SETTINGS: {
    thresholdBytesPerSecond: 150000,
    favorites: ["github.com", "zoom.us"],
    blocklist: ["8.8.8.8"]
  },
  KNOWN_SERVICES: {
    tcp: {
      20: 'ftp-data',
      21: 'ftp',
      22: 'ssh',
      25: 'smtp',
      53: 'domain',
      80: 'http',
      110: 'pop3',
      123: 'ntp',
      143: 'imap',
      443: 'https',
      465: 'smtps',
      587: 'submission',
      993: 'imaps',
      995: 'pop3s',
      3306: 'mysql',
      3389: 'rdp',
      5432: 'postgres',
      6379: 'redis',
      8080: 'http-alt'
    },
    udp: {
      53: 'domain',
      67: 'dhcp',
      68: 'dhcp',
      123: 'ntp',
      137: 'netbios',
      138: 'netbios',
      1900: 'ssdp',
      5353: 'mdns'
    }
  }
};
