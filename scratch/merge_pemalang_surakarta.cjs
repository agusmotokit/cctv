const fs = require('fs');
const path = require('path');

function mergeCctvs() {
  const dbPath = 'server/data/cctvData.json';
  if (!fs.existsSync(dbPath)) {
    console.error('Database file cctvData.json not found at:', dbPath);
    return;
  }

  // Load existing DB
  const db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
  console.log(`Original database contains ${db.length} cameras.`);

  // Load formatted cameras
  const pemalang = JSON.parse(fs.readFileSync('scratch/pemalang_cameras_formatted.json', 'utf8'));
  const surakarta = JSON.parse(fs.readFileSync('scratch/surakarta_cameras_formatted.json', 'utf8'));

  const newCameras = [...pemalang, ...surakarta];
  console.log(`Loading new cameras:`);
  console.log(`  - Pemalang: ${pemalang.length}`);
  console.log(`  - Surakarta: ${surakarta.length}`);
  console.log(`  Total new cameras loaded: ${newCameras.length}`);

  let addedCount = 0;
  let updatedCount = 0;

  newCameras.forEach(cam => {
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

mergeCctvs();
