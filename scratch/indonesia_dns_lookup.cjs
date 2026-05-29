const dns = require('dns');

const idDnsServers = [
  '203.130.193.74', // Telkom
  '202.134.0.155',  // Telkom
  '203.130.208.18', // Telkom
  '202.169.224.2',  // Biznet
  '1.1.1.1',        // Cloudflare
  '8.8.8.8'         // Google
];

const hostname = 'cctv.atcs-dishubkbb.id';

function queryDns(server) {
  return new Promise((resolve) => {
    const resolver = new dns.Resolver();
    try {
      resolver.setServers([server]);
      console.log(`Querying ${server} for ${hostname}...`);
      resolver.resolve4(hostname, (err, addresses) => {
        if (err) {
          console.log(`[${server}] Failed:`, err.code || err.message);
          resolve(null);
        } else {
          console.log(`[${server}] Success:`, addresses);
          resolve(addresses);
        }
      });
    } catch (e) {
      console.log(`[${server}] Error:`, e.message);
      resolve(null);
    }
  });
}

async function main() {
  for (const server of idDnsServers) {
    await queryDns(server);
  }
}

main();
