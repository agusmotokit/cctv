import fs from 'fs';
import path from 'path';

const content = fs.readFileSync(path.join(process.cwd(), 'scratch', 'tapin_chunks', '1b307012e163d3a8.js'), 'utf-8');

const keywords = ['totalPages', 'page', 'api/cctv', '/api/'];
for (const kw of keywords) {
  let idx = 0;
  console.log(`--- Keyword: ${kw} ---`);
  while ((idx = content.indexOf(kw, idx)) !== -1) {
    console.log(`Context at ${idx}:`, content.slice(Math.max(0, idx - 100), idx + 200));
    idx += kw.length;
    if (idx > 100000) break; // Limit printouts
  }
}
