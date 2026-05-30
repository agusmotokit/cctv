const fs = require('fs');
const path = require('path');

function readJsonFile(filePath, isUtf16 = false) {
  if (!fs.existsSync(filePath)) {
    console.warn(`File not found: ${filePath}`);
    return [];
  }
  let content = fs.readFileSync(filePath, isUtf16 ? 'utf16le' : 'utf8');
  // Strip BOM if present
  if (content.charCodeAt(0) === 0xFEFF || content.charCodeAt(0) === 0xFFFE) {
    content = content.substring(1);
  }
  return JSON.parse(content.trim());
}

async function main() {
  const dbPath = path.join(__dirname, '../server/data/cctvData.json');
  if (!fs.existsSync(dbPath)) {
    console.error('Database file not found at:', dbPath);
    process.exit(1);
  }

  const db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
  console.log(`Initial database size: ${db.length} cameras`);

  const denpasar = readJsonFile(path.join(__dirname, 'denpasar_result.json'), true); // Denpasar result was saved in utf16le
  const klungkung = readJsonFile(path.join(__dirname, 'klungkung_result.json'), false);
  const bandung = readJsonFile(path.join(__dirname, 'bandung_pelindung_result.json'), false);

  console.log(`Loaded from scrapers:`);
  console.log(`- Kota Denpasar: ${denpasar.length} cameras`);
  console.log(`- Kab. Klungkung: ${klungkung.length} cameras`);
  console.log(`- Kota Bandung (Pelindung): ${bandung.length} cameras`);

  const allNew = [...denpasar, ...klungkung, ...bandung];
  console.log(`Total new cameras to add: ${allNew.length}`);

  const seenIds = new Set(db.map(c => c.id));
  const seenStreams = new Set(db.map(c => c.streamUrl.toLowerCase().trim()));

  let added = 0;
  let skippedId = 0;
  let skippedStream = 0;

  for (const cam of allNew) {
    if (seenIds.has(cam.id)) {
      skippedId++;
      continue;
    }
    const streamNorm = cam.streamUrl.toLowerCase().trim();
    if (seenStreams.has(streamNorm)) {
      skippedStream++;
      continue;
    }

    db.push(cam);
    seenIds.add(cam.id);
    seenStreams.add(streamNorm);
    added++;
  }

  console.log(`Merge complete:`);
  console.log(`- Successfully added: ${added} cameras`);
  console.log(`- Skipped (Duplicate ID): ${skippedId}`);
  console.log(`- Skipped (Duplicate Stream URL): ${skippedStream}`);
  console.log(`New database size: ${db.length} cameras`);

  fs.writeFileSync(dbPath, JSON.stringify(db, null, 2), 'utf8');
  console.log('Database file updated successfully!');
}

main().catch(e => console.error(e));
