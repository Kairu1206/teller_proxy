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

app.post('/teller-proxy', (req, res) => {
  const accessToken = req.body;
  
  console.log(accessToken);

  if (!accessToken) {
    return res.status(400).json({ error: 'Missing access token' });
  }
});

app.listen(process.env.PORT, () => {
  console.log(`✅ Teller Proxy running on port ${process.env.PORT}`);
});

