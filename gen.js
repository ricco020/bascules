// Generates and proves 1000 levels: unique solution, every toggle used, no duplicates.
const B = require('./public/engine.js');
const fs = require('fs');
const out = [], seen = new Set();
let tries = 0, seed = 12345;
for (let n = 1; n <= 1000; n++) {
  for (;;) {
    tries++; seed = (Math.imul(seed, 1103515245) + 12345) >>> 0;
    const lv = B.candidate(n, seed);
    if (!lv) continue;
    const k = B.key(lv);
    if (seen.has(k)) continue;
    seen.add(k); out.push(lv); break;
  }
}
fs.writeFileSync('proof/levels-full.json', JSON.stringify(out)); fs.writeFileSync('public/levels.json', JSON.stringify(out.map(({ sol, seed, ...r }) => r)));
console.log('levels', out.length, 'tries', tries);
