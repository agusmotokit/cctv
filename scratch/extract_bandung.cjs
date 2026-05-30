async function main() {
  console.log('Fetching CCTV list from pelindung.bandung.go.id:8443/api/cek...');
  try {
    const res = await fetch('https://pelindung.bandung.go.id:8443/api/cek');
    console.log('Status:', res.status);
    const j = await res.json();
    console.log('Total items:', j.length);
    if (j.length > 0) {
      console.log('Sample item:', JSON.stringify(j[0], null, 2));
      console.log('Unique stream types:', [...new Set(j.map(x => x.stream_types || typeof x.stream_cctv))]);
      console.log('Another sample:', JSON.stringify(j[Math.min(j.length - 1, 10)], null, 2));
    }
  } catch (e) {
    console.error('Error fetching:', e.message);
  }
}

main();
