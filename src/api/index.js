import { Router } from 'express';
import stripelib from 'stripe';
import { version } from '../../package.json';
// import facets from './facets';

const stripe = stripelib('sk_test_N8AonzX1pB2Ip6TFOhU1xMRw');

const timeout = ms => new Promise(res => setTimeout(res, ms))

export default ({ config, db }) => {
  let api = Router();

  // mount the facets resource

  // perhaps expose some API metadata at the root
  api.get('/', (req, res) => {
    res.json({ version });
  });

  // const charge = async () => {}

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

  return api;
};
