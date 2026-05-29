const fs = require('fs');
const path = require('path');

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

async function checkStream(cam) {
  try {
    const res = await fetch(cam.streamUrl, {
      method: 'GET',
      headers: {
        'Origin': 'https://cctvnusantara.online',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      },
      signal: AbortSignal.timeout(6000)
    });
    const cors = res.headers.get('access-control-allow-origin');
    return { ok: res.ok, status: res.status, cors: cors || 'NONE' };
  } catch (err) {
    return { ok: false, error: err.message, cors: 'NONE' };
  }
}

async function checkFile(filename, label) {
  const filePath = path.join(__dirname, filename);
  if (!fs.existsSync(filePath)) {
    console.log(`File not found: ${filename}`);
    return;
  }
  const cameras = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  console.log(`Checking ${cameras.length} streams for ${label}...`);
  
  let online = 0;
  let corsSupported = 0;
  
  // Just check up to 10 cameras to get a quick sample of CORS and status
  const checkList = cameras.slice(0, 10);
  for (let i = 0; i < checkList.length; i++) {
    const cam = checkList[i];
    const res = await checkStream(cam);
    if (res.ok) {
      online++;
      if (res.cors === '*' || res.cors.includes('cctvnusantara.online')) {
        corsSupported++;
      }
    }
    if (i === 0) {
      console.log(`  [Sample Check] First Camera Stream URL: ${cam.streamUrl}`);
      console.log(`  [Sample Check] Status: ${res.ok ? 'SUCCESS' : 'FAILED (' + (res.error || res.status) + ')'}`);
      console.log(`  [Sample Check] CORS header: ${res.cors}`);
    }
  }
  
  console.log(`  -> ${label}: Checked 10 sample cameras.`);
  console.log(`  -> Results: ${online}/10 online, ${corsSupported}/10 support CORS directly.`);
}

async function main() {
  await checkFile('magelangkota_cameras.json', 'Kota Magelang');
  await checkFile('pekalongankab_cameras.json', 'Kabupaten Pekalongan');
}

main();
