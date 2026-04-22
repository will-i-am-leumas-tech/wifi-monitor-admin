const express = require('express');
const store = require('../sdk/store');
const { toNotificationPayload } = require('../sdk/transform.service');

const router = express.Router();

router.get('/notifications', (req, res) => {
  res.json({ items: (store.getState().notifications || []).map(toNotificationPayload) });
});

router.post('/notifications/read-all', (req, res) => {
  store.getState().notifications = [];
  res.json({ ok: true });
});

module.exports = router;
