const fs = require('fs');

async function testFetch(headers, name) {
  console.log(`\nTesting with: ${name}`);
  try {
    const res = await fetch('https://socakaton.cirebonkab.go.id/', {
      headers,
      signal: AbortSignal.timeout(5000)
    });
    console.log(`Status: ${res.status} ${res.statusText}`);
    const text = await res.text();
    console.log(`Body length: ${text.length} bytes`);
    if (text.includes('SafeLine')) {
      console.log('Result: STILL BLOCKED BY SAFELINE WAF');
    } else {
      console.log('Result: SUCCESS! Bypassed SafeLine!');
      fs.writeFileSync('scratch/cirebonkab_success.html', text);
      console.log('Snippet:', text.substring(0, 500));
    }
  } catch (err) {
    console.error('Error:', err.message);
  }
}

async function main() {
  // Test 1: No User-Agent
  await testFetch({}, 'No Headers');
  
  // Test 2: Raw curl-like user-agent
  await testFetch({
    'User-Agent': 'curl/7.68.0',
    'Accept': '*/*'
  }, 'curl');

  // Test 3: Common Android Chrome
  await testFetch({
    'User-Agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
    'Accept-Language': 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7'
  }, 'Mobile Chrome');
}

main();
