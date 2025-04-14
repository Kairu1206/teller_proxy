const https = require('https');
const fs = require('fs');
const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');

dotenv.config();

const app = express();
app.use(express.json());
app.use(cors());

const key = fs.readFileSync('etc/secret/private_key.pem');
const cert = fs.readFileSync('etc/secret/certificate.pem');

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

app.post('/teller-proxy', async (req, res) => {
  const { path = '/accounts', accessToken } = req.body;

  if (!accessToken) {
    return res.status(400).json({ error: 'Missing access token' });
  }

  const options = {
    hostname: 'api.teller.io',
    path,
    method: 'GET',
    key,
    cert,
    headers: {
      'Authorization': `Bearer ${accessToken}`,  // Use the access token in the request headers
      'App-Id': process.env.APP_ID,
      'Accept': 'application/json'
    }
  };

  const tellerReq = https.request(options, (tellerRes) => {
    let data = '';
    tellerRes.on('data', chunk => data += chunk);
    tellerRes.on('end', async () => {
      try {
        const accounts = JSON.parse(data);
        
        // Fetch detailed data for each account
        const fullAccountData = await Promise.all(accounts.map(async (account) => {
          const { balances, transactions, details } = await fetchAccountData(account.id);
          
          return {
            id: account.id,
            name: account.name,
            type: account.type,
            institution: account.institution.name,
            balances,
            transactions,
            details
          };
        }));

        res.json(fullAccountData);
      } catch (e) {
        res.status(500).json({ error: 'Invalid JSON or fetching account details failed', raw: data });
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
