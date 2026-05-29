const fs = require('fs');
const path = require('path');

const htmlPath = path.join(__dirname, 'bandungkab_home.html');
const content = fs.readFileSync(htmlPath, 'utf8');

// Use regex to capture the cctvData array block
const regex = /const\s+cctvData\s*=\s*(\[[\s\S]*?\]);/i;
const match = content.match(regex);

if (!match) {
  console.error('Could not find cctvData array in HTML');
  process.exit(1);
}

const arrayStr = match[1];

// Parse the array string. Since it's a JS array literal (not strict JSON), we can use eval in a safe way or a JSON5-like parser.
// In Node.js scratch scripts, using Function is safe enough for localized extraction.
const getArray = new Function(`return ${arrayStr};`);
const cameras = getArray();

console.log(`Parsed ${cameras.length} cameras for Kabupaten Bandung.`);

const formatted = cameras.map((cam, idx) => {
  // Title case formatting for names
  let name = cam.name.trim();
  // If name is all uppercase, convert to Title Case
  if (name === name.toUpperCase()) {
    name = name.toLowerCase().split(' ').map(word => {
      if (word === 'sp') return 'Simpang';
      if (word === 'tol') return 'Tol';
      return word.charAt(0).toUpperCase() + word.slice(1);
    }).join(' ');
  }

  // Generate a unique ID: jbr-bandungkab-[slugified-name]-[id]
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  const id = `jbr-bandungkab-${slug}-${cam.id}`;

  return {
    id,
    name,
    city: 'Kab. Bandung',
    province: 'Jawa Barat',
    lat: cam.coordinates[0],
    lng: cam.coordinates[1],
    streamUrl: cam.streamUrl,
    category: 'traffic',
    status: 'online',
    description: `Pantauan CCTV Lalu Lintas di ${name}, Kabupaten Bandung.`
  };
});

fs.writeFileSync(path.join(__dirname, 'bandungkab_cameras.json'), JSON.stringify(formatted, null, 2));
console.log('Saved to bandungkab_cameras.json');
console.log('Sample record:', formatted[0]);
