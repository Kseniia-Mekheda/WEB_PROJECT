const express = require('express');
const router = express.Router();
const { 
    createTask, 
    getTasks, 
    getTaskStatus, 
    cancelTask 
} = require('~/controllers/task');

const { protect } = require('~/middleware/auth');
router.use(protect);
router.post('/', createTask);
router.get('/', getTasks);
router.get('/:jobId', getTaskStatus);
router.post('/:jobId/cancel', cancelTask);

module.exports = router;
