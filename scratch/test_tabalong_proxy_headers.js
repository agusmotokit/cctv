async function test() {
  const url = 'https://cctv.tabalongkab.go.id/api/stream/hls/cctv-jjsXxQfaTu45Qs2V/index.m3u8';
  
  // Test case 1: with X-Forwarded-Host
  console.log('Test 1: With X-Forwarded-Host');
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'X-Forwarded-Host': 'localhost:5000'
      }
    });
    console.log(`  Status: ${res.status}, Content-Type: ${res.headers.get('content-type')}`);
    const text = await res.text();
    console.log(`  Snippet:`, text.substring(0, 100).replace(/\n/g, ' '));
  } catch (err) {
    console.error(err);
  }

  // Test case 2: with X-Forwarded-For
  console.log('Test 2: With X-Forwarded-For');
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'X-Forwarded-For': '127.0.0.1'
      }
    });
    console.log(`  Status: ${res.status}, Content-Type: ${res.headers.get('content-type')}`);
    const text = await res.text();
    console.log(`  Snippet:`, text.substring(0, 100).replace(/\n/g, ' '));
  } catch (err) {
    console.error(err);
  }
}
test();
