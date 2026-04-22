const { GRAPH_HISTORY_LENGTH, MAX_INSPECT_ROWS, MAX_NOTIFICATIONS, DEFAULT_SETTINGS } = require('./constants');

const state = {
  adapters: [],
  primaryAdapter: 'unknown',
  latestOverviewEvent: null,
  trafficHistory: [],
  inspectRows: [],
  devices: [],
  notifications: [],
  settings: { ...DEFAULT_SETTINGS },
  activeFilters: {}
};

function prune(list, max) {
  while (list.length > max) list.shift();
}

function setAdapters(adapters) {
  state.adapters = Array.isArray(adapters) ? adapters : [];
}

function setPrimaryAdapter(name) {
  state.primaryAdapter = name || 'unknown';
}

function addTrafficPoint(point) {
  state.latestOverviewEvent = point;
  state.trafficHistory.push(point);
  prune(state.trafficHistory, GRAPH_HISTORY_LENGTH);
}

function setInspectRows(rows) {
  state.inspectRows = Array.isArray(rows) ? rows.slice(0, MAX_INSPECT_ROWS) : [];
}

function setDevices(devices) {
  state.devices = Array.isArray(devices) ? devices : [];
}

function addNotification(item) {
  state.notifications.unshift(item);
  if (state.notifications.length > MAX_NOTIFICATIONS) {
    state.notifications.length = MAX_NOTIFICATIONS;
  }
}

function setSettings(next) {
  state.settings = { ...state.settings, ...next };
  return state.settings;
}

function getState() {
  return state;
}

module.exports = {
  setAdapters,
  setPrimaryAdapter,
  addTrafficPoint,
  setInspectRows,
  setDevices,
  addNotification,
  setSettings,
  getState
};
