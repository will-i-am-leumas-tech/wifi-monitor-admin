const { createNotification } = require('./models');

function createNotificationFromRule(type, payload) {
  const base = {
    threshold: {
      severity: 'warning',
      title: 'Bytes threshold exceeded',
      message: `${payload.bytes} B/s exceeded threshold ${payload.threshold} B/s`
    },
    favorite: {
      severity: 'info',
      title: 'New data exchanged from favorites',
      message: `${payload.host || 'favorite host'} had new traffic`
    },
    blocklist: {
      severity: 'critical',
      title: 'New data exchanged from a blocklisted host',
      message: `${payload.host || 'blocklisted host'} had new traffic`
    },
    spike: {
      severity: 'warning',
      title: 'Traffic spike detected',
      message: `Current traffic burst reached ${payload.bytes} B/s`
    }
  }[type] || { severity: 'info', title: 'Alert', message: 'Event detected' };

  return createNotification({
    severity: base.severity,
    title: base.title,
    message: base.message,
    host: payload.host,
    program: payload.program,
    service: payload.service,
    bytes: payload.bytes,
    meta: payload
  });
}

function evaluateAlerts(context) {
  const alerts = [];
  const threshold = Number(context.settings?.thresholdBytesPerSecond || 0);
  const bytes = Number(context.currentRate || 0);

  if (threshold && bytes > threshold) {
    alerts.push(createNotificationFromRule('threshold', { bytes, threshold }));
  }

  for (const row of context.rows || []) {
    if ((context.settings?.favorites || []).includes(row.host) || (context.settings?.favorites || []).includes(row.domain)) {
      alerts.push(createNotificationFromRule('favorite', row));
    }
    if ((context.settings?.blocklist || []).includes(row.host) || (context.settings?.blocklist || []).includes(row.domain)) {
      alerts.push(createNotificationFromRule('blocklist', row));
    }
  }

  if (context.previousRate && bytes > context.previousRate * 2.5 && bytes > 50000) {
    alerts.push(createNotificationFromRule('spike', { bytes }));
  }

  return alerts.slice(0, 10);
}

module.exports = {
  createNotification: createNotificationFromRule,
  evaluateAlerts
};
