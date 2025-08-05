#!/usr/bin/env node

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

/**
 * Check if package-lock.json has changed in the staged files
 */
function hasPackageLockChanged() {
  try {
    // Get list of staged files
    const stagedFiles = execSync('git diff --cached --name-only', { encoding: 'utf8' });
    return stagedFiles.includes('package-lock.json');
  } catch (error) {
    console.warn('Warning: Could not check staged files:', error.message);
    return true; // Default to regenerating if we can't check
  }
}

/**
 * Check if ATTRIBUTIONS.md exists and is up to date
 */
function isAttributionsUpToDate() {
  const attributionsPath = path.join(process.cwd(), 'ATTRIBUTIONS.md');
  const packageLockPath = path.join(process.cwd(), 'package-lock.json');

  if (!fs.existsSync(attributionsPath)) {
    return false;
  }

  try {
    const attributionsStats = fs.statSync(attributionsPath);
    const packageLockStats = fs.statSync(packageLockPath);

    // Check if attributions file is newer than package-lock.json
    return attributionsStats.mtime >= packageLockStats.mtime;
  } catch (error) {
    console.warn('Warning: Could not check file timestamps:', error.message);
    return false;
  }
}

/**
 * Main pre-commit hook logic
 */
function runPreCommitHook() {
  console.log('⏳ Running pre-commit hook...');

  const packageLockChanged = hasPackageLockChanged();
  const attributionsUpToDate = isAttributionsUpToDate();

  // Always check license policy if package-lock.json changed
  if (packageLockChanged) {
    console.log('🔒 package-lock.json changed - checking license policy...');

    try {
      execSync('node scripts/check-license-policy.js', {
        stdio: 'inherit',
        cwd: process.cwd(),
      });
    } catch (error) {
      console.error('❌ License policy check failed');
      process.exit(1);
    }
  }

  if (packageLockChanged || !attributionsUpToDate) {
    console.log('📦 package-lock.json has changed or ATTRIBUTIONS.md is out of date');
    console.log('🔄 Regenerating attributions file...');

    try {
      // Run the attributions generation script
      execSync('node scripts/generate-attributions.js', {
        stdio: 'inherit',
        cwd: process.cwd(),
      });

      // Stage the updated attributions file
      execSync('git add ATTRIBUTIONS.md', { stdio: 'inherit' });

      console.log('✅ Attributions file updated and staged');
    } catch (error) {
      console.error('❌ Failed to generate attributions:', error.message);
      process.exit(1);
    }
  } else {
    console.log('✅ ATTRIBUTIONS.md is up to date');
  }

  console.log('✅ Pre-commit hook completed successfully');
}

// Run the hook
runPreCommitHook();
