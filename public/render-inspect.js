(function () {
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

  function renderHostCell(row) {
    const label = row.hostDisplay || row.host || row.destinationAddress || '-';
    const detail = row.hostDetail && row.hostDetail !== label ? row.hostDetail : '';
    const url = safeHttpUrl(row.hostUrl);
    const labelHtml = url
      ? `<a class="host-link" href="${escapeHtml(url)}" target="_blank" rel="noreferrer">${escapeHtml(label)}</a>`
      : `<span>${escapeHtml(label)}</span>`;
    const detailHtml = detail ? `<div class="host-detail">${escapeHtml(detail)}</div>` : '';
    return `<div class="host-cell">${labelHtml}${detailHtml}</div>`;
  }

  function renderInspect(payload) {
    const tbody = document.getElementById('inspect-body');
    const fragment = document.createDocumentFragment();
    
    (payload.rows || []).forEach((row) => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${escapeHtml(row.sourceAddress || '-')}</td>
        <td>${escapeHtml(row.sourcePort || '-')}</td>
        <td>${renderHostCell(row)}</td>
        <td>${escapeHtml(row.destinationPort || '-')}</td>
        <td>${escapeHtml(row.protocol || '-')}</td>
        <td>${escapeHtml(row.service || '-')}</td>
        <td>${escapeHtml(row.program || '-')}</td>
        <td>${escapeHtml(row.country || '-')}</td>
        <td>${Math.round(row.bytes || 0).toLocaleString()}</td>
      `;
      fragment.appendChild(tr);
    });

    if (!(payload.rows || []).length) {
      const tr = document.createElement('tr');
      tr.innerHTML = '<td colspan="9" class="footer-note">No connections yet.</td>';
      fragment.appendChild(tr);
    }

    tbody.innerHTML = '';
    tbody.appendChild(fragment);
    
    document.getElementById('inspect-meta').textContent = `Showing ${Math.min(payload.total || 0, payload.pageSize || 25)} of ${payload.total || 0} results`;
  }

  window.RenderInspect = renderInspect;
})();
