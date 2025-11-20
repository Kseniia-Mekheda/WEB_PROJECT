const queueService = require('~/services/queue');
const Task = require('~/models/task');

const MAX_TASK_VALUE = 100000000;
const MAX_CONCURRENT_TASKS = 3;

const createTask = async (req, res) => {
    const { number } = req.body;
    const userId = req.user._id; 

    if (!number || number <= 0) {
        return res.status(400).json({ message: 'Invalid input number' });
    }
    if (number > MAX_TASK_VALUE) {
        return res.status(400).json({ message: `Input number exceeds maximum allowed value of ${MAX_TASK_VALUE}` });
    }

    try {
        const activeTasksCount = await Task.countDocuments({
            user: userId, 
            status: { $in: ['pending', 'processing'] }
        })

        if (activeTasksCount >= MAX_CONCURRENT_TASKS) {
            return res.status(400).json({ message: `Task limit reached. Only ${MAX_CONCURRENT_TASKS} active tasks allowed.` });
        }

        const jobCounts = await queueService.taskQueue.getJobCounts(); // waiting, active,...
        const concurrency = Number(process.env.WORKER_CONCURRENCY || 1);

        const stats = await Task.aggregate([
            { $match: { status: 'completed', durationMs: { $gt: 0 } } },
            { $sort: { createdAt: -1 } },
            { $limit: 50 },
            { $group: { _id: null, avgDuration: { $avg: '$durationMs' } } }
        ]);
        const avgDurationMs = Math.max(500, Math.floor(stats[0]?.avgDuration || 0));

        const allBusy = jobCounts.active >= concurrency;
        let etaMs = 0;
        if (allBusy) {
            const positionAhead = Math.max(0, jobCounts.waiting + (jobCounts.active - concurrency) + 1);
            etaMs = positionAhead * avgDurationMs;
        }

        const job = await queueService.addTaskToQueue({ number, userId });

        const task = await Task.create({
            jobId: job.id,
            user: userId,
            input: number,
            status: 'pending'
        }); 

        res.status(201).json({
            message: allBusy
                ? 'Task queued. All workers busy.'
                : 'Task accepted',
            task,
            etaMs: allBusy ? etaMs : 0,
            avgDurationMs
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
}; 

const getTasks = async (req, res) => {
    try {
        const tasks = await Task.find({ user: req.user._id }).sort({ createdAt: -1 });
        res.status(200).json({ tasks });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

const getTaskStatus = async (req, res) => {
    const { jobId } = req.params;
    try {
        const task = await Task.findOne({ jobId, user: req.user._id });
        if (!task) {
            return res.status(404).json({ message: 'Task not found' });
        }

        const jobStatus = await queueService.getJobStatus(jobId);
        res.status(200).json({
            dbTask: task,
            queueStatus: jobStatus
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

const cancelTask = async (req, res) => {
    const { jobId } = req.params;
    try {
        const task = await Task.findOne({ jobId, user: req.user._id });
        if (!task) {
            return res.status(404).json({ message: 'Task not found' });
        }
        if (task.status === 'completed' || task.status === 'failed' || task.status === 'cancelled') {
             return res.status(400).json({ message: 'Task is already finished' });
        }
        const cancelled = await queueService.cancelJob(jobId);
        
        if (!cancelled) {
            return res.status(404).json({ message: 'Task not in queue or already completed' });
        }
        task.status = 'cancelled';
        await task.save();
        res.status(200).json({ message: 'Task cancelled', task });
    } catch (error) {
         res.status(500).json({ message: 'Server error' });
    }
};

module.exports = {
    createTask,
    getTasks,
    getTaskStatus,
    cancelTask
};