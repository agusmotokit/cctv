async function testActions() {
  const id = '0b279a76-d4f4-4792-a0a6-a9d39acc5aa5';
  const endpoints = [
    `https://atcs.dishubkotabaru.id/data-cctv/show/${id}`,
    `https://atcs.dishubkotabaru.id/data-cctv/detail/${id}`,
    `https://atcs.dishubkotabaru.id/data-cctv/stream/${id}`,
    `https://atcs.dishubkotabaru.id/data-cctv/get-stream/${id}`,
    `https://atcs.dishubkotabaru.id/data-cctv/play/${id}`,
    `https://atcs.dishubkotabaru.id/data-cctv/live/${id}`,
    `https://atcs.dishubkotabaru.id/data-cctv/url/${id}`,
    `https://atcs.dishubkotabaru.id/data-cctv/view/${id}`,
    `https://atcs.dishubkotabaru.id/data-cctv/stream-url/${id}`,
    `https://atcs.dishubkotabaru.id/data-cctv/get-stream-url/${id}`,
    `https://atcs.dishubkotabaru.id/data-cctv/stream?id=${id}`
  ];

  for (const url of endpoints) {
    console.log('Testing endpoint:', url);
    try {
      const res = await fetch(url, {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        }
      });
      console.log('  Status:', res.status);
      if (res.ok) {
        const text = await res.text();
        console.log('  Response (first 300 chars):', text.substring(0, 300));
      }
    } catch (err) {
      console.error('  Error:', err.message);
    }
  }
}

testActions();
