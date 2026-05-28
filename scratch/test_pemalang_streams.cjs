async function testStream() {
  const url = 'https://stream.pemalangkab.go.id/masjidagung/masjid1.m3u8';
  console.log(`Testing stream headers: ${url}`);
  try {
    const res = await fetch(url, {
      method: 'GET',
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
