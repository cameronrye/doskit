# Static Assets

This directory is reserved for static assets used in the application.

## Purpose

Store images, fonts, icons, and other static files that are imported directly into your React components.

## Directory Structure

Organize assets by type:

```
src/assets/
├── images/
│   ├── screenshots/
│   ├── icons/
│   └── backgrounds/
├── fonts/
│   └── dos-fonts/
└── sounds/
    └── system-sounds/
```

## Usage

Import assets in your components:

```typescript
import logo from '../assets/images/logo.png';
import dosFont from '../assets/fonts/dos-font.woff2';

function MyComponent() {
  return <img src={logo} alt="Logo" />;
}
```

## Asset Types

### Images
- PNG, JPG, SVG, WebP
- Use SVG for icons and logos when possible
- Optimize images before committing

### Fonts
- WOFF2 (preferred for web)
- TTF, OTF
- Consider DOS-style fonts for authentic retro feel

### Sounds
- MP3, OGG, WAV
- System sounds, UI feedback
- Keep file sizes small

## Public vs. Assets

**Use `src/assets/`** when:
- Assets are imported in components
- Assets need processing by Vite
- Assets are part of the component tree

**Use `public/`** when:
- Assets are referenced by URL
- Assets don't need processing
- Assets are loaded dynamically (e.g., favicon, robots.txt)

## Optimization

- Compress images before adding them
- Use appropriate formats (WebP for photos, SVG for graphics)
- Consider lazy loading for large assets
- Use Vite's asset handling for automatic optimization

## Example

```typescript
// Component using assets
import './MyComponent.css';
import retroBg from '../assets/images/backgrounds/retro-grid.png';
import beepSound from '../assets/sounds/beep.mp3';

function MyComponent() {
  return (
    <div style={{ backgroundImage: `url(${retroBg})` }}>
      <audio src={beepSound} />
    </div>
  );
}
```

