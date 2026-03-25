const express = require('express');
const router = express.Router();

const RECOMMENDER_BASE = process.env.RECOMMENDER_API_URL || 'http://127.0.0.1:8000';

/**
 * Generic proxy helper — forwards a request body to the Python FastAPI service.
 */
async function proxyPost(targetUrl, body, res) {
    try {
        const response = await fetch(targetUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
        });
        const data = await response.json();
        if (!response.ok) {
            return res.status(response.status).json(data);
        }
        return res.json(data);
    } catch (err) {
        console.error('[Recommender Proxy] Error:', err.message);
        return res.status(503).json({
            error: 'Recommender service unavailable',
            details: err.message,
        });
    }
}

/**
 * GET /api/recommend/health
 * Proxies to Python API /health
 */
router.get('/health', async (req, res) => {
    try {
        const response = await fetch(`${RECOMMENDER_BASE}/health`);
        const data = await response.json();
        return res.json(data);
    } catch (err) {
        console.error('[Recommender Proxy] Health check failed:', err.message);
        return res.status(503).json({
            status: 'unhealthy',
            error: 'Recommender service unavailable',
        });
    }
});

/**
 * POST /api/recommend/search
 * Body: { user_id, lat, lon, radius_km, top_n }
 * Proxies to Python API /api/search
 */
router.post('/search', async (req, res) => {
    const { user_id, lat, lon, radius_km = 50, top_n = 20 } = req.body;

    if (!lat || !lon) {
        return res.status(400).json({ error: 'lat and lon are required' });
    }

    await proxyPost(
        `${RECOMMENDER_BASE}/api/search`,
        { user_id: user_id || 'anonymous', lat, lon, radius_km, top_n },
        res
    );
});

/**
 * POST /api/recommend/feedback
 * Body: { user_id, interaction_id, selected_driver_id, shown_driver_ids, timestamp }
 * Proxies to Python API /api/feedback
 */
router.post('/feedback', async (req, res) => {
    const { user_id, interaction_id, selected_driver_id, shown_driver_ids } = req.body;

    if (!interaction_id || !selected_driver_id || !shown_driver_ids) {
        return res.status(400).json({ error: 'interaction_id, selected_driver_id, and shown_driver_ids are required' });
    }

    await proxyPost(
        `${RECOMMENDER_BASE}/api/feedback`,
        {
            user_id: user_id || 'anonymous',
            interaction_id,
            selected_driver_id,
            shown_driver_ids,
            timestamp: new Date().toISOString(),
        },
        res
    );
});

module.exports = router;
