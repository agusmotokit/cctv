async function verify() {
  const proxies = [
    { name: 'Balangan', url: 'http://localhost:5000/balangan-stream/kantor-bupati-utama/index.m3u8' },
    { name: 'Kotabaru', url: 'http://localhost:5000/kotabaru-stream/0b279a76-d4f4-4792-a0a6-a9d39acc5aa5_camera_low/index.m3u8' },
    { name: 'Tabalong', url: 'http://localhost:5000/tabalong-stream/cctv-jjsXxQfaTu45Qs2V/index.m3u8' },
    { name: 'Tanah Bumbu', url: 'http://localhost:5000/tanahbumbu-stream/cctv_ch11/index.m3u8' }
  ];

  for (const p of proxies) {
    console.log(`Verifying proxy for ${p.name}: ${p.url}`);
    try {
      const res = await fetch(p.url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        }
      });
      console.log(`  Status: ${res.status}`);
      console.log(`  Content-Type: ${res.headers.get('content-type')}`);
      console.log(`  Access-Control-Allow-Origin: ${res.headers.get('access-control-allow-origin')}`);
      if (res.ok) {
        const text = await res.text();
        console.log(`  Response snippet (first 150 chars):`);
        console.log(text.substring(0, 150).replace(/\n/g, ' '));
      } else {
        const text = await res.text();
        console.warn(`  Failed payload: ${text.substring(0, 200)}`);
      }
    } catch (err) {
      console.error(`  Error:`, err.message);
    }
  }
}

verify();
