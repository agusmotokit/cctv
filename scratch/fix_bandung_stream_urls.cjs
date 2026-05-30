const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, '../server/data/cctvData.json');
if (!fs.existsSync(dbPath)) {
  console.error('DB not found!');
  process.exit(1);
}

const db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
let count = 0;

db.forEach(c => {
  if (c.id.startsWith('bandung-pelindung-')) {
    let url = c.streamUrl;
    // Normalize typo single slashes or full URLs
    url = url.replace(/^https?:\/+(pelindung\.bandung\.go\.id(:3443)?)/i, '');
    if (!url.startsWith('/')) {
      url = '/' + url;
    }
    // Prepend our proxy prefix
    if (url.startsWith('/video/')) {
      c.streamUrl = '/bandung-pelindung-stream' + url;
    } else {
      c.streamUrl = '/bandung-pelindung-stream' + url;
    }
    count++;
  }
});

fs.writeFileSync(dbPath, JSON.stringify(db, null, 2), 'utf8');
console.log(`Successfully normalized streamUrl for ${count} Bandung Pelindung cameras in database.`);
