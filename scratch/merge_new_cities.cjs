const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, '../server/data/cctvData.json');
const bandungPath = path.join(__dirname, 'bandungkab_cameras.json');
const bogorPath = path.join(__dirname, 'bogorkab_cameras.json');

if (!fs.existsSync(dbPath)) {
  console.error('Database file not found at:', dbPath);
  process.exit(1);
}

const db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
console.log(`Current database size: ${db.length} cameras`);

const newCams = [];

if (fs.existsSync(bandungPath)) {
  const bandungCams = JSON.parse(fs.readFileSync(bandungPath, 'utf8'));
  console.log(`Loaded ${bandungCams.length} cameras from Kabupaten Bandung.`);
  newCams.push(...bandungCams);
} else {
  console.warn('Bandung Kab cameras file not found.');
}

if (fs.existsSync(bogorPath)) {
  const bogorCams = JSON.parse(fs.readFileSync(bogorPath, 'utf8'));
  console.log(`Loaded ${bogorCams.length} cameras from Kabupaten Bogor.`);
  newCams.push(...bogorCams);
} else {
  console.warn('Bogor Kab cameras file not found.');
}

// Check duplicates and append
let duplicates = 0;
const seenIds = new Set(db.map(c => c.id));

newCams.forEach(cam => {
  if (seenIds.has(cam.id)) {
    console.warn(`Duplicate camera ID skipped: ${cam.id}`);
    duplicates++;
  } else {
    db.push(cam);
    seenIds.add(cam.id);
  }
});

console.log(`Appended ${newCams.length - duplicates} cameras (skipped ${duplicates} duplicates).`);
console.log(`New database size: ${db.length} cameras`);

fs.writeFileSync(dbPath, JSON.stringify(db, null, 2), 'utf8');
console.log('Database updated successfully!');
