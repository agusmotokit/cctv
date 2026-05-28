import fs from 'fs';

function parse() {
  const absolutePath = 'C:/Users/USER/.gemini/antigravity-ide/brain/189d8ffe-dc82-4354-8ab9-e5677c375e4e/scratch/kotabaru_items.json';
  const raw = JSON.parse(fs.readFileSync(absolutePath, 'utf8'));
  console.log(`Loaded ${raw.length} raw cameras for Kotabaru.`);

  const formatted = raw.map(cam => {
    // Split coordinates: e.g. "-3.2447557487418965, 116.2247562797597"
    const coords = cam.coordinates.split(',').map(s => Number(s.trim()));
    const lat = coords[0];
    const lng = coords[1];

    // Stream URL format: /kotabaru-stream/{id}_camera_low/index.m3u8
    const streamUrl = `/kotabaru-stream/${cam.id}_camera_low/index.m3u8`;

    // Category mapping: ATCS or others
    let category = 'public';
    if (cam.name_categories && cam.name_categories.toLowerCase().includes('pusat kota')) {
      category = 'traffic';
    }
    const nameLower = cam.desc_cctv ? cam.desc_cctv.toLowerCase() : '';
    if (nameLower.includes('simpang') || nameLower.includes('tugu') || nameLower.includes('jalan')) {
      category = 'traffic';
    }

    // Clean name: e.g. "Camera B - Paal 1"
    let name = cam.desc_cctv || cam.name_cctv;
    if (name.startsWith('CCTV ')) {
      name = name.substring(5);
    }

    return {
      id: `kotabaru-${cam.id}`,
      name: name,
      city: 'Kab. Kotabaru',
      province: 'Kalimantan Selatan',
      lat: lat,
      lng: lng,
      streamUrl: streamUrl,
      category: category,
      status: 'online', // Assume online as there is no status flag in item; pid_ffmpeg is present
      description: `Pantauan CCTV ${name}, Kab. Kotabaru, Kalimantan Selatan.`
    };
  });

  console.log('Formatted cameras count:', formatted.length);
  console.log('First formatted camera:', formatted[0]);

  fs.writeFileSync('scratch/kotabaru_formatted.json', JSON.stringify(formatted, null, 2), 'utf8');
  console.log('Saved formatted cameras to scratch/kotabaru_formatted.json');
}

parse();
