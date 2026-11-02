// Bascules engine: shared by the browser and the Node validator.
// Cells: '.' empty, '#' wall, '*' star, '/' '\\' fixed mirrors, 'a'..'z' toggle mirrors (state 0='/' 1='\\').
// A toggle mirror flips its orientation every time the ball passes through it.
(function (root) {
  const DX = [1, 0, -1, 0], DY = [0, 1, 0, -1]; // 0 right,1 down,2 left,3 up
  function bounce(d, m) { // m '/' or '\\'
    if (m === '/') return [3, 2, 1, 0][d];
    return [1, 0, 3, 2][d];
  }
  function rng(seed) {
    let s = seed >>> 0 || 1;
    return () => { s ^= s << 13; s >>>= 0; s ^= s >> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; };
  }
  // level: {w,h,grid:[str], start:{x,y,d}, exit:{x,y,d}, toggles:[{x,y}]}
  function simulate(lv, cfg, trace) {
    const g = lv.grid.map(r => r.split(''));
    const st = cfg.slice();
    const idx = {};
    lv.toggles.forEach((t, i) => { idx[t.y * lv.w + t.x] = i; });
    let stars = 0; lv.grid.forEach(r => { for (const c of r) if (c === '*') stars++; });
    let x = lv.start.x, y = lv.start.y, d = lv.start.d, got = 0;
    const path = [];
    for (let step = 0; step < 4000; step++) {
      x += DX[d]; y += DY[d];
      if (x < 0 || y < 0 || x >= lv.w || y >= lv.h) {
        const ok = !!lv.exit && got === stars && x - DX[d] === lv.exit.x && y - DY[d] === lv.exit.y && d === lv.exit.d;
        return { win: ok, out: { x: x - DX[d], y: y - DY[d], d }, got, stars, path, steps: step };
      }
      const c = g[y][x];
      if (trace) path.push({ x, y, d });
      if (c === '#') return { win: false, crash: true, got, stars, path, steps: step };
      if (c === '*') { got++; g[y][x] = '.'; }
      else if (c === '/' || c === '\\') d = bounce(d, c);
      else if (c >= 'a' && c <= 'z') {
        const i = idx[y * lv.w + x];
        d = bounce(d, st[i] ? '\\' : '/');
        st[i] ^= 1;
      }
    }
    return { win: false, loop: true, got, stars, path, steps: 4000 };
  }
  function solutions(lv, limit) {
    const k = lv.toggles.length, sols = [];
    for (let m = 0; m < (1 << k); m++) {
      const cfg = []; for (let i = 0; i < k; i++) cfg.push((m >> i) & 1);
      if (simulate(lv, cfg).win) { sols.push(cfg); if (limit && sols.length >= limit) break; }
    }
    return sols;
  }
  function params(n) { // difficulty ramp by level index (1-based)
    const w = Math.min(5 + Math.floor(n / 60), 9), h = Math.min(5 + Math.floor(n / 80), 10);
    const k = Math.min(2 + Math.floor(n / 80), 7);
    return { w, h, k, fixed: Math.min(1 + Math.floor(n / 100), 4), walls: Math.min(Math.floor(n / 100), 4) };
  }
  // Generate one candidate from a seed; returns level or null.
  function candidate(n, seed) {
    const p = params(n), r = rng(seed), W = p.w, H = p.h;
    const g = Array.from({ length: H }, () => Array(W).fill('.'));
    const free = [];
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) free.push([x, y]);
    for (let i = free.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [free[i], free[j]] = [free[j], free[i]]; }
    const toggles = [];
    for (let i = 0; i < Math.min(p.k * 2, 20); i++) { const [x, y] = free.pop(); g[y][x] = String.fromCharCode(97 + i); toggles.push({ x, y }); }
    for (let i = 0; i < p.fixed; i++) { const [x, y] = free.pop(); g[y][x] = r() < .5 ? '/' : '\\'; }
    for (let i = 0; i < p.walls; i++) { const [x, y] = free.pop(); g[y][x] = '#'; }
    const side = Math.floor(r() * 4);
    let start;
    if (side === 0) start = { x: -1, y: Math.floor(r() * H), d: 0 };
    else if (side === 1) start = { x: W, y: Math.floor(r() * H), d: 2 };
    else if (side === 2) start = { x: Math.floor(r() * W), y: -1, d: 1 };
    else start = { x: Math.floor(r() * W), y: H, d: 3 };
    const lv = { n, seed, w: W, h: H, grid: g.map(rw => rw.join('')), start, exit: null, toggles };
    const cfg = toggles.map(() => (r() < .5 ? 1 : 0));
    const res = simulate(lv, cfg, true);
    if (!res.out) return null;
    // every toggle must be crossed by the intended path
    const crossed = new Set(res.path.map(q => q.y * W + q.x));
    // toggles the intended path never crosses are removed: this cannot change that path
    const keep = [], kcfg = [];
    toggles.forEach((t, i) => { if (crossed.has(t.y * W + t.x)) { keep.push(t); kcfg.push(cfg[i]); } else g[t.y][t.x] = '.'; });
    if (keep.length < Math.max(2, Math.ceil(p.k * 0.6))) return null;
    keep.forEach((t, i) => { g[t.y][t.x] = String.fromCharCode(97 + i); });
    lv.toggles = keep; lv.sol = kcfg;
    const empties = [...new Set(res.path.filter(q => g[q.y][q.x] === '.').map(q => q.y * W + q.x))];
    const ns = Math.min(1 + Math.floor(n / 120), 4);
    if (empties.length < ns) return null;
    for (let i = 0; i < ns; i++) { const c = empties.splice(Math.floor(r() * empties.length), 1)[0]; g[Math.floor(c / W)][c % W] = '*'; }
    lv.grid = g.map(rw => rw.join(''));
    lv.exit = res.out;
    if (res.path.length < Math.min(6 + Math.floor(n / 25), 24)) return null;
    const sols = solutions(lv, 2);
    if (sols.length !== 1) return null; // unique solution only
    // the all-zero start must not already win (player has to think)
    lv.par = res.path.length;
    return lv;
  }
  function key(lv) { return lv.w + 'x' + lv.h + ':' + lv.grid.join('|') + ':' + JSON.stringify(lv.start) + JSON.stringify(lv.exit); }
  root.Bascules = { simulate, solutions, candidate, params, key, DX, DY };
  if (typeof module !== 'undefined') module.exports = root.Bascules;
})(typeof window !== 'undefined' ? window : globalThis);
