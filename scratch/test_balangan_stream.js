async function testBalangan() {
  const url = 'https://cctv.balangankab.go.id/hls/kantor-bupati-utama/index.m3u8';
  console.log('Testing Balangan HLS stream:', url);
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });
    console.log('  Status:', res.status);
    console.log('  Headers:', Object.fromEntries(res.headers.entries()));
    if (res.ok) {
      const text = await res.text();
      console.log('  Response content:');
      console.log(text);
    }
  } catch (err) {
    console.error('  Error:', err.message);
  }
}

testBalangan();
