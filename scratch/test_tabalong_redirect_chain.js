async function trace() {
  let url = 'https://cctv.tabalongkab.go.id/api/stream/hls/cctv-jjsXxQfaTu45Qs2V/index.m3u8';
  console.log('Tracing redirect chain for:', url);
  
  let count = 0;
  let cookies = [];
  
  while (count < 5) {
    count++;
    console.log(`Step ${count}: fetching ${url}`);
    
    const headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    };
    if (cookies.length > 0) {
      headers['Cookie'] = cookies.join('; ');
      console.log('  Sending Cookies:', headers['Cookie']);
    }
    
    const res = await fetch(url, {
      headers: headers,
      redirect: 'manual'
    });
    
    console.log(`  Status: ${res.status}`);
    console.log(`  Content-Type: ${res.headers.get('content-type')}`);
    
    const setCookies = res.headers.getSetCookie();
    if (setCookies && setCookies.length > 0) {
      console.log('  Set-Cookie received:', setCookies);
      setCookies.forEach(sc => {
        cookies.push(sc.split(';')[0]);
      });
    }
    
    if (res.status >= 300 && res.status < 400) {
      const location = res.headers.get('location');
      if (!location) {
        console.error('  No location header in redirect!');
        break;
      }
      url = new URL(location, url).toString();
      console.log(`  Redirecting to: ${url}`);
    } else {
      const text = await res.text();
      console.log(`  Final payload snippet (first 200 chars):`);
      console.log(text.substring(0, 200).replace(/\n/g, ' '));
      break;
    }
  }
}

trace();
