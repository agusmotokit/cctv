// inspect_magelang_data.cjs
const fs = require('fs');
const path = require('path');

const htmlPath = path.join(__dirname, 'magelangkota_home.html');
const content = fs.readFileSync(htmlPath, 'utf8');

// Search for the element with id="map" and capture its data-locations attribute
const mapRegex = /data-locations='([\s\S]*?)'/i;
const match = content.match(mapRegex);

if (match) {
  const decoded = match[1];
  console.log('Raw match length:', match[1].length);
  console.log('Decoded snippet:', decoded.substring(0, 1000));
  try {
    const locations = JSON.parse(decoded);
    console.log(`Magelang: Found ${locations.length} locations!`);
    fs.writeFileSync(path.join(__dirname, 'magelangkota_raw.json'), JSON.stringify(locations, null, 2));
    console.log('Saved to magelangkota_raw.json');
    if (locations.length > 0) {
      console.log('Sample record:', locations[0]);
    }
  } catch (err) {
    console.error('Failed to parse decoded JSON:', err.message);
  }
} else {
  // Sometimes attributes are in different order, try mapping search
  const match2 = content.match(/data-locations=["']([\s\S]*?)["']/i);
  if (match2) {
    console.log('Found data-locations via secondary regex!');
  } else {
    console.log('Could not find data-locations attribute.');
  }
}
