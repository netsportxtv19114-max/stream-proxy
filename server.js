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
  // Query split bug fix: URL parameter ko full slice karein
  const rawUrl = req.originalUrl;
  const targetUrlIndex = rawUrl.indexOf('url=');

  if (targetUrlIndex === -1) {
    return res.status(400).send('URL parameter missing!');
  }

  // Pure target URL extract karein with all internal query strings
  const targetUrl = decodeURIComponent(rawUrl.substring(targetUrlIndex + 4));

  try {
    const response = await fetch(targetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Referer': 'https://www.jiotv.com/',
        'Origin': 'https://www.jiotv.com'
      }
    });

    if (!response.ok) {
      console.error(`Upstream error: ${response.status} for ${targetUrl}`);
      return res.status(response.status).send(`Stream source responded with status ${response.status}`);
    }

    // Set correct MIME type so Shaka can recognize DASH/HLS
    const contentType = response.headers.get('content-type');
    if (contentType) {
      res.setHeader('Content-Type', contentType);
    } else if (targetUrl.includes('.mpd')) {
      res.setHeader('Content-Type', 'application/dash+xml');
    } else if (targetUrl.includes('.m3u8')) {
      res.setHeader('Content-Type', 'application/vnd.apple.mpegurl');
    }

    response.body.pipe(res);

  } catch (err) {
    console.error('Proxy Fetch Error:', err);
    res.status(500).send('Stream fetch karne me error aayi.');
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
