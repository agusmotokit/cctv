const fs = require('fs');
const path = require('path');

async function main() {
  console.log('Fetching Bandung Pelindung data...');
  try {
    const res = await fetch('https://pelindung.bandung.go.id:8443/api/cek');
    const items = await res.json();
    console.log('Total fetched cameras:', items.length);

    const cctvs = [];
    let idx = 1;
    for (const item of items) {
      const rawName = item.cctv_name || '';
      if (!rawName) continue;

      let name = rawName.replace(/^CCTV\s+/i, '').trim();
      // Capitalize properly
      name = name.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');

      const lat = parseFloat(item.lat);
      const lng = parseFloat(item.lng);
      if (isNaN(lat) || isNaN(lng)) continue;

      const streamUrl = (item.stream_cctv || '').trim();
      if (!streamUrl) continue;

      cctvs.push({
        id: `bandung-pelindung-${idx}`,
        name: name,
        city: 'Kota Bandung',
        province: 'Jawa Barat',
        lat: lat,
        lng: lng,
        streamUrl: streamUrl,
        category: 'traffic',
        status: 'online',
        description: `Pantauan CCTV ${name} secara real-time di Kota Bandung.`
      });
      idx++;
    }

    console.log(`Successfully mapped ${cctvs.length} Bandung Pelindung CCTVs`);
    fs.writeFileSync(path.join(__dirname, 'bandung_pelindung_result.json'), JSON.stringify(cctvs, null, 2), 'utf8');
    console.log('Saved to scratch/bandung_pelindung_result.json');
  } catch (e) {
    console.error('Error fetching/processing Bandung Pelindung data:', e);
  }
}

main();
