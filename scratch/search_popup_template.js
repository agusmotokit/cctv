import fs from 'fs';

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
    try {
      const res = await fetch(url);
      const text = await res.text();
      
      const keywords = ['name_cctv', 'url_rtsp', 'pid_ffmpeg', 'name_point', 'desc_cctv', 'dishubkotabaru'];
      for (const kw of keywords) {
        const idx = text.toLowerCase().indexOf(kw.toLowerCase());
        if (idx !== -1) {
          console.log(`[Match in ${chunk}] Found "${kw}" at index ${idx}`);
          console.log('Snippet:', text.substring(Math.max(0, idx - 150), Math.min(text.length, idx + 350)));
        }
      }
    } catch (err) {
      console.error(`Error fetching ${chunk}:`, err.message);
    }
  }
}

search();
