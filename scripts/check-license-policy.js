#!/usr/bin/env node

import { execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import licenseConfig from '../license-checking-config.json' with { type: 'json' };

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ALLOWED_LICENSES = licenseConfig.allowedLicenses;
const ALLOWED_PACKAGES = licenseConfig.allowedPackages ?? [];

/**
 * Enforce license policy - fail on prohibited licenses
 */
function enforceLicensePolicy() {
  try {
    console.log('🔒 Enforcing license policy...');

    // Create the allowed licenses list for license-checker-rseidelsohn
    const allowedLicensesString = ALLOWED_LICENSES.join(';');

    // Packages explicitly whitelisted regardless of license (e.g. dev-only tooling)
    const excludePackagesArg = ALLOWED_PACKAGES.length
      ? ` --excludePackages "${ALLOWED_PACKAGES.join(';')}"`
      : '';

    // Run license checker with onlyAllow to enforce policy
    const cmd = `npx license-checker-rseidelsohn --excludePrivatePackages --onlyAllow "${allowedLicensesString}"${excludePackagesArg} --summary`;

    execSync(cmd, {
      stdio: 'inherit',
      cwd: path.join(__dirname, '..'),
    });
    console.log('✅ License policy check passed - all dependencies use approved licenses');
  } catch {
    console.error('\n❌ License policy violation detected!');
    console.error('Please review the output above and either:');
    console.error('1. Replace the problematic dependencies with alternatives');
    console.error('2. Get legal approval for the license and update the policy');
    console.error('3. Add specific packages to an allowlist if needed');
    process.exit(1);
  }
}

// Run the policy enforcement
enforceLicensePolicy();
