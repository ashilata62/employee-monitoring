const fs = require('fs');
const path = require('path');

function findExeFiles(dir) {
    let results = [];
    if (!fs.existsSync(dir)) return results;
    const items = fs.readdirSync(dir, { withFileTypes: true });
    for (const it of items) {
        const full = path.join(dir, it.name);
        if (it.isDirectory()) {
            if (it.name !== 'win-unpacked' && it.name !== 'node_modules') {
                results = results.concat(findExeFiles(full));
            }
        } else if (it.isFile() && it.name.toLowerCase().endsWith('.exe')) {
            const lower = it.name.toLowerCase();
            if (!lower.includes('uninstaller')) {
                const stat = fs.statSync(full);
                results.push({ path: full, mtime: stat.mtimeMs, isSetup: lower.includes('setup') });
            }
        }
    }
    return results;
}

try {
    const repoRoot = path.resolve(__dirname, '..');
    const agentSourceDir = path.resolve(__dirname);
    const backendAgentDir = path.resolve(__dirname, '..', 'employee-monitoirng-backend', 'public', 'agent');
    const frontendAgentDir = path.resolve(__dirname, '..', 'employee-monitoring-frontend', 'public', 'agent');

    if (!fs.existsSync(backendAgentDir)) {
        fs.mkdirSync(backendAgentDir, { recursive: true });
    }
    if (!fs.existsSync(frontendAgentDir)) {
        fs.mkdirSync(frontendAgentDir, { recursive: true });
    }

    const distDir = path.join(agentSourceDir, 'dist');
    const exes = findExeFiles(distDir);

    if (!exes || exes.length === 0) {
        console.error('No .exe files found in agent-source/dist');
        process.exit(2);
    }

    // Prioritize setup (NSIS installer) files for robustness and stability, then by mtime
    exes.sort((a, b) => {
        if (a.isSetup && !b.isSetup) return -1;
        if (!a.isSetup && b.isSetup) return 1;
        return b.mtime - a.mtime;
    });

    const latest = exes[0];
    const destName = path.basename(latest.path);
    const destPath = path.join(backendAgentDir, destName);
    const canonicalPath = path.join(backendAgentDir, 'EMS-Tracker-latest.exe');

    console.log('Found latest exe:', latest.path);
    console.log('Copying to backend agent folder:', destPath);
    fs.copyFileSync(latest.path, destPath);

    // Also write canonical name for easy download URL
    try {
        fs.copyFileSync(latest.path, canonicalPath);
        console.log('Copied canonical latest to', canonicalPath);

        // Also copy canonical to frontend public folder
        const frontendCanonicalPath = path.join(frontendAgentDir, 'EMS-Tracker-latest.exe');
        fs.copyFileSync(latest.path, frontendCanonicalPath);
        console.log('Copied canonical latest to frontend public folder:', frontendCanonicalPath);

        // Create zip file
        const canonicalZipPath = path.join(backendAgentDir, 'EMS-Tracker-latest.zip');
        const { execSync } = require('child_process');
        execSync(`powershell -Command "Compress-Archive -Path '${canonicalPath}' -DestinationPath '${canonicalZipPath}' -Force"`);
        console.log('Created canonical latest zip at', canonicalZipPath);
    } catch (err) {
        console.warn('Failed to write canonical latest file or zip:', err.message);
    }

    console.log('Publish latest completed.');
} catch (err) {
    console.error('Error publishing latest exe:', err);
    process.exit(1);
}
