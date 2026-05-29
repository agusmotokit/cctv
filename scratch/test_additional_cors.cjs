const https = require('https');

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const testStreams = {
  'Kabupaten Indramayu': 'https://streamer.indramayukab.go.id/memfs/1791a3e3-6b6d-4f81-b614-80f400d0bbe7_output_0.m3u8',
  'Kabupaten Sukabumi': 'https://cctv-dishub.sukabumikab.go.id/hls/exittol/stream.m3u8',
  'Kabupaten Tasikmalaya': 'https://cctv.tasikmalayakab.go.id/live/cam9/index.m3u8',
  'Kota Tasikmalaya': 'https://atcs.tasikmalayakota.go.id/camera/bataskotaarahbandung.m3u8'
};

async function testCors(label, url) {
  console.log(`\nTesting CORS for ${label}: ${url}`);
  try {
    const res = await fetch(url, {
      method: 'GET',
      headers: {
        'Origin': 'https://cctvnusantara.online',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      },
      signal: AbortSignal.timeout(6000)
    });
    console.log(`  Status: ${res.status}`);
    const cors = res.headers.get('access-control-allow-origin');
    console.log(`  Access-Control-Allow-Origin: ${cors || 'NONE'}`);
  } catch (err) {
    console.log(`  Failed to connect: ${err.message}`);
  }
}

async function main() {
  for (const [label, url] of Object.entries(testStreams)) {
    await testCors(label, url);
  }
}

main();
