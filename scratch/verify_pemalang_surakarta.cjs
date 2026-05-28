async function verify() {
  console.log('--- STARTING VERIFICATION ---');
  try {
    const res = await fetch('http://localhost:5000/api/cctvs');
    if (res.ok) {
      const cctvs = await res.json();
      console.log(`Successfully fetched ${cctvs.length} cameras.`);
      const pemalang = cctvs.filter(c => c.id.startsWith('pemalang-'));
      const surakarta = cctvs.filter(c => c.id.startsWith('surakarta-'));
      console.log(`  - Pemalang cameras in database: ${pemalang.length}`);
      console.log(`  - Surakarta cameras in database: ${surakarta.length}`);

      if (pemalang.length === 13 && surakarta.length === 98) {
        console.log('Verification: SUCCESS');
      } else {
        console.log('Verification: FAILED (incorrect counts)');
      }
    } else {
      console.log(`Failed to fetch database: ${res.status}`);
    }
  } catch (err) {
    console.error('Error fetching database:', err.message);
  }
  console.log('--- VERIFICATION COMPLETED ---');
}

verify();
