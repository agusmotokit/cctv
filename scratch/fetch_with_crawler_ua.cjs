const https = require('https');
const fs = require('fs');

const agent = new https.Agent({
  rejectUnauthorized: false
});

async function fetchWithGooglebot() {
  const url = 'https://cctvnusantara.online/api/cctvs';
  console.log(`Fetching from production API with Googlebot User-Agent: ${url}`);
  try {
    const res = await fetch(url, {
      agent,
      headers: {
        'User-Agent': 'Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; Googlebot/2.1; +http://www.google.com/bot.html) Safari/537.36',
        'Accept': 'application/json'
      }
    });
    console.log(`Status: ${res.status}`);
    const text = await res.text();
    
    if (res.ok) {
      try {
        const data = JSON.parse(text);
        console.log(`SUCCESS! Parsed ${data.length} cameras.`);
        fs.writeFileSync('scratch/nusantara_cameras_googlebot.json', JSON.stringify(data, null, 2), 'utf-8');
      } catch (err) {
        console.log('Failed to parse JSON. Snippet:');
        console.log(text.slice(0, 500));
      }
    } else {
      console.log(`Failed. Status: ${res.status}. Snippet:`);
      console.log(text.slice(0, 500));
    }
  } catch (err) {
    console.error('Error:', err.message);
  }
}

fetchWithGooglebot();
