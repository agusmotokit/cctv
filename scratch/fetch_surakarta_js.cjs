const https = require('https');
const fs = require('fs');

const agent = new https.Agent({
  rejectUnauthorized: false
});

async function downloadJS() {
  const url = 'https://ccroom-dishub.surakarta.go.id/build/assets/app-c87f6f19.js';
  console.log(`Downloading JS bundle: ${url}`);
  try {
    const res = await fetch(url, { agent });
    console.log(`Status: ${res.status}`);
    const text = await res.text();
    fs.writeFileSync('scratch/surakarta_app.js', text, 'utf-8');
    console.log('Saved to scratch/surakarta_app.js');

    // Search for coordinate mapping or list of markers
    // Let's search for lat/lng patterns around Surakarta: e.g. lat: -7. or lng: 110.
    // Or arrays of camera locations
    console.log('Scanning for patterns...');
    const occurrences = [];
    const regex = /(-7\.\d+,\s*110\.\d+)/g;
    let match;
    while ((match = regex.exec(text)) !== null) {
      occurrences.push(match[1]);
    }
    console.log(`Found ${occurrences.length} instances of "lat, lng" patterns.`);
    if (occurrences.length > 0) {
      console.log('Sample occurrences:', occurrences.slice(0, 10));
    }
  } catch (err) {
    console.error('Error:', err.message);
  }
}

downloadJS();
