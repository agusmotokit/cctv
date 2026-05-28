const fs = require('fs');

function findCoords() {
  const html = fs.readFileSync('scratch/pemalang_home.html', 'utf-8');
  
  // Look for Leaflet, Google Maps, lat, lng, or coordinate structures
  console.log('Is leaflet loaded?', html.includes('leaflet') || html.includes('L.map') || html.includes('L.marker'));
  
  // Search for any numbers that look like coordinates around Pemalang (-6.89, 109.38)
  const regex = /(-6\.\d+|109\.\d+)/g;
  const matches = html.match(regex);
  if (matches) {
    console.log(`Found ${matches.length} coordinate-like numbers:`);
    console.log(Array.from(new Set(matches)).slice(0, 30));
  } else {
    console.log('No coordinate-like numbers found.');
  }
}

findCoords();
