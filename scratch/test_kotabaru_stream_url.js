async function checkStream() {
  const id = '0b279a76-d4f4-4792-a0a6-a9d39acc5aa5'; // Camera B - Paal 1
  const urls = [
    `https://atcs.dishubkotabaru.id/live/${id}_camera_low/index.m3u8`,
    `https://atcs.dishubkotabaru.id/live/${id}_camera_high/index.m3u8`,
    `https://atcs.dishubkotabaru.id/live/${id}_camera/index.m3u8`
  ];

  for (const url of urls) {
    console.log('Checking stream URL:', url);
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
        console.log('  Response snippet:', text.substring(0, 300));
      }
    } catch (err) {
      console.error('  Error:', err.message);
    }
  }
}
checkStream();
