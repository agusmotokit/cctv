const fs = require('fs');
const path = require('path');

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const camerasPath = path.join(__dirname, 'bandungkab_cameras.json');
const cameras = JSON.parse(fs.readFileSync(camerasPath, 'utf8'));

async function checkStream(cam) {
  console.log(`Checking ${cam.name} (${cam.streamUrl})...`);
  try {
    const res = await fetch(cam.streamUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      },
      signal: AbortSignal.timeout(6000)
    });
    console.log(`  -> Status: ${res.status} ${res.statusText}`);
    return res.ok;
  } catch (err) {
    console.log(`  -> Failed: ${err.message}`);
    return false;
  }
}

async function main() {
  let onlineCount = 0;
  for (const cam of cameras) {
    const isOnline = await checkStream(cam);
    if (isOnline) onlineCount++;
  }
  console.log(`\n========================================`);
  console.log(`Kabupaten Bandung: ${onlineCount}/${cameras.length} streams are online.`);
  console.log(`========================================`);
}

main();
