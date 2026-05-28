import fs from 'fs';

function search() {
  const html = fs.readFileSync('scratch/kotabaru_peta.html', 'utf8');
  console.log('HTML size:', html.length);
  
  const keywords = ['video', 'canvas', 'iframe', 'player', 'webrtc', 'stream', 'hls', 'm3u8', 'rtsp', '172.98'];
  for (const kw of keywords) {
    let count = 0;
    let idx = -1;
    while ((idx = html.toLowerCase().indexOf(kw.toLowerCase(), idx + 1)) !== -1) {
      count++;
      if (count <= 3) {
        console.log(`  [Match "${kw}"] index ${idx}: ...${html.substring(Math.max(0, idx - 50), Math.min(html.length, idx + 100))}...`);
      }
    }
    console.log(`Keyword "${kw}" found ${count} times.`);
  }
}
search();
