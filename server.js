const https = require('https');
const fs = require('fs');
const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');

dotenv.config();

const app = express();
app.use(express.json());
app.use(cors());

const cert = process.env.CERTIFICATE;
const key = process.env.PRIVATE_KEY;

app.post('/teller-proxy', async (req, res) => {
  const { path = '/accounts' } = req.body;

  const options = {
    hostname: 'api.teller.io',
    path,
    method: 'GET',
    key,
    cert,
    headers: {
      'App-Id': process.env.APP_ID,
      'Accept': 'application/json'
    }
  };

  const tellerReq = https.request(options, (tellerRes) => {
    let data = '';
    tellerRes.on('data', chunk => data += chunk);
    tellerRes.on('end', () => {
      try {
        const json = JSON.parse(data);
        res.json(json);
      } catch (e) {
        res.status(500).json({ error: 'Invalid JSON', raw: data });
      }
    });
  });

  tellerReq.on('error', err => {
    console.error('Teller error:', err);
    res.status(500).json({ error: err.message });
  });

  tellerReq.end();
});

https.createServer({ key, cert }, app)
  .listen(process.env.PORT, () =>
    console.log(`🔐 Secure Teller Proxy running at https://localhost:${process.env.PORT}`)
  );
