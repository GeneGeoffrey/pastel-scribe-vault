#!/usr/bin/env node

/**
 * Deployment verification script
 * Ensures all components are properly configured for production
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Verifying deployment configuration...\n');

// Check if contract is deployed
const sepoliaDeployment = path.join(__dirname, '..', 'deployments', 'sepolia', 'EncryptedMoodDiary.json');
if (fs.existsSync(sepoliaDeployment)) {
  const deployment = JSON.parse(fs.readFileSync(sepoliaDeployment, 'utf8'));
  console.log('✅ Contract deployed on Sepolia:', deployment.address);
} else {
  console.log('❌ Contract not deployed on Sepolia');
}

// Check frontend configuration
const frontendPackage = path.join(__dirname, '..', 'frontend', 'package.json');
if (fs.existsSync(frontendPackage)) {
  const pkg = JSON.parse(fs.readFileSync(frontendPackage, 'utf8'));
  console.log('✅ Frontend package version:', pkg.version);
} else {
  console.log('❌ Frontend package.json not found');
}

// Check environment configuration
const configExample = path.join(__dirname, '..', 'config.example.json');
if (fs.existsSync(configExample)) {
  console.log('✅ Configuration template available');
} else {
  console.log('❌ Configuration template missing');
}

// Check demo video
const demoVideo = path.join(__dirname, '..', 'daliy.mp4');
if (fs.existsSync(demoVideo)) {
  const stats = fs.statSync(demoVideo);
  console.log('✅ Demo video available:', (stats.size / 1024 / 1024).toFixed(2), 'MB');
} else {
  console.log('❌ Demo video missing');
}

console.log('\n🎉 Deployment verification complete!');
console.log('Run "npm run full-deploy" to deploy all components.');
