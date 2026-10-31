const express = require('express');
const fetch = require('node-fetch');
const app = express();
const PORT = process.env.PORT || 3000;

// Universal CORS Middleware
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, HEAD, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Range, Authorization");
  res.header("Access-Control-Expose-Headers", "Content-Length, Content-Range");

  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

app.get('/', (req, res) => {
  res.send('NetSportX Proxy Server is Running Live!');
});

app.get('/proxy', async (req, res) => {
  const rawUrl = req.originalUrl;
  const targetUrlIndex = rawUrl.indexOf('url=');

  if (targetUrlIndex === -1) {
    return res.status(400).json({ error: 'URL parameter missing!' });
  }

  const targetUrl = decodeURIComponent(rawUrl.substring(targetUrlIndex + 4));

  try {
    // Upstream request ke liye zaroori headers assemble karein
    const upstreamHeaders = {
      'User-Agent': req.headers['user-agent'] || 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': req.headers['accept'] || '*/*'
    };

    // Range requests (video seeking/buffering ke liye)
    if (req.headers['range']) {
      upstreamHeaders['Range'] = req.headers['range'];
    }

    // Authorization tokens (agar client bhej raha ho)
    if (req.headers['authorization']) {
      upstreamHeaders['Authorization'] = req.headers['authorization'];
    }

    const response = await fetch(targetUrl, {
      method: 'GET',
      headers: upstreamHeaders
    });

    // Upstream status aur error codes handle karein
    if (!response.ok) {
      console.error(`Upstream responded with status ${response.status} for URL: ${targetUrl}`);
      return res.status(response.status).json({
        error: 'Upstream Error',
        status: response.status,
        statusText: response.statusText
      });
    }

    // Upstream headers client ko forward karein
    res.status(response.status);

    const contentType = response.headers.get('content-type');
    if (contentType) {
      res.setHeader('Content-Type', contentType);
    } else if (targetUrl.includes('.mpd')) {
      res.setHeader('Content-Type', 'application/dash+xml');
    } else if (targetUrl.includes('.m3u8')) {
      res.setHeader('Content-Type', 'application/vnd.apple.mpegurl');
    }

    const contentLength = response.headers.get('content-length');
    if (contentLength) {
      res.setHeader('Content-Length', contentLength);
    }

    const contentRange = response.headers.get('content-range');
    if (contentRange) {
      res.setHeader('Content-Range', contentRange);
    }

    response.body.pipe(res);

  } catch (err) {
    console.error('Proxy Fetch Error:', err);
    res.status(500).json({ error: 'Proxy fetch failed', details: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
