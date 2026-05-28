async function test() {
  const streamUrl = 'https://cctv.tapinkab.go.id/api/stream.m3u8?src=simp3_tiga_rth&mp4=aac';
  
  try {
    const res = await fetch(streamUrl, { method: 'GET' });
    console.log(`[GET] ${streamUrl} -> Status: ${res.status}, Type: ${res.headers.get('content-type')}`);
    if (res.ok) {
      const text = await res.text();
      console.log(`Stream response snippet:\n${text.slice(0, 300)}`);
    }

    // Try fetching page 2 HTML to see if list is embedded there
    const page2Url = 'https://cctv.tapinkab.go.id/?page=2';
    const res2 = await fetch(page2Url);
    console.log(`[GET] ${page2Url} -> Status: ${res2.status}`);
    if (res2.ok) {
      const html2 = await res2.text();
      // Search for any camera JSON
      const matches = html2.match(/simp3_tiga_rth/g);
      console.log(`Page 2 contains simp3_tiga_rth: ${!!matches}`);
      // Let's search for "cctv":"/api/stream.m3u8"
      const streamMatches = html2.match(/\/api\/stream\.m3u8\?src=[a-zA-Z0-9_-]+/g);
      console.log(`Page 2 stream matches count: ${streamMatches ? streamMatches.length : 0}`);
      if (streamMatches) {
        console.log(`Sample stream matches from page 2:`, streamMatches.slice(0, 5));
      }
    }
  } catch (err) {
    console.error(`Error: ${err.message}`);
  }
}

test();
