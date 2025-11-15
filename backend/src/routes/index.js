const express = require('express');
const router = express.Router();
const authRoutes = require('./auth');

router.get('/', (req, res) => {
    res.json({ message: 'API is working' });
});

router.use('/auth', authRoutes);

module.exports = router;