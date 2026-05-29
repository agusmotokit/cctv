const fs = require('fs');
const path = require('path');

function cleanDb() {
  const dbPath = path.join(__dirname, '../server/data/cctvData.json');
  const db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));

  const invalidCams = db.filter(cam => !cam.streamUrl);
  console.log('Invalid cameras to remove:', invalidCams);

  const cleanDb = db.filter(cam => cam.streamUrl);
  fs.writeFileSync(dbPath, JSON.stringify(cleanDb, null, 2), 'utf8');
  console.log(`Cleaned database saved. Old count: ${db.length}, New count: ${cleanDb.length}`);
}

cleanDb();
