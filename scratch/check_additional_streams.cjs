const fs = require('fs');
const path = require('path');

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

async function checkStream(cam) {
  try {
    const res = await fetch(cam.streamUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      },
      signal: AbortSignal.timeout(5000)
    });
    return res.ok;
  } catch (err) {
    return false;
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
  for (const cam of cameras) {
    const ok = await checkStream(cam);
    if (ok) online++;
  }
  console.log(`  -> ${label}: ${online}/${cameras.length} streams are online.`);
}

async function main() {
  await checkFile('indramayukab_cameras.json', 'Kabupaten Indramayu');
  await checkFile('sukabumikab_cameras.json', 'Kabupaten Sukabumi');
  await checkFile('tasikmalayakab_cameras.json', 'Kabupaten Tasikmalaya');
  await checkFile('tasikmalayakota_cameras.json', 'Kota Tasikmalaya');
}

main();
