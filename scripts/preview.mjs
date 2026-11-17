import { mkdir, readFile, writeFile } from 'node:fs/promises';
const modules = await Promise.all(
  ['shared/game.js', 'shared/font.js', 'shared/render.js'].map(p => readFile(p, 'utf8')),
);
const code = modules
  .map(s => s.replace(/^import [\s\S]*?;\n/gm, '').replace(/\bexport /g, ''))
  .join('\n');
const html = `<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>What the Duck</title>
<style>*{box-sizing:border-box}body{margin:0;min-height:100vh;display:grid;place-items:center;background:#17181b;color:#e8e5db;font:16px system-ui,sans-serif}main{width:min(840px,100%);padding:28px}h1{font-size:24px;margin:0 0 28px}canvas{display:block;width:100%;height:auto;background:#000;image-rendering:pixelated;border-radius:4px;touch-action:manipulation}button{font:inherit;color:inherit;border:1px solid #4a4b50;background:#292a2f;padding:12px 20px;border-radius:8px;cursor:pointer}button:focus-visible{outline:2px solid #ffd43b;outline-offset:4px}.controls{display:flex;gap:12px;margin-top:24px;flex-wrap:wrap}#score{font-variant-numeric:tabular-nums;color:#ffd43b}p{color:#a8a9b0;line-height:1.6}</style>
<main><h1>What the Duck</h1><canvas width="72" height="16" role="img" aria-label="Yellow duck runner game"></canvas><div class="controls"><button id="jump">Start / Jump</button><button id="pause">Pause</button></div><p id="score"></p><p>Space / ↑ / tap to jump · P to pause</p></main>
<script>${code}
const game=createGame(), canvas=document.querySelector('canvas'), ctx=canvas.getContext('2d');
let previous=performance.now(), elapsed=0;
function paint(){const rows=frontRows(game);for(let y=0;y<16;y++)for(let x=0;x<72;x++){ctx.fillStyle=COLORS[rows[y][x]];ctx.fillRect(x,y,1,1);}document.querySelector('#score').textContent='Score '+game.score+' · Best '+game.best;document.querySelector('#jump').textContent=game.phase==='dead'?'Try again':game.phase==='ready'?'Start':game.phase==='paused'?'Resume':'Jump';document.querySelector('#pause').textContent=game.phase==='paused'?'Resume':'Pause';}
function jump(){action(game);paint();}
document.querySelector('#jump').onclick=jump;canvas.onpointerdown=e=>{e.preventDefault();jump();};document.querySelector('#pause').onclick=()=>{pause(game);paint();};
document.addEventListener('keydown',e=>{if(e.target.tagName==='BUTTON'&&(e.code==='Space'||e.code==='Enter'))return;if(['Space','ArrowUp','KeyP'].includes(e.code)){e.preventDefault();if(e.repeat)return;if(e.code==='KeyP')pause(game);else jump();paint();}});
document.addEventListener('visibilitychange',()=>{if(document.hidden&&game.phase==='running')pause(game);previous=performance.now();elapsed=0;paint();});
function tick(t){elapsed+=Math.min((t-previous)/1000,.16);previous=t;if(elapsed>=.08){advance(game,elapsed);elapsed=0;paint();}requestAnimationFrame(tick);}paint();requestAnimationFrame(tick);
</script></html>`;
await mkdir('dist', { recursive: true });
await writeFile('dist/preview.html', html);
console.log('Created dist/preview.html');
