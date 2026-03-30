const express = require('express');
const db = require('../db');
const { verifyToken } = require('../middlewares/auth');

const router = express.Router();

// Get current user profile and latest scores
router.get('/me', verifyToken, async (req, res) => {
    try {
        const userResult = await db.query(
            'SELECT id, name, email, role, subscription_status, charity_id, contribution_percentage FROM users WHERE id = $1',
            [req.user.id]
        );

        if (userResult.rows.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }

        const scoresResult = await db.query(
            'SELECT id, score, date FROM scores WHERE user_id = $1 ORDER BY date DESC, created_at DESC',
            [req.user.id]
        );

        let charity = null;
        if (userResult.rows[0].charity_id) {
            const charityResult = await db.query('SELECT name, image_url, description FROM charities WHERE id = $1', [userResult.rows[0].charity_id]);
            if (charityResult.rows.length > 0) {
                charity = charityResult.rows[0];
            }
        }

        res.status(200).json({
            user: { ...userResult.rows[0], charity },
            scores: scoresResult.rows
        });
    } catch (err) {
        console.error('Error fetching user profile:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

// Update charity selection or contribution
router.put('/me/preferences', verifyToken, async (req, res) => {
    try {
        const { charity_id, contribution_percentage } = req.body;
        
        if (contribution_percentage && contribution_percentage < 10) {
            return res.status(400).json({ message: 'Minimum contribution is 10%' });
        }

        const updates = [];
        const values = [];
        let valIdx = 1;

        if (charity_id) {
            updates.push(`charity_id = $${valIdx++}`);
            values.push(charity_id);
        }
        if (contribution_percentage) {
            updates.push(`contribution_percentage = $${valIdx++}`);
            values.push(contribution_percentage);
        }

        if (updates.length === 0) {
            return res.status(400).json({ message: 'No updates provided' });
        }

        values.push(req.user.id);
        const query = `UPDATE users SET ${updates.join(', ')} WHERE id = $${valIdx} RETURNING id, charity_id, contribution_percentage`;
        
        const result = await db.query(query, values);
        res.status(200).json({ message: 'Preferences updated', data: result.rows[0] });
    } catch (err) {
        console.error('Error updating profile:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
