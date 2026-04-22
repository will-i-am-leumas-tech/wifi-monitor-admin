const express = require('express');
const store = require('../sdk/store');
const { applyInspectFilters, sortRows, paginate } = require('../sdk/filter.service');

const router = express.Router();

router.get('/inspect', (req, res) => {
  const filters = {
    host: req.query.host,
    program: req.query.program,
    service: req.query.service,
    protocol: req.query.protocol
  };
  const state = store.getState();
  state.activeFilters = Object.fromEntries(Object.entries(filters).filter(([, value]) => value));
  let rows = applyInspectFilters(state.inspectRows || [], filters);
  rows = sortRows(rows, req.query.sortBy || 'bytes', req.query.order || 'desc');
  res.json(paginate(rows, req.query.page || 1, req.query.pageSize || 25));
});

module.exports = router;
