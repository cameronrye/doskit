# DosKit Logo Design

## Overview

The DosKit logo is a modern, scalable SVG design that combines retro DOS terminal aesthetics with contemporary design principles.

## Design Concept

The logo features a **terminal window icon** that represents the core functionality of DosKit - providing a DOS command-line interface through modern web technology.

### Visual Elements

1. **Terminal Window**: Rounded rectangle with purple gradient background
2. **Color Scheme**: Matches the app's header gradient (#667eea → #764ba2)
3. **DOS Prompt**: Classic "C:\>" prompt in green (#00ff00)
4. **Blinking Cursor**: Animated underscore cursor (in main logo)
5. **Window Controls**: macOS-style traffic light buttons (red, yellow, green)
6. **DosKit Text**: Subtle branding text at the bottom (main logo only)

## Color Palette

- **Primary Gradient**: `#667eea` (purple-blue) → `#764ba2` (purple)
- **Terminal Green**: `#00ff00` (classic DOS/terminal green)
- **Background**: `#1a1a1a` (dark terminal screen)
- **Window Controls**: 
  - Red: `#ff5f56`
  - Yellow: `#ffbd2e`
  - Green: `#27c93f`

## Files

### `/public/logo.svg`
- **Size**: 512x512px
- **Purpose**: Main logo for README, documentation, and promotional materials
- **Features**: Full detail with animated cursor and "DosKit" text
- **Usage**: Display at 150-300px width for optimal visibility

### `/public/favicon.svg`
- **Size**: 64x64px
- **Purpose**: Browser favicon and small icon displays
- **Features**: Simplified design optimized for small sizes (16x16 to 64x64)
- **Usage**: Automatically used by browsers for tabs and bookmarks

## Usage Guidelines

### In README.md
```markdown
<div align="center">
  <img src="public/logo.svg" alt="DosKit Logo" width="200"/>
</div>
```

### In HTML (favicon)
```html
<link rel="icon" type="image/svg+xml" href="/favicon.svg" />
```

### In React Components
```tsx
<img src="/logo.svg" alt="DosKit Logo" className="header-logo" />
```

### Recommended Sizes
- **README/Documentation**: 200-250px width
- **App Header**: 40-48px height
- **Favicon**: Automatic (browser handles sizing)
- **Social Media**: 512x512px (use logo.svg at full size)

## Customization

### Changing Colors

To modify the gradient colors, edit the `linearGradient` definition in the SVG:

```svg
<linearGradient id="terminalGradient" x1="0%" y1="0%" x2="100%" y2="100%">
  <stop offset="0%" style="stop-color:#667eea;stop-opacity:1" />
  <stop offset="100%" style="stop-color:#764ba2;stop-opacity:1" />
</linearGradient>
```

### Disabling Animation

To disable the cursor blink animation, remove or comment out the `@keyframes` and `.cursor` class in the SVG:

```svg
<!-- Remove or comment out:
<style>
  @keyframes blink { ... }
  .cursor { animation: blink 1.2s infinite; }
</style>
-->
```

### Adjusting Prompt Text

To change the prompt text from "C:\>" to something else, modify the text element:

```svg
<text x="96" y="200" ...>C:\&gt;</text>
<!-- Change to: -->
<text x="96" y="200" ...>$</text>  <!-- Unix-style prompt -->
```

## Design Rationale

### Why This Design?

1. **Instant Recognition**: Terminal window shape immediately communicates the app's purpose
2. **Brand Consistency**: Purple gradient matches the existing app header design
3. **Scalability**: Simple geometric shapes ensure clarity at all sizes
4. **Retro-Modern Balance**: Combines nostalgic DOS elements with contemporary styling
5. **Cross-Platform Appeal**: Works well on light and dark backgrounds
6. **Professional**: Clean, minimal design suitable for technical documentation

### Design Alternatives Considered

- **Modular "D" Letter**: Too abstract, less immediately recognizable
- **Command Line Typography**: Didn't scale well to small sizes
- **DOS Floppy Disk**: Too retro, didn't reflect modern web technology
- **Terminal + Tools**: Too complex, lost clarity at small sizes

## Technical Details

- **Format**: SVG (Scalable Vector Graphics)
- **Compatibility**: All modern browsers, GitHub, documentation platforms
- **File Size**: ~1-2KB (highly optimized)
- **Animation**: CSS-based (no JavaScript required)
- **Accessibility**: Includes proper `alt` text in all implementations

## Future Enhancements

Potential additions for future versions:

- [ ] Light mode variant (for light backgrounds)
- [ ] Monochrome version (for print/single-color use)
- [ ] Animated GIF version (for platforms that don't support SVG animation)
- [ ] PNG exports at common sizes (16x16, 32x32, 64x64, 128x128, 256x256, 512x512)
- [ ] Social media variants (Twitter card, Open Graph, etc.)

## License

The DosKit logo follows the same MIT license as the project itself. You're free to use, modify, and distribute it as part of the DosKit project.