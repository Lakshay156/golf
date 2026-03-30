const express = require('express');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const db = require('../db');
const { verifyToken } = require('../middlewares/auth');
const { sendEmail } = require('../services/email');

const router = express.Router();

router.post('/create-checkout-session', verifyToken, async (req, res) => {
    try {
        const { planId } = req.body; // 'monthly' or 'yearly'
        
        // Example prices, in production these would be Stripe Price IDs from env
        const priceId = planId === 'yearly' ? 'price_dummy_yearly' : 'price_dummy_monthly';
        const amount = planId === 'yearly' ? 10000 : 1000; // $100 or $10

        // Create Checkout Sessions
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            mode: 'subscription',
            customer_email: req.user.email,
            client_reference_id: req.user.id,
            line_items: [
                {
                    price_data: {
                        currency: 'usd',
                        product_data: {
                            name: `FairwayCause ${planId === 'yearly' ? 'Yearly' : 'Monthly'} Subscription`,
                        },
                        unit_amount: amount,
                        recurring: {
                            interval: planId === 'yearly' ? 'year' : 'month',
                        },
                    },
                    quantity: 1,
                },
            ],
            success_url: `${process.env.CLIENT_URL}/dashboard?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${process.env.CLIENT_URL}/dashboard`,
        });

        res.status(200).json({ url: session.url });
    } catch (err) {
        console.error('Error creating checkout session:', err);
        res.status(500).json({ message: 'Stripe session creation failed' });
    }
});

// For dummy/testing if Stripe is not fully set up
router.post('/simulate-success', verifyToken, async (req, res) => {
    try {
        const { plan } = req.body;
        
        await db.query(
            'UPDATE users SET subscription_status = $1 WHERE id = $2',
            ['active', req.user.id]
        );

        // Add dummy subscription record
        await db.query(
            `INSERT INTO subscriptions (user_id, plan, status, start_date, end_date) 
             VALUES ($1, $2, 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP + interval '1 month')`,
            [req.user.id, plan || 'monthly']
        );

        await sendEmail(req.user.email, 'Subscription Activated', `Your ${plan || 'monthly'} subscription is now active! 10% will be seamlessly directed to your chosen charity.`);

        res.status(200).json({ message: 'Subscription simulated successfully' });
    } catch (err) {
        console.error('Error simulating sub:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
