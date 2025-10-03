# PWA Quick Start Guide

Get DosKit's PWA features up and running in 5 minutes!

## 🚀 Quick Setup

### 1. Generate Icons

Choose one of these methods:

**Option A: Automated (Recommended)**
```bash
npm install --save-dev sharp
npm run generate-icons
```

**Option B: Browser-based**
```bash
npm run create-icon-generator
# Then open public/icons/icon-generator.html in your browser
# Click "Download All Icons" and extract to public/icons/
```

**Option C: Online Tool**
- Visit https://www.pwabuilder.com/imageGenerator
- Upload `public/logo.svg`
- Download and extract icons to `public/icons/`

### 2. Build and Test

```bash
# Build the app
npm run build

# Preview the production build
npm run preview
```

### 3. Test PWA Features

Open http://localhost:4173 in your browser:

1. **Check Manifest:**
   - Open DevTools (F12)
   - Go to Application → Manifest
   - Verify all fields are populated

2. **Check Service Worker:**
   - Go to Application → Service Workers
   - Verify it's registered and active

3. **Test Offline:**
   - Go to Application → Service Workers
   - Check "Offline" checkbox
   - Reload the page - it should still work!

4. **Test Installation:**
   - Look for install icon in address bar
   - Click to install the app
   - Launch from desktop/start menu

### 4. Deploy

Push to GitHub to deploy to GitHub Pages:

```bash
git add .
git commit -m "Add PWA features"
git push origin main
```

The app will automatically deploy with PWA features enabled!

## ✅ Verification Checklist

After deployment, verify:

- [ ] App installs on desktop (Chrome/Edge)
- [ ] App installs on mobile (Android)
- [ ] Works offline after first visit
- [ ] Icons display correctly
- [ ] Lighthouse PWA score is 90+

## 🎯 Next Steps

- Read the [full PWA documentation](./PWA.md)
- Customize the manifest in `public/manifest.json`
- Adjust service worker caching in `public/sw.js`
- Add custom app shortcuts
- Implement push notifications

## 🐛 Common Issues

### Icons not showing?
```bash
# Regenerate icons
npm run generate-icons

# Rebuild
npm run build
```

### Service worker not registering?
- Ensure you're using HTTPS or localhost
- Check browser console for errors
- Clear cache and reload

### App not working offline?
- Visit the app online first to cache assets
- Check that service worker is active
- Verify assets are cached in DevTools

## 📚 Resources

- [PWA Documentation](./PWA.md)
- [Icon Generation Guide](../public/icons/README.md)
- [Service Worker Registration](../src/utils/serviceWorkerRegistration.ts)
- [Offline Indicator Component](../src/components/OfflineIndicator.tsx)

