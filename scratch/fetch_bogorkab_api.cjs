const fs = require('fs');
const path = require('path');

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

async function fetchBogorCctvs() {
  const url = 'https://itscctv-dishub.bogorkab.go.id/api/v3/pv/ldevice';
  console.log(`Fetching Bogor CCTV from API: ${url}`);
  
  try {
    const res = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'x-client-id': 'a194e6ae-d4dd-4b62-a0ac-388922f09303',
        'x-client-secret': 'f430fde38a031fb657a2a7d6f84644a9aed767a4c22314d4b7c565648acc2396',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });
    
    console.log('Status:', res.status, res.statusText);
    const text = await res.text();
    
    if (res.ok) {
      const data = JSON.parse(text);
      console.log(`Success! Received data type: ${typeof data}`);
      // Usually next.js responses wrap it or return array directly
      const list = Array.isArray(data) ? data : (data.data || data.results || data.devices || []);
      console.log(`List length: ${list.length}`);
      
      fs.writeFileSync(path.join(__dirname, 'bogorkab_raw.json'), JSON.stringify(data, null, 2));
      console.log('Saved raw data to scratch/bogorkab_raw.json');
      
      if (list.length > 0) {
        console.log('Sample item:', list[0]);
      } else {
        console.log('Data object keys:', Object.keys(data));
      }
    } else {
      console.log('Response content:', text.slice(0, 1000));
    }
  } catch (err) {
    console.error('Error fetching Bogor CCTV:', err.message);
  }
}

fetchBogorCctvs();
