const fs = require('fs');
const path = require('path');

const bundlePath = path.join(__dirname, 'tasikmalayakab_bundle.js');
const text = fs.readFileSync(bundlePath, 'utf8');

console.log('Searching for Jy function code in tasikmalayakab_bundle.js...');

let idx = text.indexOf('qy=`/api`;function Jy(){');
if (idx !== -1) {
  console.log(`Found Jy at index ${idx}! Printing 2000 characters:`);
  console.log(text.substring(idx, idx + 2000));
} else {
  console.log('Could not find exact function signature.');
}
