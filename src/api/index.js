import { Router } from 'express';
import stripelib from 'stripe';
import fetch from 'node-fetch';
import { version } from '../../package.json';

const mySecretKey = 'sk_test_Gllo6dtbIl8Qfs0yWsDWh7bB';
const stripeClientId = 'ca_EbQS52pNK45mz7acUoP9AXHs4kxgLS0P';

const stripe = stripelib(mySecretKey);

const timeout = ms => new Promise(res => setTimeout(res, ms));

export default ({ config, db }) => {
  let api = Router();

  // mount the facets resource

  // perhaps expose some API metadata at the root
  // api.get('/', (req, res) => {
  //   res.json({ version });
  // });

  const chargeNow = async (token) => {
    console.log('before charge');
    const charge = await stripe.charges.create({
      amount: 999,
      currency: 'usd',
      description: 'Example immediate charge',
      source: token,
    });
    console.log('after charge');
  };

  const chargeCustomer = async (token) => {
    console.log('before cust');
    const customer = await stripe.customers.create({
      source: token,
      email: 'paying.user@example.com',
    })
    .then(
      async function (cust) {
        await timeout(2222);
        const charge = await stripe.charges.create({
          amount: 1555,
          currency: 'usd',
          description: 'Example customer charge',
          customer: cust.id,
        })
        .then(
          async function (chg) {
            console.log('after charge');
          },
          async function(err) {
            console.log('auth error', err);
          }
        );
        console.log('after charge');
      },
      async function(err) {
        console.log('auth error', err);
      }
    );

    console.log('after cust');


    console.log('after cust charge');
  };

  const chargeAfterAuth = async (token) => {
    console.log('before charge');
    const charge = await stripe.charges.create({
      amount: 777,
      currency: 'usd',
      description: 'Example immediate charge',
      capture: false,
      source: token,
    }).then(
      async function (chg) {
        await timeout(2222);
        const capture = await stripe.charges.capture(chg.id);
        console.log('after charge');
      },
      async function(err) {
        console.log('auth error', err);
      }
    );
  };

  api.post('/charge', async (req, res) => {
    console.log({body: req.body});
    const token = req.body.stripeToken;

    console.log({
      now: new Date(),
      // req,
      token,
    });
    await chargeNow(token);
    res.json({ success: true });
  });

  api.post('/authorize', async (req, res) => {
    console.log({body: req.body});
    const token = req.body.stripeToken;

    console.log({
      now: new Date(),
      // req,
      token,
    });
    await chargeAfterAuth(token);
    res.json({ success: true });
  });

  api.post('/customer', async (req, res) => {
    console.log({body: req.body});
    const token = req.body.stripeToken;

    console.log({
      now: new Date(),
      // req,
      token,
    });
    await chargeCustomer(token);
    res.json({ success: true });
  });

  api.get('/connectresult', async (req, res) => {
    console.log({query: req.query});
    const {scope, code, error, error_description } = req.query;

    const oauthUrl =`https://connect.stripe.com/oauth/token?client_secret=${mySecretKey}&code=${code}&grant_type=authorization_code`;
    const response = await fetch(oauthUrl, {
      method: "POST",
      // headers: {"Content-Type": "application/json"},
      // body: JSON.stringify({stripeToken: token.id})
    })
    .then(resp => resp.json());

    console.log({
      now: new Date(),
      // req,
      data: response,
    });

    res.json({ connected: true });
  });

  api.post('/deauthorize', async (req, res) => {
    console.log('deauthorize');
    console.log({body: req.body});
    const { target } = req.body;

    const deauthUrl =`https://connect.stripe.com/oauth/deauthorize`;
    const response = await fetch(deauthUrl, {
      method: "POST",
      body: JSON.stringify({
        client_id: stripeClientId,
        stripe_user_id: target,
      }),
      headers: {
        'Authorization': `Bearer ${mySecretKey}`,
        'Content-Type': 'application/json',
      },
    })
    .then(resp => resp.json());

    console.log({
      now: new Date(),
      // req,
      data: response,
    });

    res.json({ connected: true });
  });

  api.post('/events', async (req, res) => {
    console.log('events');
    console.log({body: req.body});

    res.json({ connected: true });
  });

  return api;
};
