import fs from 'fs';
import path from 'path';
import zlib from 'zlib';

const dist = path.resolve(process.cwd(), 'dist', 'assets');
const main = fs.readdirSync(dist).find(f => /^index-.*\.js$/.test(f));
if (!main) {
  console.error('No main index-*.js found in dist/assets');
  process.exit(1);
}
const buf = fs.readFileSync(path.join(dist, main));
const gz = zlib.gzipSync(buf);
const kb = Math.round((gz.length / 1024) * 100) / 100;
const limit = Number(process.env.BUNDLE_LIMIT_KB || 200);
if (kb > limit) {
  console.error(`Bundle too large: ${kb}KB gzip (limit ${limit}KB).`);
  process.exit(2);
} else {
  console.log(`Bundle size OK: ${kb}KB gzip (limit ${limit}KB).`);
}
