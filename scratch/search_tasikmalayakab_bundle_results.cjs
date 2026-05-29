const fs = require('fs');
const path = require('path');

const bundlePath = path.join(__dirname, 'tasikmalayakab_bundle.js');
const text = fs.readFileSync(bundlePath, 'utf8');

console.log('Searching for API endpoints and URL paths in the Tasikmalaya Kabupaten bundle...');

// Find all strings starting with "/" or "http" that look like endpoints or URLs
const stringRegex = /"(https?:\/\/[^"]+|[a-zA-Z0-9_\-\/]+\.(?:m3u8|mp4|flv|ts|js|php|json)|(?:\/[a-zA-Z0-9_\-]+)+)"|'(https?:\/\/[^']+|[a-zA-Z0-9_\-\/]+\.(?:m3u8|mp4|flv|ts|js|php|json)|(?:\/[a-zA-Z0-9_\-]+)+)'|`([^`]+)`/g;
let match;
const foundPaths = new Set();

while ((match = stringRegex.exec(text)) !== null) {
  const val = match[1] || match[2] || match[3] || '';
  if (val.includes('api') || val.includes('stream') || val.includes('cctv') || val.includes('tasikmalaya') || val.includes('.php') || val.includes('.json') || val.includes('webrtc') || val.includes('device') || val.includes('camera')) {
    if (val.length < 150) {
      foundPaths.add(val.trim());
    }
  }
}

console.log('Interesting strings found inside bundle:');
console.log([...foundPaths]);
