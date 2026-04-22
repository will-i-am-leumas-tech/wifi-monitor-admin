(function () {
  function renderNotifications(items) {
    const root = document.getElementById('notifications-list');
    const fragment = document.createDocumentFragment();

    items.forEach((item) => {
      const card = document.createElement('div');
      card.className = `notification ${item.severity || 'info'}`;
      card.innerHTML = `
        <div><strong>${item.title}</strong></div>
        <div>${item.message || ''}</div>
        <div class="meta">${new Date(item.timestamp).toLocaleString()} · ${item.host || item.program || item.service || 'system'} · ${Math.round(item.bytes || 0).toLocaleString()} B</div>
      `;
      fragment.appendChild(card);
    });

    if (!items.length) {
      const empty = document.createElement('div');
      empty.className = 'footer-note';
      empty.textContent = 'No notifications yet.';
      fragment.appendChild(empty);
    }

    root.innerHTML = '';
    root.appendChild(fragment);
  }

  window.RenderNotifications = renderNotifications;
})();

