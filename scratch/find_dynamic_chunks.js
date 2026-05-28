import fs from 'fs';

async function findChunks() {
  const chunks = [
    '756-v0.1.2.b5e023c421b4757fe302.min.js',
    '472-v0.1.2.3c2cfa56e634e6de12fa.min.js',
    '974-v0.1.2.847cec97e3773ac27af8.min.js',
    '327-v0.1.2.418751555c992220f0bb.min.js',
    '267-v0.1.2.5d32cfa31e6e316b6bd1.min.js',
    'i-v0.1.2.aaab8b2cac8c7485cebe.min.js'
  ];

  for (const chunk of chunks) {
    const url = `https://atcs.dishubkotabaru.id/apps/${chunk}`;
    try {
      const res = await fetch(url);
      const text = await res.text();
      
      // Look for ".min.js" or ".js" references that might indicate other chunks
      const regex = /"[0-9a-zA-Z_\-]+\.min\.js"|"[0-9a-zA-Z_\-]+\.js"/g;
      const matches = text.match(regex) || [];
      if (matches.length > 0) {
        console.log(`[Matches in ${chunk}] Found js file names:`, [...new Set(matches)]);
      }

      // Also look for chunk loading function (webpackJsonp, chunkId, etc.)
      const webpackLoaders = ['chunkId', 'webpackChunk', 'jsonp', 'u.mini.js', '.min.js?'];
      for (const loader of webpackLoaders) {
        if (text.includes(loader)) {
          console.log(`  [Loader Match] ${chunk} contains "${loader}"`);
          const idx = text.indexOf(loader);
          console.log('  Snippet:', text.substring(idx - 100, idx + 200));
        }
      }
    } catch (err) {
      console.error(err);
    }
  }
}
findChunks();
