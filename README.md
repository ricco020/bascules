# Bascules

Flip-mirror logic puzzle. Set the amber mirrors, launch the ball, collect every star, exit through the gate. Each mirror flips after the ball passes.

- `public/engine.js`: simulator, solver (exhaustive over 2^k mirror settings), generator (shared by browser and Node).
- `node gen.js 1000`: generates levels; keeps only levels with exactly one winning setting, every mirror on the solution path, no duplicate.
- `node verify.js`: independent proof over `proof/levels-full.json` (exits 1 on any invalid or duplicate level).
- `server.js`: static server + anonymous play events (`POST /e`, aggregate at `/stats`).
