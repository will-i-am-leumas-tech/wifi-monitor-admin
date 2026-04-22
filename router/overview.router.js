const express = require('express');
const store = require('../sdk/store');
const { collectDevices } = require('../sdk/device.service');
const { toOverviewPayload } = require('../sdk/transform.service');

const router = express.Router();

router.get('/overview', (req, res) => {
  res.json(toOverviewPayload(store.getState()));
});

router.get('/overview/history', (req, res) => {
  res.json({ history: store.getState().trafficHistory || [] });
});

router.get('/adapters', (req, res) => {
  const state = store.getState();
  res.json({ primaryAdapter: state.primaryAdapter, adapters: state.adapters || [] });
});

router.get('/devices', async (req, res) => {
  const devices = await collectDevices({ force: req.query.refresh === '1' }).catch(() => store.getState().devices || []);
  store.setDevices(devices);
  res.json({ devices });
});

module.exports = router;
