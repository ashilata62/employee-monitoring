const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

try {
    // Kill any existing agent processes to unlock files
    try {
        console.log('[Prebuild] Unlocking executable files by terminating any running agent processes...');
        const { execSync } = require('child_process');
        execSync('powershell -Command "Stop-Process -Name \'Insightful Agent\' -Force -ErrorAction SilentlyContinue"');
        execSync('powershell -Command "Stop-Process -Name \'Insightful Agent Setup\' -Force -ErrorAction SilentlyContinue"');
        console.log('[Prebuild] Processes terminated successfully.');
    } catch (procErr) {
        console.log('[Prebuild] No active processes to terminate or failed to terminate.');
    }

    console.log('[Prebuild] Running auto server URL injection...');

    const envPath = path.resolve(__dirname, '..', 'employee-monitoirng-backend', '.env');
    let serverUrl = 'https://insight-pool-production.up.railway.app'; // Default to live production server

    if (fs.existsSync(envPath)) {
        const envConfig = dotenv.parse(fs.readFileSync(envPath));
        if (envConfig.API_PUBLIC_URL && !envConfig.API_PUBLIC_URL.includes('localhost')) {
            serverUrl = envConfig.API_PUBLIC_URL.trim();
            console.log(`[Prebuild] Found production API_PUBLIC_URL in backend .env: ${serverUrl}`);
        } else {
            console.log(`[Prebuild] Using default live production server: ${serverUrl}`);
        }
    } else {
        console.log(`[Prebuild] Backend .env file not found, using default: ${serverUrl}`);
    }

    serverUrl = serverUrl.replace(/\/api\/?$/, '').replace(/\/$/, '');

    // Write server-config.json
    const configPath = path.join(__dirname, 'server-config.json');
    fs.writeFileSync(configPath, JSON.stringify({ SERVER_URL: serverUrl }, null, 2));
    console.log(`[Prebuild] Wrote server-config.json with SERVER_URL = ${serverUrl}`);
} catch (error) {
    console.error('[Prebuild] Failed during server URL injection:', error);
    process.exit(1);
}
