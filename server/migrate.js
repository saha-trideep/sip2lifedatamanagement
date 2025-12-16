require('dotenv').config();
const { exec } = require('child_process');

const dbUrl = process.env.DATABASE_URL;
if (!dbUrl) {
    console.error("DATABASE_URL not found");
    process.exit(1);
}

// Use DATABASE_URL as DIRECT_URL if missing
const directUrl = process.env.DIRECT_URL || dbUrl;

console.log("Running migration with DIRECT_URL set...");

// Use cross-platform env setting or just pass it to the child process env
const env = { ...process.env, DIRECT_URL: directUrl };

// We use 'npx' directly. If on windows cmd, npx.cmd might be needed.
const npxCmd = process.platform === 'win32' ? 'npx.cmd' : 'npx';

const child = exec(`${npxCmd} prisma db push --accept-data-loss`, { env });

child.stdout.on('data', (data) => console.log(data));
child.stderr.on('data', (data) => console.error(data));

child.on('close', (code) => {
    console.log(`Migration process exited with code ${code}`);
});
