(function () {
  function clear(ctx, canvas) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }

  function drawTrafficAreaChart(canvas, series) {
    const ctx = canvas.getContext('2d');
    clear(ctx, canvas);
    const w = canvas.width;
    const h = canvas.height;
    const pad = 28;
    const data = Array.isArray(series) && series.length ? series : [{ incoming: 0, outgoing: 0 }];
    const max = Math.max(1, ...data.map((item) => Math.max(item.incoming || 0, item.outgoing || 0)));

    ctx.strokeStyle = 'rgba(255,255,255,0.12)';
    ctx.lineWidth = 1;
    for (let i = 0; i < 4; i += 1) {
      const y = pad + ((h - pad * 2) / 3) * i;
      ctx.beginPath();
      ctx.moveTo(pad, y);
      ctx.lineTo(w - pad, y);
      ctx.stroke();
    }

    function drawOne(key, fill, stroke) {
      ctx.beginPath();
      data.forEach((item, index) => {
        const x = pad + ((w - pad * 2) / Math.max(1, data.length - 1)) * index;
        const y = h - pad - ((item[key] || 0) / max) * (h - pad * 2);
        if (index === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      });
      const points = data.map((item, index) => ({
        x: pad + ((w - pad * 2) / Math.max(1, data.length - 1)) * index,
        y: h - pad - ((item[key] || 0) / max) * (h - pad * 2)
      }));
      ctx.lineWidth = 2;
      ctx.strokeStyle = stroke;
      ctx.stroke();
      ctx.lineTo(w - pad, h - pad);
      ctx.lineTo(pad, h - pad);
      ctx.closePath();
      ctx.fillStyle = fill;
      ctx.fill();
    }

    drawOne('incoming', 'rgba(242,180,63,0.25)', '#f2b43f');
    drawOne('outgoing', 'rgba(74,163,255,0.2)', '#4aa3ff');
  }

  function drawDonutChart(canvas, totals) {
    const ctx = canvas.getContext('2d');
    clear(ctx, canvas);
    const total = Math.max(1, (totals.incoming || 0) + (totals.outgoing || 0));
    const cx = canvas.width / 2;
    const cy = canvas.height / 2;
    const radius = 58;
    const lineWidth = 16;
    const incomingAngle = ((totals.incoming || 0) / total) * Math.PI * 2;

    ctx.lineWidth = lineWidth;
    ctx.strokeStyle = 'rgba(255,255,255,0.08)';
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = '#f2b43f';
    ctx.beginPath();
    ctx.arc(cx, cy, radius, -Math.PI / 2, -Math.PI / 2 + incomingAngle);
    ctx.stroke();

    ctx.strokeStyle = '#4aa3ff';
    ctx.beginPath();
    ctx.arc(cx, cy, radius, -Math.PI / 2 + incomingAngle, Math.PI * 1.5);
    ctx.stroke();

    ctx.fillStyle = '#e9f1ff';
    ctx.font = '700 22px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(Math.round((totals.incoming || 0) + (totals.outgoing || 0)).toLocaleString(), cx, cy + 8);
  }

  window.Charts = { drawTrafficAreaChart, drawDonutChart };
})();
