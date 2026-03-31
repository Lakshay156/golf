const express = require('express');
const db = require('../db');
const { verifyToken, verifyAdmin } = require('../middlewares/auth');
const multer = require('multer');

// Quick in-memory uploader for Base64 conversion
const upload = multer({ 
    storage: multer.memoryStorage(), 
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB Limit
});

const router = express.Router();

// Generate Random Numbers
function generateDrawNumbers() {
    const nums = new Set();
    while(nums.size < 5) {
        nums.add(Math.floor(Math.random() * 45) + 1);
    }
    return Array.from(nums).sort((a,b) => a - b);
}

// Calculate matches
function getMatchCount(userScores, drawNumbers) {
    let matches = 0;
    // We treat user scores as a set to match the draw numbers, 
    // but a user could have identical scores. If draw is unique 5, 
    // how many unique draw numbers are in the user's scores?
    const userScoreSet = new Set(userScores);
    drawNumbers.forEach(num => {
        if(userScoreSet.has(num)) matches++;
    });
    return matches;
}

// Run the monthly draw
router.post('/run', verifyToken, verifyAdmin, async (req, res) => {
    try {
        const { simulate = false, method = 'random' } = req.body;

        await db.query('BEGIN');

        // 1. Calculate the prize pool (e.g. 50% of active subscriptions)
        // Note: For simplicity, assume fixed $10 per active sub this month. Pool = 50% of that.
        const activeUsers = await db.query("SELECT id FROM users WHERE subscription_status = 'active'");
        const totalSubAmount = activeUsers.rows.length * 10;
        let newPrizePool = totalSubAmount * 0.50;

        // Add previous jackpot rollover if any
        const lastDraw = await db.query("SELECT jackpot_amount FROM draws ORDER BY created_at DESC LIMIT 1");
        let jackpotRollover = 0;
        if (lastDraw.rows.length > 0) {
            jackpotRollover = parseFloat(lastDraw.rows[0].jackpot_amount);
            newPrizePool += jackpotRollover;
        }

        // 2. Generate numbers
        let drawNumbers = [];
        if (method === 'algorithmic') {
            // Pick the 5 most frequently entered scores among active users
            const freqQuery = await db.query(`
                SELECT score, COUNT(score) as freq 
                FROM scores s 
                JOIN users u ON s.user_id = u.id 
                WHERE u.subscription_status = 'active'
                GROUP BY score 
                ORDER BY freq DESC 
                LIMIT 5
            `);
            if (freqQuery.rows.length === 5) {
                drawNumbers = freqQuery.rows.map(r => parseInt(r.score)).sort((a,b) => a - b);
            } else {
                // Fallback if not enough data
                drawNumbers = generateDrawNumbers();
            }
        } else {
            drawNumbers = generateDrawNumbers();
        }

        // 3. Create Draw record
        const drawRes = await db.query(
            "INSERT INTO draws (draw_date, numbers, status, total_prize_pool, jackpot_amount) VALUES (CURRENT_DATE, $1, 'completed', $2, 0) RETURNING id",
            [drawNumbers, newPrizePool]
        );
        const drawId = drawRes.rows[0].id;

        // 4. Process all active users' scores
        let winners5 = [];
        let winners4 = [];
        let winners3 = [];

        for (let user of activeUsers.rows) {
            const scoresRes = await db.query("SELECT score FROM scores WHERE user_id = $1 ORDER BY date DESC LIMIT 5", [user.id]);
            if (scoresRes.rows.length === 5) { // Must have exactly 5 scores to enter
                const userScores = scoresRes.rows.map(r => r.score);
                const matches = getMatchCount(userScores, drawNumbers);
                
                if (matches === 5) winners5.push(user.id);
                else if (matches === 4) winners4.push(user.id);
                else if (matches === 3) winners3.push(user.id);
            }
        }

        // 5. Calculate pots
        // 5 matches -> 40%, 4 matches -> 35%, 3 matches -> 25%
        const pot5 = newPrizePool * 0.40;
        const pot4 = newPrizePool * 0.35;
        const pot3 = newPrizePool * 0.25;

        let nextJackpot = 0;

        // Insert winners 5
        if (winners5.length > 0) {
            const prizePerWinner = pot5 / winners5.length;
            for(let wid of winners5) {
                await db.query("INSERT INTO winners (user_id, draw_id, match_type, prize_amount) VALUES ($1, $2, 5, $3)", [wid, drawId, prizePerWinner]);
            }
        } else {
            nextJackpot += pot5; // Rollover
        }

        // Insert winners 4
        if (winners4.length > 0) {
            const prizePerWinner = pot4 / winners4.length;
            for(let wid of winners4) {
                await db.query("INSERT INTO winners (user_id, draw_id, match_type, prize_amount) VALUES ($1, $2, 4, $3)", [wid, drawId, prizePerWinner]);
            }
        } else {
            nextJackpot += pot4; // Rollover
        }

        // Insert winners 3
        if (winners3.length > 0) {
            const prizePerWinner = pot3 / winners3.length;
            for(let wid of winners3) {
                await db.query("INSERT INTO winners (user_id, draw_id, match_type, prize_amount) VALUES ($1, $2, 3, $3)", [wid, drawId, prizePerWinner]);
            }
        } else {
            nextJackpot += pot3; // Rollover
        }

        // Update draw with rolled over jackpot
        await db.query("UPDATE draws SET jackpot_amount = $1 WHERE id = $2", [nextJackpot, drawId]);

        // SIMULATION MODE BEHAVIOR
        if (simulate) {
            await db.query('ROLLBACK');
            return res.status(200).json({
                message: 'Simulation completed. Database was NOT modified.',
                simulated: true,
                drawNumbers,
                totalPrizePool: newPrizePool,
                potDistribution: {
                    match5_pot: pot5,
                    match4_pot: pot4,
                    match3_pot: pot3
                },
                nextJackpot,
                winnersCount: {
                    match5: winners5.length,
                    match4: winners4.length,
                    match3: winners3.length
                }
            });
        }

        await db.query('COMMIT');

        res.status(200).json({
            message: 'Draw officially executed & published successfully',
            simulated: false,
            drawNumbers,
            totalPrizePool: newPrizePool,
            nextJackpot,
            winnersCount: {
                match5: winners5.length,
                match4: winners4.length,
                match3: winners3.length
            }
        });
    } catch (err) {
        await db.query('ROLLBACK');
        console.error('Error running draw:', err);
        res.status(500).json({ message: 'Server error during draw execution' });
    }
});

// Get latest draw results
router.get('/latest', async (req, res) => {
    try {
        const drawRes = await db.query("SELECT * FROM draws ORDER BY created_at DESC LIMIT 1");
        if (drawRes.rows.length === 0) {
            return res.status(200).json({ data: null });
        }
        res.status(200).json({ data: drawRes.rows[0] });
    } catch(err) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Upload proof for a win
router.post('/winners/:id/upload-proof', verifyToken, upload.single('proof_image'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No image file provided' });
        }

        // Verify user owns this win
        const winRes = await db.query("SELECT * FROM winners WHERE id = $1 AND user_id = $2", [req.params.id, req.user.id]);
        if (winRes.rows.length === 0) {
            return res.status(403).json({ message: 'Unauthorized or win not found' });
        }

        // Convert image to Base64
        const base64Str = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;

        await db.query("UPDATE winners SET proof_url = $1 WHERE id = $2", [base64Str, req.params.id]);

        res.status(200).json({ message: 'Proof uploaded successfully!' });
    } catch(err) {
        console.error('Error uploading proof:', err);
        res.status(500).json({ message: 'Server error during upload' });
    }
});

module.exports = router;
