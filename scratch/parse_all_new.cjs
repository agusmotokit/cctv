const fs = require('fs');
const path = require('path');

// Disable TLS validation since government sites often have SSL/TLS issues
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

// Helper: title case
function toTitleCase(str) {
  return str.trim().toLowerCase().split(' ').map(word => {
    return word.charAt(0).toUpperCase() + word.slice(1);
  }).join(' ');
}

// 1. INDRAMAYU KABUPATEN
function parseIndramayu() {
  const rawPath = path.join(__dirname, 'indramayukab_raw.json');
  if (!fs.existsSync(rawPath)) {
    console.warn('Indramayu raw data not found.');
    return;
  }
  const data = JSON.parse(fs.readFileSync(rawPath, 'utf8'));
  const cameras = data.map(cam => {
    const name = toTitleCase(cam.name);
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    return {
      id: `jbr-indramayukab-${slug}-${cam.id}`,
      name,
      city: 'Kab. Indramayu',
      province: 'Jawa Barat',
      lat: Number(cam.latitude),
      lng: Number(cam.longitude),
      streamUrl: cam.hls_url.trim(),
      category: 'traffic',
      status: 'online',
      description: `Pantauan CCTV Lalu Lintas secara real-time di ${name}, Kabupaten Indramayu.`
    };
  });
  fs.writeFileSync(path.join(__dirname, 'indramayukab_cameras.json'), JSON.stringify(cameras, null, 2));
  console.log(`Parsed ${cameras.length} cameras for Kabupaten Indramayu.`);
}

// 2. SUKABUMI KABUPATEN
function parseSukabumi() {
  const htmlPath = path.join(__dirname, 'sukabumikab_home.html');
  if (!fs.existsSync(htmlPath)) {
    console.warn('Sukabumi HTML not found.');
    return;
  }
  const content = fs.readFileSync(htmlPath, 'utf8');
  
  // Extract cams array
  const camsMatch = content.match(/const\s+cams\s*=\s*(\[[\s\S]*?\]);/i);
  // Extract data array
  const dataMatch = content.match(/var\s+data\s*=\s*(\[[\s\S]*?\]);/i);

  if (!camsMatch || !dataMatch) {
    console.error('Failed to extract cams or data for Sukabumi.');
    return;
  }

  const getCams = new Function(`return ${camsMatch[1]};`);
  const getData = new Function(`return ${dataMatch[1]};`);
  const cams = getCams();
  const rawData = getData();

  const cameras = rawData.map(c => {
    const name = toTitleCase(c.n);
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const relativeStream = cams[c.i];
    const streamUrl = `https://cctv-dishub.sukabumikab.go.id${relativeStream}`;
    
    return {
      id: `jbr-sukabumikab-${slug}-${c.i}`,
      name,
      city: 'Kab. Sukabumi',
      province: 'Jawa Barat',
      lat: Number(c.lat),
      lng: Number(c.lng),
      streamUrl,
      category: 'traffic',
      status: 'online',
      description: `Pantauan CCTV Lalu Lintas secara real-time di ${name}, Kabupaten Sukabumi.`
    };
  });

  fs.writeFileSync(path.join(__dirname, 'sukabumikab_cameras.json'), JSON.stringify(cameras, null, 2));
  console.log(`Parsed ${cameras.length} cameras for Kabupaten Sukabumi.`);
}

// 3. TASIKMALAYA KABUPATEN
function parseTasikKab() {
  const rawPath = path.join(__dirname, 'tasikmalayakab_raw.json');
  if (!fs.existsSync(rawPath)) {
    console.warn('Tasikmalaya Kab raw data not found.');
    return;
  }
  const data = JSON.parse(fs.readFileSync(rawPath, 'utf8'));
  const list = data.Data || [];

  // Geocoded locations for districts
  const geoMappings = {
    'KEC.SALAWU': { lat: -7.3878, lng: 108.0028 },
    'KEC.KADIPATEN': { lat: -7.1478, lng: 108.0833 },
    'CIPASUNG': { lat: -7.3514, lng: 108.1256 },
    'SINGAPARNA': { lat: -7.3533, lng: 108.1114 },
    'KEC.KARANGNUNGGAL': { lat: -7.6433, lng: 108.1367 },
    'KEC.MANONJAYA': { lat: -7.3564, lng: 108.3092 },
    'KEC.CIPATUJAH': { lat: -7.7418, lng: 108.0230 },
    'CINTARAJA': { lat: -7.3550, lng: 108.1378 },
    'KEC.RAJAPOLAH': { lat: -7.2181, lng: 108.1903 }
  };

  const cameras = list.map(cam => {
    const name = toTitleCase(cam.name);
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const locKey = cam.description ? cam.description.toUpperCase() : '';
    const locKey2 = cam.location ? cam.location.toUpperCase() : '';
    
    let coords = { lat: -7.3503, lng: 108.1254 }; // Default Singaparna
    
    for (const [key, val] of Object.entries(geoMappings)) {
      if (locKey.includes(key) || locKey2.includes(key) || key.includes(locKey) || key.includes(locKey2)) {
        coords = val;
        break;
      }
    }

    return {
      id: `jbr-tasikmalayakab-${slug}-${cam.id}`,
      name,
      city: 'Kab. Tasikmalaya',
      province: 'Jawa Barat',
      lat: coords.lat,
      lng: coords.lng,
      streamUrl: cam.stream.trim(),
      category: 'traffic',
      status: 'online',
      description: `Pantauan CCTV Lalu Lintas secara real-time di ${name}, Kabupaten Tasikmalaya.`
    };
  });

  fs.writeFileSync(path.join(__dirname, 'tasikmalayakab_cameras.json'), JSON.stringify(cameras, null, 2));
  console.log(`Parsed ${cameras.length} cameras for Kabupaten Tasikmalaya.`);
}

// 4. TASIKMALAYA KOTA
function parseTasikKota() {
  const htmlPath = path.join(__dirname, 'tasikmalayakota_home.html');
  if (!fs.existsSync(htmlPath)) {
    console.warn('Tasikmalaya Kota HTML not found.');
    return;
  }
  const content = fs.readFileSync(htmlPath, 'utf8');

  // Extract var cctv = {...};
  const cctvMatch = content.match(/var\s+cctv\s*=\s*(\{[\s\S]*?\});/i);
  if (!cctvMatch) {
    console.error('Failed to extract cctv object for Tasikmalaya Kota.');
    return;
  }

  const getCctvObj = new Function(`return ${cctvMatch[1]};`);
  const cctvObj = getCctvObj();

  const cameras = Object.values(cctvObj).map(cam => {
    const name = toTitleCase(cam.nama);
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    return {
      id: `jbr-tasikmalayakota-${slug}-${cam.id}`,
      name,
      city: 'Kota Tasikmalaya',
      province: 'Jawa Barat',
      lat: Number(cam.lokasi_lat),
      lng: Number(cam.lokasi_lng),
      streamUrl: cam.link.trim(),
      category: 'traffic',
      status: 'online',
      description: `Pantauan CCTV Lalu Lintas ATCS secara real-time di ${name}, Kota Tasikmalaya.`
    };
  });

  fs.writeFileSync(path.join(__dirname, 'tasikmalayakota_cameras.json'), JSON.stringify(cameras, null, 2));
  console.log(`Parsed ${cameras.length} cameras for Kota Tasikmalaya.`);
}

parseIndramayu();
parseSukabumi();
parseTasikKab();
parseTasikKota();
