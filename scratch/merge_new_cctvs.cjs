const fs = require('fs');
const path = require('path');

function toTitleCase(str) {
  if (!str) return '';
  // Clean "CCTV" prefixes and redundant occurrences
  let cleaned = str.replace(/^cctv\s+/i, '').trim();
  cleaned = cleaned.replace(/\bcctv\b/gi, '').replace(/\s+/g, ' ').trim();
  
  // Clean common abbreviations to clean Indonesian words
  cleaned = cleaned
    .replace(/\bsimp\b/gi, 'Simpang')
    .replace(/\bsimp\.\s*/gi, 'Simpang ')
    .replace(/\bsimp\s*/gi, 'Simpang ')
    .replace(/\bsimp4\b/gi, 'Simpang 4')
    .replace(/\bsimp3\b/gi, 'Simpang 3')
    .replace(/\bkec\.\s*/gi, 'Kecamatan ')
    .replace(/\bkec\b/gi, 'Kecamatan')
    .replace(/\bjl\.\s*/gi, 'Jalan ')
    .replace(/\bjl\b/gi, 'Jalan')
    .replace(/\bpertig\b/gi, 'Pertigaan')
    .replace(/\bperemp\b/gi, 'Perempatan')
    .replace(/\bmesjid\b/gi, 'Masjid')
    .replace(/\bsgt\b/gi, 'Sangatta');

  return cleaned.split(/\s+/).map((word, idx) => {
    const upper = word.toUpperCase();
    if (['PHM', 'STQ', 'RSUD', 'PDAM', 'RTH', 'BPK', 'SGM', 'S3', 'S4', 'ATCS', 'PTZ', 'KODIM'].includes(upper)) {
      return upper;
    }
    // Specific standard capitalization
    if (upper === 'AMELIA') return 'Amelia';
    
    const lowercaseWords = ['di', 'ke', 'dari', 'dan', 'yang', 'untuk', 'dengan', 'atau', 'pada', 'sisi', 'depan', 'arah'];
    if (idx > 0 && lowercaseWords.includes(word.toLowerCase())) {
      return word.toLowerCase();
    }
    
    return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
  }).join(' ');
}

