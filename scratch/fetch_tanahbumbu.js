import fs from 'fs';

async function fetchTanahBumbu() {
  const url = 'https://atcs.tanahbumbukab.go.id/';
  console.log('Fetching Tanah Bumbu page:', url);
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });
    const html = await res.text();
    
    if (!fs.existsSync('scratch')) {
      fs.mkdirSync('scratch');
    }
    fs.writeFileSync('scratch/tanahbumbu_main.html', html, 'utf8');
    console.log('Saved Tanah Bumbu HTML, size:', html.length);

    // Let's search for keywords
    const keywords = ['cctv', 'lat', 'lng', 'marker', 'map', 'webrtc', 'stream', 'hls', 'm3u8', 'rtsp', 'iframe'];
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

    // List script tags
    const regex = /<script\b[^>]*>([\s\S]*?)<\/script>/gi;
    let match;
    let count = 0;
    while ((match = regex.exec(html)) !== null) {
      count++;
      if (match[0].includes('src=')) {
        console.log(`Script ${count} src:`, match[0]);
      } else {
        console.log(`Script ${count} inline snippet (first 150 chars):`, match[1].trim().substring(0, 150));
      }
    }
  } catch (err) {
    console.error(err);
  }
}

fetchTanahBumbu();
