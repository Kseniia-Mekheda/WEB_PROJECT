const express = require('express');
const router = express.Router();
const authRoutes = require('./auth');
const taskRoutes = require('./task');

router.get('/', (req, res) => {
    res.json({ message: 'API is working' });
});

router.use('/auth', authRoutes);
router.use('/tasks', taskRoutes);

module.exports = router;