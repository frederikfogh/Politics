require('dotenv').config();
const express = require('express');
const { getDatabase } = require('./database');
const crypto = require('crypto');

const router = express.Router();
const DEFAULT_NB_ADDS = 20;


router.get('/counts', async function (req, res, next) {
    try {
        const nbAds = parseInt(req.query.nb_ads) || DEFAULT_NB_ADDS;

        const adsCount = await getDatabase().collection('ads').count();
        const annotationsCount = await getDatabase().collection('annotations').count();

        res.json({
            adsCount,
            annotationsCount,
        });
    } catch (e) {
        return next(e);
    }
});

router.get('/random', async function(req, res, next) {
    try {
        const nbAds = parseInt(req.query.nb_ads) || DEFAULT_NB_ADDS;

        adsTable = getDatabase().collection('ads');
        const cursor = await adsTable.aggregate([{ '$sample': { size: nbAds } }]);
        const randomAds = await cursor.toArray();

        res.json(randomAds);
    } catch(e) {
        return next(e);
    }
});


// Sample request:
// curl -X POST http://localhost:3003/ads/1254/annotation --header "Content-Type: application/json" --data '{"value": "hello"}'
router.post('/ads/:adId/annotation', async function(req, res, next) {
    try {
        // Front-end data
        const adId = req.params['adId'];
        const payload = req.body;

        // Back-end data
        const timestamp = new Date().toISOString();
        const contributorIP = crypto.createHmac('sha512', process.env.SALT).update(req.ip).digest("hex");
        const userAgent = crypto.createHmac('sha512', process.env.SALT).update(req.headers['user-agent']).digest("hex");

        annotationTable = getDatabase().collection('annotations');
        await annotationTable.insertOne({
            adId,
            payload,
            timestamp,
            contributorIP,
            userAgent,
        });

        res.status(201).json({
            id: adId
        });
    } catch(e) {
        return next(e);
    }
});


module.exports = router;
