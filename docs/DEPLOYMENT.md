# GitHub Pages Deployment Guide

This guide explains how to deploy DosKit to GitHub Pages with automatic deployment via GitHub Actions.

## 🚀 Quick Start

The project is now configured for automatic deployment to GitHub Pages. Every push to the `main` branch will automatically build and deploy the site.

### Your Deployment URL

Once deployed, your site will be available at:
```
https://cameronrye.github.io/doskit/
```

## 📋 Prerequisites

Before deploying, ensure:

1. ✅ You have admin access to the `cameronrye/doskit` repository
2. ✅ GitHub Pages is enabled in repository settings
3. ✅ GitHub Actions has the necessary permissions

## ⚙️ One-Time Setup

### Step 1: Enable GitHub Pages

1. Go to your repository on GitHub: `https://github.com/cameronrye/doskit`
2. Click **Settings** → **Pages** (in the left sidebar)
3. Under **Source**, select:
   - Source: **GitHub Actions**
4. Click **Save**

That's it! The workflow is already configured.

### Step 2: Verify Workflow Permissions

1. Go to **Settings** → **Actions** → **General**
2. Scroll to **Workflow permissions**
3. Ensure **Read and write permissions** is selected
4. Check **Allow GitHub Actions to create and approve pull requests**
5. Click **Save**

## 🔄 Automatic Deployment

### How It Works

The deployment workflow (`.github/workflows/deploy.yml`) automatically:

1. **Triggers** on every push to the `main` branch
2. **Installs** dependencies with `npm ci`
3. **Builds** the project with `npm run build`
4. **Deploys** the `dist` folder to GitHub Pages

### Manual Deployment

You can also trigger deployment manually:

1. Go to **Actions** tab in your repository
2. Click **Deploy to GitHub Pages** workflow
3. Click **Run workflow** → **Run workflow**

## 🛠️ Configuration Details

### Vite Configuration

The `vite.config.ts` has been updated with:

```typescript
export default defineConfig({
  base: '/doskit/',  // Repository name for correct asset paths
  // ... other config
})
```

This ensures all assets (JS, CSS, images) load correctly from the `/doskit/` subdirectory.

### Workflow File

Location: `.github/workflows/deploy.yml`

Key features:
- **Node.js 20**: Uses latest LTS version
- **npm ci**: Fast, clean dependency installation
- **Caching**: Speeds up builds by caching node_modules
- **Artifact Upload**: Uploads build output to GitHub Pages
- **Concurrent Deployment**: Prevents multiple simultaneous deployments

### .nojekyll File

Location: `public/.nojekyll`

This empty file prevents GitHub Pages from processing the site with Jekyll, which can interfere with files/folders starting with underscores.

## 📦 Build Output

The build process creates a `dist` folder with:
- `index.html` - Main HTML file
- `assets/` - JavaScript, CSS, and other assets
- `favicon.svg`, `logo.svg` - Static assets from `public/`
- `.nojekyll` - Prevents Jekyll processing

## 🔍 Monitoring Deployments

### Check Deployment Status

1. Go to **Actions** tab in your repository
2. Click on the latest workflow run
3. View the build and deployment logs

### Deployment Environments

GitHub creates a `github-pages` environment:
- View at: **Settings** → **Environments** → **github-pages**
- Shows deployment history and status
- Displays the live URL

## 🐛 Troubleshooting

### Deployment Fails

**Problem**: Workflow fails during build or deployment.

**Solutions**:
1. Check the **Actions** tab for error logs
2. Verify `package.json` dependencies are correct
3. Ensure `npm run build` works locally
4. Check workflow permissions in Settings → Actions

### Site Shows 404

**Problem**: Deployed site shows "404 Page Not Found".

**Solutions**:
1. Verify GitHub Pages is enabled (Settings → Pages)
2. Check the source is set to "GitHub Actions"
3. Wait a few minutes for DNS propagation
4. Clear browser cache and try again

### Assets Not Loading

**Problem**: Site loads but CSS/JS files return 404.

**Solutions**:
1. Verify `base: '/doskit/'` is set in `vite.config.ts`
2. Check that asset paths in HTML start with `/doskit/`
3. Rebuild and redeploy: `npm run build`

### WASM Files Not Loading

**Problem**: js-dos WebAssembly files fail to load.

**Solutions**:
1. js-dos loads WASM from CDN (https://v8.js-dos.com), not from your site
2. Verify CDN is accessible in browser console
3. Check for CORS errors in browser console
4. Ensure `.nojekyll` file exists in `public/` folder

## 🔄 Updating the Site

To update your deployed site:

1. Make changes to your code
2. Commit and push to `main` branch:
   ```bash
   git add .
   git commit -m "Update site"
   git push origin main
   ```
3. GitHub Actions automatically builds and deploys
4. Check the **Actions** tab to monitor progress
5. Visit your site after deployment completes (usually 1-2 minutes)

## 🌐 Custom Domain (Optional)

To use a custom domain like `doskit.rye.dev`:

1. Add a `CNAME` file to `public/` folder:
   ```
   doskit.rye.dev
   ```
2. Configure DNS with your domain provider:
   - Add a CNAME record pointing to `cameronrye.github.io`
3. Go to **Settings** → **Pages**
4. Enter your custom domain and click **Save**
5. Wait for DNS propagation (can take up to 24 hours)
6. Update `base` in `vite.config.ts` to `'/'` for root domain

## 📊 Performance Optimization

The deployment is optimized for performance:

- ✅ **Code Splitting**: React vendor bundle separated
- ✅ **Asset Optimization**: Vite optimizes all assets
- ✅ **Source Maps**: Hidden source maps for debugging
- ✅ **CDN**: js-dos WASM files loaded from CDN
- ✅ **Caching**: GitHub Actions caches dependencies

## 🔒 Security

GitHub Pages deployment is secure:

- ✅ **HTTPS**: Automatic HTTPS for all GitHub Pages sites
- ✅ **Permissions**: Workflow uses minimal required permissions
- ✅ **Isolation**: Each deployment runs in isolated environment
- ✅ **Audit**: All deployments logged in Actions tab

## 📝 Deployment Checklist

Before your first deployment:

- [ ] Enable GitHub Pages in repository settings
- [ ] Set source to "GitHub Actions"
- [ ] Verify workflow permissions
- [ ] Push to `main` branch
- [ ] Monitor deployment in Actions tab
- [ ] Visit deployed site and test functionality
- [ ] Check browser console for errors
- [ ] Test on mobile devices

## 🎉 Success!

Once deployed, your DOS emulator will be live at:
```
https://cameronrye.github.io/doskit/
```

Share it with the world! 🌍

## 📞 Need Help?

If you encounter issues:

1. Check the [Troubleshooting](#-troubleshooting) section
2. Review workflow logs in the Actions tab
3. Open an issue: https://github.com/cameronrye/doskit/issues
4. Include:
   - Error messages from Actions logs
   - Browser console errors (if site loads)
   - Steps to reproduce the issue

---

Made with ❤️ by [Cameron Rye](https://rye.dev)

