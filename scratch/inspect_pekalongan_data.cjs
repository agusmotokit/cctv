const fs = require('fs');
const path = require('path');

const htmlPath = path.join(__dirname, 'pekalongankab_home.html');
const content = fs.readFileSync(htmlPath, 'utf8');

console.log('Searching for camera data array in pekalongankab_home.html...');

// Look for inline script containing arrays, objects, or fetches
const scriptRegex = /<script\b[^>]*>([\s\S]*?)<\/script>/gi;
let match;
let count = 0;

while ((match = scriptRegex.exec(content)) !== null) {
  const scriptContent = match[1];
  count++;
  if (scriptContent.includes('const cctv') || scriptContent.includes('var cctv') || scriptContent.includes('let cctv') || scriptContent.includes('cctvs') || scriptContent.includes('data') || scriptContent.includes('fetch') || scriptContent.includes('$.ajax') || scriptContent.includes('axios')) {
    console.log(`\nScript #${count} (Length: ${scriptContent.length}) matches:`);
    // Print lines containing key terms
    const lines = scriptContent.split('\n');
    lines.forEach((line, lIdx) => {
      if (line.includes('cctv') || line.includes('marker') || line.includes('url') || line.includes('fetch') || line.includes('ajax') || line.includes('lat') || line.includes('lng') || line.includes('data')) {
        console.log(`  Line ${lIdx + 1}: ${line.trim()}`);
      }
    });
  }
}
