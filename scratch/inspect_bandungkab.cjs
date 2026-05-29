const fs = require('fs');
const path = require('path');

const htmlPath = path.join(__dirname, 'bandungkab_home.html');
const content = fs.readFileSync(htmlPath, 'utf8');

console.log('Searching for scripts containing camera arrays, coordinates, marker references...');

// Let's write a regex search or extract script elements
const scriptRegex = /<script\b[^>]*>([\s\S]*?)<\/script>/gi;
let match;
let count = 0;

while ((match = scriptRegex.exec(content)) !== null) {
  const scriptContent = match[1];
  count++;
  if (scriptContent.includes('m3u8') || scriptContent.includes('marker') || scriptContent.includes('lat') || scriptContent.includes('cctv')) {
    console.log(`\nScript #${count} (Length: ${scriptContent.length}):`);
    console.log(scriptContent.substring(0, 1000));
    if (scriptContent.length > 1000) {
      console.log('... [truncated] ...');
    }
  }
}
