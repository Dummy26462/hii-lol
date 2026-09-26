const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3002;

const pgdir = path.join(__dirname, 'pages');
const cdndir = path.join(__dirname, 'cdn');

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

function sendError(res, statusCode, message) {
  const errorFile = path.join(pgdir, 'error.html');

  fs.readFile(errorFile, (err, content) => {
    res.writeHead(statusCode, { 'Content-Type': 'text/html; charset=utf-8' });
    if (!err) {
      res.end(content);
    } else {
      res.end(`<h1>${statusCode} - ${message}</h1>`);
    }
  });
}

const server = http.createServer((req, res) => {
  const host = req.headers.host || `localhost:${PORT}`;
  console.log(`page/url requested: ${host}${req.url}`);

  let cleanUrl = req.url.split('?')[0];
  let targetFile;

  if (cleanUrl.startsWith('/cdn/')) {

    const assetPath = cleanUrl.replace(/^\/cdn\//, '');
    targetFile = path.join(cdndir, assetPath);

    if (!targetFile.startsWith(cdndir)) {
      return sendError(res, 403, 'you not allowed');
    }
  } 
  else {
    const ext = path.extname(cleanUrl).toLowerCase();
    if (ext === '.css' || ext === '.js') {
      return sendError(res, 403, 'only from /cdn/ bradar');
    }

    let pageName = cleanUrl === '/' ? 'index.html' : cleanUrl;
    if (!path.extname(pageName)) {
      pageName += '.html';
    }

    targetFile = path.join(pgdir, pageName);

    if (!targetFile.startsWith(pgdir)) {
      return sendError(res, 403, 'you not allowed');
    }
  }

  const ext = path.extname(targetFile).toLowerCase();
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';

  fs.readFile(targetFile, (err, data) => {
    if (err) {
      if (err.code === 'ENOENT') {
        return sendError(res, 404, 'page no here');
      }
      return sendError(res, 500, 'server broke(error)');
    }

    res.writeHead(200, { 'Content-Type': contentType });
    res.end(data);
  });
});

server.listen(PORT, () => {
  console.log(`aaaaaaa running at http://localhost:${PORT}`);
});