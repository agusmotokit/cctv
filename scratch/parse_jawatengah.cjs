const fs = require('fs');
const path = require('path');

// Helper: title case
function toTitleCase(str) {
  if (!str) return '';
  return str.trim().toLowerCase().split(' ').map(word => {
    return word.charAt(0).toUpperCase() + word.slice(1);
  }).join(' ');
}

// 1. KOTA MAGELANG
function parseMagelang() {
  const rawPath = path.join(__dirname, 'magelangkota_raw.json');
  if (!fs.existsSync(rawPath)) {
    console.warn('Magelang raw data not found.');
    return;
  }
  const rawData = JSON.parse(fs.readFileSync(rawPath, 'utf8'));
  const cameras = rawData.map(loc => {
    const name = toTitleCase(loc.name.replace(/PTZ-|CCTV-/gi, '').trim());
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    
    // Fallback streamUrl. If monitor has hls_link, use it. Otherwise use link or fallback.
    let streamUrl = '';
    if (loc.monitor) {
      streamUrl = loc.monitor.hls_link || loc.monitor.link || '';
    }
    
    return {
      id: `jtg-magelangkota-${slug}-${loc.id}`,
      name,
      city: 'Kota Magelang',
      province: 'Jawa Tengah',
      lat: Number(loc.latitude),
      lng: Number(loc.longitude),
      streamUrl: streamUrl.trim(),
      category: 'traffic',
      status: 'online',
      description: loc.address || `Pantauan CCTV secara real-time di ${name}, Kota Magelang.`
    };
  }).filter(c => c.streamUrl !== '');

  fs.writeFileSync(path.join(__dirname, 'magelangkota_cameras.json'), JSON.stringify(cameras, null, 2));
  console.log(`Parsed ${cameras.length} cameras for Kota Magelang.`);
}

// 2. KABUPATEN PEKALONGAN
function parsePekalongan() {
  const rawPath = path.join(__dirname, 'pekalongankab_raw.json');
  if (!fs.existsSync(rawPath)) {
    console.warn('Pekalongan raw data not found.');
    return;
  }
  const rawData = JSON.parse(fs.readFileSync(rawPath, 'utf8'));
  const cameras = rawData.map(cam => {
    const name = toTitleCase(cam.nama);
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    
    let streamUrl = cam.stream_url || '';
    // If stream URL is valid but does not end in .m3u8, check if we need to append /index.m3u8 or keep it.
    // In Pekalongan Kab API, it is "https://cctv.pekalongankab.go.id/hls/bojong-kajen"
    // HLS players usually accept this path directly or need index.m3u8. Let us test it in a check script.
    
    return {
      id: `jtg-pekalongankab-${slug}-${cam.id}`,
      name,
      city: 'Kab. Pekalongan',
      province: 'Jawa Tengah',
      lat: Number(cam.latitude),
      lng: Number(cam.longitude),
      streamUrl: streamUrl.trim(),
      category: 'traffic',
      status: cam.status === 'aktif' ? 'online' : 'offline',
      description: cam.alamat || `Pantauan CCTV secara real-time di ${name}, Kabupaten Pekalongan.`
    };
  }).filter(c => c.streamUrl !== '');

  fs.writeFileSync(path.join(__dirname, 'pekalongankab_cameras.json'), JSON.stringify(cameras, null, 2));
  console.log(`Parsed ${cameras.length} cameras for Kabupaten Pekalongan.`);
}

parseMagelang();
parsePekalongan();
