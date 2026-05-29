const fs = require('fs');
const path = require('path');

const bundlePath = path.join(__dirname, 'tasikmalayakab_bundle.js');
const text = fs.readFileSync(bundlePath, 'utf8');

console.log('Searching for Uy and qy usage...');

function showNear(name) {
  let idx = 0;
  while (true) {
    idx = text.indexOf(name, idx);
    if (idx === -1) break;
    console.log(`\n--- Match for "${name}" at index ${idx} ---`);
    const start = Math.max(0, idx - 100);
    const end = Math.min(text.length, idx + 400);
    console.log(text.substring(start, end));
    idx += name.length;
  }
}

showNear('Uy=');
showNear('qy=');
