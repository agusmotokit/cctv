async function test() {
  const videoUrl = 'https://cctv.kutaitimurkab.go.id/hls/polder-2/video1_stream.m3u8';

  try {
    const res = await fetch(videoUrl, { method: 'GET' });
    console.log(`[GET] ${videoUrl} -> Status: ${res.status}, Type: ${res.headers.get('content-type')}`);
    if (res.ok) {
      const text = await res.text();
      console.log(`Video playlist response snippet:\n${text.slice(0, 300)}`);
    }
  } catch (err) {
    console.error(`Error: ${err.message}`);
  }
}

test();
