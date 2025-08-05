#!/usr/bin/env node
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */

import { execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import licenseConfig from '../license-checking-config.json' with { type: 'json' };

const ALLOWED_LICENSES = licenseConfig.allowedLicenses;
const PROHIBITED_LICENSES = licenseConfig.prohibitedLicenses;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Run license analysis using license-checker-rseidelsohn
 */
function runLicenseAnalysis() {
  try {
    console.log('🔍 Analyzing licenses using license-checker-rseidelsohn...\n');

    // Run license checker to get all licenses in JSON format
    const licenseOutput = execSync(
      'npx license-checker-rseidelsohn --json --excludePrivatePackages',
      {
        encoding: 'utf8',
        cwd: path.join(__dirname, '..'),
      }
    );

    const licenses = JSON.parse(licenseOutput);

    // Analyze licenses
    const licenseStats = new Map();
    const problematicPackages = [];
    const reviewRequiredPackages = [];
    const unknownLicenses = [];

    for (const [packageName, packageInfo] of Object.entries(licenses)) {
      const packageLicenses = packageInfo.licenses;
      const licenseArray = Array.isArray(packageLicenses) ? packageLicenses : [packageLicenses];

      licenseArray.forEach(license => {
        if (!license || license === 'UNKNOWN') {
          unknownLicenses.push({ name: packageName, info: packageInfo });
          return;
        }

        // Count license usage
        licenseStats.set(license, (licenseStats.get(license) || 0) + 1);

        // Check against policies
        if (PROHIBITED_LICENSES.includes(license)) {
          problematicPackages.push({
            name: packageName,
            license: license,
            info: packageInfo,
            reason: 'PROHIBITED',
          });
        } else if (!ALLOWED_LICENSES.includes(license)) {
          unknownLicenses.push({
            name: packageName,
            license: license,
            info: packageInfo,
            reason: 'UNKNOWN_LICENSE_TYPE',
          });
        }
      });
    }

    // Display results
    displayLicenseStats(licenseStats);
    displayPolicyViolations(problematicPackages, unknownLicenses);

    // Return exit code based on policy violations
    if (problematicPackages.length > 0) {
      console.log('\n❌ License policy violations detected!');
      process.exit(1);
    } else if (reviewRequiredPackages.length > 0 || unknownLicenses.length > 0) {
      console.log('\n⚠️  Some licenses require manual review.');
      // Don't exit with error for review-required licenses
    } else {
      console.log('\n✅ All licenses comply with policy!');
    }
  } catch (error) {
    console.error('❌ Error analyzing licenses:', error.message);
    process.exit(1);
  }
}

/**
 * Display license statistics
 */
function displayLicenseStats(licenseStats) {
  const sortedLicenses = Array.from(licenseStats.entries()).sort((a, b) => b[1] - a[1]);

  const totalPackages = Array.from(licenseStats.values()).reduce((sum, count) => sum + count, 0);

  console.log('📊 LICENSE ANALYSIS RESULTS\n');
  console.log('┌─────────────────────────────────────────┬───────┬─────────┬────────────┐');
  console.log('│ License                                 │ Count │ % Total │ Status     │');
  console.log('├─────────────────────────────────────────┼───────┼─────────┼────────────┤');

  sortedLicenses.forEach(([license, count]) => {
    const percentage = ((count / totalPackages) * 100).toFixed(1);
    const licenseName = license.padEnd(39);
    const countStr = count.toString().padStart(5);
    const pct = `${percentage}%`.padStart(7);

    let status = '✅ ALLOWED';
    if (PROHIBITED_LICENSES.includes(license)) {
      status = '❌ PROHIBITED';
    } else if (!ALLOWED_LICENSES.includes(license)) {
      status = '❓ UNKNOWN';
    }

    const statusStr = status.padEnd(10);
    console.log(`│ ${licenseName} │ ${countStr} │ ${pct} │ ${statusStr} │`);
  });

  console.log('└─────────────────────────────────────────┴───────┴─────────┴────────────┘\n');
  console.log(`📈 Total packages analyzed: ${totalPackages}`);
  console.log(`📝 Unique licenses found: ${sortedLicenses.length}`);
}

/**
 * Display policy violations
 */
function displayPolicyViolations(prohibited, unknown) {
  if (prohibited.length > 0) {
    console.log('\n🚫 PROHIBITED LICENSES (Policy Violation):');
    prohibited.forEach(pkg => {
      console.log(`   ❌ ${pkg.name} - ${pkg.license}`);
      console.log(`      Repository: ${pkg.info.repository || 'N/A'}`);
    });
  }

  if (unknown.length > 0) {
    console.log('\n❓ PACKAGES WITH UNKNOWN LICENSES:');
    unknown.forEach(pkg => {
      console.log(`   ❓ ${pkg.name} - License information missing`);
      console.log(`      Repository: ${pkg.info.repository || 'N/A'}`);
    });
  }

  // Display policy information
  console.log('\n📋 LICENSE POLICY REFERENCE:');
  console.log('✅ ALLOWED: ' + ALLOWED_LICENSES.join(', '));
  console.log('❌ PROHIBITED: ' + PROHIBITED_LICENSES.join(', '));
}

// Run the analysis
runLicenseAnalysis();
