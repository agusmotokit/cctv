const https = require('https');

// Create agent in case of self-signed certificate issues
const agent = new https.Agent({
  rejectUnauthorized: false
});

async function testStream() {
  const url = 'https://surakarta.atcsindonesia.info:8086/camera/Agas.flv';
  console.log(`Testing Surakarta FLV stream: ${url}`);
  try {
    const res = await fetch(url, {
      method: 'GET',
      agent,
      headers: {
        'User-Agent': 'Mozilla/5.0'
      }
    });
    console.log(`Status: ${res.status}`);
    console.log('Headers:');
    for (const [key, value] of res.headers.entries()) {
      console.log(`  ${key}: ${value}`);
    }
  } catch (err) {
    console.error('Error fetching stream:', err.message);
  }
}

testStream();
