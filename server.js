const https = require('https');
const fs = require('fs');
const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');

dotenv.config();

const app = express();
app.use(express.json());
app.use(cors());

const key = fs.readFileSync('./private_key.pem');
const cert = fs.readFileSync('./certificate.pem');

const fetchAccountData = async (accountId) => {
  const endpoints = [
    `/accounts/${accountId}/balances`,
    `/accounts/${accountId}/transactions`,
    `/accounts/${accountId}/details`
  ];

  const fetchData = async (endpoint) => {
    const options = {
      hostname: 'api.teller.io',
      path: endpoint,
      method: 'GET',
      key,
      cert,
      headers: {
        'App-Id': process.env.APP_ID,
        'Accept': 'application/json'
      }
    };

    return new Promise((resolve, reject) => {
      const tellerReq = https.request(options, (tellerRes) => {
        let data = '';
        tellerRes.on('data', chunk => data += chunk);
        tellerRes.on('end', () => {
          try {
            resolve(JSON.parse(data));
          } catch (e) {
            reject(new Error('Invalid JSON'));
          }
        });
      });

      tellerReq.on('error', err => reject(err));
      tellerReq.end();
    });
  };

  try {
    const balances = await fetchData(endpoints[0]);
    const transactions = await fetchData(endpoints[1]);
    const details = await fetchData(endpoints[2]);

    return {
      balances,
      transactions,
      details
    };
  } catch (error) {
    throw new Error(`Failed to fetch data for account ${accountId}: ${error.message}`);
  }
};

app.post('/teller-proxy', (req, res) => {
  console.log("Request body:", req.body); // Log the request
  res.json({ message: "Test proxy received successfully" }); // Return a simple response
});


https.createServer({ key, cert }, app)
  .listen(process.env.PORT, () =>
    console.log(`🔐 Secure Teller Proxy running at https://localhost:${process.env.PORT}`)
  );
