const fs = require('fs');
const path = require('path');

const content = fs.readFileSync(path.join(__dirname, 'magelangkota_home.html'), 'utf8');

const idx = content.indexOf('id="map"');
if (idx !== -1) {
  console.log('Found id="map"! Snippet:');
  console.log(content.substring(idx - 100, idx + 800));
} else {
  console.log('Not found');
}
