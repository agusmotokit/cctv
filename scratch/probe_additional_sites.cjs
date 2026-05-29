const fs = require('fs');
const path = require('path');

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

async function fetchUrl(url, name) {
  console.log(`\n========================================`);
  console.log(`Fetching ${name}: ${url}`);
  console.log(`========================================`);
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5'
      },
      signal: AbortSignal.timeout(15000)
    });
    console.log(`Status: ${res.status} ${res.statusText}`);
    const text = await res.text();
    const destPath = path.join(__dirname, `${name}_home.html`);
    fs.writeFileSync(destPath, text);
    console.log(`Saved ${text.length} bytes to ${destPath}`);
    
    // Print first 500 chars and search for common patterns
    console.log('Snippet:', text.substring(0, 500));
    
    // Check if there are script sources, iframes or mentions of hls/m3u8/rtsp
    const keywords = ['iframe', 'video', 'm3u8', 'hls', 'flv', 'rtsp', 'stream', 'cctv', 'lat', 'lng', 'geojson', 'marker', 'api'];
    keywords.forEach(keyword => {
      const regex = new RegExp(keyword, 'gi');
      const matches = text.match(regex);
      console.log(`Keyword "${keyword}": ${matches ? matches.length : 0} matches`);
    });
  } catch (err) {
    console.error(`Error fetching ${name}:`, err.message);
  }
}

async function main() {
  await fetchUrl('https://socakaton.cirebonkab.go.id/', 'cirebonkab');
  await fetchUrl('https://cctv.indramayukab.go.id/', 'indramayukab');
  await fetchUrl('https://cctv-dishub.sukabumikab.go.id/', 'sukabumikab');
  await fetchUrl('https://cctv.tasikmalayakab.go.id/', 'tasikmalayakab');
  await fetchUrl('https://atcs.tasikmalayakota.go.id/', 'tasikmalayakota');
}

main();
