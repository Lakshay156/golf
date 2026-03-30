const express = require('express');
const db = require('../db');

const router = express.Router();

// Get public list of charities
router.get('/', async (req, res) => {
    try {
        const result = await db.query(
            'SELECT id, name, description, image_url, created_at FROM charities ORDER BY name ASC'
        );
        res.status(200).json({ data: result.rows });
    } catch (err) {
        console.error('Error fetching charities:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
