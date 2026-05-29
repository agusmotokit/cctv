const fs = require('fs');
const path = require('path');

function verifyDb() {
  const dbPath = path.join(__dirname, '../server/data/cctvData.json');
  if (!fs.existsSync(dbPath)) {
    console.error('FAIL: Database file does not exist.');
    process.exit(1);
  }

  const db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
  console.log(`Verifying database containing ${db.length} cameras...`);

  const seenIds = new Set();
  const duplicateIds = [];
  const invalidFields = [];
  let makassarCount = 0;

  db.forEach((cam, idx) => {
    // Check ID unique
    if (seenIds.has(cam.id)) {
      duplicateIds.push(cam.id);
    }
    seenIds.add(cam.id);

    // Check fields
    const required = ['id', 'name', 'city', 'province', 'lat', 'lng', 'streamUrl', 'category', 'status'];
    const missing = required.filter(field => cam[field] === undefined || cam[field] === null || cam[field] === '');
    
    if (missing.length > 0) {
      invalidFields.push({ index: idx, id: cam.id, missing });
    }

    // Check coordinates type
    if (typeof cam.lat !== 'number' || typeof cam.lng !== 'number') {
      invalidFields.push({ index: idx, id: cam.id, error: 'Coordinates are not numbers' });
    }

    // Check category values
    const validCategories = ['traffic', 'public', 'tourism'];
    if (!validCategories.includes(cam.category)) {
      invalidFields.push({ index: idx, id: cam.id, error: `Invalid category: ${cam.category}` });
    }

    if (cam.city === 'Kota Makassar') {
      makassarCount++;
    }
  });

  console.log(`Validation Results:`);
  console.log(`- Total Cameras: ${db.length}`);
  console.log(`- Makassar Cameras: ${makassarCount}`);

  if (duplicateIds.length > 0) {
    console.error(`FAIL: Found ${duplicateIds.length} duplicate IDs:`, duplicateIds);
  } else {
    console.log(`PASS: No duplicate IDs found.`);
  }

  if (invalidFields.length > 0) {
    console.error(`FAIL: Found ${invalidFields.length} invalid camera records:`, invalidFields.slice(0, 10));
  } else {
    console.log(`PASS: All camera records match the schema.`);
  }

  if (makassarCount !== 21) {
    console.error(`FAIL: Expected 21 Makassar cameras, but found ${makassarCount}.`);
  } else {
    console.log(`PASS: Correct number of Makassar cameras integrated.`);
  }

  if (duplicateIds.length > 0 || invalidFields.length > 0 || makassarCount !== 21) {
    process.exit(1);
  } else {
    console.log(`SUCCESS: Database verification passed!`);
  }
}

verifyDb();
