const express = require('express');
const router = express.Router();
const { protect } = require('~/middleware/auth');
const { requireSuperUser } = require('~/middleware/admin');
const { getOverview, getAllTasks, getUsers, cancelTaskAdmin } = require('~/controllers/admin');

router.use(protect);
router.use(requireSuperUser);

router.get('/overview', getOverview);
router.get('/tasks', getAllTasks);
router.get('/users', getUsers);
router.post('/tasks/:jobId/cancel', cancelTaskAdmin);

module.exports = router;