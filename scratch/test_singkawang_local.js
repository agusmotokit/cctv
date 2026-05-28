async function test() {
  const url = 'http://localhost:5000/singkawang-stream/stream/pp/ch-1/stream.m3u8';
  try {
    const res = await fetch(url);
    console.log(`[GET] ${url} -> Status: ${res.status}`);
    if (res.ok) {
      const text = await res.text();
      console.log(`Response snippet:\n${text.slice(0, 300)}`);
    } else {
      const text = await res.text();
      console.log(`Error body: ${text.slice(0, 300)}`);
    }
  } catch (err) {
    console.error(`Error: ${err.message}`);
  }
}

test();
