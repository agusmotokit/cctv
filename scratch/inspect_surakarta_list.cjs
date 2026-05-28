const fs = require('fs');

function inspectList() {
  const props = JSON.parse(fs.readFileSync('scratch/surakarta_props.json', 'utf-8'));
  const list = props.list || [];
  
  console.log(`Total cameras: ${list.length}`);
  console.log('Keys of first camera:', Object.keys(list[0]));
  
  // Group by stream format / extension
  const formats = {};
  const jnsUrls = {};
  
  list.forEach(cam => {
    const ext = cam.url ? cam.url.split('.').pop().split('?')[0] : 'unknown';
    formats[ext] = (formats[ext] || 0) + 1;
    
    jnsUrls[cam.jns_url] = (jnsUrls[cam.jns_url] || 0) + 1;
  });
  
  console.log('Formats:', formats);
  console.log('jns_url distributions:', jnsUrls);
  
  console.log('\nSample items:');
  console.log(list.slice(0, 5));
}

inspectList();
