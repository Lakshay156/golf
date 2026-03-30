const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../db');
const { sendEmail } = require('../services/email');

const router = express.Router();

router.post('/register', async (req, res) => {
    try {
        const { name, email, password, charity_id } = req.body;
        
        if (!name || !email || !password) {
            return res.status(400).json({ message: 'Name, email, and password are required' });
        }

        // Check if user exists
        const userCheck = await db.query('SELECT * FROM users WHERE email = $1', [email]);
        if (userCheck.rows.length > 0) {
            return res.status(400).json({ message: 'User already exists with that email' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        
        // Handle uuid placeholder or real charity
        let queryCharity = charity_id;
        if (!charity_id || charity_id === 'temp-uuid-placeholder') {
             queryCharity = null;
        }

        const newUser = await db.query(
            'INSERT INTO users (name, email, password_hash, charity_id, role) VALUES ($1, $2, $3, $4, $5) RETURNING id, name, email, role, subscription_status',
            [name, email, hashedPassword, queryCharity, 'user']
        );

        const user = newUser.rows[0];
        const token = jwt.sign(
            { id: user.id, role: user.role, email: user.email }, 
            process.env.JWT_SECRET, 
            { expiresIn: '7d' }
        );

        // Send confirmation email
        await sendEmail(email, 'Welcome to FairwayCause!', `Hello ${name},\n\nThank you for joining FairwayCause. Get ready to log your Stableford scores, participate in draws, and support your favorite charities!\n\nBest,\nThe FairwayCause Team`);

        res.status(201).json({
            message: 'User registered successfully',
            token,
            user
        });
    } catch (err) {
        console.error('Error in /register:', err);
        res.status(500).json({ message: 'Server error during registration' });
    }
});

router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: 'Email and password are required' });
        }

        const userResult = await db.query('SELECT * FROM users WHERE email = $1', [email]);
        if (userResult.rows.length === 0) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const user = userResult.rows[0];
        const isMatch = await bcrypt.compare(password, user.password_hash);
        
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const token = jwt.sign(
            { id: user.id, role: user.role, email: user.email }, 
            process.env.JWT_SECRET, 
            { expiresIn: '7d' }
        );

        res.status(200).json({
            message: 'Login successful',
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                subscription_status: user.subscription_status
            }
        });
    } catch (err) {
        console.error('Error in /login:', err);
        res.status(500).json({ message: 'Server error during login' });
    }
});

module.exports = router;
