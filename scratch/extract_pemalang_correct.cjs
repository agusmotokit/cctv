const fs = require('fs');

function extractPemalang() {
  const html = fs.readFileSync('scratch/pemalang_home.html', 'utf-8');
  const regex = /hls(\d+)\.loadSource\("([^"]+)"\)/gi;
  let match;
  const cameras = [];

  while ((match = regex.exec(html)) !== null) {
    const id = match[1];
    const streamUrl = match[2];

    // Find the title *after* the video tag
    const videoElemIdx = html.indexOf(`id="video${id}"`);
    let name = '';
    
    if (videoElemIdx !== -1) {
      // Look forward up to 1000 chars to find the h3 name
      const context = html.slice(videoElemIdx, videoElemIdx + 1500);
      const titleMatch = context.match(/<h3[^>]*class="[^"]*text-white[^"]*"[^>]*>([\s\S]*?)<\/h3>/i) ||
                         context.match(/<h3[^>]*>([\s\S]*?)<\/h3>/i) ||
                         context.match(/<(?:h[1-6]|p|div|span)[^>]*class="[^"]*title[^"]*"[^>]*>([\s\S]*?)<\//i);
      
      if (titleMatch) {
        name = titleMatch[1].replace(/<\/?[^>]+(>|$)/g, "").trim();
      }
    }

    cameras.push({ id, name, streamUrl });
  }

  console.log(`Found ${cameras.length} cameras:`);
  console.log(JSON.stringify(cameras, null, 2));

  fs.writeFileSync('scratch/pemalang_cameras.json', JSON.stringify(cameras, null, 2), 'utf-8');
}

extractPemalang();
