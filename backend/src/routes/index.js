const express = require('express');
const router = express.Router();
const authRoutes = require('./auth');
const taskRoutes = require('./task');
const adminRoutes = require('./admin');

router.get('/', (req, res) => {
    res.json({ message: 'API is working' });
});

router.use('/auth', authRoutes);
router.use('/tasks', taskRoutes);
router.use('/admin', adminRoutes);

module.exports = router;