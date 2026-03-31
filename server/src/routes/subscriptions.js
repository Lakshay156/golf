const express = require('express');
const Stripe = require('stripe');
const db = require('../db');
const { verifyToken } = require('../middlewares/auth');
const { sendEmail } = require('../services/email');

const router = express.Router();

const stripe = process.env.STRIPE_SECRET_KEY ? new Stripe(process.env.STRIPE_SECRET_KEY) : null;

router.post('/create-subscription', verifyToken, async (req, res) => {
    try {
        const { planId } = req.body; // 'monthly' or 'yearly'
        
        if (!stripe) {
            return res.status(400).json({ message: 'Stripe keys not configured' });
        }
        
        // Example Stripe price IDs. In production, create these in your Stripe Dashboard
        const price_id = planId === 'yearly' ? 'price_dummy_yearly' : 'price_1TH3CAlf7nXoHpxlyrZNsf5i';
        
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            mode: 'subscription',
            client_reference_id: req.user.id,
            line_items: [{
                price: price_id,
                quantity: 1,
            }],
            success_url: `${process.env.CLIENT_URL}/dashboard?payment=success`,
            cancel_url: `${process.env.CLIENT_URL}/dashboard?payment=cancelled`,
        });

        res.status(200).json({ url: session.url });
    } catch (err) {
        console.error('Error creating stripe subscription checkout:', err);
        res.status(500).json({ message: 'Stripe subscription creation failed' });
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

        // Add dummy subscription record based on Stripe structure
        await db.query(
            `INSERT INTO subscriptions (user_id, stripe_subscription_id, plan, status, start_date, end_date) 
             VALUES ($1, $2, $3, 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP + interval '1 month')`,
            [req.user.id, `sim_sub_${Date.now()}`, plan || 'monthly']
        );

        await sendEmail(req.user.email, 'Subscription Activated via Stripe', `Your ${plan || 'monthly'} subscription is now active! 10% will be seamlessly directed to your chosen charity.`);

        res.status(200).json({ message: 'Stripe Subscription simulated successfully' });
    } catch (err) {
        console.error('Error simulating sub:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
