# What the Duck

Standalone BUSY Bar endless runner. Canonical source: `/Users/Yury/dev/what-the-duck`.

- Separate app ID `me.molodtsov.what-the-duck`; never change or replace SuperBar.
- Yellow duck, orange bill and feet, cacti, scrolling ground, rising speed, score, retry.
- Front display: 72×16, ground row 14. Keep the duck fully visible at jump apex.
- Start/OK short or wheel: jump/start/retry. Long OK: pause/resume. Back short: quit.
- Launcher artwork: yellow duck in `icon_front_8x8.png`, gray line-art duck in `icon_back_11x11.png`; regenerate with `scripts/icons.mjs`.
- `shared/game.js` owns deterministic 60 Hz physics. `shared/render.js` owns pixel rendering and back-display text. `src/main.js` owns hardware I/O.
- JerryScript on firmware 1.3.1: no Node, DOM, Intl, or Annex B in device code. Optional localStorage only; best score otherwise lasts for the app session.
- One draw request in flight, 80 ms target pacing and at least 25 ms idle for input. Priority 50; native BUSY/calendar retain priority. Pause after long frame gaps or failed draws.
- Rear display: send only changed text; rate-limit score checks to once per second, flush state changes immediately, and restore all rear elements every 30 seconds after possible firmware canvas clears. Cache only successful draws.
- No network data, cloud account, sound, or desktop dependency.
- Keep back text within x=145, clear of the firmware status column. BUSY small glyph data in `shared/font.js` is generated; do not hand-edit it.
- Run `npm run format`, `npm run build`, `npm test`, `npm run check`. Tests execute the packaged bundle, so build first.
- Use `scripts/bar.mjs` for requests to the device: Node fetch rejects firmware 1.3.1's padded Content-Length. USB address: `http://10.0.4.20`.
- Check visuals and verify on hardware before claiming device behavior. Log dump: POST `/api/log_dump`, then GET `/api/storage/read?path=/ext/log.txt`.
- Do not modify firmware or invent endpoints. Consult SuperBar's AGENTS.md for additional shared device notes.

- Catalog release builds use plain `busy-cli build`, without custom hooks. Commit generated assets; run `npm run generate` after editing their sources. Keep licenses and notices in both the repository and packaged resources.
