const https = require('https');

async function testBlora() {
  const url = 'https://cctv.blorakab.go.id/';
  console.log(`Checking connection to: ${url}`);
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });
    console.log(`Status: ${res.status}`);
    const text = await res.text();
    console.log(`Content Type: ${res.headers.get('content-type')}`);
    if (text.includes('Just a moment...') || text.includes('cf-challenge')) {
      console.log('Blocked by Cloudflare (Challenge Page)');
    } else {
      console.log('Successfully reached page!');
      console.log(text.slice(0, 500));
    }
  } catch (err) {
    console.error('Error:', err.message);
  }
}

testBlora();
