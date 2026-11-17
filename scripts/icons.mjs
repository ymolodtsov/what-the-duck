// Exact pixel launcher artwork, written as RGBA PNG without graphics dependencies.
import { writeFile } from 'node:fs/promises';
import { deflateSync } from 'node:zlib';
const crc32 = data => {
  let c = 0xffffffff;
  for (const b of data) {
    c ^= b;
    for (let i = 0; i < 8; i++) c = (c >>> 1) ^ (c & 1 ? 0xedb88320 : 0);
  }
  return (c ^ 0xffffffff) >>> 0;
};
function chunk(type, data) {
  const name = Buffer.from(type),
    length = Buffer.alloc(4),
    crc = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  crc.writeUInt32BE(crc32(Buffer.concat([name, data])));
  return Buffer.concat([length, name, data, crc]);
}
export function png(width, height, rgba) {
  const header = Buffer.alloc(13);
  header.writeUInt32BE(width);
  header.writeUInt32BE(height, 4);
  header[8] = 8;
  header[9] = 6;
  const raw = Buffer.alloc(height * (1 + width * 4));
  for (let y = 0; y < height; y++)
    Buffer.from(rgba.slice(y * width * 4, (y + 1) * width * 4)).copy(raw, y * (1 + width * 4) + 1);
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk('IHDR', header),
    chunk('IDAT', deflateSync(raw)),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}
export const FRONT_ICON = [
  '...yyy..',
  '...yky..',
  'y..yyoo.',
  'yyyyyy..',
  '.yyyyy..',
  '..yyy...',
  '..o.o...',
  '........',
];
export const BACK_ICON = [
  '...........',
  '.....mmm...',
  '....m...m..',
  '....m.m.m..',
  '.m..m...mmm',
  '.mm.m...m..',
  '.m.m....m..',
  '..m.....m..',
  '...mmmmm...',
  '....m.m....',
  '...........',
];
const colors = {
  '.': [0, 0, 0, 0],
  y: [255, 212, 59, 255],
  k: [36, 32, 27, 255],
  o: [245, 158, 11, 255],
  m: [136, 136, 136, 255],
};
for (const [file, rows] of [
  ['icon_front_8x8.png', FRONT_ICON],
  ['icon_back_11x11.png', BACK_ICON],
]) {
  const rgba = rows.flatMap(row => [...row].flatMap(c => colors[c]));
  await writeFile('src/appmeta/' + file, png(rows[0].length, rows.length, rgba));
}
