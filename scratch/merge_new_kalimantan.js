import fs from 'fs';
import path from 'path';

function merge() {
  const dbPath = 'server/data/cctvData.json';
  if (!fs.existsSync(dbPath)) {
    console.error('Database file cctvData.json not found at:', dbPath);
    return;
  }

  // Load existing DB
  const db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
  console.log(`Original database contains ${db.length} cameras.`);

  // Load formatted cameras
  const balangan = JSON.parse(fs.readFileSync('scratch/balangan_formatted.json', 'utf8'));
  const kotabaru = JSON.parse(fs.readFileSync('scratch/kotabaru_formatted.json', 'utf8'));
  const tabalong = JSON.parse(fs.readFileSync('scratch/tabalong_formatted.json', 'utf8'));
  const tanahbumbu = JSON.parse(fs.readFileSync('scratch/tanahbumbu_formatted.json', 'utf8'));

  const newCameras = [...balangan, ...kotabaru, ...tabalong, ...tanahbumbu];
  console.log(`Loading new cameras:`);
  console.log(`  - Balangan: ${balangan.length}`);
  console.log(`  - Kotabaru: ${kotabaru.length}`);
  console.log(`  - Tabalong: ${tabalong.length}`);
  console.log(`  - Tanah Bumbu: ${tanahbumbu.length}`);
  console.log(`  Total new cameras loaded: ${newCameras.length}`);

  let addedCount = 0;
  let updatedCount = 0;

  newCameras.forEach(cam => {
    // Check if duplicate ID
    const index = db.findIndex(c => c.id === cam.id);
    if (index === -1) {
      db.push(cam);
      addedCount++;
    } else {
      // Overwrite/update details
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

merge();
