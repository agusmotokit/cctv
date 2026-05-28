async function testTabalong() {
  const cctvId = 'cctv-jjsXxQfaTu45Qs2V';
  const url = `https://cctv.tabalongkab.go.id/api/stream/hls/${encodeURIComponent(cctvId)}/index.m3u8`;
  console.log('Testing Tabalong stream URL:', url);
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });
    console.log('  Status:', res.status);
    console.log('  Content-Type:', res.headers.get('content-type'));
    console.log('  Headers:', Object.fromEntries(res.headers.entries()));
    if (res.ok) {
      const text = await res.text();
      console.log('  Response snippet:', text.substring(0, 300));
    }
  } catch (err) {
    console.error('  Error:', err.message);
  }
}
testTabalong();
