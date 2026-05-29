// fetch_indramayukab_api.cjs
const fs = require('fs');
const path = require('path');

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

async function fetchIndramayu() {
  const url = 'https://cctv.indramayukab.go.id/api/streams';
  console.log(`Fetching Indramayu CCTV from: ${url}`);
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json'
      }
    });
    console.log('Status:', res.status, res.statusText);
    const text = await res.text();
    if (res.ok) {
      const data = JSON.parse(text);
      console.log(`Successfully fetched ${data.length || Object.keys(data).length} cameras.`);
      fs.writeFileSync(path.join(__dirname, 'indramayukab_raw.json'), JSON.stringify(data, null, 2));
      console.log('Saved to scratch/indramayukab_raw.json');
      if (Array.isArray(data) && data.length > 0) {
        console.log('Sample record:', data[0]);
      } else {
        console.log('Data sample:', text.substring(0, 500));
      }
    } else {
      console.log('Error content:', text.slice(0, 1000));
    }
  } catch (err) {
    console.error('Error:', err.message);
  }
}

fetchIndramayu();
