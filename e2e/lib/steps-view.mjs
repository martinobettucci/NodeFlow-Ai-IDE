// Renders a captured sequence of real API calls (see the gateway management
// driver) into a self-contained, scrollable HTML timeline — no CDN. Each
// card shows the actor, the request, the HTTP status and the real response.

const ACTOR_COLORS = {
  admin: '#38bdf8',
  dev: '#34d399',
  'dev (team_admin)': '#a78bfa',
  system: '#fbbf24',
};

function statusClass(code) {
  if (typeof code !== 'number') return 'i';
  if (code < 300) return 'ok';
  if (code < 500) return 'warn';
  return 'err';
}

export function stepsTimelineHtml(steps, { title, subtitle } = {}) {
  const cards = steps.map((s, i) => {
    const color = ACTOR_COLORS[s.actor] || '#94a3b8';
    const req = s.request
      ? `<div class="lbl">request</div><pre class="req">${escapeJson(s.request)}</pre>` : '';
    const note = s.note ? `<div class="note">▸ ${escape(s.note)}</div>` : '';
    return `<div class="card">
      <div class="top">
        <span class="n">${i + 1}</span>
        <span class="actor" style="background:${color}22;color:${color};border-color:${color}55">${escape(s.actor)}</span>
        <span class="title">${escape(s.title)}</span>
        <span class="status ${statusClass(s.status)}">${s.status}</span>
      </div>
      <div class="route"><code class="m">${escape(s.method)}</code> <code>${escape(s.path)}</code></div>
      ${note}
      ${req}
      <div class="lbl">response</div><pre class="res ${statusClass(s.status)}">${escapeJson(s.response)}</pre>
    </div>`;
  }).join('');

  return `<!doctype html><meta charset="utf8"><title>steps</title><style>
*{box-sizing:border-box}body{margin:0;font-family:system-ui,sans-serif;background:#0b1220;color:#e6edf6}
.hd{position:sticky;top:0;z-index:5;padding:16px 26px;background:linear-gradient(90deg,#1d4ed8,#0ea5e9);box-shadow:0 2px 14px rgba(0,0,0,.4)}
.hd h1{margin:0;font-size:21px}.hd p{margin:3px 0 0;opacity:.92;font-size:13px}
.wrap{padding:18px 26px;max-width:1180px;margin:0 auto;display:grid;gap:14px}
.card{border:1px solid #22304a;border-radius:10px;background:#0f1830;overflow:hidden}
.top{display:flex;align-items:center;gap:10px;padding:10px 14px;background:#16213c}
.n{width:24px;height:24px;border-radius:6px;background:#22304a;color:#cbd5e1;font-size:12px;display:flex;align-items:center;justify-content:center;flex:0 0 auto}
.actor{font-size:11px;font-weight:700;border:1px solid;border-radius:20px;padding:2px 9px;text-transform:uppercase;letter-spacing:.3px}
.title{font-size:14px;font-weight:600;flex:1}
.status{font-weight:700;font-size:13px;border-radius:6px;padding:2px 9px}
.status.ok{background:#0b3d2e;color:#34d399}.status.warn{background:#3b2f08;color:#fbbf24}.status.err{background:#4d1216;color:#f87171}.status.i{background:#22304a;color:#cbd5e1}
.route{padding:8px 14px 0;font-size:13px;color:#cbd5e1}
.route .m{color:#38bdf8;font-weight:700}
.note{padding:6px 14px 0;font-size:12px;color:#9fb3c8;font-style:italic}
.lbl{padding:8px 14px 2px;font-size:10px;text-transform:uppercase;letter-spacing:.6px;color:#64748b}
pre{margin:0 14px 12px;padding:10px 12px;border-radius:8px;background:#0a1124;font-size:12px;white-space:pre-wrap;word-break:break-word;color:#cbd5e1}
pre.req{background:#0a1430}
pre.res.ok{border-left:3px solid #34d399}pre.res.warn{border-left:3px solid #fbbf24}pre.res.err{border-left:3px solid #f87171}
</style>
<div class="hd"><h1>${escape(title || 'NodeFlow API Gateway — management')}</h1>
<p>${escape(subtitle || '')}</p></div>
<div class="wrap">${cards}</div>`;
}

function escape(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
function escapeJson(obj) {
  let s = typeof obj === 'string' ? obj : JSON.stringify(obj, null, 2);
  if (s == null) s = '';
  if (s.length > 1400) s = s.slice(0, 1400) + '\n…';
  return escape(s);
}
