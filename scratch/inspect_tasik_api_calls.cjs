const fs = require('fs');
const path = require('path');

const bundlePath = path.join(__dirname, 'tasikmalayakab_bundle.js');
const text = fs.readFileSync(bundlePath, 'utf8');

console.log('Searching for /api context in tasikmalayakab_bundle.js...');

let idx = 0;
while (true) {
  idx = text.indexOf('/api', idx);
  if (idx === -1) break;
  console.log(`\n--- Match at index ${idx} ---`);
  const start = Math.max(0, idx - 150);
  const end = Math.min(text.length, idx + 150);
  console.log(text.substring(start, end));
  idx += 4;
}
