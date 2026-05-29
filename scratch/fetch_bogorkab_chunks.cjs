const fs = require('fs');
const path = require('path');

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const baseUrl = 'https://itscctv-dishub.bogorkab.go.id';
const chunkPath = '/_next/static/chunks/app/page-1bb2415db8bdb558.js';
const url = `${baseUrl}${chunkPath}`;

console.log(`Downloading chunk: ${url}`);

fetch(url, {
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  }
})
.then(res => res.text())
.then(text => {
  console.log(`Saved ${text.length} bytes to scratch/bogor_page_chunk.js`);
  fs.writeFileSync(path.join(__dirname, 'bogor_page_chunk.js'), text);
  
  // Let us search for interesting keywords like "api", "cctv", "stream", "http", "m3u8"
  const keywords = ['/api/', 'cctv', 'stream', 'http', 'm3u8', 'fetch', 'axios', 'get', 'post'];
  keywords.forEach(keyword => {
    const count = (text.match(new RegExp(keyword, 'gi')) || []).length;
    console.log(`Keyword "${keyword}": ${count} matches`);
  });
})
.catch(err => {
  console.error('Error fetching chunk:', err.message);
});
