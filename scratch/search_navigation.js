import fs from 'fs';
import path from 'path';

const content = fs.readFileSync(path.join(process.cwd(), 'scratch', 'tapin_chunks', '1b307012e163d3a8.js'), 'utf-8');

// Let's search for keywords in a case-insensitive way
const keywords = ['next', 'prev', 'pagination', 'page', 'limit', 'offset', 'slice'];
for (const kw of keywords) {
  let count = 0;
  let idx = 0;
  while ((idx = content.toLowerCase().indexOf(kw, idx)) !== -1) {
    count++;
    if (count <= 10) {
      console.log(`[${kw}] Context ${count} at ${idx}:`, content.slice(Math.max(0, idx - 50), idx + 100));
    }
    idx += kw.length;
  }
  console.log(`[${kw}] Found ${count} total occurrences.`);
}
