const https = require('https');
const fs = require('fs');

const agent = new https.Agent({
  rejectUnauthorized: false
});

async function fetchNusantaraApi() {
  const url = 'https://cctvnusantara.online/api/cctvs';
  console.log(`Fetching from production API: ${url}`);
  try {
    const res = await fetch(url, {
      agent,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json'
      }
    });
    console.log(`Status: ${res.status}`);
    const text = await res.text();
    
    if (res.ok) {
      try {
        const data = JSON.parse(text);
        console.log(`Successfully fetched ${data.length} cameras from production API.`);
        fs.writeFileSync('scratch/nusantara_cameras_production.json', JSON.stringify(data, null, 2), 'utf-8');
        console.log('Saved to scratch/nusantara_cameras_production.json');
      } catch (err) {
        console.error('Failed to parse response as JSON. Snippet:');
        console.log(text.slice(0, 500));
      }
    } else {
      console.log(`Response status: ${res.status}. Snippet:`);
      console.log(text.slice(0, 500));
    }
  } catch (err) {
    console.error('Error fetching API:', err.message);
  }
}

fetchNusantaraApi();
