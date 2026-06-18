#!/usr/bin/env node

/**
 * DataSuite Cloud Setup Verification
 * Run: node verify-cloud-setup.js
 * 
 * Verifies your environment is ready for cloud deployment
 */

const fs = require('fs');
const path = require('path');

console.log('\n🔍 DataSuite Cloud Setup Verification\n');

let allGood = true;
const checks = [];

// Check 1: Node.js version
const nodeVersion = process.version;
const majorVersion = parseInt(nodeVersion.split('.')[0].substring(1));
const nodeCheck = majorVersion >= 18;
checks.push({
  name: 'Node.js Version',
  status: nodeCheck,
  current: nodeVersion,
  required: '≥18.0.0'
});
if (!nodeCheck) allGood = false;

// Check 2: npm version
const { execSync } = require('child_process');
try {
  const npmVersion = execSync('npm --version', { encoding: 'utf-8' }).trim();
  const npmMajor = parseInt(npmVersion.split('.')[0]);
  const npmCheck = npmMajor >= 8;
  checks.push({
    name: 'npm Version',
    status: npmCheck,
    current: npmVersion,
    required: '≥8.0.0'
  });
  if (!npmCheck) allGood = false;
} catch (e) {
  checks.push({
    name: 'npm Version',
    status: false,
    current: 'Not found',
    required: '≥8.0.0'
  });
  allGood = false;
}

// Check 3: package.json exists
const packageJsonExists = fs.existsSync(path.join(__dirname, 'package.json'));
checks.push({
  name: 'package.json',
  status: packageJsonExists,
  current: packageJsonExists ? 'Found' : 'Missing',
  required: 'Required'
});
if (!packageJsonExists) allGood = false;

// Check 4: node_modules exists
const nodeModulesExists = fs.existsSync(path.join(__dirname, 'node_modules'));
checks.push({
  name: 'Dependencies Installed',
  status: nodeModulesExists,
  current: nodeModulesExists ? 'Yes' : 'No (run: npm install)',
  required: 'Required'
});

// Check 5: Environment files
const envExists = fs.existsSync(path.join(__dirname, '.env'));
const envExampleExists = fs.existsSync(path.join(__dirname, '.env.cloud.example'));
checks.push({
  name: '.env File',
  status: envExists,
  current: envExists ? 'Found' : 'Missing (copy .env.cloud.example)',
  required: 'Required for local dev'
});

checks.push({
  name: '.env.cloud.example',
  status: envExampleExists,
  current: envExampleExists ? 'Found' : 'Missing',
  required: 'Template for cloud'
});

// Check 6: Key files exist
const keyFiles = [
  'api/code-router.ts',
  'api/lib/env.ts',
  'api/queries/connection.ts',
  'src/pages/dashboard/IDEPage.tsx',
  'db/schema.ts'
];

const filesCheck = keyFiles.every(file => fs.existsSync(path.join(__dirname, file)));
checks.push({
  name: 'Key Source Files',
  status: filesCheck,
  current: filesCheck ? 'All found' : 'Some missing',
  required: 'All required'
});

// Check 7: Documentation files
const docFiles = [
  'QUICK_CLOUD_START.md',
  'CLOUD_SETUP.md',
  'CLOUD_MIGRATION_SUMMARY.md',
  'README_CLOUD.md'
];

const docsCheck = docFiles.every(file => fs.existsSync(path.join(__dirname, file)));
checks.push({
  name: 'Cloud Documentation',
  status: docsCheck,
  current: docsCheck ? 'All found' : 'Some missing',
  required: 'For setup'
});

// Check 8: Docker files (optional)
const dockerfileExists = fs.existsSync(path.join(__dirname, 'Dockerfile'));
const dockerComposeExists = fs.existsSync(path.join(__dirname, 'docker-compose.yml'));
const railwayTomlExists = fs.existsSync(path.join(__dirname, 'railway.toml'));

// Print results
console.log('╔════════════════════════════════════════════════╗');
console.log('║         ENVIRONMENT CHECK RESULTS              ║');
console.log('╚════════════════════════════════════════════════╝\n');

checks.forEach(check => {
  const icon = check.status ? '✅' : '❌';
  console.log(`${icon} ${check.name}`);
  console.log(`   Current: ${check.current}`);
  console.log(`   Required: ${check.required}\n`);
});

console.log('╔════════════════════════════════════════════════╗');
console.log('║           DEPLOYMENT CONFIGURATION             ║');
console.log('╚════════════════════════════════════════════════╝\n');

console.log(`${dockerfileExists ? '✅' : '⚠️ '} Dockerfile (optional for Docker deployment)`);
console.log(`${dockerComposeExists ? '✅' : '⚠️ '} docker-compose.yml (optional for local MySQL)`);
console.log(`${railwayTomlExists ? '✅' : '⚠️ '} railway.toml (for Railway deployment)\n`);

// Print recommendations
console.log('╔════════════════════════════════════════════════╗');
console.log('║              RECOMMENDATIONS                   ║');
console.log('╚════════════════════════════════════════════════╝\n');

if (!nodeModulesExists) {
  console.log('1️⃣  Install dependencies:');
  console.log('   npm install\n');
}

if (!envExists) {
  console.log('2️⃣  Create .env file:');
  console.log('   cp .env.cloud.example .env');
  console.log('   Then edit .env with your values\n');
}

console.log('3️⃣  For local development:');
console.log('   npm run dev\n');

console.log('4️⃣  For cloud deployment:');
console.log('   1. Read: QUICK_CLOUD_START.md');
console.log('   2. Get: PlanetScale + Replit accounts');
console.log('   3. Push: GitHub → Railway auto-deploys\n');

// Final status
console.log('╔════════════════════════════════════════════════╗');
if (allGood && nodeModulesExists) {
  console.log('║      ✅ READY FOR DEVELOPMENT!                ║');
  console.log('╚════════════════════════════════════════════════╝\n');
  console.log('Next: npm run dev\n');
  process.exit(0);
} else if (allGood) {
  console.log('║      ✅ ALMOST READY!                         ║');
  console.log('╚════════════════════════════════════════════════╝\n');
  console.log('Install dependencies: npm install\n');
  process.exit(0);
} else {
  console.log('║      ❌ SETUP INCOMPLETE                      ║');
  console.log('╚════════════════════════════════════════════════╝\n');
  process.exit(1);
}
