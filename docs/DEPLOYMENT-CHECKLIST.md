# Deployment Checklist

This checklist ensures a smooth deployment of DosKit to production. Follow these steps before and after each deployment.

## Pre-Deployment Checklist

### Code Quality

- [ ] All tests pass (`npm run test`)
- [ ] No TypeScript errors (`npx tsc --noEmit`)
- [ ] No ESLint errors (`npm run lint`)
- [ ] Code coverage is acceptable (`npm run test:coverage`)
- [ ] All features work in development mode (`npm run dev`)

### Build Verification

- [ ] Production build succeeds (`npm run build`)
- [ ] Build size is acceptable (< 15MB total, < 500KB JS gzipped)
- [ ] No build warnings or errors
- [ ] Source maps are generated but hidden
- [ ] All assets are properly bundled

### Browser Testing

- [ ] Tested in Chrome (latest)
- [ ] Tested in Firefox (latest)
- [ ] Tested in Safari (latest)
- [ ] Tested in Edge (latest)
- [ ] Tested on mobile Chrome (Android)
- [ ] Tested on mobile Safari (iOS)

### Functionality Testing

- [ ] DOS emulator loads and runs
- [ ] Code editor works (Monaco Editor)
- [ ] File system operations work
- [ ] Compilation works (mock or real)
- [ ] Build panel displays correctly
- [ ] Error messages display properly
- [ ] PWA installation works
- [ ] Service worker registers correctly
- [ ] Offline mode works after first visit

### Performance Testing

- [ ] Initial load time < 3 seconds (on fast connection)
- [ ] Time to interactive < 5 seconds
- [ ] Lighthouse performance score > 80
- [ ] Lighthouse PWA score > 90
- [ ] No memory leaks during extended use
- [ ] WASM loads and initializes properly

### Security

- [ ] No security vulnerabilities (`npm audit`)
- [ ] Dependencies are up to date
- [ ] No exposed secrets or API keys
- [ ] HTTPS is enforced
- [ ] CSP headers are appropriate (if applicable)

### Documentation

- [ ] README is up to date
- [ ] CHANGELOG is updated with new version
- [ ] API documentation is current
- [ ] Browser compatibility guide is accurate
- [ ] Deployment guide is accurate

### Configuration

- [ ] Environment variables are set correctly
- [ ] Base path is correct for deployment target
- [ ] Custom domain configuration is correct (if applicable)
- [ ] Service worker cache version is incremented (if needed)
- [ ] Manifest.json is correct

## Deployment Steps

### 1. Prepare Release

```bash
# Ensure you're on the main branch
git checkout main
git pull origin main

# Update version in package.json
npm version patch  # or minor, or major

# Update CHANGELOG.md with release notes
# Edit CHANGELOG.md manually

# Commit version bump
git add package.json package-lock.json CHANGELOG.md
git commit -m "chore: bump version to X.Y.Z"
```

### 2. Run Pre-Deployment Checks

```bash
# Run all tests
npm run test

# Run linter
npm run lint

# Type check
npx tsc --noEmit

# Build for production
npm run build

# Preview production build
npm run preview
```

### 3. Deploy to Production

```bash
# Push to main branch (triggers GitHub Actions)
git push origin main
git push origin --tags

# Or manually trigger deployment
# Go to GitHub Actions → Deploy to GitHub Pages → Run workflow
```

### 4. Monitor Deployment

- [ ] Check GitHub Actions workflow status
- [ ] Verify build job completes successfully
- [ ] Verify deployment job completes successfully
- [ ] Check for any errors in workflow logs
- [ ] Verify build size report in workflow logs

### 5. Post-Deployment Verification

- [ ] Visit production URL and verify it loads
- [ ] Check browser console for errors
- [ ] Test core functionality (DOS emulator, code editor)
- [ ] Verify PWA installation works
- [ ] Test offline mode
- [ ] Check service worker registration
- [ ] Verify custom domain works (if applicable)
- [ ] Test on multiple browsers
- [ ] Test on mobile devices

### 6. Performance Monitoring

- [ ] Run Lighthouse audit on production
- [ ] Check Core Web Vitals
  - LCP (Largest Contentful Paint) < 2.5s
  - FID (First Input Delay) < 100ms
  - CLS (Cumulative Layout Shift) < 0.1
