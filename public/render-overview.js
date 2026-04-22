(function () {
  function formatValue(value, mode) {
    if (mode === 'bits') return `${Math.round(value * 8).toLocaleString()} b`;
    if (mode === 'packets') return `${Math.round(value).toLocaleString()} pkts`;
    if (value >= 1024 * 1024) return `${(value / (1024 * 1024)).toFixed(1)} MB`;
    if (value >= 1024) return `${(value / 1024).toFixed(1)} KB`;
    return `${Math.round(value)} B`;
  }

  const lastRendered = {};

  function escapeHtml(value) {
    return String(value || '').replace(/[&<>"']/g, (char) => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    }[char]));
  }

  function safeHttpUrl(value) {
    try {
      const url = new URL(value);
      return url.protocol === 'http:' || url.protocol === 'https:' ? url.href : '';
    } catch {
      return '';
    }
  }

  function hostnameFromUrl(value) {
    try {
      return new URL(value).hostname;
    } catch {
      return '';
    }
  }

  function isIpAddress(value) {
    const clean = String(value || '').trim();
    return /^(?:\d{1,3}\.){3}\d{1,3}$/.test(clean) || (clean.includes(':') && /^[0-9a-f:.]+$/i.test(clean));
  }

  function renderList(containerId, items, mode, type = 'generic') {
    const container = document.getElementById(containerId);
    if (!container) return;

    // Ensure items is an array
    const data = Array.isArray(items) ? items : [];

    // Simple optimization: avoid re-rendering if data is identical
    const dataKey = JSON.stringify(data) + mode;
    if (lastRendered[containerId] === dataKey) return;
    lastRendered[containerId] = dataKey;

    if (data.length === 0) {
      container.innerHTML = '<div class="footer-note">No data yet.</div>';
      return;
    }

    const fragment = document.createDocumentFragment();
    const max = Math.max(1, ...data.map((item) => item.bytes || 0));

    data.forEach((item) => {
      const el = document.createElement('div');
      el.className = 'list-item';
      const pct = Math.max(5, Math.round(((item.bytes || 0) / max) * 100));

      let iconUrl = '';
      if (type === 'host') {
        const domain = hostnameFromUrl(item.url) || (!isIpAddress(item.detail) ? item.detail : '') || (!isIpAddress(item.name) ? item.name : '');
        if (domain) iconUrl = `https://icon.horse/icon/${domain}`;
      } else if (type === 'country' && item.name && item.name !== 'Local/Unknown') {
        iconUrl = `https://flagcdn.com/w80/${item.name.toLowerCase()}.png`;
      } else if (type === 'program') {
        iconUrl = 'https://img.icons8.com/fluency/48/000000/console.png';
      } else if (type === 'service') {
        iconUrl = 'https://img.icons8.com/fluency/48/000000/server.png';
      }

      const iconHtml = iconUrl ? `<img src="${escapeHtml(iconUrl)}" class="item-icon" loading="lazy" onerror="this.onerror=null; this.src='https://img.icons8.com/fluency/48/000000/generic-sorting.png';">` : '<div class="item-icon-placeholder"></div>';
      const itemUrl = safeHttpUrl(item.url);
      const label = escapeHtml(item.name || 'Unknown');
      const labelHtml = itemUrl
        ? `<a class="host-link" href="${escapeHtml(itemUrl)}" target="_blank" rel="noreferrer">${label}</a>`
        : `<span>${label}</span>`;
      const detailHtml = item.detail && item.detail !== item.name
        ? `<div class="list-item-detail">${escapeHtml(item.detail)}</div>`
        : '';

      el.innerHTML = `
        <div style="width:100%">
          <div class="list-item-content">
            ${iconHtml}
            <div class="list-item-text">
              <div class="list-item-header">${labelHtml}<strong>${formatValue(item.bytes || 0, mode)}</strong></div>
              ${detailHtml}
              <div class="bar-bg"><div class="bar" style="width:${pct}%"></div></div>
            </div>
          </div>
        </div>
      `;
      fragment.appendChild(el);
    });

    container.innerHTML = '';
    container.appendChild(fragment);
  }

  function deviceIcon(type) {
    const clean = String(type || '').toLowerCase();
    if (clean === 'router') return 'R';
    if (clean === 'phone') return 'P';
    if (clean === 'tablet') return 'T';
    if (clean === 'computer') return 'C';
    if (clean === 'media') return 'M';
    if (clean === 'printer') return 'Pr';
    if (clean === 'smart device') return 'S';
    return 'N';
  }

  function renderDevices(devices) {
    const container = document.getElementById('connected-devices');
    const summary = document.getElementById('devices-summary');
    if (!container) return;
    const data = Array.isArray(devices) ? devices : [];
    const dataKey = JSON.stringify(data);
    if (lastRendered['connected-devices'] === dataKey) return;
    lastRendered['connected-devices'] = dataKey;

    if (summary) {
      const routerCount = data.filter((item) => item.isRouter).length;
      summary.textContent = `${data.length} device${data.length === 1 ? '' : 's'} found${routerCount ? ` · ${routerCount} router` : ''}`;
    }

    if (!data.length) {
      container.innerHTML = '<div class="footer-note">No network devices discovered yet.</div>';
      return;
    }

    const fragment = document.createDocumentFragment();
    data.forEach((device) => {
      const row = document.createElement('div');
      row.className = 'device-row';
      const label = device.hostname || device.ip || 'Unknown device';
      const meta = [device.ip, device.mac, device.interface].filter(Boolean).join(' · ');
      row.innerHTML = `
        <div class="device-icon" title="${escapeHtml(device.type || 'Network device')}">${escapeHtml(deviceIcon(device.type))}</div>
        <div class="device-main">
          <div class="device-title">
            <span>${escapeHtml(label)}</span>
            <strong>${escapeHtml(device.type || 'Network device')}</strong>
          </div>
          <div class="device-meta">${escapeHtml(meta || 'No address details')}</div>
        </div>
        <span class="device-state">${escapeHtml(device.state || 'unknown')}</span>
      `;
      fragment.appendChild(row);
    });

    container.innerHTML = '';
    container.appendChild(fragment);
  }

  function renderOverview(data) {
    if (!data) return;
    const mode = window.AppState.representation || 'bytes';
    
    const adapterName = document.getElementById('adapter-name');
    if (adapterName) adapterName.textContent = data.adapter || 'unknown';
    
    const footerAdapter = document.getElementById('footer-adapter');
    if (footerAdapter) footerAdapter.textContent = `Adapter: ${data.adapter || 'unknown'}`;
    
    const footerUpdated = document.getElementById('footer-updated');
    if (footerUpdated) footerUpdated.textContent = `Updated: ${new Date().toLocaleTimeString()}`;
    
    const incomingCurrent = document.getElementById('incoming-current');
    if (incomingCurrent) incomingCurrent.textContent = formatValue(data.totals?.currentIncoming || 0, mode) + (mode === 'packets' ? '' : '/s');
    const incomingTotal = document.getElementById('incoming-total');
    if (incomingTotal) incomingTotal.textContent = 'Total (60s): ' + formatValue(data.totals?.incoming || 0, mode);
    
    const outgoingCurrent = document.getElementById('outgoing-current');
    if (outgoingCurrent) outgoingCurrent.textContent = formatValue(data.totals?.currentOutgoing || 0, mode) + (mode === 'packets' ? '' : '/s');
    const outgoingTotal = document.getElementById('outgoing-total');
    if (outgoingTotal) outgoingTotal.textContent = 'Total (60s): ' + formatValue(data.totals?.outgoing || 0, mode);
    
    const droppedCurrent = document.getElementById('dropped-current');
    if (droppedCurrent) droppedCurrent.textContent = (data.totals?.currentDropped || 0).toLocaleString() + ' pkts/s';
    const droppedTotal = document.getElementById('dropped-total');
    if (droppedTotal) droppedTotal.textContent = 'Total (60s): ' + (data.totals?.dropped || 0).toLocaleString() + ' pkts';

    const chips = document.getElementById('active-filters');
    if (chips) {
      const filtersKey = JSON.stringify(data.activeFilters || {});
      if (lastRendered['active-filters'] !== filtersKey) {
        chips.innerHTML = '';
        Object.entries(data.activeFilters || {}).forEach(([key, value]) => {
          const chip = document.createElement('span');
          chip.className = 'chip';
          chip.textContent = `${key}: ${value}`;
          chips.appendChild(chip);
        });
        lastRendered['active-filters'] = filtersKey;
      }
    }

    if (window.Charts) {
      const trafficChart = document.getElementById('trafficChart');
      if (trafficChart) window.Charts.drawTrafficAreaChart(trafficChart, data.graphSeries || []);
      
      const donutChart = document.getElementById('donutChart');
      if (donutChart) window.Charts.drawDonutChart(donutChart, data.totals || { incoming: 0, outgoing: 0 });
    }

    renderList('top-hosts', data.topHosts, mode, 'host');
    renderDevices(data.devices || []);
    renderList('top-services', data.topServices, mode, 'service');
    renderList('top-programs', data.topPrograms, mode, 'program');
    renderList('top-countries', (data.topCountries || []).map(c => ({ ...c, name: c.name || 'Local/Unknown' })), mode, 'country');
  }

  window.RenderOverview = renderOverview;
})();
