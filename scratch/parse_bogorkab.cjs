const fs = require('fs');
const path = require('path');

const rawPath = path.join(__dirname, 'bogorkab_raw.json');
const rawData = JSON.parse(fs.readFileSync(rawPath, 'utf8'));

// Check if rawData is an array or object
const locations = Array.isArray(rawData) ? rawData : (rawData.data || rawData.results || rawData.devices || []);

console.log(`Loaded ${locations.length} locations from raw data.`);

const cameras = [];
locations.forEach(loc => {
  const devices = loc.tb_device_lokasi || [];
  devices.forEach(dev => {
    // Determine category
    const category = 'traffic'; // Default to traffic for Dishub
    
    // Construct unique ID: jbr-bogorkab-[slugified-name]
    let camName = dev.nama_alias ? dev.nama_alias.trim() : `${loc.nama_lokasi} - ${dev.nama}`;
    // Convert to Title Case
    camName = camName.toLowerCase().split(' ').map(word => {
      return word.charAt(0).toUpperCase() + word.slice(1);
    }).join(' ');

    const slug = camName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const id = `jbr-bogorkab-${slug}`;

    // The stream URL. Note that url_proxy_hls might need index.m3u8 appended or is it already the hls stream path?
    // Let's look at url_proxy_hls: "https://itscctv-dishub.bogorkab.go.id/stream/SENTUL/"
    // Typically in these Go2RTC / WebRTC / HLS setups, it is /stream/CAMERA_NAME/index.m3u8 or just the folder.
    // Let's look at what is used or verify it.
    let streamUrl = dev.url_proxy_hls ? dev.url_proxy_hls.trim() : '';
    if (streamUrl && !streamUrl.endsWith('.m3u8')) {
      // If it ends with a slash, we might append index.m3u8 or keep it.
      // Let's make sure it's valid. In many systems (like go2rtc), the stream URL is:
      // https://.../stream/SENTUL/index.m3u8
      if (!streamUrl.endsWith('/')) {
        streamUrl += '/';
      }
      streamUrl += 'index.m3u8';
    }

    cameras.push({
      id,
      name: camName,
      city: 'Kab. Bogor',
      province: 'Jawa Barat',
      lat: loc.lat_lokasi,
      lng: loc.lon_lokasi,
      streamUrl,
      category,
      status: 'online',
      description: `${dev.deskripsi || `Kamera pantauan lalu lintas di ${camName}, Kabupaten Bogor.`}`
    });
  });
});

console.log(`Total cameras parsed: ${cameras.length}`);
console.log('Sample cameras:', cameras.slice(0, 3));

fs.writeFileSync(path.join(__dirname, 'bogorkab_cameras.json'), JSON.stringify(cameras, null, 2));
console.log('Saved to bogorkab_cameras.json');
