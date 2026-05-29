const fs = require('fs');

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

// Test both hostnames
const host1 = 'cctv.atcs-dishubkbb.id';
const host2 = 'cctv.bandungbaratkab.go.id';
const path = '/9512d5e6-2424-44f0-869a-4026ea91b2ed.html';

async function testHost(host) {
  const url = `http://${host}${path}`;
  console.log(`Testing URL: ${url}`);
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      },
      signal: AbortSignal.timeout(5000)
    });
    console.log(`Status: ${res.status}`);
    const text = await res.text();
    console.log(`Length: ${text.length} bytes`);
    console.log('Snippet:', text.substring(0, 500));
  } catch (err) {
    console.error(`Failed: ${err.message}`);
  }
}

async function main() {
  await testHost(host2);
}

main();
