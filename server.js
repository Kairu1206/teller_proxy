const https = require('https');
const fs = require('fs');
const express = require('express');
const axios = require('axios');
const dotenv = require('dotenv');
const cors = require('cors');

dotenv.config();

const app = express();
app.use(express.json());
app.use(cors());

const key = fs.readFileSync('./private_key.pem');
const cert = fs.readFileSync('./certificate.pem');

app.post('/teller-proxy', async (req, res) => {
  const accessTokenObject = req.body;
  const accessToken = accessTokenObject.accessToken;
  console.log(accessToken);

  if (!accessToken) {
    return res.status(400).json({ error: 'Missing access token' });
  }

  const options = {
    hostname: 'api.teller.io',
    path: '/accounts',
    method: 'GET',
    key,
    cert,
    headers: {
      'Authorization': `Bearer ${accessToken}`,  // Use the access token in the request headers
      'App-Id': process.env.APP_ID,
      'Accept': 'application/json'
    }
  };

  const request = https.request(options, (response) => {
    return res.json(response);
  });
  request.end();
});

app.listen(process.env.PORT, () => {
  console.log(`✅ Teller Proxy running on port ${process.env.PORT}`);
});

