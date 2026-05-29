const fs = require('fs');

async function lookup(hostname) {
  console.log(`Looking up ${hostname} via DNS-over-HTTPS...`);
  try {
    const res = await fetch(`https://dns.google/resolve?name=${hostname}&type=A`);
    const data = await res.json();
    console.log(JSON.stringify(data, null, 2));
  } catch (err) {
    console.error('Error:', err.message);
  }
}

lookup('atcs-dishubkbb.id');
