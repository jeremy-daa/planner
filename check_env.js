const fs = require('fs');
try {
  const content = fs.readFileSync('.env', 'utf8');
  console.log('File read successfully.');
  content.split('\n').forEach(line => {
    const parts = line.split('=');
    if (parts.length > 0 && parts[0].trim()) {
      const key = parts[0].trim();
      console.log('Key found:', key);
      if (key === 'DATABASE_URL') {
          const val = parts.slice(1).join('=').trim();
          console.log(`DATABASE_URL value length: ${val.length}`);
      }
      if (key === 'POSTGRESQL_STRING') {
          const val = parts.slice(1).join('=').trim();
          console.log(`POSTGRESQL_STRING value length: ${val.length}`);
      }
    }
  });
} catch (e) {
  console.error('Error reading file:', e.message);
}
