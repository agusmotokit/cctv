const fs = require('fs');
const path = require('path');

async function main() {
  console.log('Fetching Klungkung page...');
  const res = await fetch('https://dashboard.klungkungkab.go.id/?nav=cctv');
  const t = await res.text();

  // Find locations block
  const match = t.match(/var locations = \[\s*([\s\S]*?)\s*\];/);
  if (!match) {
    console.error('Could not find locations block in HTML');
    process.exit(1);
  }

  const rawLocationsText = match[1];
  
  // Extract individual arrays using regex: ['name','lat','lng','code','url']
  const arrayRe = /\[\s*'([\s\S]*?)'\s*,\s*'([\s\S]*?)'\s*,\s*'([\s\S]*?)'\s*,\s*'([\s\S]*?)'\s*,\s*'([\s\S]*?)'\s*\]/g;
  
  const cctvs = [];
  let idx = 1;
  let m;
  while ((m = arrayRe.exec(rawLocationsText)) !== null) {
    const rawName = m[1];
    const latStr = m[2];
    const lngStr = m[3];
    const streamUrl = m[5];

    // Clean name: remove HTML tags like <center><b class="headerpin">CCTV Ruang Control Jl. Untung Surapati</b></center>
    let name = rawName.replace(/<[^>]*>/g, '').replace(/^CCTV\s+/i, '').trim();
    // Proper capitalization
    name = name.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');

    const lat = parseFloat(latStr);
    const lng = parseFloat(lngStr);

    cctvs.push({
      id: `klungkung-${idx}`,
      name: name,
      city: 'Kab. Klungkung',
      province: 'Bali',
      lat: lat,
      lng: lng,
      streamUrl: streamUrl,
      category: 'traffic',
      status: 'online',
      description: `Pantauan CCTV ${name} secara real-time di Kabupaten Klungkung.`
    });
    idx++;
  }

  console.log(`Successfully mapped ${cctvs.length} Klungkung CCTVs`);
  fs.writeFileSync(path.join(__dirname, 'klungkung_result.json'), JSON.stringify(cctvs, null, 2), 'utf8');
  console.log('Saved to scratch/klungkung_result.json');
}

main().catch(e => console.error(e));
