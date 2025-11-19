# SEO and Metadata Implementation Guide

This document describes the comprehensive SEO, metadata, and web standards implementation for DosKit.

## Overview

DosKit now includes a complete suite of web metadata, SEO optimizations, and discovery files to ensure maximum visibility and proper representation across search engines, social media platforms, and AI/LLM crawlers.

## Implemented Features

### 1. Social Media Meta Tags

#### Open Graph (Facebook, LinkedIn, etc.)

- `og:type` - Website type
- `og:url` - Canonical URL (https://doskit.net/)
- `og:site_name` - Site name
- `og:title` - Page title
- `og:description` - Detailed description
- `og:image` - Social preview image (1200x630px PNG)
- `og:image:width` - Image width
- `og:image:height` - Image height
- `og:image:alt` - Image alt text
- `og:locale` - Language locale

#### Twitter Cards

- `twitter:card` - Card type (summary_large_image)
- `twitter:url` - Canonical URL
- `twitter:title` - Page title
- `twitter:description` - Detailed description
- `twitter:image` - Social preview image
- `twitter:image:alt` - Image alt text
- `twitter:creator` - Creator handle (@cameronrye)
- `twitter:site` - Site handle (@cameronrye)

### 2. Social Media Images

#### Generated Images

- **Open Graph Image**: `og-image.png` (1200x630px)
  - Optimized for Facebook, LinkedIn, and other OG-compatible platforms
  - Features terminal interface with DosKit branding
  - High-quality PNG with proper compression

- **GitHub Social Preview**: `github-social.png` (1280x640px)
  - Optimized for GitHub repository social preview
  - Includes additional context and branding
  - Proper dimensions for GitHub's requirements

#### Image Generation Process

1. SVG source files created in `/public/`:
   - `social-preview.svg` (1200x630 viewBox)
   - `github-social-preview.svg` (1280x640 viewBox)

2. Automated conversion using Sharp:
   - Script: `scripts/generate-social-images.js`
   - Converts SVG to high-quality PNG
   - Runs automatically during build process
   - Can be run manually: `npm run generate-social-images`

3. Build Integration:
   - Added to `package.json` build script
   - Runs before TypeScript compilation
   - Copies images to both `public/` and `dist/` directories

### 3. SEO and Structured Data

#### Sitemap.xml

Location: `/public/sitemap.xml`

Includes:

- Main page (priority 1.0)
- Documentation pages (priority 0.7-0.8)
- GitHub repository link (priority 0.9)
- Proper lastmod dates
- Change frequency hints

#### JSON-LD Structured Data

Location: `index.html` (in `<head>`)

Implements Schema.org types:

- **WebSite**: Site-level information
- **SoftwareApplication**: Application details, features, ratings
- **Person**: Author/developer information
- **WebPage**: Page-specific metadata
- **ImageObject**: Primary image information

Benefits:

- Enhanced search engine understanding
- Rich snippets in search results
- Better indexing of application features
- Improved knowledge graph representation

### 4. LLM Discovery Files

#### llm.txt

Location: `/public/llm.txt`

Concise project summary for AI crawlers including:

- Project overview
- Key features
- Technology stack
- Project structure
- Usage instructions
- Development commands
- License and links
- Browser compatibility

#### llm-full.txt

Location: `/public/llm-full.txt`

Comprehensive documentation for AI crawlers including:

- Complete table of contents
- Detailed feature descriptions
- Architecture overview
- Full project structure
- Installation and setup
- Configuration options
- API documentation
- Development workflow
- Deployment guide
- Browser compatibility matrix
- Troubleshooting guide
- Contributing guidelines
- Contact information

### 5. Standard Web Files

#### robots.txt

Location: `/public/robots.txt`

Features:

- Allow all crawlers by default
- Disallow build artifacts and source maps
- Explicit allow rules for AI/LLM crawlers:
  - GPTBot (OpenAI)
  - ChatGPT-User
  - CCBot (Common Crawl)
  - anthropic-ai (Anthropic)
  - Claude-Web
  - Google-Extended
  - PerplexityBot
- Sitemap location
- Host preference for SEO

#### humans.txt

Location: `/public/humans.txt`

Includes:

- Team information (developer, contact, social links)
- Acknowledgments (js-dos, DOSBox, React, Vite teams)
- Technology colophon (complete tech stack)
- Project information (version, license, repository)
- Site details (standards, accessibility, SEO)
- Feature list
- Browser support
- Contact information
- ASCII art logo

### 6. Well-Known URIs

#### .well-known/security.txt

Location: `/public/.well-known/security.txt`

Follows RFC 9116 standard:

- Contact information (email and GitHub)
- Expiration date
- Preferred languages
- Canonical URL
- Security policy link
- Acknowledgments link

#### .well-known/change-password

Location: `/public/.well-known/change-password`

Note: DosKit doesn't have user accounts, but this file is provided for completeness and redirects to the home page.

## File Locations

### Source Files

```
public/
├── .well-known/
│   ├── security.txt
│   └── change-password
├── social-preview.svg
├── github-social-preview.svg
├── og-image.png (generated)
├── github-social.png (generated)
├── sitemap.xml
├── robots.txt
├── humans.txt
├── llm.txt
└── llm-full.txt
```

### Build Output

All files are automatically copied to `dist/` during the build process.

## Build Process

### Scripts

1. **Generate Social Images**

   ```bash
   npm run generate-social-images
   ```

   Converts SVG source files to PNG images.

2. **Build**
   ```bash
   npm run build
   ```
   Full build process:
   - Generate social images
   - TypeScript compilation
   - Vite production build
   - Service worker version injection

### Automated Steps

1. `generate-social-images.js` runs first
2. Creates PNG images from SVG sources
3. Copies images to both `public/` and `dist/`
4. Vite copies all public files to dist
5. Service worker is updated with new assets

## Validation

### Testing Social Media Previews

1. **Facebook/Open Graph**
   - Use Facebook Sharing Debugger: https://developers.facebook.com/tools/debug/
   - Enter URL: https://doskit.net/
   - Check image preview and metadata

2. **Twitter Cards**
   - Use Twitter Card Validator: https://cards-dev.twitter.com/validator
   - Enter URL: https://doskit.net/
   - Verify card preview

3. **LinkedIn**
   - Use LinkedIn Post Inspector: https://www.linkedin.com/post-inspector/
   - Enter URL: https://doskit.net/
   - Check preview

### Testing Structured Data

1. **Google Rich Results Test**
   - URL: https://search.google.com/test/rich-results
   - Enter URL: https://doskit.net/
   - Verify structured data is valid

2. **Schema.org Validator**
   - URL: https://validator.schema.org/
   - Enter URL: https://doskit.net/
   - Check for errors

### Testing SEO

1. **Google Search Console**
   - Submit sitemap: https://doskit.net/sitemap.xml
   - Monitor indexing status
   - Check for errors

2. **Bing Webmaster Tools**
   - Submit sitemap
   - Monitor crawl stats

## Maintenance

### Updating Social Images

1. Edit SVG source files in `/public/`:
   - `social-preview.svg`
   - `github-social-preview.svg`

2. Run image generation:

   ```bash
   npm run generate-social-images
   ```

3. Commit both SVG and generated PNG files

### Updating Metadata

1. **index.html**: Update meta tags as needed
2. **sitemap.xml**: Update lastmod dates when content changes
3. **llm.txt / llm-full.txt**: Update when features or documentation changes
4. **humans.txt**: Update when team or technology changes
5. **.well-known/security.txt**: Update expiration date annually

## Best Practices

1. **Images**
   - Keep SVG sources in version control
   - Regenerate PNGs after SVG changes
   - Optimize for file size while maintaining quality
   - Use descriptive alt text

2. **Metadata**
   - Keep descriptions concise but informative
   - Update dates when content changes
   - Maintain consistency across platforms
   - Test previews before deployment

3. **Structured Data**
   - Validate after changes
   - Keep version numbers updated
   - Ensure URLs are absolute
   - Use proper Schema.org types

4. **Discovery Files**
   - Keep llm.txt concise (< 3KB)
   - Make llm-full.txt comprehensive
   - Update when features change
   - Include relevant keywords

## Resources

- [Open Graph Protocol](https://ogp.me/)
- [Twitter Cards Documentation](https://developer.twitter.com/en/docs/twitter-for-websites/cards/overview/abouts-cards)
- [Schema.org](https://schema.org/)
- [robots.txt Specification](https://www.robotstxt.org/)
- [humans.txt](https://humanstxt.org/)
- [llm.txt Standard](https://llmstxt.org/)
- [RFC 9116 - security.txt](https://www.rfc-editor.org/rfc/rfc9116.html)
- [Well-Known URIs](https://www.iana.org/assignments/well-known-uris/well-known-uris.xhtml)

## Troubleshooting

### Images Not Showing in Social Previews

1. Check image URLs are absolute (https://doskit.net/og-image.png)
2. Verify images are accessible (not blocked by robots.txt)
3. Clear social media cache (use debugging tools)
4. Check image dimensions (1200x630 for OG)
5. Verify Content-Type header (image/png)

### Structured Data Errors

1. Validate JSON-LD syntax
2. Check for required properties
3. Ensure URLs are absolute
4. Verify Schema.org types are correct
5. Test with Google Rich Results Test

### Sitemap Not Being Crawled

1. Submit to Google Search Console
2. Check robots.txt allows crawling
3. Verify sitemap URL in robots.txt
4. Ensure XML is valid
5. Check for 404 errors

## Future Enhancements

Potential additions:

- Multi-language support (hreflang tags)
- Additional structured data types (FAQPage, HowTo)
- Video structured data (if video content added)
- Breadcrumb structured data
- Organization structured data
- Additional well-known URIs as needed
- RSS/Atom feed for updates

---

Last updated: 2025-11-18
