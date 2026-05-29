const fs = require('fs');
const path = require('path');

const bundlePath = path.join(__dirname, 'tasikmalayakab_bundle.js');
const text = fs.readFileSync(bundlePath, 'utf8');

console.log('Searching for endpoints, APIs, and stream urls in tasikmalayakab_bundle.js...');

function searchKeywords(keywords) {
  keywords.forEach(keyword => {
    let idx = 0;
    let occurrences = 0;
    while (true) {
      idx = text.indexOf(keyword, idx);
      if (idx === -1) break;
      occurrences++;
      if (occurrences <= 10) {
        console.log(`\n--- Match #${occurrences} for "${keyword}" at index ${idx} ---`);
        const start = Math.max(0, idx - 150);
        const end = Math.min(text.length, idx + 250);
        console.log(text.substring(start, end));
      }
      idx += keyword.length;
    }
    console.log(`\nTotal occurrences of "${keyword}": ${occurrences}`);
  });
}

searchKeywords(['/api/', 'cctv', 'stream', 'webrtc', 'm3u8', 'http', 'lat', 'lng', 'geojson']);
