import fs from 'fs';
import path from 'path';

async function search() {
  const chunks = [
    '756-v0.1.2.b5e023c421b4757fe302.min.js',
    '472-v0.1.2.3c2cfa56e634e6de12fa.min.js',
    '974-v0.1.2.847cec97e3773ac27af8.min.js',
    '327-v0.1.2.418751555c992220f0bb.min.js',
    '267-v0.1.2.5d32cfa31e6e316b6bd1.min.js',
    'i-v0.1.2.aaab8b2cac8c7485cebe.min.js'
  ];

  for (const chunk of chunks) {
    const url = `https://atcs.dishubkotabaru.id/apps/${chunk}`;
    console.log(`Searching chunk: ${chunk}`);
    try {
      const res = await fetch(url);
      const text = await res.text();
      
      const keywords = [
        'webrtc', 'go2rtc', 'mpegts', 'flv', 'videojs', 'hls', 'm3u8',
        'rtsp', 'stream', 'play', 'localhost', '172.', 'video', 'canvas',
        'ws://', 'wss://', 'http://', 'https://'
      ];
      
      for (const kw of keywords) {
        let idx = -1;
        let count = 0;
        while ((idx = text.toLowerCase().indexOf(kw, idx + 1)) !== -1) {
          count++;
          if (count <= 3) {
            console.log(`  [Match "${kw}"] index ${idx}: ...${text.substring(Math.max(0, idx - 80), Math.min(text.length, idx + 120))}...`);
          }
        }
        if (count > 3) {
          console.log(`  [Match "${kw}"] total occurrences: ${count}`);
        }
      }
    } catch (err) {
      console.error(`  Error fetching ${chunk}:`, err.message);
    }
  }
}

search();
