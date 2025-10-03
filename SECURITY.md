# Security Policy

## Supported Versions

We release patches for security vulnerabilities in the following versions:

| Version | Supported          |
| ------- | ------------------ |
| 1.x.x   | :white_check_mark: |
| < 1.0   | :x:                |

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
3. **Content Security Policy**: Implement a strict CSP that allows js-dos CDN resources
4. **Subresource Integrity**: The project uses SRI hashes for CDN resources - do not remove them
5. **Sanitize user input**: If you allow users to upload DOS programs, validate and sanitize all inputs

### For Contributors

1. **No secrets in code**: Never commit API keys, passwords, or other secrets
2. **Dependency audits**: Run `npm audit` before submitting PRs
3. **Input validation**: Always validate and sanitize user inputs
4. **XSS prevention**: Be cautious with `dangerouslySetInnerHTML` and user-generated content
5. **Follow secure coding practices**: Review OWASP guidelines for web applications

## Known Security Considerations

### js-dos CDN Dependency

DosKit loads js-dos from a CDN (`https://v8.js-dos.com/latest/`). We use Subresource Integrity (SRI) hashes to ensure the integrity of these resources. However, users should be aware:

- The js-dos library is a third-party dependency
- We use SRI hashes to prevent tampering
- The `/latest/` path may update without notice - consider pinning to a specific version for production

### WebAssembly Execution

DosKit uses WebAssembly (via js-dos) to run DOS programs:

- DOS programs run in a sandboxed WebAssembly environment
- However, malicious DOS programs could potentially exploit vulnerabilities in the emulator
- Only run DOS programs from trusted sources
- Consider implementing additional sandboxing for user-uploaded programs

### Browser Security

DosKit relies on browser security features:

- Modern browsers provide process isolation for WebAssembly
- Ensure your Content Security Policy allows WebAssembly execution
- Keep browsers updated to benefit from the latest security patches

## Security Updates

Security updates will be released as patch versions (e.g., 1.0.1, 1.0.2) and announced via:

- GitHub Security Advisories
- Release notes on GitHub
- npm package updates

Subscribe to GitHub notifications for this repository to stay informed about security updates.

## Questions?

If you have questions about this security policy, please contact:

**cameron@rye.dev**

---

Thank you for helping keep DosKit and its users safe! 🔒

