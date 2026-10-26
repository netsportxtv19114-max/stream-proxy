const express = require('express');
const fetch = require('node-fetch');
const app = express();
const PORT = process.env.PORT || 3000;

// CORS Headers allow karein
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, HEAD, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

// Root Route (Ye add karne se 'Cannot GET /' nahi aayega)
app.get('/', (req, res) => {
  res.send('NetSportX Proxy Server is Running Live!');
});

app.get('/proxy', async (req, res) => {
  const targetUrl = req.query.url;

  if (!targetUrl) {
    return res.status(400).send('URL parameter missing!');
  }

  try {
    const response = await fetch(targetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Referer': 'https://www.jiotv.com/'
      }
    });

    res.setHeader('Content-Type', response.headers.get('content-type') || 'application/octet-stream');
    response.body.pipe(res);

  } catch (err) {
    console.error('Proxy Error:', err);
    res.status(500).send('Stream fetch karne me error aayi.');
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
