const fs = require('fs');

try {
  const content = fs.readFileSync('.env', 'utf8');
  console.log('Reading .env...');
  
  const envVars = {};
  content.split('\n').forEach(line => {
    const parts = line.split('=');
    if (parts.length > 1) {
        const key = parts[0].trim();
        const val = parts.slice(1).join('=').trim();
        envVars[key] = val;
    }
  });

  if (envVars['DATABASE_URL']) {
      const val = envVars['DATABASE_URL'];
      console.log('DATABASE_URL found.');
      console.log('Length:', val.length);
      console.log('Starts with "postgresql://":', val.startsWith('postgresql://'));
      console.log('Starts with "postgres://":', val.startsWith('postgres://'));
      console.log('Starts with quote " or \' :', val.startsWith('"') || val.startsWith("'"));
      
      // Check if it's the placeholders
      if (val.includes('johndoe') || val.includes('randompassword')) {
          console.log('WARNING: Seems to be default placeholder.');
      }
  } else {
      console.log('DATABASE_URL NOT found in .env');
  }

  if (envVars['POSTGRESQL_STRING']) {
      const val = envVars['POSTGRESQL_STRING'];
      console.log('POSTGRESQL_STRING found.');
      console.log('Length:', val.length);
      console.log('Starts with "postgresql://":', val.startsWith('postgresql://'));
  }

} catch (e) {
  console.error(e);
}
