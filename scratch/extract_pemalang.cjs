const fs = require('fs');

function extractPemalang() {
  const html = fs.readFileSync('scratch/pemalang_home.html', 'utf-8');
  
  // Let's find all instances of Hls stream source binding and extract their IDs, stream URLs, and surrounding title text.
  // In the HTML, there are blocks containing <video id="video115" ...> and hls115.loadSource("...")
  // Let's parse all video IDs and matching stream URLs.
  const regex = /hls(\d+)\.loadSource\("([^"]+)"\)/gi;
  let match;
  const cameras = [];

  while ((match = regex.exec(html)) !== null) {
    const id = match[1];
    const streamUrl = match[2];

    // Find the camera name/title near this video element in the HTML
    // We search for a block containing `id="video{id}"` or `id='video{id}'`
    // and try to find headers or titles nearby.
    const videoElemIdx = html.indexOf(`id="video${id}"`);
    let name = '';
    
    if (videoElemIdx !== -1) {
      // Look back e.g. 500 chars to find title or cards
      const context = html.slice(Math.max(0, videoElemIdx - 1000), videoElemIdx);
      // Let's look for tags like <h4>, <h3>, <p>, or card-title
      const titleMatch = context.match(/<(?:h[1-6]|p|div|span)[^>]*class="[^"]*(?:title|header|card-title|loc)[^"]*"[^>]*>([\s\S]*?)<\//i) ||
                         context.match(/<(?:h[1-6]|p|div|span)[^>]*>([\s\S]*?)<\/(?:h[1-6]|p|div|span)>(?:\s*<[^>]+>)*\s*<div[^>]*class="[^"]*card-body/i) ||
                         context.match(/<h\d+[^>]*>([\s\S]*?)<\/h\d+>/gi);
      
      if (titleMatch) {
        // If multiple headers match, get the last one before the video element
        if (Array.isArray(titleMatch)) {
          name = titleMatch[titleMatch.length - 1].replace(/<\/?[^>]+(>|$)/g, "").trim();
        } else {
          name = titleMatch[1].replace(/<\/?[^>]+(>|$)/g, "").trim();
        }
      }
    }

    cameras.push({ id, name, streamUrl });
  }

  console.log(`Found ${cameras.length} cameras via stream loading:`);
  console.log(JSON.stringify(cameras, null, 2));

  // Let's write them to a JSON file
  fs.writeFileSync('scratch/pemalang_cameras_raw.json', JSON.stringify(cameras, null, 2), 'utf-8');
  console.log('Saved raw data to scratch/pemalang_cameras_raw.json');
}

extractPemalang();
