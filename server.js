// Static server + play telemetry (JSONL). No dependencies.
const http = require('http'), fs = require('fs'), path = require('path');
const PUB = path.join(__dirname, 'public');
const DATA = fs.existsSync('/data') ? '/data' : __dirname;
const LOG = path.join(DATA, 'events.jsonl');
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.json': 'application/json', '.css': 'text/css', '.svg': 'image/svg+xml', '.png': 'image/png', '.txt': 'text/plain' };
http.createServer((req, res) => {
  const u = new URL(req.url, 'http://x');
  if (req.method === 'POST' && u.pathname === '/e') {
    let b = ''; req.on('data', c => { b += c; if (b.length > 2000) req.destroy(); });
    req.on('end', () => {
      try { const e = JSON.parse(b); e.t = Date.now(); e.ref = (req.headers.referer || '').slice(0, 120); fs.appendFile(LOG, JSON.stringify(e) + '\n', () => {}); } catch (_) {}
      res.writeHead(204); res.end();
    });
    return;
  }
  if (u.pathname === '/stats') { // aggregate only, no raw events
    fs.readFile(LOG, 'utf8', (err, txt) => {
      const ev = err ? [] : txt.trim().split('\n').filter(Boolean).map(l => { try { return JSON.parse(l); } catch (_) { return null; } }).filter(Boolean);
      const players = new Set(ev.map(e => e.p)), starts = ev.filter(e => e.k === 'start').length, wins = ev.filter(e => e.k === 'win').length;
      const secs = ev.filter(e => e.k === 'win').reduce((a, e) => a + (e.s || 0), 0);
      res.writeHead(200, { 'content-type': 'application/json' }); res.end(JSON.stringify({ players: players.size, starts, wins, playSeconds: secs }));
    });
    return;
  }
  let f = path.normalize(path.join(PUB, u.pathname === '/' ? 'index.html' : u.pathname));
  if (!f.startsWith(PUB)) { res.writeHead(403); return res.end(); }
  fs.readFile(f, (err, d) => {
    if (err) { res.writeHead(404); return res.end('not found'); }
    res.writeHead(200, { 'content-type': TYPES[path.extname(f)] || 'application/octet-stream', 'cache-control': 'public, max-age=300' });
    res.end(d);
  });
}).listen(process.env.PORT || 3000);
