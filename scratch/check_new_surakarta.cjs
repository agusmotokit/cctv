const https = require('https');
const fs = require('fs');

const agent = new https.Agent({
  rejectUnauthorized: false
});

// Decode HTML entities
function htmlDecode(input) {
  return input
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#039;/g, "'")
    .replace(/&nbsp;/g, ' ');
}

async function checkNew() {
  const url = 'https://ccroom-dishub.surakarta.go.id/';
  console.log(`Fetching current page from: ${url}`);
  try {
    const res = await fetch(url, {
      agent,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });
    console.log(`Status: ${res.status}`);
    const html = await res.text();
    
    const regex = /<div\s+id="app"\s+data-page="([^"]+)"/i;
    const match = html.match(regex);
    if (!match) {
      console.error('Could not find data-page attribute');
      return;
    }
    
    const decoded = htmlDecode(match[1]);
    const data = JSON.parse(decoded);
    const list = data.props?.list || [];
    console.log(`Current cameras listed on Surakarta site: ${list.length}`);
    
    // Check our database file
    const db = JSON.parse(fs.readFileSync('server/data/cctvData.json', 'utf8'));
    const existingSurakarta = db.filter(c => c.id.startsWith('surakarta-'));
    console.log(`Cameras in our database for Surakarta: ${existingSurakarta.length}`);
    
    if (list.length === existingSurakarta.length) {
      console.log('No new cameras found. The lists match perfectly!');
    } else {
      console.log('List length mismatch! We might need to update.');
    }
  } catch (err) {
    console.error('Error checking Surakarta:', err.message);
  }
}

checkNew();
