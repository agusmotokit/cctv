const fs = require('fs');
const path = require('path');

const chunkPath = path.join(__dirname, 'bogor_page_chunk.js');
const text = fs.readFileSync(chunkPath, 'utf8');

console.log('Searching for interesting snippets in bogor_page_chunk.js...');

function showContext(keyword, len = 200) {
  let idx = 0;
  while (true) {
    idx = text.indexOf(keyword, idx);
    if (idx === -1) break;
    console.log(`\n--- Context for "${keyword}" at index ${idx} ---`);
    const start = Math.max(0, idx - 100);
    const end = Math.min(text.length, idx + len);
    console.log(text.substring(start, end));
    idx += keyword.length;
  }
}

showContext('/api/', 300);
showContext('fetch', 150);
showContext('stream', 150);
