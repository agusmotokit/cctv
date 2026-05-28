const http = require('http');

async function testEndpoint(url, method = 'GET') {
  return new Promise((resolve) => {
    const options = {
      method,
      headers: {
        'User-Agent': 'Mozilla/5.0'
      }
    };
    const req = http.request(url, options, (res) => {
      console.log(`[${method}] ${url} -> Status: ${res.statusCode}`);
      if (res.headers.location) {
        console.log(`  Redirect Location: ${res.headers.location}`);
      }
      resolve(res);
    });
    req.on('error', (err) => {
      console.error(`[${method}] ${url} -> Error: ${err.message}`);
      resolve(null);
    });
    req.end();
  });
}

async function runTests() {
  console.log('--- STARTING LOCAL VERIFICATION ---');
  
  // 1. Check if the database route has the new cameras
  try {
    const res = await fetch('http://localhost:5000/api/cctvs');
    if (res.ok) {
      const cctvs = await res.json();
      console.log(`[GET] http://localhost:5000/api/cctvs -> Total: ${cctvs.length}`);
      const kutim = cctvs.filter(c => c.id.startsWith('kutim-'));
      const bontang = cctvs.filter(c => c.id.startsWith('bontang-'));
      const tapin = cctvs.filter(c => c.id.startsWith('tapin-'));
      console.log(`  - Kutim cameras: ${kutim.length}`);
      console.log(`  - Bontang cameras: ${bontang.length}`);
      console.log(`  - Tapin cameras: ${tapin.length}`);
    } else {
      console.log(`[GET] http://localhost:5000/api/cctvs -> Status: ${res.status}`);
    }
  } catch (err) {
    console.error(`[GET] http://localhost:5000/api/cctvs -> Failed: ${err.message}`);
  }

  // 2. Test Kutim Wakeup Stream Route
  await testEndpoint('http://localhost:5000/api/kutim-stream/polder-2');

  // 3. Test Bontang Stream Route
  await testEndpoint('http://localhost:5000/api/bontang-stream/49Ix0TMzTUxJNjAw0DUxSLXUNTRMMtW1ME5L1U02MDU0T01OSkxKstBLTsw1MBASmL6waSJLkeP7niRZgb_HoqIB/stream.mp4');

  // 4. Test Tapin Stream Proxy Route
  await testEndpoint('http://localhost:5000/tapin-stream/api/stream.m3u8?src=simp3_tiga_rth&mp4=aac');

  console.log('--- VERIFICATION COMPLETED ---');
}

runTests();
