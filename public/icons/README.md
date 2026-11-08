# PWA Icons

This directory contains the Progressive Web App (PWA) icons for DosKit in various sizes.

## Generating Icons

### Option 1: Automated Script (Recommended)

The script uses sharp, one of the devDependencies, so `npm ci` installs it. Then run:

```bash
npm run generate-icons
```

This generates every icon below from `public/logo.svg`: the standard, maskable and Apple touch icons.

The icons depend on the machine that makes them. `logo.svg` sets its text in Courier New, which sharp renders with the fonts that machine has, and a machine without Courier New substitutes another monospace font. The icons in this directory were not all made on the same machine, so the script also rewrites icons you did not mean to change, with text that looks different. Commit only the icons your change is about: check `git status` afterwards, and put the others back with `git restore <file>`.

### Option 2: Online Tools

If you prefer not to install dependencies, you can use online tools:

1. **PWA Builder Image Generator**
   - Visit: https://www.pwabuilder.com/imageGenerator
   - Upload `public/logo.svg`
   - Download the generated icons
   - Extract to this directory

2. **RealFaviconGenerator**
   - Visit: https://realfavicongenerator.net/
   - Upload `public/logo.svg`
   - Configure settings for PWA
   - Download and extract icons

3. **Favicon.io**
   - Visit: https://favicon.io/
   - Use the PNG/SVG to favicon converter
   - Upload `public/logo.svg`
   - Download and extract

### Option 3: Manual Creation

Use any image editing software (Photoshop, GIMP, Inkscape, etc.) to export `public/logo.svg` to PNG at these sizes:

- 72x72
- 96x96
- 128x128
- 144x144
- 152x152
- 192x192
- 384x384
- 512x512

For maskable icons (192x192 and 512x512), add 10% padding around the logo with the theme color (#667eea) as background. The Apple touch icons are 180x180 and 120x120. Flatten the maskable and Apple touch icons onto the theme color, so that no pixel is transparent.

## Required Icons

### Standard Icons

- `icon-72x72.png` - Small icon
- `icon-96x96.png` - Small icon
- `icon-128x128.png` - Medium icon
- `icon-144x144.png` - Medium icon
- `icon-152x152.png` - Medium icon
- `icon-192x192.png` - Standard PWA icon
- `icon-384x384.png` - Large icon
- `icon-512x512.png` - Extra large icon

### Maskable Icons

- `icon-192x192-maskable.png` - Maskable icon (with safe area padding)
- `icon-512x512-maskable.png` - Large maskable icon (with safe area padding)

### Apple Touch Icons

- `apple-touch-icon-180x180.png` - For iPhones with 3x screens; iPads scale it down
- `apple-touch-icon-120x120.png` - For iPhones with 2x screens

`index.html` links them with their sizes.

## Icon Guidelines

### Standard Icons

- Use transparent background or #1a1a1a (app background color)
- Logo should fill most of the icon space
- Maintain aspect ratio

### Maskable Icons

- Use #667eea (theme color) as background, with no transparent pixels: launchers fill those with a color of their own, inside the mask
- Add 10% padding around the logo for safe area
- Logo should be centered
- These icons work better on Android adaptive icons

### Apple Touch Icons

- The logo on #667eea (theme color), with no transparent pixels: iOS fills those with black

## Testing Icons

After generating icons, test them:

1. **Local Testing:**

   ```bash
   npm run build
   npm run preview
   ```

   Then open DevTools → Application → Manifest, which lists each icon with its size. **Show only the minimum safe area for maskable icons** shows what a launcher's mask keeps of the maskable icons.

2. **Automated Checks:**

   `npm test` runs `scripts/icons.test.js`, which checks every icon that `index.html` and `manifest.json` declare for its size, and the maskable and Apple touch icons for transparent pixels.

3. **Online Testing:**
   - Deploy to GitHub Pages
   - Use https://www.pwabuilder.com/ to validate
   - Test installation on mobile devices

## Troubleshooting

### Icons not showing in manifest

- Clear browser cache
- Rebuild the app: `npm run build`
- Check browser console for errors
- Verify file paths in `public/manifest.json`

### Icons not loading on mobile

- Ensure icons are in PNG format
- Check file sizes (should be < 500KB each)
- Verify MIME types are correct
- Test on different devices/browsers

### Maskable icons not working

- Verify 10% safe area padding
- Use solid background color (#667eea)
- Check them in DevTools → Application → Manifest with **Show only the minimum safe area for maskable icons**

## Resources

- [PWA Icon Guidelines](https://web.dev/add-manifest/#icons)
- [Maskable Icons](https://web.dev/maskable-icon/)
- [PWA Builder](https://www.pwabuilder.com/)
- [Adaptive Icons](https://developer.android.com/guide/practices/ui_guidelines/icon_design_adaptive)
