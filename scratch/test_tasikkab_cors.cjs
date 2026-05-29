const https = require('https');

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

// Test cam8 (JALAN KADIPATEN ARAH TASIK) and cam1 (SIMPANG CIPASUNG)
const testUrls = [
  'https://cctv.tasikmalayakab.go.id/live/cam8/index.m3u8',
  'https://cctv.tasikmalayakab.go.id/live/cam1/index.m3u8'
];

async function test(url) {
  console.log(`Testing CORS for: ${url}`);
  try {
    const res = await fetch(url, {
      method: 'GET',
      headers: {
        'Origin': 'https://cctvnusantara.online',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      },
      signal: AbortSignal.timeout(6000)
    });
    console.log(`  Status: ${res.status}`);
    const cors = res.headers.get('access-control-allow-origin');
    console.log(`  Access-Control-Allow-Origin: ${cors || 'NONE'}`);
  } catch (err) {
    console.log(`  Failed: ${err.message}`);
  }
}

async function main() {
  for (const url of testUrls) {
    await test(url);
  }
}

main();
