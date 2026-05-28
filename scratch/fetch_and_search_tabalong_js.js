import fs from 'fs';
import path from 'path';

async function searchTabalongJS() {
  const assets = [
    '/assets/index-jD3o9B1p.js',
    '/assets/_landing-B_1tMaaK.js',
    '/assets/main-nav-BJsIOG_M.js',
    '/assets/mode-toggle-B1EGDxw6.js',
    '/assets/_landing-CdV-luHI.js',
    '/assets/dist-CpxpgrrN.js',
    '/assets/dist-BMVFO2JJ.js',
    '/assets/dist-dwlfKUYS.js',
    '/assets/dist-DdXDWFvg.js',
    '/assets/useSuspenseQuery-4dDs9vqo.js',
    '/assets/search-Cca_fW1m.js',
    '/assets/input-C-EbzVzg.js'
  ];

  for (const asset of assets) {
    const url = `https://cctv.tabalongkab.go.id${asset}`;
    console.log(`Fetching Tabalong asset: ${url}`);
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

      const keywords = ['webrtc', 'go2rtc', 'm3u8', 'stream', 'hls', 'video', 'canvas', 'flv', 'mpegts', 'ws://', 'wss://', 'rtsp', 'transcode', 'api/'];
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
      console.error(`  Error for asset ${asset}:`, err.message);
    }
  }
}

searchTabalongJS();
