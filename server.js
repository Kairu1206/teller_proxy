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
      username: accessToken,
      password: ''
    }
  })
  .then(response => {
    console.log('Response:', response.data);
    const accounts = [];
    for (let i = 0; i < response.data.length; i++) {
      const acc_last_four = response.data[i].last_four;
      const acc_subtype = response.data[i].subtype; //Subtype: Checking, Savings, Credit Card
      const acc_institution = response.data[i].institution[0]; //Name of the institution
      const acc_currency = response.data[i].currency; //Currency of the account
      const acc_type = response.data[i].type; //Type: Debit, Credit
      const acc_status = response.data[i].status; //Status: Open, Closed
      const acc_name = response.data[i].name; //Name of the account
      const links = response.data[i].links;
      const acc_id = response.data[i].id; //Account ID
      const acc_balance = async () => {
        axios.get(`https://api.teller.io/accounts/${acc_id}/balances`, {
          auth: {
            username: accessToken,
            password: ''
          }
        })
        .then(balance_response => {
          console.log('Balance Response:', balance_response.data);
          return balance_response.data.available;
        })
        .catch(balance_error => {
          console.error('Error:', balance_error);
        });
      };
      

      let acc_transactions = [];

      let acc_details = [];
      

      accounts.push({
        acc_last_four,
        acc_subtype,
        acc_institution,
        acc_currency,
        acc_type,
        acc_status,
        acc_name,
        acc_balance,
        acc_transactions,
        acc_details
      });

    }
    return res.json(accounts);
  })
  .catch(error => {
    console.error('Error:', error);
    return res.json(error);
  });
});

app.listen(process.env.PORT, () => {
  console.log(`✅ Teller Proxy running on port ${process.env.PORT}`);
});

