const fs = require('fs');
const path = require('path');

const htmlPath = path.join(__dirname, 'bogorkab_home.html');
const content = fs.readFileSync(htmlPath, 'utf8');

console.log('Searching for script tags and interesting links in bogorkab_home.html...');

// Find all script tags with src
const scriptSrcs = [];
const scriptRegex = /<script\b[^>]*src=["']([^"']+)["']/gi;
let match;
while ((match = scriptRegex.exec(content)) !== null) {
  scriptSrcs.push(match[1]);
}
console.log('Script sources:', scriptSrcs);

// Search for any strings containing "api" or "cctv" or "stream" or "http"
const urlRegex = /https?:\/\/[^\s"'`<>]+/g;
const urls = content.match(urlRegex) || [];
const uniqueUrls = [...new Set(urls)];
console.log('Total URLs found in HTML:', uniqueUrls.length);
console.log('Interesting URLs:', uniqueUrls.filter(u => u.includes('cctv') || u.includes('api') || u.includes('stream') || u.includes('bogorkab')));