- [ ] Monitor bundle sizes
- [ ] Check for any performance regressions

### 7. Error Monitoring

- [ ] Check browser console for errors
- [ ] Monitor for any user-reported issues
- [ ] Check GitHub Issues for new reports
- [ ] Verify error boundaries work correctly

## Post-Deployment Checklist

### Immediate (Within 1 hour)

- [ ] Production site is accessible
- [ ] No critical errors in browser console
- [ ] Core functionality works
- [ ] PWA features work
- [ ] Mobile experience is good

### Short-term (Within 24 hours)

- [ ] Monitor for user-reported issues
- [ ] Check analytics for traffic patterns
- [ ] Verify SEO is working (if applicable)
- [ ] Check social media sharing (if applicable)
- [ ] Monitor performance metrics

### Long-term (Within 1 week)

- [ ] Review user feedback
- [ ] Check for any performance degradation
- [ ] Monitor error rates
- [ ] Review analytics data
- [ ] Plan next iteration based on feedback

## Rollback Procedure

If critical issues are found after deployment:

### Option 1: Quick Fix

```bash
# Fix the issue
git checkout main
# Make fixes
git add .
git commit -m "fix: critical issue description"
git push origin main
# Wait for automatic deployment
```

### Option 2: Revert to Previous Version

```bash
# Revert the problematic commit
git revert HEAD
git push origin main
# Wait for automatic deployment
```

### Option 3: Manual Rollback

1. Go to GitHub Actions
2. Find the last successful deployment
3. Re-run that workflow
4. Or manually deploy a previous version

## Common Issues and Solutions

### Build Fails

**Problem:** Build fails in GitHub Actions

**Solutions:**
1. Check workflow logs for specific error
2. Verify all dependencies are in package.json
3. Test build locally: `npm run build`
4. Check Node version matches workflow (Node 20)
5. Clear npm cache: `npm ci`

### Deployment Fails

**Problem:** Deployment job fails

**Solutions:**
1. Check GitHub Pages is enabled in repository settings
2. Verify permissions are correct in workflow
3. Check for any GitHub service outages
4. Try manual workflow dispatch
5. Check artifact upload succeeded

### Site Not Loading

**Problem:** Production site doesn't load

**Solutions:**
1. Check DNS configuration (if custom domain)
2. Verify CNAME file is in dist folder
3. Check base path in vite.config.ts
4. Clear browser cache
5. Wait for DNS propagation (up to 24 hours)

### PWA Not Working

**Problem:** PWA features don't work in production

**Solutions:**
1. Verify HTTPS is enabled
2. Check service worker registration
3. Verify manifest.json is accessible
4. Check browser console for errors
5. Increment cache version in sw.js

### Performance Issues

**Problem:** Site is slow in production

**Solutions:**
1. Check bundle sizes in build report
2. Verify code splitting is working
3. Check for large dependencies
4. Enable compression on server
5. Optimize images and assets

## Monitoring and Metrics

### Key Metrics to Track

- **Build Size:** Total dist folder size
- **JS Bundle Size:** Gzipped JavaScript size
- **Load Time:** Time to first paint
- **Time to Interactive:** When page becomes interactive
- **Lighthouse Scores:** Performance, PWA, Accessibility
- **Error Rate:** Percentage of users experiencing errors
- **Browser Support:** Percentage of users on supported browsers

### Tools

- **GitHub Actions:** Build and deployment logs
- **Lighthouse:** Performance and PWA audits
- **Browser DevTools:** Network, Performance, Console
- **WebPageTest:** Detailed performance analysis
- **Can I Use:** Browser compatibility checking

## Version History

| Version | Date | Changes | Deployed By |
|---------|------|---------|-------------|
| 1.0.0 | 2025-10-05 | Initial release | GitHub Actions |

## Additional Resources

- [GitHub Pages Documentation](https://docs.github.com/en/pages)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Vite Build Documentation](https://vitejs.dev/guide/build.html)
- [PWA Deployment Guide](https://web.dev/progressive-web-apps/)
- [Lighthouse Documentation](https://developers.google.com/web/tools/lighthouse)

---

**Last Updated:** 2025-10-05  
**Maintained By:** DosKit Team

