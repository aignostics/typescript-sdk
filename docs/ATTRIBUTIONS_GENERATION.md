# Attributions Generation and License Policy

This document explains how the automatic attributions generation and license policy enforcement works in this project.

## Overview

The project automatically:

1. **Enforces license policy** - Checks that all dependencies use approved licenses
2. **Generates attributions** - Creates an `ATTRIBUTIONS.md` file with:
   - A thank you message to the open-source community
   - A list of all third-party dependencies from `package-lock.json`
   - Full license texts for each dependency

## Scripts

- `npm run generate-attributions`: Manually generate the attributions file
- `npm run analyze-licenses`: Analyze all licenses and show policy compliance
- `npm run check-license-policy`: Enforce license policy (fail on prohibited licenses)
- Pre-commit hook automatically runs when `package-lock.json` has changed

## Files

- `scripts/generate-attributions.js`: Main script that generates the attributions
- `scripts/analyze-licenses.js`: License analysis and policy checking
- `scripts/check-license-policy.js`: License policy enforcement
- `scripts/pre-commit-attributions.js`: Pre-commit hook logic
- `.husky/pre-commit`: Husky pre-commit hook configuration
- `ATTRIBUTIONS.md`: Generated attributions file (tracked in git)
- `docs/LICENSE_POLICY.md`: Detailed license policy documentation

## How it works

1. When you commit changes, the pre-commit hook checks if `package-lock.json` is in the staged files
2. If it is, the hook first checks license policy compliance
3. If policy check fails, the commit is blocked
4. If policy check passes, it regenerates the attributions file (if needed)
5. The updated `ATTRIBUTIONS.md` is automatically staged and included in the commit
6. This ensures both license compliance and up-to-date attributions

## License Policy

See [`docs/LICENSE_POLICY.md`](LICENSE_POLICY.md) for detailed information about:

- Allowed, prohibited, and review-required licenses
- License checking tools and process
- Handling license violations
- Updating the license policy
