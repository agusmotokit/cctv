const fs = require('fs');
const path = require('path');

function mergeDepok() {
  const dbPath = path.join(__dirname, '../server/data/cctvData.json');
  const depokPath = path.join(__dirname, 'depok_cameras.json');

  if (!fs.existsSync(dbPath)) {
    console.error('Database file cctvData.json not found at:', dbPath);
    return;
  }
  if (!fs.existsSync(depokPath)) {
    console.error('Depok cameras JSON not found at:', depokPath);
    return;
  }

  // Load existing DB
  const db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
  console.log(`Original database contains ${db.length} cameras.`);

  // Load new Depok cameras
  const depok = JSON.parse(fs.readFileSync(depokPath, 'utf8'));
  console.log(`Loaded ${depok.length} new cameras for Depok.`);

  let addedCount = 0;
  let updatedCount = 0;

  depok.forEach(cam => {
    const index = db.findIndex(c => c.id === cam.id);
    if (index === -1) {
      db.push(cam);
      addedCount++;
    } else {
      db[index] = { ...db[index], ...cam };
      updatedCount++;
    }
  });

  // Save back to DB
  fs.writeFileSync(dbPath, JSON.stringify(db, null, 2), 'utf8');
  console.log(`Merged database successfully!`);
  console.log(`  - Added: ${addedCount}`);
  console.log(`  - Updated/Overwritten: ${updatedCount}`);
  console.log(`  - New database size: ${db.length} cameras.`);
}

mergeDepok();
