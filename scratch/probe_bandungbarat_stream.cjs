const fs = require('fs');

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const url = 'https://cctv.atcs-dishubkbb.id/9512d5e6-2424-44f0-869a-4026ea91b2ed.html';

console.log(`Fetching stream page: ${url}`);

fetch(url, {
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  }
})
.then(res => res.text())
.then(text => {
  console.log('Page content:');
  console.log(text);
})
.catch(err => {
  console.error('Detailed Error:', err);
});
