require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();

const crypto = require('crypto');

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

// Stripe webhooks need the raw body to verify signatures
app.post('/api/subscriptions/webhook', express.raw({ type: 'application/json' }), (req, res) => {
    const signature = req.headers['stripe-signature'];
    
    let event;
    try {
        if (!process.env.WEBHOOK_SECRET || process.env.WEBHOOK_SECRET === 'dummy_for_now') {
            // For testing before webhook secret is set
            event = JSON.parse(req.body);
            console.log('Skipped Stripe signature verification. Secret not configured.');
        } else {
            event = stripe.webhooks.constructEvent(req.body, signature, process.env.WEBHOOK_SECRET);
        }
    } catch (err) {
        console.error('Webhook signature verification failed.', err.message);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    console.log('Stripe webhook received:', event.type);
    
    // In production, you would handle event.type === 'checkout.session.completed' here
    
    res.status(200).send('OK');
});

// Added root route so people don't get "Cannot GET /"
app.get('/', (req, res) => {
    res.status(200).send('<h1>FairwayCause API is running!</h1><p>Frontend should point to /api</p>');
});

app.use(express.json());
app.use(cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true,
}));

// Basic health check route
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'OK', message: 'Golf Charity Subscription API is running.' });
});

// Import route modules (to be created)
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/scores', require('./routes/scores'));
app.use('/api/subscriptions', require('./routes/subscriptions'));
app.use('/api/charities', require('./routes/charities'));
app.use('/api/draws', require('./routes/draws'));
app.use('/api/admin', require('./routes/admin'));

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        success: false,
        message: 'Internal Server Error',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server started on port ${PORT}`);
});
