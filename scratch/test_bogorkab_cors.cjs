const http = require('http');
const https = require('https');

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const url = 'https://itscctv-dishub.bogorkab.go.id/stream/SENTUL1/index.m3u8';

console.log(`Probing CORS for stream: ${url}`);

fetch(url, {
  method: 'GET',
  headers: {
    'Origin': 'https://cctvnusantara.online'
  }
}).then(res => {
  console.log('Status:', res.status);
  console.log('Headers:');
  for (const [key, value] of res.headers.entries()) {
    console.log(`  ${key}: ${value}`);
  }
}).catch(err => {
  console.error('Error fetching stream:', err.message);
});
