async function testHandshake() {
  const id = 1; // Let's try id 1 (Simpang Empat Kompi) or id 8 (Angsana)
  const connectUrl = `https://atcs.tanahbumbukab.go.id/stream/${id}/connect`;
  console.log('1. Connecting to:', connectUrl);
  
  try {
    const connRes = await fetch(connectUrl, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });
    console.log('   Status:', connRes.status);
    if (!connRes.ok) {
      console.warn('   Failed connect step');
      return;
    }
    
    const connData = await connRes.json();
    console.log('   Response data:', connData);
    const token = connData.token;
    if (!token) {
      console.error('   No token returned!');
      return;
    }
    
    const infoUrl = `https://atcs.tanahbumbukab.go.id/stream/${id}/info?token=${encodeURIComponent(token)}`;
    console.log('2. Fetching stream info from:', infoUrl);
    const infoRes = await fetch(infoUrl, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });
    console.log('   Status:', infoRes.status);
    if (infoRes.ok) {
      const infoData = await infoRes.json();
      console.log('   Stream info:', infoData);
    } else {
      const text = await infoRes.text();
      console.log('   Error response:', text);
    }
  } catch (err) {
    console.error('   Error:', err.message);
  }
}
testHandshake();
