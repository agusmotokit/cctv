async function test() {
  const url = 'https://cctv.tabalongkab.go.id/api/stream/hls/cctv-jjsXxQfaTu45Qs2V/index.m3u8';
  
  const headersList = [
    {
      name: 'All headers sent by proxy',
      headers: {
        host: 'cctv.tabalongkab.go.id',
        connection: 'keep-alive',
        'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        accept: '*/*',
        'accept-language': '*',
        'sec-fetch-mode': 'cors',
        'accept-encoding': 'gzip, deflate',
        origin: 'https://cctv.tabalongkab.go.id',
        referer: 'https://cctv.tabalongkab.go.id/'
      }
    },
    {
      name: 'No sec-fetch-mode',
      headers: {
        host: 'cctv.tabalongkab.go.id',
        connection: 'keep-alive',
        'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        accept: '*/*',
        'accept-language': '*',
        'accept-encoding': 'gzip, deflate',
        origin: 'https://cctv.tabalongkab.go.id',
        referer: 'https://cctv.tabalongkab.go.id/'
      }
    },
    {
      name: 'No origin/referer/sec-fetch-mode',
      headers: {
        host: 'cctv.tabalongkab.go.id',
        connection: 'keep-alive',
        'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        accept: '*/*',
        'accept-encoding': 'gzip, deflate'
      }
    }
  ];

  for (const t of headersList) {
    console.log(`Running test: ${t.name}`);
    try {
      const res = await fetch(url, {
        headers: t.headers,
        redirect: 'manual' // Do not follow redirects automatically
      });
      console.log(`  Status: ${res.status}, Location header: ${res.headers.get('location')}, Content-Type: ${res.headers.get('content-type')}`);
    } catch (err) {
      console.error('  Error:', err.message);
    }
  }
}
test();
