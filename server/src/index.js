require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();

// Stripe webhooks need the raw body, so we must separate it before express.json()
app.post('/api/subscriptions/webhook', express.raw({ type: 'application/json' }), (req, res) => {
    // Webhook logic placeholder, will be imported from controllers
    console.log('Stripe webhook received');
    res.status(200).send('OK');
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
