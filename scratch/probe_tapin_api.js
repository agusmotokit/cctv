async function test() {
  const urls = [
    'https://cctv.tapinkab.go.id/api/cctv',
    'https://cctv.tapinkab.go.id/api/cctv?page=2',
    'https://cctv.tapinkab.go.id/api/cameras',
    'https://cctv.tapinkab.go.id/api/list',
    'https://cctv.tapinkab.go.id/api/stream',
    'https://cctv.tapinkab.go.id/api/cctv/public'
  ];

  for (const url of urls) {
    try {
      const res = await fetch(url);
      console.log(`[GET] ${url} -> Status: ${res.status}, Type: ${res.headers.get('content-type')}`);
      if (res.ok) {
        const text = await res.text();
        console.log(`Snippet: ${text.slice(0, 200)}`);
      }
    } catch (err) {
      console.error(`Error for ${url}: ${err.message}`);
    }
  }
}

test();
