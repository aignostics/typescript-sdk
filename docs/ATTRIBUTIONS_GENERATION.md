# Attributions Generation

This document explains how the automatic attributions generation works in this project.

## Overview

The project automatically generates an `ATTRIBUTIONS.md` file that contains:

- A thank you message to the open-source community
- A list of all third-party dependencies from `package-lock.json`
- Full license texts for each dependency

## Scripts

- `npm run generate-attributions`: Manually generate the attributions file
- Pre-commit hook automatically runs when `package-lock.json` has changed

## Files

- `scripts/generate-attributions.js`: Main script that generates the attributions
- `scripts/pre-commit-attributions.js`: Pre-commit hook logic
- `.husky/pre-commit`: Husky pre-commit hook configuration
- `ATTRIBUTIONS.md`: Generated attributions file (tracked in git)

## How it works

1. When you commit changes, the pre-commit hook checks if `package-lock.json` is in the staged files
2. If it is (or if `ATTRIBUTIONS.md` is missing/outdated), it regenerates the attributions file
3. The updated `ATTRIBUTIONS.md` is automatically staged and included in the commit
4. This ensures the attributions file is always up-to-date with the current dependencies
