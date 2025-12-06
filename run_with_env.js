const fs = require('fs');
const { spawn } = require('child_process');

console.log('Reading .env...');
const envContent = fs.readFileSync('.env', 'utf8');
const envVars = {};
envContent.split('\n').forEach(line => {
   const parts = line.split('=');
   if (parts.length > 1) {
       const key = parts[0].trim();
       let val = parts.slice(1).join('=').trim();
       if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
           val = val.slice(1, -1);
       }
       if (key && val) {
           envVars[key] = val;
       }
   }
});

if (envVars['POSTGRESQL_STRING']) {
    console.log('Mapping POSTGRESQL_STRING to DATABASE_URL');
    envVars['DATABASE_URL'] = envVars['POSTGRESQL_STRING'];
}

console.log('Environment variables loaded:', Object.keys(envVars));

const args = process.argv.slice(2);
if (args.length === 0) {
    console.error('No command provided');
    process.exit(1);
}

const command = args[0];
const commandArgs = args.slice(1);

console.log(`Running: ${command} ${commandArgs.join(' ')}`);

console.log('Renaming .env to .env.bak to avoid Prisma conflict...');
try {
    if (fs.existsSync('.env')) {
        fs.renameSync('.env', '.env.bak');
    }
} catch (e) {
    console.error('Failed to rename .env:', e);
}

const child = spawn(command, commandArgs, {
    env: { ...process.env, ...envVars },
    stdio: 'inherit',
    shell: true
});

child.on('exit', (code) => {
    console.log('Restoring .env...');
    try {
        if (fs.existsSync('.env.bak')) {
            fs.renameSync('.env.bak', '.env');
        }
    } catch (e) {
        console.error('Failed to restore .env:', e);
    }
    process.exit(code);
});
