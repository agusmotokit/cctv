import fs from 'fs';

function extract() {
  const html = fs.readFileSync('scratch/tabalong_main.html', 'utf8');
  
  const scriptStart = html.indexOf('(self.$R=self.$R||{})["tsr"]');
  if (scriptStart === -1) {
    console.error('Failed to find start of TSR script!');
    return;
  }
  const scriptEnd = html.indexOf('</script>', scriptStart);
  let scriptContent = html.substring(scriptStart, scriptEnd);
  
  scriptContent = scriptContent.replace('document.currentScript.remove()', '');
  
  const sandboxCode = `
    import fs from 'fs';
    
    // Setup globals for Seroval script
    const self = { $R: {} };
    globalThis.self = self;
    globalThis.$_TSR = {};
    globalThis.$R = self.$R;
    globalThis.document = { currentScript: { remove() {} } };
    globalThis.window = { setTimeout() {} };
    globalThis.ReadableStream = class {};
    
    // Execute the hydration script
    ${scriptContent}
    
    // Dump the data
    fs.writeFileSync('scratch/tabalong_tsr_dump.json', JSON.stringify(self.$R, null, 2), 'utf8');
    console.log('Successfully wrote scratch/tabalong_tsr_dump.json');
  `;
  
  fs.writeFileSync('scratch/tabalong_eval.js', sandboxCode, 'utf8');
  console.log('Created tabalong_eval.js sandbox script.');
}

extract();
