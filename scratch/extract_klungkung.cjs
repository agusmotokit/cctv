const fs = require('fs');

async function main() {
  console.log('Fetching Klungkung page...');
  const res = await fetch('https://dashboard.klungkungkab.go.id/?nav=cctv');
  const t = await res.text();

  // Find all script blocks containing "Streamedian" or player initialization
  const scriptRe = /<script\b[^>]*>([\s\S]*?)<\/script>/gi;
  let m;
  while ((m = scriptRe.exec(t)) !== null) {
    const content = m[1];
    if (content.toLowerCase().includes('streamedian') || content.toLowerCase().includes('rtsp')) {
      console.log('--- Found script block ---');
      console.log(content.trim());
      console.log('--------------------------\n');
    }
  }

  // Find video or object tags in HTML
  const videoRe = /<video\b[^>]*>([\s\S]*?)<\/video>|<div\b[^>]*id=["']map["'][\s\S]*?<\/div>/gi;
  const videoMatches = t.match(/<video\b[^>]*>/gi);
  console.log('Video tags found:', videoMatches);
}

main().catch(e => console.error(e));
