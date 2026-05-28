import fs from 'fs';
import path from 'path';
import { URL } from 'url';

async function main() {
  const url = 'https://atcs.dishubkotabaru.id/';
  console.log('Fetching main page:', url);
  try {
    const res = await fetch(url);
    const html = await res.text();
    
    // Ensure scratch directory exists
    if (!fs.existsSync('scratch')) {
      fs.mkdirSync('scratch');
    }
    fs.writeFileSync('scratch/kotabaru_main.html', html, 'utf8');
    
    // Find all script tags
    const scriptRegex = /src="([^"]+)"/g;
    let match;
    const scripts = [];
    while ((match = scriptRegex.exec(html)) !== null) {
      if (match[1].endsWith('.js')) {
        scripts.push(match[1]);
      }
    }
    console.log('Found script URLs in HTML:', scripts);
    
    // Also find any inline script content
    const inlineScripts = [];
    const inlineRegex = /<script\b[^>]*>([\s\S]*?)<\/script>/gi;
    while ((match = inlineRegex.exec(html)) !== null) {
      if (!match[0].includes('src=')) {
        inlineScripts.push(match[1]);
      }
    }
    console.log(`Found ${inlineScripts.length} inline scripts.`);
    for (let i = 0; i < inlineScripts.length; i++) {
      const content = inlineScripts[i];
      if (content.includes('webrtc') || content.includes('stream') || content.includes('cctv')) {
        console.log(`Inline script ${i} matches:`, content.substring(0, 1000));
      }
    }

    // Fetch and search all external scripts
    for (const scriptUrl of scripts) {
      const fullUrl = scriptUrl.startsWith('http') ? scriptUrl : new URL(scriptUrl, url).toString();
      console.log('Fetching script:', fullUrl);
      const sRes = await fetch(fullUrl);
      const sText = await sRes.text();
      
      const keywords = ['webrtc', 'go2rtc', 'stream', 'hls', 'm3u8', 'live', 'rtsp', 'player', 'video', 'flv', 'ws://', 'wss://', 'data-cctv'];
      for (const kw of keywords) {
        let idx = -1;
        while ((idx = sText.toLowerCase().indexOf(kw, idx + 1)) !== -1) {
          console.log(`[${path.basename(fullUrl)}] Match for "${kw}" at index ${idx}`);
          console.log('Snippet:', sText.substring(Math.max(0, idx - 150), Math.min(sText.length, idx + 300)));
          break; // just log the first one for brevity
        }
      }
    }
  } catch (err) {
    console.error('Error:', err);
  }
}
main();
