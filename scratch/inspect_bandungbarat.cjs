const fs = require('fs');
const path = require('path');

const htmlPath = path.join(__dirname, 'bandungbarat_home.html');
const content = fs.readFileSync(htmlPath, 'utf8');

console.log('Searching for scripts, iframe tags, and Leaflet configuration...');

// Log all iframe elements
const iframeRegex = /<iframe\b[^>]*>([\s\S]*?)<\/iframe>/gi;
const iframeTags = content.match(/<iframe\b[^>]*>/gi);
console.log('Iframe tags found:', iframeTags);

// Search for L.marker, L.map, coordinates or links in the script tags
const scriptRegex = /<script\b[^>]*>([\s\S]*?)<\/script>/gi;
let match;
let count = 0;

while ((match = scriptRegex.exec(content)) !== null) {
  const scriptContent = match[1];
  count++;
  if (scriptContent.includes('marker') || scriptContent.includes('map') || scriptContent.includes('iframe') || scriptContent.includes('cctv')) {
    console.log(`\nScript #${count} (Length: ${scriptContent.length}):`);
    console.log(scriptContent.substring(0, 1500));
    if (scriptContent.length > 1500) {
      console.log('... [truncated] ...');
    }
  }
}
