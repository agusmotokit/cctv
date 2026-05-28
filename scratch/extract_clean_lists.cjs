const fs = require('fs');

function toTitleCase(str) {
  if (!str) return '';
  let cleaned = str.trim();
  // Clean special abbreviations
  cleaned = cleaned
    .replace(/\bsimp\b/gi, 'Simpang')
    .replace(/\bsimp\.\s*/gi, 'Simpang ')
    .replace(/\bsimp\s*/gi, 'Simpang ')
    .replace(/\bjl\.\s*/gi, 'Jalan ')
    .replace(/\bjl\b/gi, 'Jalan')
    .replace(/\bkec\.\s*/gi, 'Kecamatan ')
    .replace(/\bkec\b/gi, 'Kecamatan')
    .replace(/\bfo\b/gi, 'Flyover')
    .replace(/\bpos\b/gi, 'Pos');

  // Handle all-caps acronyms or keep them clean
  return cleaned.split(/\s+/).map((word, idx) => {
    const upper = word.toUpperCase();
    if (['ATCS', 'PTZ', 'RTH', 'RSUD', 'PDAM', 'TIPTOP', 'AGAS', 'PHM', 'STQ', 'APILL'].includes(upper)) {
      return upper;
    }
    if (upper === 'BALAIKOTA') return 'Balaikota';
    if (upper === 'TIKUNGAN') return 'Tikungan';
    
    const lowercaseWords = ['di', 'ke', 'dari', 'dan', 'yang', 'untuk', 'dengan', 'atau', 'pada', 'arah', 'depan', 'sisi'];
    if (idx > 0 && lowercaseWords.includes(word.toLowerCase())) {
      return word.toLowerCase();
    }
    
    return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
  }).join(' ');
}

function processLists() {
  // 1. Process Pemalang
  console.log('Formatting Pemalang cameras...');
  const pemalangRaw = JSON.parse(fs.readFileSync('scratch/pemalang_cameras.json', 'utf8'));
  const pemalangFormatted = [];
  const pemalangCenterLat = -6.89;
  const pemalangCenterLng = 109.38;

  pemalangRaw.forEach((cam, idx) => {
    const cleanName = toTitleCase(cam.name);
    const isTraffic = /simpang|jalan|pertigaan|perempatan|arah|tiptop|beji|bojongbata/i.test(cleanName);
    const category = isTraffic ? 'traffic' : 'public';
    
    // Spread coordinates around Pemalang center
    const angle = (idx / pemalangRaw.length) * 2 * Math.PI;
    const radius = 0.007 + (idx % 3) * 0.002;
    const lat = pemalangCenterLat + Math.sin(angle) * radius;
    const lng = pemalangCenterLng + Math.cos(angle) * radius;

    pemalangFormatted.push({
      id: `pemalang-${cam.id}`,
      name: cleanName,
      city: 'Kab. Pemalang',
      province: 'Jawa Tengah',
      lat: lat,
      lng: lng,
      streamUrl: cam.streamUrl,
      category: category,
      status: 'online',
      description: isTraffic
        ? `Pantauan arus lalu lintas secara real-time di ${cleanName}, Kab. Pemalang.`
        : `Pantauan langsung fasilitas umum di ${cleanName}, Kab. Pemalang.`
    });
  });
  
  fs.writeFileSync('scratch/pemalang_cameras_formatted.json', JSON.stringify(pemalangFormatted, null, 2), 'utf8');
  console.log(`  Formatted ${pemalangFormatted.length} Pemalang cameras.`);

  // 2. Process Surakarta
  console.log('Formatting Surakarta cameras...');
  const props = JSON.parse(fs.readFileSync('scratch/surakarta_props.json', 'utf8'));
  const surakartaRaw = props.list || [];
  const surakartaFormatted = [];
  const surakartaCenterLat = -7.568;
  const surakartaCenterLng = 110.821;

  surakartaRaw.forEach((cam, idx) => {
    const cleanName = toTitleCase(cam.lokasi);
    const isPublic = /balaikota|kantor|pasar|stasiun|terminal|taman/i.test(cleanName);
    const category = isPublic ? 'public' : 'traffic'; // Default to traffic for ATCS cameras
    
    // Spread coordinates around Surakarta center
    const angle = (idx / surakartaRaw.length) * 2 * Math.PI;
    const radius = 0.012 + (idx % 4) * 0.003;
    const lat = surakartaCenterLat + Math.sin(angle) * radius;
    const lng = surakartaCenterLng + Math.cos(angle) * radius;

    surakartaFormatted.push({
      id: `surakarta-${cam.id}`,
      name: cleanName,
      city: 'Kota Surakarta',
      province: 'Jawa Tengah',
      lat: lat,
      lng: lng,
      streamUrl: cam.url,
      category: category,
      status: 'online',
      description: category === 'traffic'
        ? `Pantauan arus lalu lintas secara real-time di ${cleanName}, Kota Surakarta.`
        : `Pantauan langsung fasilitas umum di ${cleanName}, Kota Surakarta.`
    });
  });

  fs.writeFileSync('scratch/surakarta_cameras_formatted.json', JSON.stringify(surakartaFormatted, null, 2), 'utf8');
  console.log(`  Formatted ${surakartaFormatted.length} Surakarta cameras.`);
}

processLists();
