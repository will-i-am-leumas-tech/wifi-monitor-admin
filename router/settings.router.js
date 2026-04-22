const express = require('express');
const store = require('../sdk/store');

const router = express.Router();

router.get('/settings', (req, res) => {
  res.json(store.getState().settings);
});

router.post('/settings', (req, res) => {
  const next = {};
  if (typeof req.body.thresholdBytesPerSecond !== 'undefined') {
    next.thresholdBytesPerSecond = Number(req.body.thresholdBytesPerSecond) || 0;
  }
  if (Array.isArray(req.body.favorites)) next.favorites = req.body.favorites;
  if (Array.isArray(req.body.blocklist)) next.blocklist = req.body.blocklist;
  res.json({ ok: true, settings: store.setSettings(next) });
});

module.exports = router;
