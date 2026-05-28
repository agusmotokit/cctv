import fs from 'fs';
import path from 'url';

async function searchLazy() {
  const chunks = [
    { id: '225', hash: '7ae0f0137fbae9624f59' },
    { id: '251', hash: '229d021f2b18ab5b99ee' },
    { id: '470', hash: '3405169e1877493e7147' },
    { id: '507', hash: '1036bf5b7968e6710a9e' },
    { id: '585', hash: 'af3b789112c14ebc4568' },
    { id: '650', hash: '6706b4847d8052ba1081' },
    { id: '902', hash: 'c17ab0492a3c324c5f15' }
  ];

  for (const chunk of chunks) {
    const filename = `${chunk.id}-v0.1.2.${chunk.hash}.min.js`;
    const url = `https://atcs.dishubkotabaru.id/apps/${filename}`;
    console.log(`Checking lazy chunk ${chunk.id}: ${url}`);
    
    try {
      const res = await fetch(url);
      if (!res.ok) {
        console.warn(`  Failed to fetch ${chunk.id}: ${res.status}`);
        continue;
      }
      const text = await res.text();
      fs.writeFileSync(`scratch/chunk_${chunk.id}.js`, text, 'utf8');
      console.log(`  Saved scratch/chunk_${chunk.id}.js, size: ${text.length}`);

      const keywords = ['rtsp', 'username_rtsp', 'password_rtsp', 'pid_ffmpeg', 'webrtc', 'go2rtc', 'm3u8', 'stream', 'hls', 'video', 'canvas', 'flv', 'mpegts', 'ws://', 'wss://'];
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
      console.error(`  Error for chunk ${chunk.id}:`, err.message);
    }
  }
}

searchLazy();