function mergeCctvs() {
  const dbPath = 'server/data/cctvData.json';
  if (!fs.existsSync(dbPath)) {
    console.error('Database file cctvData.json not found at:', dbPath);
    return;
  }

  // Load existing DB
  const db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
  console.log(`Original database contains ${db.length} cameras.`);

  const newCctvs = [];

  // 1. Process Kutai Timur
  console.log('Processing Kutai Timur cameras...');
  const kutimRaw = JSON.parse(fs.readFileSync('scratch/kutim_cameras_raw.json', 'utf8'));
  const kutimCameras = kutimRaw.data || [];
  
  kutimCameras.forEach(cam => {
    const cleanName = toTitleCase(cam.name);
    const isTraffic = /simpang|jalan|pertigaan|perempatan|road/i.test(cleanName);
    const category = isTraffic ? 'traffic' : 'public';
    
    newCctvs.push({
      id: `kutim-${cam.id}`,
      name: cleanName,
      city: 'Kab. Kutai Timur',
      province: 'Kalimantan Timur',
      lat: parseFloat(cam.lat),
      lng: parseFloat(cam.lng),
      streamUrl: `/api/kutim-stream/${cam.streamKey}`,
      category: category,
      status: 'online',
      description: isTraffic 
        ? `Pantauan arus lalu lintas secara real-time di ${cleanName}, Kab. Kutai Timur.`
        : `Pantauan langsung fasilitas umum di ${cleanName}, Kab. Kutai Timur.`
    });
  });
  console.log(`  Processed ${kutimCameras.length} Kutai Timur cameras.`);

  // 2. Process Bontang
  console.log('Processing Bontang cameras...');
  const bontangRaw = [
    { name: "SIMP 4 AMELIA 1", id: "49Ix0TMzTUxJNjAw0DUxSLXUNTRMMtW1ME5L1U02MDU0T01OSkxKstBLTsw1MBASmL6waSJLkeP7niRZgb_HoqIB" },
    { name: "SIMP 4 AMELIA 2", id: "49Ix0TMzTUxJNjAw0DUxSLXUNTRMMtW1ME5L1U02MDU0T01OSkxKNNdLTsw1MBASmL6waSJLkeP7niRZgb_HoqIB" },
    { name: "TIKUNGAN S PISANGAN", id: "49Ix0bM0NbM0AAJdIwNTS11DwyRjXQtDE0tdCwPzZDMjkxQDszRDveTEXAMDIYHpC5smshQ5vu9JkhX4eywqGgA" },
    { name: "SIMP PISANGAN", id: "49Ix0Us1TjMzMTAw0E2ytDTRNTRMMta1MDJI1k1LtkxLS0k0SEq2SNFLTsw1MBASmL6waSJLkeP7niRZgb_HoqIB" },
    { name: "SIMP KENARI", id: "49Ix0bM0NbM0AAJdIwNTS11DwyRjXQtDE0tdCwPzZDMjkxQDcwNDveTEXAMDIYHpC5smshQ5vu9JkhX4eywqGgA" },
    { name: "SIMP PHM", id: "49Ix0Us1TjMzMTAw0E2ytDTRNTRMMta1MDJI1k1LtkxLS0k0SEq2SNRLTsw1MBASmL6waSJLkeP7niRZgb_HoqIB" },
    { name: "SIMP RAMAYANA", id: "49Ix0TMzTUxJNjAw0DUxSLXUNTRMMtW1ME5L1U02MDU0T01OSkxKNtBLTsw1MBASmL6waSJLkeP7niRZgb_HoqIB" },
    { name: "SIMP 3 JUANDA", id: "49Ix0Us1TjMzMTAw0E2ytDTRNTRMMta1MDJI1k1LtkxLS0k0SEq2SNNLTsw1MBASmL6waSJLkeP7niRZgb_HoqIB" },
    { name: "BONTANG KUALA", id: "49Ix0TMzTUxJNjAw0DUxSLXUNTRMMtW1ME5L1U02MDU0T01OSkxKtNBLTsw1MBASmL6waSJLkeP7niRZgb_HoqIB" },
    { name: "HOTEL SENREGO", id: "4xIx1EtLtkxLS0k0SEq2MNdLTsw1MBASmL6waSJLkeP7niRZgb_HoqIB" },
    { name: "SIMP KODIM 2", id: "49Ix0UszNTc3MTAw0LU0MTbRNTRMMtW1MDGz0DUyMTZKTE0yTktMTNZLTsw1MBASmL6waSJLkeP7niRZgb_HoqIB" }
  ];

  const bontangCenterLat = 0.134;
  const bontangCenterLng = 117.474;

  bontangRaw.forEach((cam, idx) => {
    const cleanName = toTitleCase(cam.name);
    const isTraffic = /simpang|jalan|pertigaan|perempatan|tikungan/i.test(cleanName);
    const category = isTraffic ? 'traffic' : 'public';
    
    // Spread coordinates around the center in a small circle
    const angle = (idx / bontangRaw.length) * 2 * Math.PI;
    const radius = 0.008 + (idx % 3) * 0.003;
    const lat = bontangCenterLat + Math.sin(angle) * radius;
    const lng = bontangCenterLng + Math.cos(angle) * radius;

    newCctvs.push({
      id: `bontang-${idx + 1}`,
      name: cleanName,
      city: 'Kota Bontang',
      province: 'Kalimantan Timur',
      lat: lat,
      lng: lng,
      streamUrl: `/api/bontang-stream/${cam.id}/stream.mp4`,
      thumbnailUrl: `/api/bontang-snapshot/${cam.id}`,
      category: category,
      status: 'online',
      description: isTraffic 
        ? `Pantauan arus lalu lintas secara real-time di ${cleanName}, Kota Bontang.`
        : `Pantauan langsung fasilitas umum di ${cleanName}, Kota Bontang.`
    });
  });
  console.log(`  Processed ${bontangRaw.length} Bontang cameras.`);

  // 3. Process Tapin
  console.log('Processing Tapin cameras...');
  const tapinRaw = JSON.parse(fs.readFileSync('scratch/tapin_cameras.json', 'utf8'));
  const tapinCenterLat = -2.92;
  const tapinCenterLng = 115.15;

  tapinRaw.forEach((cam, idx) => {
    const cleanName = toTitleCase(cam.lokasi);
    const isTraffic = /simpang|jalan|pertigaan|perempatan|margasari|pos lantas/i.test(cleanName);
    const category = isTraffic ? 'traffic' : 'public';

    let lat = tapinCenterLat;
    let lng = tapinCenterLng;

    if (cam.lat_lon && cam.lat_lon !== '0,0' && cam.lat_lon !== '0, 0') {
      const parts = cam.lat_lon.split(',');
      if (parts.length === 2) {
        const pLat = parseFloat(parts[0].trim());
        const pLng = parseFloat(parts[1].trim());
        if (!isNaN(pLat) && !isNaN(pLng)) {
          lat = pLat;
          lng = pLng;
        }
      }
    } else {
      // Spread coordinates around center if 0,0
      const angle = (idx / tapinRaw.length) * 2 * Math.PI;
      const radius = 0.01 + (idx % 4) * 0.003;
      lat = tapinCenterLat + Math.sin(angle) * radius;
      lng = tapinCenterLng + Math.cos(angle) * radius;
    }

    newCctvs.push({
      id: `tapin-${cam.id}`,
      name: cleanName,
      city: 'Kab. Tapin',
      province: 'Kalimantan Selatan',
      lat: lat,
      lng: lng,
      streamUrl: `/tapin-stream${cam.cctv}`,
      category: category,
      status: 'online',
      description: isTraffic 
        ? `Pantauan arus lalu lintas secara real-time di ${cleanName}, Kab. Tapin.`
        : `Pantauan langsung fasilitas umum di ${cleanName}, Kab. Tapin.`
    });
  });
  console.log(`  Processed ${tapinRaw.length} Tapin cameras.`);

  // Merge into existing DB
  let addedCount = 0;
  let updatedCount = 0;

  newCctvs.forEach(cam => {
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
