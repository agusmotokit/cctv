const fs = require('fs');
const path = require('path');

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

async function fetchTasik() {
  const url = 'https://cctv.tasikmalayakab.go.id/api/cameras/enabled';
  console.log(`Fetching Tasikmalaya Kab CCTV from: ${url}`);
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
      console.log(`Successfully fetched data. Keys:`, Object.keys(data));
      const list = data.Data || [];
      console.log(`Cameras list length: ${list.length}`);
      fs.writeFileSync(path.join(__dirname, 'tasikmalayakab_raw.json'), JSON.stringify(data, null, 2));
      console.log('Saved to scratch/tasikmalayakab_raw.json');
      if (list.length > 0) {
        console.log('Sample record:', list[0]);
      }
    } else {
      console.log('Error content:', text.slice(0, 1000));
    }
  } catch (err) {
    console.error('Error:', err.message);
  }
}

fetchTasik();
