import fs from 'fs';

async function mapStreams() {
  const rawCctvs = JSON.parse(fs.readFileSync('scratch/tanahbumbu_extracted.json', 'utf8'));
  console.log(`Loaded ${rawCctvs.length} raw cameras from scratch/tanahbumbu_extracted.json`);

  const results = [];
  for (const cam of rawCctvs) {
    const id = cam.id;
    console.log(`Handshaking for camera ${id}: ${cam.name}...`);
    try {
      const connRes = await fetch(`https://atcs.tanahbumbukab.go.id/stream/${id}/connect`, {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        }
      });
      if (!connRes.ok) {
        console.warn(`  Failed connect, status: ${connRes.status}`);
        results.push({ ...cam, streamUrl: null, status: 'offline' });
        continue;
      }
      const connData = await connRes.json();
      const token = connData.token;
      if (!token) {
        console.warn('  No token returned');
        results.push({ ...cam, streamUrl: null, status: 'offline' });
        continue;
      }

      const infoRes = await fetch(`https://atcs.tanahbumbukab.go.id/stream/${id}/info?token=${encodeURIComponent(token)}`, {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        }
      });
      if (!infoRes.ok) {
        console.warn(`  Failed info, status: ${infoRes.status}`);
        results.push({ ...cam, streamUrl: null, status: 'offline' });
        continue;
      }

      const infoData = await infoRes.json();
      console.log(`  Info data:`, infoData);
      results.push({
        ...cam,
        hls_path: infoData.hls_url,
        status: cam.is_active ? 'online' : 'offline'
      });
    } catch (err) {
      console.error(`  Error:`, err.message);
      results.push({ ...cam, streamUrl: null, status: 'offline', error: err.message });
    }
    // Small delay to be polite
    await new Promise(r => setTimeout(r, 200));
  }

  fs.writeFileSync('scratch/tanahbumbu_mapped.json', JSON.stringify(results, null, 2), 'utf8');
  console.log('Saved mapped cameras to scratch/tanahbumbu_mapped.json');
}

mapStreams();
