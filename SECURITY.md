# Security Policy

## Supported Versions

We release patches for security vulnerabilities in the following versions:

| Version | Supported |
| ------- | --------- |
| 1.x.x   | ✓         |
| < 1.0   | ✗         |

## Reporting a Vulnerability

We take the security of DosKit seriously. If you believe you have found a security vulnerability, please report it to us as described below.

### How to Report

**Please do not report security vulnerabilities through public GitHub issues.**

Instead, please report them via email to:

**cameron@rye.dev**

You should receive a response within 48 hours. If for some reason you do not, please follow up via email to ensure we received your original message.

### What to Include

Please include the following information in your report:

- **Type of vulnerability** (e.g., XSS, CSRF, code injection, etc.)
- **Full paths of source file(s)** related to the vulnerability
- **Location of the affected source code** (tag/branch/commit or direct URL)
- **Step-by-step instructions** to reproduce the issue
- **Proof-of-concept or exploit code** (if possible)
- **Impact of the vulnerability** and how an attacker might exploit it

This information will help us triage your report more quickly.

### What to Expect

After you submit a report, we will:

1. **Acknowledge receipt** of your vulnerability report within 48 hours
2. **Confirm the vulnerability** and determine its severity
3. **Work on a fix** and prepare a security advisory
4. **Release a patch** as soon as possible depending on complexity
5. **Publicly disclose the vulnerability** after the patch is released

We will keep you informed of the progress throughout the process.

### Disclosure Policy

- We ask that you give us a reasonable amount of time to fix the vulnerability before any public disclosure
- We will credit you in the security advisory (unless you prefer to remain anonymous)
- We will coordinate the disclosure timeline with you

## Security Best Practices

When using DosKit, we recommend:

### For Users

1. **Keep dependencies updated**: Regularly update to the latest version of DosKit
2. **Use HTTPS**: Always serve your application over HTTPS in production
3. **Content Security Policy**: DosKit sets none. If you add one, it must allow what js-dos needs: see [Browser Security](#browser-security)
4. **Sanitize user input**: If you allow users to upload DOS programs, validate and sanitize all inputs

### For Contributors

1. **No secrets in code**: Never commit API keys, passwords, or other secrets
2. **Dependency audits**: Run `npm audit` before submitting PRs. CI fails when a production dependency has a high or critical advisory (`npm audit --omit=dev --audit-level=high`), and only reports the rest
3. **Input validation**: Always validate and sanitize user inputs
4. **XSS prevention**: Be cautious with `dangerouslySetInnerHTML` and user-generated content
5. **Follow secure coding practices**: Review OWASP guidelines for web applications

## Known Security Considerations

### js-dos

DosKit serves js-dos from its own origin, not from a CDN. `package.json` pins an exact version, and `scripts/copy-js-dos.js` copies its player (`js-dos.js`, `js-dos.css`) and emulator files (`emulators/`) from `node_modules` into `public/` before every dev server start and build. Users should be aware:

- The js-dos library is a third-party dependency, under the GPL-2.0: the [licenses page](https://doskit.net/licenses/) gives its license and links the source of the version the site serves
- The page loads js-dos from its own origin, without Subresource Integrity hashes. `package-lock.json` records the integrity hash of the js-dos package, which `npm ci` checks when it installs it
- js-dos changes only with `package.json` and `package-lock.json`. The service worker keeps js-dos's files in a cache named after its version, so an open page goes on running the player and emulator files of one version
- js-dos has cloud features, and loads its emulator files from its own CDN by default. DosKit's settings in `src/config/jsdos.config.ts` turn the cloud features off (`noCloud`) and load the emulator files from `/emulators/` (`pathPrefix`), so the page loads nothing from other origins

### WebAssembly Execution

DosKit uses WebAssembly (via js-dos) to run DOS programs:

- DOS programs run in a sandboxed WebAssembly environment
- However, malicious DOS programs could potentially exploit vulnerabilities in the emulator
- Only run DOS programs from trusted sources
- Consider implementing additional sandboxing for user-uploaded programs

### Browser Security

DosKit relies on browser security features:

- Modern browsers provide process isolation for WebAssembly
- DosKit sets no Content Security Policy: GitHub Pages cannot send response headers, and `index.html` has no CSP meta tag. A policy added where you host DosKit must allow `'unsafe-eval'` in `script-src`, because js-dos's `emulators.js` runs the script of the DOSBox backend, `wdosbox.js`, with `eval`, and `blob:` in `worker-src`, because it starts the emulator's worker from a blob URL. `'wasm-unsafe-eval'` alone is not enough: without `'unsafe-eval'`, no player starts
- Keep browsers updated to benefit from the latest security patches

## Security Updates

Security updates will be released as patch versions (e.g., 1.0.1, 1.0.2) and announced via:

- GitHub Security Advisories
- GitHub releases, whose notes list the fixes (they are the release's entry in [CHANGELOG.md](CHANGELOG.md))

[doskit.net](https://doskit.net/) is deployed from `main` once CI passes, so a fix reaches it when the fix is merged. Open pages then offer the new version in their update prompt.

To hear of each release, watch this repository on GitHub for releases (Watch → Custom → Releases).

## Questions?

If you have questions about this security policy, please contact:

**cameron@rye.dev**

---

Thank you for helping keep DosKit and its users safe!
