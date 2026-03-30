const express = require('express');
const Razorpay = require('razorpay');
const db = require('../db');
const { verifyToken } = require('../middlewares/auth');
const { sendEmail } = require('../services/email');

const router = express.Router();

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

router.post('/create-subscription', verifyToken, async (req, res) => {
    try {
        const { planId } = req.body; // 'monthly' or 'yearly'
        
        // Example Razorpay plan IDs. In production, create these in your Razorpay Dashboard
        const plan_id = planId === 'yearly' ? 'plan_dummy_yearly' : 'plan_dummy_monthly';
        
        const subscription = await razorpay.subscriptions.create({
            plan_id: plan_id,
            total_count: 120, // number of billing cycles
            customer_notify: 1,
            notes: {
                userId: req.user.id
            }
        });

        res.status(200).json({ subscriptionId: subscription.id });
    } catch (err) {
        console.error('Error creating razorpay subscription:', err);
        res.status(500).json({ message: 'Razorpay subscription creation failed' });
    }
});

// For dummy/testing if Razorpay is not fully set up
router.post('/simulate-success', verifyToken, async (req, res) => {
    try {
        const { plan } = req.body;
        
        await db.query(
            'UPDATE users SET subscription_status = $1 WHERE id = $2',
            ['active', req.user.id]
        );

        // Add dummy subscription record based on Razorpay structure
        await db.query(
            `INSERT INTO subscriptions (user_id, razorpay_subscription_id, plan, status, start_date, end_date) 
             VALUES ($1, $2, $3, 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP + interval '1 month')`,
            [req.user.id, `sim_sub_${Date.now()}`, plan || 'monthly']
        );

        await sendEmail(req.user.email, 'Subscription Activated via Razorpay', `Your ${plan || 'monthly'} subscription is now active! 10% will be seamlessly directed to your chosen charity.`);

        res.status(200).json({ message: 'Razorpay Subscription simulated successfully' });
    } catch (err) {
        console.error('Error simulating sub:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
