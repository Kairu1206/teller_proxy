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

  try {
    const accountsResponse = await axios.get('https://api.teller.io/accounts', {
      auth: {
        username: accessToken,
        password: ''
      }
    });

    console.log('Accounts Response:', accountsResponse.data);
    const accounts = [];

    async function getBalance(acc_id, accessToken) {
      try {
        const balanceResponse = await axios.get(`https://api.teller.io/accounts/${acc_id}/balances`, {
          auth: {
            username: accessToken,
            password: ''
          }
        });
        console.log('Balance Response for ID:', acc_id, balanceResponse.data);
        return balanceResponse.data.available;
      } catch (balanceError) {
        console.error('Error fetching balance for ID:', acc_id, balanceError);
        return null; // Or handle the error as needed
      }
    }

    // Make the .then() callback async
    await Promise.all(accountsResponse.data.map(async (accountData) => {
      const acc_id = accountData.id;
      const balance = await getBalance(acc_id, accessToken);

      accounts.push({
        acc_last_four: accountData.last_four,
        acc_subtype: accountData.subtype,
        acc_institution: accountData.institution,
        acc_currency: accountData.currency,
        acc_type: accountData.type,
        acc_status: accountData.status,
        acc_name: accountData.name,
        acc_id: acc_id,
        acc_balances: balance,
        acc_transactions: accountData.transactions,
        acc_details: accountData.details
      });
    }));

    console.log("Accounts with Balances:", accounts);
    return res.json(accounts);

  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json(error);
  }
});

app.listen(process.env.PORT, () => {
  console.log(`✅ Teller Proxy running on port ${process.env.PORT}`);
});

