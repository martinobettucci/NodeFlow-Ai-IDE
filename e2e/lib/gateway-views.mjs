// Self-contained (no-CDN) HTML views of the gateway used by the panorama
// recorder and the e2e spec. One renders a live panel that calls the
// running gateway and shows the real responses; the other renders a
// feature map built from the live /openapi.json.

export function livePanelHtml(gateway, apiKey) {
  return `<!doctype html><meta charset="utf8"><title>Gateway live</title><style>
*{box-sizing:border-box}body{margin:0;font-family:system-ui,sans-serif;background:#0b1220;color:#e6edf6}
.hd{padding:18px 26px;background:linear-gradient(90deg,#1d4ed8,#0ea5e9)}
.hd h1{margin:0;font-size:22px}.hd p{margin:4px 0 0;opacity:.9;font-size:14px}
.wrap{padding:18px 26px;max-width:1180px;margin:0 auto;display:grid;gap:16px}
.card{border:1px solid #22304a;border-radius:10px;background:#0f1830;overflow:hidden}
.card h2{margin:0;padding:10px 16px;background:#16213c;font-size:14px}
.card h2 code{color:#38bdf8;font-weight:600}
pre{margin:0;padding:12px 16px;font-size:13px;white-space:pre-wrap;word-break:break-word;color:#cbd5e1}
.ok{color:#34d399}.err{color:#f87171}
</style>
<div class="hd"><h1>NodeFlow API Gateway — live control plane</h1>
<p>Real responses from the running gateway (Bearer API key) — no CDN, fetched at play time</p></div>
<div class="wrap" id="wrap"></div>
<script>
const GW=${JSON.stringify(gateway)}, KEY=${JSON.stringify(apiKey)};
const wrap=document.getElementById('wrap');
function card(title){const c=document.createElement('div');c.className='card';
  c.innerHTML='<h2><code>'+title+'</code></h2><pre>…</pre>';wrap.appendChild(c);return c.querySelector('pre');}
async function call(method,path,auth){
  const pre=card(method+' '+path);
  try{
    const h=auth?{'Authorization':'Bearer '+KEY}:{};
    const r=await fetch(GW+path,{headers:h});
    const j=await r.json();
    pre.className=r.ok?'ok':'err';
    pre.textContent=(r.ok?'200 ':r.status+' ')+JSON.stringify(j,null,2);
  }catch(e){pre.className='err';pre.textContent='ERROR '+e.message;}
}
(async()=>{
  await call('GET','/gateway/capabilities',false);
  await call('GET','/gateway/me',true);
  await call('GET','/admin/backends',true);
  await call('GET','/gateway/me/keys',true);
  document.title='done';
})();
</script>`;
}

export function featureMapHtml(spec) {
  const groups = {};
  for (const [path, ops] of Object.entries(spec.paths)) {
    for (const [method, op] of Object.entries(ops)) {
      const tag = (op.tags && op.tags[0]) || 'other';
      (groups[tag] = groups[tag] || []).push({
        method: method.toUpperCase(), path, summary: op.summary || '',
      });
    }
  }
  const order = ['session', 'proxy', 'nodes', 'instances', 'self', 'admin', 'billing', 'auth'];
  const tags = Object.keys(groups).sort(
    (a, b) => (order.indexOf(a) < 0 ? 99 : order.indexOf(a)) - (order.indexOf(b) < 0 ? 99 : order.indexOf(b)),
  );
  const sections = tags.map((t) =>
    `<section><h2>${t} <span>${groups[t].length}</span></h2>` +
    groups[t].sort((a, b) => a.path.localeCompare(b.path)).map((r) =>
      `<div class="row"><code class="m m-${r.method}">${r.method}</code>` +
      `<code class="p">${r.path}</code><span class="s">${r.summary}</span></div>`).join('') +
    `</section>`).join('');
  return `<!doctype html><meta charset="utf8"><title>Feature map</title><style>
*{box-sizing:border-box}body{margin:0;font-family:system-ui,sans-serif;background:#0b1220;color:#e6edf6}
.hd{padding:18px 26px;background:linear-gradient(90deg,#1d4ed8,#0ea5e9)}
.hd h1{margin:0;font-size:22px}.hd p{margin:4px 0 0;opacity:.9;font-size:14px}
.wrap{padding:18px 26px;max-width:1180px;margin:0 auto}
section{margin:0 0 18px;border:1px solid #22304a;border-radius:10px;overflow:hidden;background:#0f1830}
h2{margin:0;padding:10px 16px;background:#16213c;font-size:15px;text-transform:capitalize}
h2 span{float:right;background:#22304a;border-radius:10px;padding:1px 9px;font-size:12px}
.row{display:flex;gap:12px;align-items:center;padding:7px 16px;border-top:1px solid #1a2540;font-size:13px}
.m{font-weight:700;border-radius:5px;padding:1px 8px;min-width:54px;text-align:center;font-size:12px}
.m-GET{background:#0b3d2e;color:#34d399}.m-POST{background:#0b2f4d;color:#38bdf8}
.m-DELETE{background:#4d1216;color:#f87171}.m-PATCH{background:#3b2f08;color:#fbbf24}.m-PUT{background:#3b2f08;color:#fbbf24}
.p{color:#cbd5e1}.s{color:#7f8ea3;margin-left:auto;text-align:right}
</style>
<div class="hd"><h1>NodeFlow API Gateway — feature map</h1>
<p>${Object.keys(spec.paths).length} routes · generated from the live /openapi.json (self-contained, no CDN)</p></div>
<div class="wrap">${sections}</div>`;
}
