const fs = require('fs');
const path = require('path');

const htmlFilePath = "C:\\Users\\USER\\.gemini\\antigravity-ide\\brain\\189d8ffe-dc82-4354-8ab9-e5677c375e4e\\.system_generated\\steps\\14789\\content.md";
const outputFilePath = path.join(__dirname, 'depok_cameras.json');

function toTitleCase(str) {
  return str
    .toLowerCase()
    .split(' ')
    .map(word => {
      if (word === 'sp') return 'Simpang';
      if (word === 'gdc') return 'GDC';
      if (word === 'ui') return 'UI';
      if (word === 'ubsi' || word === 'usbi') return 'UBSI';
      if (word === 'jpo') return 'JPO';
      if (word === 'pospol') return 'Pospol';
      if (word === 'pju') return 'PJU';
      if (word === 'pln') return 'PLN';
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function parseHtml() {
  const content = fs.readFileSync(htmlFilePath, 'utf-8');

  // Match the dataCCTV array definition
  const arrayMatch = content.match(/var\s+dataCCTV\s*=\s*(\[[\s\S]*?\]);/);
  if (!arrayMatch) {
    console.error('FAIL: Could not find var dataCCTV array in HTML file.');
    return;
  }

  const rawData = JSON.parse(arrayMatch[1]);
  console.log(`Found raw data containing ${rawData.length} CCTV records.`);

  const cameras = [];

  rawData.forEach(item => {
    const rawName = item.nama_cctv.trim();
    let name = toTitleCase(rawName);

    // Further cleaning of abbreviations
    if (name.startsWith('Sp ')) {
      name = name.replace(/^Sp /, 'Simpang ');
    }

    const lat = parseFloat(item.latitude.trim());
    const lng = parseFloat(item.longitude.trim());

    if (!isNaN(lat) && !isNaN(lng)) {
      const ipSanitized = item.ip.replace(/\./g, '');
      const streamUrl = `https://dishub.depok.go.id/vi/${ipSanitized}.m3u8`;

      // Determine category
      let category = 'traffic';
      const nameLower = name.toLowerCase();
      if (nameLower.includes('taman') || nameLower.includes('pospol') || nameLower.includes('dermaga') || nameLower.includes('pju')) {
        category = 'public';
      }

      // Generate ID
      const baseSlug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      const id = `jbr-depok-${baseSlug}-${ipSanitized}`;

      const status = (item.exists === 1 && item.status_on === "1") ? "online" : "offline";
      const description = `Pantauan ${category === 'traffic' ? 'arus lalu lintas' : 'fasilitas umum'} secara real-time di ${name}, Kota Depok.`;

      cameras.push({
        id,
        name,
        city: "Kota Depok",
        province: "Jawa Barat",
        lat,
        lng,
        streamUrl,
        category,
        status,
        description
      });
    }
  });

  // De-duplicate IDs
  const finalCameras = [];
  const seenIds = new Set();
  for (const cam of cameras) {
    let uniqueId = cam.id;
    let suffix = 1;
    while (seenIds.has(uniqueId)) {
      uniqueId = `${cam.id}-${suffix}`;
      suffix++;
    }
    seenIds.add(uniqueId);
    cam.id = uniqueId;
    finalCameras.push(cam);
  }

  fs.writeFileSync(outputFilePath, JSON.stringify(finalCameras, null, 2), 'utf-8');
  console.log(`Successfully parsed ${finalCameras.length} cameras for Depok and saved to scratch/depok_cameras.json`);
}

parseHtml();
