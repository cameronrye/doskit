// A static server for the built site that answers paths the way GitHub Pages does, measured
// against doskit.net on 2026-11-09:
//   /x   -> the file x, else x.html (200, no redirect), else a 301 to /x/ for a directory,
//           else x.xml (200), else 404.html with status 404
//   /x/  -> x/index.html, else 404.html with status 404 (x.html is not served there)
// Names are case-sensitive, as on GitHub Pages, though macOS file systems are not, and the
// query string is ignored. `vite preview` differs on each of these points.
//
// As a program: node e2e/server.mjs [root=dist] [port=4173]
import { createHash } from 'node:crypto';
import { readdirSync, readFileSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, join, posix, resolve as resolvePath } from 'node:path';
import { fileURLToPath } from 'node:url';

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.wasm': 'application/wasm',
  '.zip': 'application/zip',
  '.txt': 'text/plain; charset=utf-8',
  '.md': 'text/markdown; charset=utf-8',
  '.xml': 'application/xml',
  '.webmanifest': 'application/manifest+json',
};

/** Every file and directory under root, by its exact-case path from the site's root */
function indexFiles(root) {
  const files = new Map();
  const dirs = new Set(['/']);
  const walk = (dir, prefix) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const full = join(dir, entry.name);
      if (entry.isDirectory()) {
        dirs.add(`${prefix}${entry.name}/`);
        walk(full, `${prefix}${entry.name}/`);
      } else if (entry.isFile()) {
        files.set(`${prefix}${entry.name}`, full);
      }
    }
  };
  walk(root, '/');
  return { files, dirs };
}

/** What GitHub Pages answers for a path: { status, file } or { status: 301, location } */
export function resolveLikeGitHubPages({ files, dirs }, pathname) {
  if (files.has(pathname)) return { status: 200, file: files.get(pathname) };
  if (pathname.endsWith('/')) {
    const page = `${pathname}index.html`;
    if (files.has(page)) return { status: 200, file: files.get(page) };
  } else {
    if (files.has(`${pathname}.html`)) return { status: 200, file: files.get(`${pathname}.html`) };
    if (dirs.has(`${pathname}/`)) return { status: 301, location: `${pathname}/` };
    if (files.has(`${pathname}.xml`)) return { status: 200, file: files.get(`${pathname}.xml`) };
  }
  return { status: 404, file: files.get('/404.html') };
}

export function startServer({ root = 'dist', port = 4173, host = '127.0.0.1' } = {}) {
  const index = indexFiles(resolvePath(root));
  const server = createServer((request, response) => {
    const url = new URL(request.url ?? '/', `http://${host}:${port}`);
    let pathname;
    try {
      pathname = posix.normalize(decodeURIComponent(url.pathname));
    } catch {
      pathname = url.pathname;
    }
    const found = resolveLikeGitHubPages(index, pathname);
    if (found.status === 301) {
      response.writeHead(301, { Location: `${found.location}${url.search}` });
      response.end();
      return;
    }
    if (!found.file) {
      response.writeHead(404, { 'Content-Type': 'text/plain' });
      response.end('404');
      return;
    }
    const body = readFileSync(found.file);
    const etag = `"${createHash('sha1').update(body).digest('hex').slice(0, 16)}"`;
    const headers = {
      'Cache-Control': 'max-age=600',
      'Content-Type': TYPES[extname(found.file)] ?? 'application/octet-stream',
      ETag: etag,
    };
    if (found.status === 200 && request.headers['if-none-match'] === etag) {
      response.writeHead(304, headers);
      response.end();
      return;
    }
    response.writeHead(found.status, { ...headers, 'Content-Length': body.length });
    response.end(request.method === 'HEAD' ? undefined : body);
  });
  return new Promise((done) => {
    server.listen(port, host, () =>
      done({
        url: `http://${host}:${port}`,
        close: () =>
          new Promise((closed) => {
            server.closeAllConnections();
            server.close(() => closed());
          }),
      })
    );
  });
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const [root = 'dist', port = '4173'] = process.argv.slice(2);
  const site = await startServer({ root, port: Number(port) });
  console.log(`Serving ${resolvePath(root)} as GitHub Pages would, at ${site.url}`);
  const stop = () => site.close().then(() => process.exit(0));
  process.on('SIGTERM', stop);
  process.on('SIGINT', stop);
}
