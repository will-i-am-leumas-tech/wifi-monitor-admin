const express = require('express');
const store = require('../sdk/store');
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

module.exports = router;
