const fs = require('fs');
const https = require('https');

// Create agent to bypass certificate issues if any
const agent = new https.Agent({
  rejectUnauthorized: false
});

async function fetchKutim() {
  const url = 'https://apicctv.kutaitimurkab.go.id/api/cctv/public?page=1&limit=10000';
  console.log(`Fetching Kutai Timur CCTV from: ${url}`);
  try {
    const res = await fetch(url, { agent });
    console.log(`Response status: ${res.status}`);
    const data = await res.json();
    console.log(`Fetched ${data?.data?.length || 0} cameras.`);
    fs.writeFileSync('scratch/kutim_cameras_raw.json', JSON.stringify(data, null, 2));
    console.log('Saved to scratch/kutim_cameras_raw.json');
  } catch (err) {
    console.error('Error fetching Kutai Timur:', err);
  }
}

fetchKutim();
