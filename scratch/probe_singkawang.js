async function test() {
  const rootUrl = 'https://pantau.singkawangkota.go.id/';
  const apiUrl = 'https://pantau.singkawangkota.go.id/source';
  
  try {
    // 1. Get cookies
    const rootRes = await fetch(rootUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });
    const cookies = rootRes.headers.getSetCookie();
    let cookieHeader = '';
    if (cookies && cookies.length > 0) {
      cookieHeader = cookies.map(c => c.split(';')[0]).join('; ');
    }
    console.log(`Singkawang Cookies: ${cookieHeader}`);

    // 2. Fetch API using cookies
    const res = await fetch(apiUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Cookie': cookieHeader,
        'Referer': 'https://pantau.singkawangkota.go.id/'
      }
    });
    console.log(`[GET] ${apiUrl} -> Status: ${res.status}`);
    if (res.ok) {
      const data = await res.json();
      console.log(`Successfully fetched ${data.length} Singkawang cameras.`);
      console.log('Sample camera:', data[0]);
      // Save it
      const fs = await import('fs');
      const path = await import('path');
      fs.writeFileSync(
        path.join(process.cwd(), 'scratch', 'singkawang_cameras.json'),
        JSON.stringify(data, null, 2),
        'utf-8'
      );
      console.log('Saved to scratch/singkawang_cameras.json');
    } else {
      const text = await res.text();
      console.log(`Error snippet: ${text.slice(0, 500)}`);
    }
  } catch (err) {
    console.error(`Error: ${err.message}`);
  }
}

test();
