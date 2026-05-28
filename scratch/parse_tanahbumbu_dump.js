import fs from 'fs';

function parse() {
  const raw = JSON.parse(fs.readFileSync('scratch/tanahbumbu_mapped.json', 'utf8'));
  console.log(`Loaded ${raw.length} mapped cameras for Tanah Bumbu.`);

  const formatted = raw.map(cam => {
    // Stream URL mapping
    let streamUrl = '';
    let status = 'offline';
    if (cam.hls_path) {
      // e.g. /hls/cctv_ch09/index.m3u8 -> /tanahbumbu-stream/cctv_ch09/index.m3u8
      const ch = cam.hls_path.replace('/hls/', '');
      streamUrl = `/tanahbumbu-stream/${ch}`;
      status = 'online';
    }

    // Category mapping: check for Simpang, Jembatan, Arah, etc.
    let category = 'public';
    const nameLower = cam.name.toLowerCase();
    if (nameLower.includes('simp') || nameLower.includes('jembatan') || nameLower.includes('arah') || nameLower.includes('lampu merah')) {
      category = 'traffic';
    }

    // Clean name
    let name = cam.name;
    if (name.startsWith('CCTV ')) {
      name = name.substring(5);
    }

    return {
      id: `tanahbumbu-${cam.id}`,
      name: name,
      city: 'Kab. Tanah Bumbu',
      province: 'Kalimantan Selatan',
      lat: Number(cam.latitude),
      lng: Number(cam.longitude),
      streamUrl: streamUrl,
      category: category,
      status: status,
      description: `Pantauan CCTV ${name}, Kab. Tanah Bumbu, Kalimantan Selatan.`
    };
  });

  console.log('Formatted cameras count:', formatted.length);
  console.log('Online cameras count:', formatted.filter(c => c.status === 'online').length);
  console.log('First formatted camera:', formatted[0]);

  fs.writeFileSync('scratch/tanahbumbu_formatted.json', JSON.stringify(formatted, null, 2), 'utf8');
  console.log('Saved formatted cameras to scratch/tanahbumbu_formatted.json');
}

parse();
