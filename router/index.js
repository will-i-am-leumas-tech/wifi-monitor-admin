const express = require('express');
const overviewRouter = require('./overview.router');
const inspectRouter = require('./inspect.router');
const notificationsRouter = require('./notifications.router');
const settingsRouter = require('./settings.router');
const { attachStream } = require('../sdk/stream.service');

const router = express.Router();

router.get('/health', (req, res) => {
  res.json({ ok: true, service: 'wifi-traffic-monitor' });
});

router.get('/stream', attachStream);
router.use(overviewRouter);
router.use(inspectRouter);
router.use(notificationsRouter);
router.use(settingsRouter);

module.exports = router;
