async function test() {
  const tokenUrl = 'https://intip.bontangkota.go.id/token.json';
  const cctvs = [
    { name: "SIMP 4 AMELIA 1", id: "49Ix0TMzTUxJNjAw0DUxSLXUNTRMMtW1ME5L1U02MDU0T01OSkxKstBLTsw1MBASmL6waSJLkeP7niRZgb_HoqIB" },
    { name: "SIMP 4 AMELIA 2", id: "49Ix0TMzTUxJNjAw0DUxSLXUNTRMMtW1ME5L1U02MDU0T01OSkxKNNdLTsw1MBASmL6waSJLkeP7niRZgb_HoqIB" },
    { name: "TIKUNGAN S PISANGAN", id: "49Ix0bM0NbM0AAJdIwNTS11DwyRjXQtDE0tdCwPzZDMjkxQDszRDveTEXAMDIYHpC5smshQ5vu9JkhX4eywqGgA" },
    { name: "SIMP PISANGAN", id: "49Ix0Us1TjMzMTAw0E2ytDTRNTRMMta1MDJI1k1LtkxLS0k0SEq2SNFLTsw1MBASmL6waSJLkeP7niRZgb_HoqIB" },
    { name: "SIMP KENARI", id: "49Ix0bM0NbM0AAJdIwNTS11DwyRjXQtDE0tdCwPzZDMjkxQDcwNDveTEXAMDIYHpC5smshQ5vu9JkhX4eywqGgA" },
    { name: "SIMP PHM", id: "49Ix0Us1TjMzMTAw0E2ytDTRNTRMMta1MDJI1k1LtkxLS0k0SEq2SNRLTsw1MBASmL6waSJLkeP7niRZgb_HoqIB" },
    { name: "SIMP RAMAYANA", id: "49Ix0TMzTUxJNjAw0DUxSLXUNTRMMtW1ME5L1U02MDU0T01OSkxKNtBLTsw1MBASmL6waSJLkeP7niRZgb_HoqIB" },
    { name: "SIMP 3 JUANDA", id: "49Ix0Us1TjMzMTAw0E2ytDTRNTRMMta1MDJI1k1LtkxLS0k0SEq2SNNLTsw1MBASmL6waSJLkeP7niRZgb_HoqIB" },
    { name: "BONTANG KUALA", id: "49Ix0TMzTUxJNjAw0DUxSLXUNTRMMtW1ME5L1U02MDU0T01OSkxKtNBLTsw1MBASmL6waSJLkeP7niRZgb_HoqIB" },
    { name: "HOTEL SENREGO", id: "4xIx1EtLtkxLS0k0SEq2MNdLTsw1MBASmL6waSJLkeP7niRZgb_HoqIB" },
    { name: "SIMP KODIM 2", id: "49Ix0UszNTc3MTAw0LU0MTbRNTRMMtW1MDGz0DUyMTZKTE0yTktMTNZLTsw1MBASmL6waSJLkeP7niRZgb_HoqIB" }
  ];

  try {
    const tokenRes = await fetch(tokenUrl);
    const tokenData = await tokenRes.json();
    const session = tokenData.session;
    console.log(`Bontang Session Token: ${session.slice(0, 30)}...`);

    for (const cctv of cctvs) {
      const snapUrl = `https://i-see.iconpln.co.id/ckexo/media?session=${session}&cameraId=${cctv.id}&format=jpeg&frames=1&media=image`;
      const res = await fetch(snapUrl, {
        headers: {
          'Referer': 'https://intip.bontangkota.go.id/',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        }
      });
      console.log(`CCTV: ${cctv.name} -> Status: ${res.status}`);
    }
  } catch (err) {
    console.error(`Error: ${err.message}`);
  }
}

test();
