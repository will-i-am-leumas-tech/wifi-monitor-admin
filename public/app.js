(function () {
  let renderPending = false;

  async function loadAll() {
    const [overview, inspect, notifications] = await Promise.all([
      window.Api.getOverview(),
      window.Api.getInspect(),
      window.Api.getNotifications()
    ]);
    window.AppState.overview = overview;
    window.AppState.inspect = inspect;
    window.AppState.notifications = notifications.items || [];
    requestRender();
  }

  function requestRender() {
    if (renderPending) return;
    renderPending = true;
    requestAnimationFrame(() => {
      render();
      renderPending = false;
    });
  }

  function render() {
    if (window.AppState.overview) window.RenderOverview(window.AppState.overview);
    if (window.AppState.inspect) window.RenderInspect(window.AppState.inspect);
    window.RenderNotifications(window.AppState.notifications || []);
  }

  function setTab(tab) {
    window.AppState.currentTab = tab;
    document.querySelectorAll('.tab').forEach((btn) => btn.classList.toggle('is-active', btn.dataset.tab === tab));
    document.querySelectorAll('.view').forEach((view) => view.classList.toggle('is-active', view.id === `view-${tab}`));
  }

  async function applyFilters() {
    const params = {
      host: document.getElementById('filter-host').value,
      program: document.getElementById('filter-program').value,
      service: document.getElementById('filter-service').value,
      country: document.getElementById('filter-country').value,
      protocol: document.getElementById('filter-protocol').value
    };
    window.AppState.inspect = await window.Api.getInspect(params);
    window.AppState.overview = await window.Api.getOverview();
    requestRender();
  }

  function debounce(fn, delay) {
    let timer;
    return (...args) => {
      clearTimeout(timer);
      timer = setTimeout(() => fn(...args), delay);
    };
  }

  const debouncedApplyFilters = debounce(applyFilters, 300);

  function wireUi() {
    document.querySelectorAll('.tab').forEach((btn) => btn.addEventListener('click', () => setTab(btn.dataset.tab)));
    document.querySelectorAll('.mode-btn').forEach((btn) => btn.addEventListener('click', () => {
      document.querySelectorAll('.mode-btn').forEach((b) => b.classList.remove('is-active'));
      btn.classList.add('is-active');
      window.AppState.representation = btn.dataset.mode;
      requestRender();
    }));

    ['filter-host', 'filter-program', 'filter-service', 'filter-country'].forEach(id => {
      document.getElementById(id).addEventListener('input', debouncedApplyFilters);
    });
    document.getElementById('filter-protocol').addEventListener('change', applyFilters);

    document.getElementById('apply-filters').addEventListener('click', applyFilters);
    document.getElementById('clear-filters').addEventListener('click', async () => {
      ['filter-host', 'filter-program', 'filter-service', 'filter-country'].forEach((id) => { document.getElementById(id).value = ''; });
      document.getElementById('filter-protocol').value = '';
      window.AppState.inspect = await window.Api.getInspect();
      window.AppState.overview = await window.Api.getOverview();
      requestRender();
    });
    document.getElementById('clear-notifications').addEventListener('click', async () => {
      await window.Api.clearNotifications();
      window.AppState.notifications = [];
      requestRender();
    });
  }

  function wireStream() {
    window.Api.connectStream((event, data) => {
      if (event === 'connected') {
        document.getElementById('connection-status').textContent = 'Live';
        return;
      }
      if (event === 'overview:update') {
        window.AppState.overview = data;
        if (window.AppState.currentTab === 'overview') requestRender();
      }
      if (event === 'inspect:update') {
        window.AppState.inspect = { ...(window.AppState.inspect || {}), rows: data, total: data.length, pageSize: data.length };
        if (window.AppState.currentTab === 'inspect') requestRender();
      }
      if (event === 'notification:new') {
        window.AppState.notifications.unshift(data);
        if (window.AppState.currentTab === 'notifications') requestRender();
      }
    });
  }

  window.addEventListener('DOMContentLoaded', async () => {
    wireUi();
    await loadAll();
    wireStream();
  });
})();

