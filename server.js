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

  const axios = require('axios');

  axios.get('https://api.teller.io/accounts', {
    auth: {
      username: 'test_token_bo4xsmweqwwts',
      password: '' // Empty password
    }
  })
  .then(response => {
    console.log('Response:', response.data);
    return res.json(response.data);
  })
  .catch(error => {
    console.error('Error:', error);
    return res.json(error);
  });
});

app.listen(process.env.PORT, () => {
  console.log(`✅ Teller Proxy running on port ${process.env.PORT}`);
});

