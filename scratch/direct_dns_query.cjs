const dns = require('dns');

const resolver = new dns.Resolver();
resolver.setServers(['103.102.152.5']);

console.log('Querying 103.102.152.5 for cctv.atcs-dishubkbb.id...');
resolver.resolve4('cctv.atcs-dishubkbb.id', (err, addresses) => {
  if (err) {
    console.error('Failed to resolve:', err);
  } else {
    console.log('Resolved addresses:', addresses);
  }
});
