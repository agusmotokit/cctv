import fs from 'fs';

function parse() {
  const absoluteRawPath = 'C:/Users/USER/.gemini/antigravity-ide/brain/189d8ffe-dc82-4354-8ab9-e5677c375e4e/scratch/balangan_raw.json';
  const raw = JSON.parse(fs.readFileSync(absoluteRawPath, 'utf8'));
  console.log(`Loaded ${raw.length} raw cameras for Balangan.`);

  const formatted = raw.map(cam => {
    // Camera fields:
    // id, name, city, province, lat, lng, streamUrl, category, status, description
    // Balangan uses static HLS URLs like https://cctv.balangankab.go.id/hls/{slug}/index.m3u8
    // We proxy this to /balangan-stream/{slug}/index.m3u8
    const slug = cam.slug || cam.nama_lokasi.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const streamUrl = `/balangan-stream/${slug}/index.m3u8`;

    // Category mapping: check for simpang, jalan, pertigaan, etc.
    let category = 'public';
    const nameLower = cam.nama_lokasi.toLowerCase();
    if (nameLower.includes('simp') || nameLower.includes('jl.') || nameLower.includes('jalan') || nameLower.includes('pertigaan')) {
      category = 'traffic';
    }

    // Clean name: e.g. "Kantor Bupati (utama)" -> Title Case
    let name = cam.nama_lokasi;
    if (name.startsWith('CCTV ')) {
      name = name.substring(5);
    }
    
    return {
      id: `balangan-${slug}`,
      name: name,
      city: 'Kab. Balangan',
      province: 'Kalimantan Selatan',
      lat: Number(cam.latitude),
      lng: Number(cam.longitude),
      streamUrl: streamUrl,
      category: category,
      status: cam.status === 'online' ? 'online' : 'offline',
      description: `Pantauan CCTV ${name}, Kab. Balangan, Kalimantan Selatan.`
    };
  });

  console.log('Formatted cameras count:', formatted.length);
  console.log('First formatted camera:', formatted[0]);

  fs.writeFileSync('scratch/balangan_formatted.json', JSON.stringify(formatted, null, 2), 'utf8');
  console.log('Saved formatted cameras to scratch/balangan_formatted.json');
}

parse();
