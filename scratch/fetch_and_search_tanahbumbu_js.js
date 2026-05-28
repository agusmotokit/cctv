import fs from 'fs';
import path from 'path';

async function searchTanahBumbuJS() {
  const url = 'https://atcs.tanahbumbukab.go.id/build/assets/app-BSbaAyNn.js';
  console.log('Fetching Tanah Bumbu bundle:', url);
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });
    if (!res.ok) {
      console.warn(`  Failed: ${res.status}`);
      return;
    }
    const text = await res.text();
    fs.writeFileSync('scratch/tanahbumbu_app.js', text, 'utf8');
    console.log('Saved app.js, size:', text.length);

    const keywords = ['m3u8', 'stream', 'hls', 'video', 'canvas', 'flv', 'mpegts', 'ws://', 'wss://', 'rtsp', 'transcode', 'api/', '/cctv', 'url', 'play', 'localhost', '103.'];
    for (const kw of keywords) {
      let idx = -1;
      let count = 0;
      while ((idx = text.toLowerCase().indexOf(kw.toLowerCase(), idx + 1)) !== -1) {
        count++;
        if (count <= 3) {
          console.log(`    [Match "${kw}"] index ${idx}: ...${text.substring(Math.max(0, idx - 80), Math.min(text.length, idx + 150))}...`);
        }
      }
      if (count > 0) {
        console.log(`    Total occurrences of "${kw}": ${count}`);
      }
    }
  } catch (err) {
    console.error(err);
  }
}

searchTanahBumbuJS();
