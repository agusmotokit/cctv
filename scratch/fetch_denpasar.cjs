// Fetch Denpasar CCTV data from ATCS API and output JSON
const BASE = 'https://atcs.denpasarkota.go.id/api/v3/pv';
const HEADERS = {
  'Content-Type': 'application/json',
  'x-client-id': 'a194e6ae-d4dd-4b62-a0ac-388922f09303',
  'x-client-secret': 'f430fde38a031fb657a2a7d6f84644a9aed767a4c22314d4b7c565648acc2396'
};

async function main() {
  const allItems = [];
  for (let page = 1; page <= 5; page++) {
    const res = await fetch(`${BASE}/ldevice?page=${page}&paginate=100`, { headers: HEADERS });
    const json = await res.json();
    if (!json.data || json.data.length === 0) break;
    allItems.push(...json.data);
    if (page >= json.meta.pages) break;
  }

  const cctvs = [];
  let idx = 1;
  for (const item of allItems) {
    const dev = item.tb_device_lokasi?.[0];
    if (!dev) continue;

    const hlsUrl = (dev.url_proxy_hls || '').trim();
    if (!hlsUrl || !hlsUrl.startsWith('http')) continue;

    const lat = item.lat_lokasi;
    const lng = item.lon_lokasi;
    if (!lat || !lng) continue;

    // Build proper HLS URL - add index.m3u8 if needed
    let streamUrl = hlsUrl;
    if (!streamUrl.endsWith('.m3u8')) {
      if (!streamUrl.endsWith('/')) streamUrl += '/';
      streamUrl += 'index.m3u8';
    }

    const name = dev.nama_alias || dev.nama || item.nama_lokasi;
    cctvs.push({
      id: `denpasar-${idx}`,
      name: name.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' '),
      city: 'Kota Denpasar',
      province: 'Bali',
      lat: lat,
      lng: lng,
      streamUrl: streamUrl,
      category: 'traffic',
      status: 'online',
      description: `Pantauan CCTV ${item.ket_lokasi || item.nama_lokasi} secara real-time di Kota Denpasar.`
    });
    idx++;
  }

  console.log(JSON.stringify(cctvs, null, 2));
  console.error(`Total: ${cctvs.length} CCTVs`);
}

main().catch(e => console.error(e));
