const https = require('https');
const fs = require('fs');

const agent = new https.Agent({
  rejectUnauthorized: false
});

async function probeNusantara() {
  const url = 'https://cctvnusantara.online/';
  console.log(`Probing: ${url}`);
  try {
    const res = await fetch(url, {
      agent,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });
    console.log(`Status: ${res.status}`);
    const text = await res.text();
    fs.writeFileSync('scratch/nusantara_home.html', text, 'utf-8');
    console.log(`Saved home HTML (size: ${text.length} bytes) to scratch/nusantara_home.html`);
    
    // Check if it has next.js data or inline scripts
    if (text.includes('__NEXT_DATA__')) {
      console.log('Detected: Next.js website');
      // Extract Next.js data
      const nextMatch = text.match(/<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/);
      if (nextMatch) {
        fs.writeFileSync('scratch/nusantara_next_data.json', nextMatch[1], 'utf-8');
        console.log('Saved Next.js data to scratch/nusantara_next_data.json');
      }
    } else if (text.includes('__NUXT__')) {
      console.log('Detected: Nuxt.js website');
    } else if (text.includes('id="app"') || text.includes('id="root"')) {
      console.log('Detected: SPA (React/Vue/Angular)');
    } else {
      console.log('Detected: Traditional server-rendered HTML or other');
    }
  } catch (err) {
    console.error('Error probing Nusantara:', err.message);
  }
}

probeNusantara();
