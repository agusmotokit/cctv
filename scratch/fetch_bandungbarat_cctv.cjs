const fs = require('fs');
const path = require('path');

// Disable TLS validation since government sites often have SSL/TLS issues
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const url = 'https://atcs.bandungbaratkab.go.id/get-cctv';

console.log(`Fetching Bandung Barat CCTV from: ${url}`);

fetch(url, {
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'application/json, text/plain, */*'
  }
})
.then(res => res.json())
.then(data => {
  console.log('Successfully received data.');
  console.log('Status:', data.status);
  console.log('Length:', data.data ? data.data.length : 'no data array');
  
  if (data.data && data.data.length > 0) {
    fs.writeFileSync(path.join(__dirname, 'bandungbarat_raw.json'), JSON.stringify(data.data, null, 2));
    console.log('Saved raw data to bandungbarat_raw.json');
    console.log('Sample item:', data.data[0]);
  }
})
.catch(err => {
  console.error('Error fetching data:', err.message);
});
