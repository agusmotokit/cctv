import fs from 'fs';

function parse() {
  const dump = JSON.parse(fs.readFileSync('scratch/tabalong_tsr_dump.json', 'utf8'));
  
  // Find where the cctvs are located
  // The dump should contain self.$R.tsr which is an array
  const tsr = dump.tsr || [];
  console.log('TSR array length:', tsr.length);
  
  // Let's search all array elements for an element containing the cctv key
  let cctvArray = null;
  for (let i = 0; i < tsr.length; i++) {
    const item = tsr[i];
    if (Array.isArray(item) && item.length > 0 && item[0] && item[0].hasOwnProperty('cctv')) {
      console.log(`Found camera array at tsr[${i}], length: ${item.length}`);
      cctvArray = item;
      break;
    }
  }

  if (!cctvArray) {
    // Search recursively in the dump object if it wasn't flat in tsr
    console.error('Could not find cctv array directly in TSR array!');
    return;
  }

  // Format the cameras
  const formatted = cctvArray.map(cam => {
    // Camera schema:
    // id, name, city, province, lat, lng, streamUrl, category, status, description
    // Link to HLS on Tabalong is:
    // https://cctv.tabalongkab.go.id/api/stream/hls/{encodeURIComponent(id)}/index.m3u8
    // We will use our local proxy:
    // /tabalong-stream/{encodeURIComponent(id)}/index.m3u8
    const streamUrl = `/tabalong-stream/${encodeURIComponent(cam.id)}/index.m3u8`;
    
    // Status is 'online' if cam.isOnline is true, else 'offline'
    const status = cam.isOnline ? 'online' : 'offline';
    
    // Category mapping: ATCS -> traffic, otherwise public/office
    let category = 'public';
    if (cam.dataKategori && cam.dataKategori.kategori) {
      const kat = cam.dataKategori.kategori.toLowerCase();
      if (kat.includes('atcs') || kat.includes('lalu lintas')) {
        category = 'traffic';
      } else if (kat.includes('rth') || kat.includes('publik')) {
        category = 'public';
      }
    }
    
    // Clean name: e.g. "RTH Kec. Haruai" -> Title Case and clean prefixes
    let name = cam.cctv;
    if (name.startsWith('CCTV ')) {
      name = name.substring(5);
    }
    
    return {
      id: `tabalong-${cam.slug || cam.id}`,
      name: name,
      city: 'Kab. Tabalong',
      province: 'Kalimantan Selatan',
      lat: Number(cam.latitude),
      lng: Number(cam.longitude),
      streamUrl: streamUrl,
      category: category,
      status: status,
      description: `Pantauan CCTV ${name}, Kab. Tabalong, Kalimantan Selatan.`
    };
  });

  console.log('Formatted cameras count:', formatted.length);
  console.log('First formatted camera:', formatted[0]);
  
  fs.writeFileSync('scratch/tabalong_formatted.json', JSON.stringify(formatted, null, 2), 'utf8');
  console.log('Saved formatted cameras to scratch/tabalong_formatted.json');
}

parse();
