const http = require('http');
const https = require('https');

// Disable TLS verification for tests
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const url = 'https://cctv.bandungkab.go.id/e6a89f9987693937d35abb96271464a8/hls/dishub01/kRTdYHeHLZ/s.m3u8';

console.log(`Probing CORS for stream: ${url}`);

fetch(url, {
  method: 'GET',
  headers: {
    'Origin': 'https://cctvnusantara.online' // simulation of third party origin
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
