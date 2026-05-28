async function test() {
  const url = 'https://cctv.tabalongkab.go.id/api/stream/hls/cctv-jjsXxQfaTu45Qs2V/index.m3u8';
  
  // Test case 1: Direct fetch with standard user agent
  console.log('Test 1: Standard User-Agent');
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });
    console.log(`  Status: ${res.status}, Content-Type: ${res.headers.get('content-type')}`);
    const text = await res.text();
    console.log(`  Snippet:`, text.substring(0, 100).replace(/\n/g, ' '));
  } catch (err) {
    console.error(err);
  }

  // Test case 2: Fetch WITHOUT user agent
  console.log('Test 2: No User-Agent');
  try {
    const res = await fetch(url);
    console.log(`  Status: ${res.status}, Content-Type: ${res.headers.get('content-type')}`);
    const text = await res.text();
    console.log(`  Snippet:`, text.substring(0, 100).replace(/\n/g, ' '));
  } catch (err) {
    console.error(err);
  }
}
test();
