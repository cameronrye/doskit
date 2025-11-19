# Release Process

This document describes how releases work in DosKit.

## Overview

DosKit uses **[release-please](https://github.com/googleapis/release-please)** for fully automated releases. You don't need to manually update versions or changelogs!

### How It Works

1. **Write code** with conventional commit messages
2. **Merge PR to main** - that's it!
3. **release-please bot** automatically:
   - Creates/updates a "Release PR" with version bump and changelog
   - When you merge the Release PR, it creates a GitHub release
   - Builds and uploads artifacts automatically

## Conventional Commits

Use conventional commit messages for automatic versioning:

### Commit Types

- `feat:` - New feature → **MINOR** version bump (1.0.0 → 1.1.0)
- `fix:` - Bug fix → **PATCH** version bump (1.0.0 → 1.0.1)
- `docs:` - Documentation only → No version bump
- `chore:` - Maintenance → No version bump
- `refactor:` - Code refactoring → No version bump
- `test:` - Tests → No version bump
- `perf:` - Performance improvement → **PATCH** version bump
- `BREAKING CHANGE:` - Breaking change → **MAJOR** version bump (1.0.0 → 2.0.0)

### Examples

```bash
# Feature (minor bump)
git commit -m "feat: add gamepad support"

# Bug fix (patch bump)
git commit -m "fix: resolve audio sync issue"

# Breaking change (major bump)
git commit -m "feat!: redesign configuration API

BREAKING CHANGE: Configuration format has changed"

# No version bump
git commit -m "docs: update README"
git commit -m "chore: update dependencies"
```

## Release Workflow

### Normal Development

1. **Create a feature branch**:

   ```bash
   git checkout -b feat/my-feature
   ```

2. **Make changes with conventional commits**:

   ```bash
   git commit -m "feat: add new feature"
   git commit -m "fix: resolve bug"
   ```

3. **Push and create PR**:

   ```bash
   git push origin feat/my-feature
   # Create PR on GitHub
   ```

4. **Merge PR to main** - Done! CI runs, deploys to GitHub Pages

### Creating a Release

After merging PRs to main, release-please automatically creates a **Release PR**:

1. **Check for Release PR**:
   - Look for a PR titled "chore(main): release X.Y.Z"
   - It contains updated `package.json` and `CHANGELOG.md`

2. **Review the Release PR**:
   - Check the version number is correct
   - Review the auto-generated changelog
   - Ensure all changes are included

3. **Merge the Release PR**:
   - Click "Merge" on the Release PR
   - release-please automatically:
     - Creates a GitHub release
     - Tags the commit
     - Builds and uploads artifacts

That's it! No manual version bumping or changelog editing needed.

## Versioning

DosKit follows [Semantic Versioning](https://semver.org/):

- **MAJOR** (X.0.0): Breaking changes, incompatible API changes
- **MINOR** (0.X.0): New features, backwards compatible
- **PATCH** (0.0.X): Bug fixes, backwards compatible

release-please automatically determines the version bump based on your commit messages!

## Manual Release (Emergency Only)

If you need to create a release manually:

1. **Update version** in `package.json`
2. **Update CHANGELOG.md** manually
3. **Commit**: `git commit -m "chore: release X.Y.Z"`
4. **Tag**: `git tag vX.Y.Z`
5. **Push**: `git push origin main --tags`

## Troubleshooting

### No Release PR created

- Ensure you're using conventional commit messages
- Check that commits are merged to `main` branch
- Look for the release-please workflow in Actions tab
- May take a few minutes after merging to main

### Release PR has wrong version

- Check your commit messages follow conventional commits
- `feat:` = minor, `fix:` = patch, `BREAKING CHANGE:` = major
- Close the Release PR and fix commit messages, then push to main

### Need to skip a release

- Don't merge the Release PR
- Continue merging features to main
- release-please will update the Release PR with all changes

### Need to delete a release

```bash
# Delete the tag locally
git tag -d v1.1.0

# Delete the tag remotely
git push origin :refs/tags/v1.1.0

# Delete the release on GitHub
gh release delete v1.1.0
```

## Benefits

- **Zero manual work**: No version bumping or changelog editing
- **Consistent**: Follows semantic versioning automatically
- **Transparent**: Release PR shows exactly what will be released
- **Flexible**: Can review and edit Release PR before merging
- **Safe**: Can't accidentally release without review

## Learn More

- [release-please documentation](https://github.com/googleapis/release-please)
- [Conventional Commits](https://www.conventionalcommits.org/)
- [Semantic Versioning](https://semver.org/)
