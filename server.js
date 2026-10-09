const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3000;

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm'
};

// Safeguard against uncaught socket errors
process.on('uncaughtException', (err) => {
  console.error('Server Uncaught Exception:', err);
});
process.on('unhandledRejection', (reason) => {
  console.error('Server Unhandled Rejection:', reason);
});

const server = http.createServer((req, res) => {
  let reqPath = '/';
  try {
    reqPath = decodeURIComponent(req.url.split('?')[0]);
  } catch {
    reqPath = req.url.split('?')[0];
  }
  
  // API: Reservation Booking Endpoint
  if (req.method === 'POST' && reqPath === '/api/reservations') {
    let body = '';
    req.on('data', chunk => { body += chunk.toString(); });
    req.on('end', () => {
      try {
        const payload = JSON.parse(body || '{}');
        const bookingId = 'VRN-' + Math.floor(100000 + Math.random() * 900000);
        const responseData = {
          success: true,
          bookingId: bookingId,
          reservation: {
            name: payload.name || 'Guest',
            phone: payload.phone || '',
            guests: payload.guests || '2',
            date: payload.date || '',
            time: payload.time || '19:00',
            createdAt: new Date().toISOString()
          },
          message: 'Reservation request successfully received. Chef Dhyan & team look forward to welcoming you!'
        };
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(responseData));
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, message: 'Invalid reservation request format.' }));
      }
    });
    return;
  }

  if (reqPath === '/' || reqPath === '') reqPath = '/index.html';
  
  // Prevent directory traversal
  const safePath = path.normalize(reqPath).replace(/^(\.\.[\/\\])+/, '');
  const filePath = path.join(__dirname, safePath);
  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';

  // Support robust video range requests for smooth autoplay and seeking
  if (ext === '.mp4' || ext === '.webm') {
    fs.stat(filePath, (err, stats) => {
      if (err) {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        return res.end('404 Not Found');
      }

      const fileSize = stats.size;
      const range = req.headers.range;

      if (range) {
        const match = range.match(/bytes=(\d*)-(\d*)/);
        if (!match) {
          res.writeHead(416, {
            'Content-Range': `bytes */${fileSize}`,
            'Content-Type': 'text/plain'
          });
          return res.end('416 Range Not Satisfiable');
        }

        let start = match[1] !== '' ? parseInt(match[1], 10) : undefined;
        let end = match[2] !== '' ? parseInt(match[2], 10) : undefined;

        if (start === undefined && end !== undefined) {
          // Suffix byte range: e.g. bytes=-1000 means the last 1000 bytes
          start = Math.max(0, fileSize - end);
          end = fileSize - 1;
        } else if (start !== undefined && end === undefined) {
          // Open range: e.g. bytes=1000-
          end = fileSize - 1;
        }

        // Validate range bounds
        if (
          start === undefined ||
          end === undefined ||
          isNaN(start) ||
          isNaN(end) ||
          start > end ||
          start >= fileSize
        ) {
          res.writeHead(416, {
            'Content-Range': `bytes */${fileSize}`,
            'Content-Type': 'text/plain'
          });
          return res.end('416 Range Not Satisfiable');
        }

        if (end >= fileSize) {
          end = fileSize - 1;
        }

        const chunkSize = (end - start) + 1;
        res.writeHead(206, {
          'Content-Range': `bytes ${start}-${end}/${fileSize}`,
          'Accept-Ranges': 'bytes',
          'Content-Length': chunkSize,
          'Content-Type': contentType
        });

        const fileStream = fs.createReadStream(filePath, { start, end });
        fileStream.on('error', () => {
          if (!res.headersSent) res.writeHead(500);
          res.end();
        });
        req.on('close', () => {
          fileStream.destroy();
        });
        fileStream.pipe(res);
      } else {
        res.writeHead(200, {
          'Content-Length': fileSize,
          'Content-Type': contentType,
          'Accept-Ranges': 'bytes'
        });
        const fileStream = fs.createReadStream(filePath);
        fileStream.on('error', () => {
          if (!res.headersSent) res.writeHead(500);
          res.end();
        });
        req.on('close', () => {
          fileStream.destroy();
        });
        fileStream.pipe(res);
      }
    });
    return;
  }

  fs.readFile(filePath, (err, content) => {
    if (err) {
      if (err.code === 'ENOENT') {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('404 Not Found');
      } else {
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('500 Server Error: ' + err.code);
      }
    } else {
      res.writeHead(200, {
        'Content-Type': contentType,
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      });
      res.end(content);
    }
  });
});

server.listen(PORT, () => {
  console.log(`Varanasi Server running at http://localhost:${PORT}/`);
});
