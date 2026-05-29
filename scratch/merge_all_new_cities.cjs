const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, '../server/data/cctvData.json');
const files = [
  { path: 'bandungkab_cameras.json', label: 'Kabupaten Bandung' },
  { path: 'bogorkab_cameras.json', label: 'Kabupaten Bogor' },
  { path: 'indramayukab_cameras.json', label: 'Kabupaten Indramayu' },
  { path: 'sukabumikab_cameras.json', label: 'Kabupaten Sukabumi' },
  { path: 'tasikmalayakab_cameras.json', label: 'Kabupaten Tasikmalaya' },
  { path: 'tasikmalayakota_cameras.json', label: 'Kota Tasikmalaya' }
];

if (!fs.existsSync(dbPath)) {
  console.error('Database file not found at:', dbPath);
  process.exit(1);
}

const db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
console.log(`Current database size: ${db.length} cameras`);

const seenIds = new Set(db.map(c => c.id));
let totalAdded = 0;
let totalDuplicates = 0;

files.forEach(fileInfo => {
  const filePath = path.join(__dirname, fileInfo.path);
  if (!fs.existsSync(filePath)) {
    console.warn(`File not found: ${fileInfo.path}`);
    return;
  }
  
  const cameras = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  console.log(`Loaded ${cameras.length} cameras from ${fileInfo.label}.`);
  
  let added = 0;
  let dups = 0;
  
  cameras.forEach(cam => {
    if (seenIds.has(cam.id)) {
      console.warn(`Duplicate ID skipped in ${fileInfo.label}: ${cam.id}`);
      dups++;
      totalDuplicates++;
    } else {
      db.push(cam);
      seenIds.add(cam.id);
      added++;
      totalAdded++;
    }
  });
  
  console.log(`  -> Added ${added} cameras (skipped ${dups} duplicates).`);
});

console.log(`\n========================================`);
console.log(`Total cameras added: ${totalAdded}`);
console.log(`Total duplicates skipped: ${totalDuplicates}`);
console.log(`New database size: ${db.length} cameras`);
console.log(`========================================`);

fs.writeFileSync(dbPath, JSON.stringify(db, null, 2), 'utf8');
console.log('Database file successfully updated!');
