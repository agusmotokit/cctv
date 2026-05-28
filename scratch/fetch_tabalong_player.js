import fs from 'fs';
import path from 'path';

async function fetchPlayer() {
  const assets = [
    '/assets/stream-url-Co7Bjr8M.js',
    '/assets/video-player-wrapper-BkAQC7W5.js',
    '/assets/use-record-play-CRfd50XD.js'
  ];

  for (const asset of assets) {
    const url = `https://cctv.tabalongkab.go.id${asset}`;
    console.log(`Fetching: ${url}`);
    try {
      const res = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        }
      });
      if (!res.ok) {
        console.warn(`  Failed: ${res.status}`);
        continue;
      }
      const text = await res.text();
      fs.writeFileSync(`scratch/tabalong_${path.basename(asset)}`, text, 'utf8');
      console.log(`  Saved scratch/tabalong_${path.basename(asset)}, size: ${text.length}`);

      const keywords = ['http', 'stream', 'hls', 'webrtc', 'mediamtx', 'rtsp', 'transcode', 'play', 'video', 'url', 'id', 'slug'];
      for (const kw of keywords) {
        let idx = -1;
        while ((idx = text.toLowerCase().indexOf(kw.toLowerCase(), idx + 1)) !== -1) {
          console.log(`    [Match "${kw}"] index ${idx}: ...${text.substring(Math.max(0, idx - 80), Math.min(text.length, idx + 150))}...`);
          break; // just print the first match for brevity
        }
      }
    } catch (err) {
      console.error(`  Error:`, err.message);
    }
  }
}

fetchPlayer();
