const express = require('express');
const db = require('../db');
const { verifyToken } = require('../middlewares/auth');

const router = express.Router();

// Add a new score
router.post('/', verifyToken, async (req, res) => {
    try {
        const { score, date } = req.body;

        if (score === undefined || score < 1 || score > 45) {
            return res.status(400).json({ message: 'Stableford score must be between 1 and 45' });
        }

        const scoreDate = date ? new Date(date) : new Date();

        // Start transaction
        await db.query('BEGIN');

        // Insert new score
        await db.query(
            'INSERT INTO scores (user_id, score, date) VALUES ($1, $2, $3)',
            [req.user.id, score, scoreDate]
        );

        // Fetch all scores for user ordered by date desc
        const allScores = await db.query(
            'SELECT id FROM scores WHERE user_id = $1 ORDER BY date DESC, created_at DESC',
            [req.user.id]
        );

        // Keep only top 5 recent scores
        if (allScores.rows.length > 5) {
            // Get the IDs of the scores to delete (everything past the 5th)
            const idsToDelete = allScores.rows.slice(5).map(s => s.id);
            // Delete them
            if (idsToDelete.length > 0) {
                const placeholders = idsToDelete.map((_, i) => `$${i + 2}`).join(', ');
                await db.query(`DELETE FROM scores WHERE user_id = $1 AND id IN (${placeholders})`, [req.user.id, ...idsToDelete]);
            }
        }

        await db.query('COMMIT');

        // Fetch updated list to return
        const updatedScores = await db.query(
            'SELECT id, score, date FROM scores WHERE user_id = $1 ORDER BY date DESC, created_at DESC',
            [req.user.id]
        );

        res.status(201).json({ 
            message: 'Score added successfully', 
            scores: updatedScores.rows 
        });

    } catch (err) {
        await db.query('ROLLBACK');
        console.error('Error recording score:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
