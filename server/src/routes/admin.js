const express = require('express');
const db = require('../db');
const { verifyToken, verifyAdmin } = require('../middlewares/auth');

const router = express.Router();

// Get Analytics Overview
router.get('/stats', verifyToken, verifyAdmin, async (req, res) => {
    try {
        const usersCount = await db.query('SELECT COUNT(*) FROM users');
        const activeSubs = await db.query("SELECT COUNT(*) FROM users WHERE subscription_status = 'active'");
        
        // Sum total prize pool from completed draws
        const drawsTotal = await db.query("SELECT SUM(total_prize_pool) as total FROM draws");
        
        // Calculate estimated charity contributions
        // For simplicity: active subs * $10 per sub * average 15% contribution (mock value)
        const totalCharityEstimation = (parseInt(activeSubs.rows[0].count) * 10 * 0.15).toFixed(2);

        res.status(200).json({
            totalUsers: parseInt(usersCount.rows[0].count),
            activeSubscriptions: parseInt(activeSubs.rows[0].count),
            totalPrizePool: drawsTotal.rows[0].total || 0,
            estimatedCharityContributions: totalCharityEstimation,
        });
    } catch (err) {
        console.error('Error fetching stats:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get all users
router.get('/users', verifyToken, verifyAdmin, async (req, res) => {
    try {
        const result = await db.query(`
            SELECT u.id, u.name, u.email, u.role, u.subscription_status, u.created_at, c.name as charity_name 
            FROM users u LEFT JOIN charities c ON u.charity_id = c.id 
            ORDER BY u.created_at DESC
        `);
        res.status(200).json({ data: result.rows });
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

// ----- CHARITY CRUD -----

router.post('/charities', verifyToken, verifyAdmin, async (req, res) => {
    try {
        const { name, description, image_url } = req.body;
        const insertRes = await db.query(
            'INSERT INTO charities (name, description, image_url) VALUES ($1, $2, $3) RETURNING *',
            [name, description, image_url]
        );
        res.status(201).json({ message: 'Charity created', data: insertRes.rows[0] });
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

router.put('/charities/:id', verifyToken, verifyAdmin, async (req, res) => {
    try {
        const { name, description, image_url } = req.body;
        const updateRes = await db.query(
            'UPDATE charities SET name = $1, description = $2, image_url = $3 WHERE id = $4 RETURNING *',
            [name, description, image_url, req.params.id]
        );
        res.status(200).json({ message: 'Charity updated', data: updateRes.rows[0] });
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

router.delete('/charities/:id', verifyToken, verifyAdmin, async (req, res) => {
    try {
        await db.query('DELETE FROM charities WHERE id = $1', [req.params.id]);
        res.status(200).json({ message: 'Charity deleted' });
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
