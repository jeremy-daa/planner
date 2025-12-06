const fs = require('fs');

try {
  const content = fs.readFileSync('.env', 'utf8');
  const lines = content.split('\n');
  const newLines = [];
  let pgString = '';

  // First pass to find POSTGRESQL_STRING
  lines.forEach(line => {
      const parts = line.split('=');
      if (parts.length > 1) {
          const key = parts[0].trim();
          if (key === 'POSTGRESQL_STRING') {
              pgString = parts.slice(1).join('=').trim();
              // Unquote if needed
              if ((pgString.startsWith('"') && pgString.endsWith('"')) || (pgString.startsWith("'") && pgString.endsWith("'"))) {
                   pgString = pgString.slice(1, -1);
              }
          }
      }
  });

  if (!pgString) {
      console.log('POSTGRESQL_STRING not found, aborting.');
      process.exit(1);
  }

  console.log('Found POSTGRESQL_STRING (len ' + pgString.length + '). Updating DATABASE_URL...');

  let dbUrlUpdated = false;
  lines.forEach(line => {
      const parts = line.split('=');
      if (parts.length > 1) {
          const key = parts[0].trim();
          if (key === 'DATABASE_URL') {
              newLines.push(`DATABASE_URL="${pgString}"`);
              dbUrlUpdated = true;
          } else {
              newLines.push(line);
          }
      } else {
          newLines.push(line);
      }
  });

  if (!dbUrlUpdated) {
      newLines.push(`DATABASE_URL="${pgString}"`);
  }

  fs.writeFileSync('.env', newLines.join('\n'));
  console.log('Successfully updated .env');

} catch (e) {
  console.error(e);
}
