// Independent proof: every level has exactly one winning configuration, equal to the stored one, no duplicates.
const B = require('./public/engine.js');
const L = require('./proof/levels-full.json');
let bad = 0, keys = new Set(), dup = 0, ks = {};
for (const lv of L) {
  const s = B.solutions(lv);
  if (s.length !== 1 || s[0].join() !== lv.sol.join()) bad++;
  const k = B.key(lv); if (keys.has(k)) dup++; keys.add(k);
  ks[lv.toggles.length] = (ks[lv.toggles.length] || 0) + 1;
}
console.log(JSON.stringify({ levels: L.length, invalid: bad, duplicates: dup, toggles: ks }));
process.exit(bad || dup ? 1 : 0);
