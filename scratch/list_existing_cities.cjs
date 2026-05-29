const fs = require('fs');

function listCities() {
  const db = JSON.parse(fs.readFileSync('server/data/cctvData.json', 'utf8'));
  
  const regions = {};
  
  db.forEach(cam => {
    const prov = cam.province || 'Unknown Province';
    const city = cam.city || 'Unknown City';
    
    if (!regions[prov]) {
      regions[prov] = new Set();
    }
    regions[prov].add(city);
  });
  
  console.log('=== integrated regions ===');
  for (const prov of Object.keys(regions).sort()) {
    console.log(`${prov}:`);
    const cities = Array.from(regions[prov]).sort();
    cities.forEach(city => {
      console.log(`  - ${city}`);
    });
  }
}

listCities();
