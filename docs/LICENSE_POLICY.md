# License Policy and Checking

This document describes the license policy and automated checking system for the Aignostics Platform TypeScript SDK project.

## License Policy

Only packages with permissive licenses such as MIT are allowed. See `license-checking-config.json` for a detailed list.

## Automated License Checking

### Scripts

- `npm run analyze-licenses` - Analyze all licenses and show policy compliance
- `npm run check-license-policy` - Enforce license policy (fail on violations)
- `npm run generate-attributions` - Generate ATTRIBUTIONS.md file

### Pre-commit Hook

The pre-commit hook automatically:

1. **License Policy Check** - When `package-lock.json` changes, checks that all new dependencies comply with the license policy
2. **Attribution Generation** - Updates `ATTRIBUTIONS.md` with current dependency licenses
3. **Automatic Staging** - Stages the updated attribution file

### Tools Used

We use [`license-checker-rseidelsohn`](https://www.npmjs.com/package/license-checker-rseidelsohn) for license analysis:

- **Maintenance**: Actively maintained (last updated 1 year ago)
- **Community**: 151k weekly downloads
- **License**: BSD-3-Clause (compatible)
- **Features**: Comprehensive license detection, policy enforcement

## Usage

### Check Current License Status

```bash
# Analyze all licenses with policy status
npm run analyze-licenses

# Quick policy compliance check
npm run check-license-policy

# See license summary
npx license-checker-rseidelsohn --summary
```

### Adding New Dependencies

When adding new npm packages:

1. The pre-commit hook will automatically check license compliance
2. If a package has a prohibited license, the commit will fail
3. If a package requires review, it will be noted but won't fail the build
4. The `ATTRIBUTIONS.md` file will be automatically updated

### Handling License Violations

If you encounter a license policy violation:

1. **Option 1**: Find an alternative package with a compatible license
2. **Option 2**: Request legal review for the specific license
3. **Option 3**: Update the license policy if approved by legal team

### Updating License Policy

To update the allowed licenses:

1. Edit the `license-checking-config`
2. Test with `npm run check-license-policy`

## Manual License Review Process

For packages requiring review:

1. Document the package name, version, and license
2. Review the license terms for compatibility with our open source project
3. Get legal approval if needed
4. Either add to allowed list or find alternative

## Integration

### CI/CD Integration

Add license checking to your CI pipeline:

```yaml
- name: Check License Policy
  run: npm run check-license-policy
```

### IDE Integration

Consider adding these npm scripts to your IDE for quick access:

- License analysis
- Policy checking
- Attribution generation

## Troubleshooting

### Common Issues

1. **"UNKNOWN" licenses** - Package has no license metadata or the license is not listed as allowed of prohibited
   - Check package repository for license file
   - Contact package maintainer
   - Consider finding alternative

2. **Policy violations** - Package uses prohibited license
   - Find alternative package
   - Request legal review
   - Update policy if approved

3. **Attribution file conflicts** - Merge conflicts in ATTRIBUTIONS.md
   - Regenerate with `npm run generate-attributions`
   - The file is auto-generated, so regeneration resolves conflicts

### Getting Help

If you need help with license issues:

1. Check this documentation
2. Run `npm run analyze-licenses` for detailed analysis
3. Contact the legal team for license review questions
4. Contact the development team for tooling issues
